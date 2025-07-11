import * as SQLite from 'expo-sqlite';

/**
 * Service de base de données SQLite pour le stockage offline
 */
class SqliteDatabase {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('monpetitroadtrip_offline.db');
      await this.createTables();
      this.initialized = true;
      console.log('✅ Base de données SQLite initialisée');
    } catch (error) {
      console.error('❌ Erreur initialisation SQLite:', error);
      throw error;
    }
  }

  async createTables() {
    // Table principale pour les opérations en attente de synchronisation
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        local_id TEXT,
        data TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        headers TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        status TEXT DEFAULT 'pending'
      );
    `);

    // Table pour le cache des données
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_key TEXT UNIQUE NOT NULL,
        data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        etag TEXT
      );
    `);

    // Table pour les métadonnées de synchronisation
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT UNIQUE NOT NULL,
        last_sync DATETIME,
        last_full_sync DATETIME,
        sync_token TEXT
      );
    `);

    // Index pour les performances
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_cached_data_key ON cached_data(cache_key);
      CREATE INDEX IF NOT EXISTS idx_cached_data_expires ON cached_data(expires_at);
    `);

    console.log('✅ Tables SQLite créées');
  }

  // Opérations queue de synchronisation
  async addToSyncQueue(operation) {
    await this.ensureInitialized();
    
    const query = `
      INSERT INTO sync_queue (
        operation_type, entity_type, entity_id, local_id, 
        data, endpoint, method, headers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await this.db.runAsync(query, [
      operation.type,
      operation.entityType,
      operation.entityId,
      operation.localId,
      JSON.stringify(operation.data),
      operation.endpoint,
      operation.method,
      JSON.stringify(operation.headers || {})
    ]);

    return result.lastInsertRowId;
  }

  async getPendingSyncOperations(limit = 50) {
    await this.ensureInitialized();
    
    const query = `
      SELECT * FROM sync_queue 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT ?
    `;
    
    const result = await this.db.getAllAsync(query, [limit]);
    
    return result.map(row => ({
      id: row.id,
      type: row.operation_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      localId: row.local_id,
      data: JSON.parse(row.data),
      endpoint: row.endpoint,
      method: row.method,
      headers: JSON.parse(row.headers),
      createdAt: row.created_at,
      retryCount: row.retry_count,
      lastError: row.last_error
    }));
  }

  async markSyncOperationCompleted(operationId) {
    await this.ensureInitialized();
    
    await this.db.runAsync(
      'UPDATE sync_queue SET status = ? WHERE id = ?',
      ['completed', operationId]
    );
  }

  async markSyncOperationFailed(operationId, error) {
    await this.ensureInitialized();
    
    await this.db.runAsync(
      'UPDATE sync_queue SET status = ?, retry_count = retry_count + 1, last_error = ? WHERE id = ?',
      ['failed', error, operationId]
    );
  }

  // Opérations cache
  async setCachedData(key, data, expiresIn = null) {
    await this.ensureInitialized();
    
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO cached_data (cache_key, data, expires_at) 
       VALUES (?, ?, ?)`,
      [key, JSON.stringify(data), expiresAt]
    );
  }

  async getCachedData(key) {
    await this.ensureInitialized();
    
    const result = await this.db.getFirstAsync(
      'SELECT * FROM cached_data WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime("now"))',
      [key]
    );
    
    return result ? JSON.parse(result.data) : null;
  }

  async clearExpiredCache() {
    await this.ensureInitialized();
    
    await this.db.runAsync(
      'DELETE FROM cached_data WHERE expires_at IS NOT NULL AND expires_at <= datetime("now")'
    );
  }

  // Métadonnées de synchronisation
  async getLastSyncTime(entityType) {
    await this.ensureInitialized();
    
    const result = await this.db.getFirstAsync(
      'SELECT last_sync FROM sync_metadata WHERE entity_type = ?',
      [entityType]
    );
    
    return result ? new Date(result.last_sync) : null;
  }

  async updateLastSyncTime(entityType, timestamp = new Date()) {
    await this.ensureInitialized();
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (entity_type, last_sync) 
       VALUES (?, ?)`,
      [entityType, timestamp.toISOString()]
    );
  }

  // Utilitaires
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async clearAll() {
    await this.ensureInitialized();
    
    await this.db.execAsync(`
      DELETE FROM sync_queue;
      DELETE FROM cached_data;
      DELETE FROM sync_metadata;
    `);
    
    console.log('🧹 Base de données nettoyée');
  }

  async getStats() {
    await this.ensureInitialized();
    
    const pendingOps = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"');
    const cachedItems = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM cached_data');
    
    return {
      pendingOperations: pendingOps.count,
      cachedItems: cachedItems.count
    };
  }
}

// Instance singleton
const sqliteDatabase = new SqliteDatabase();

export default sqliteDatabase;
