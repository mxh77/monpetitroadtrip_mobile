import sqliteDatabase from '../database/SqliteDatabase';
import connectivityService from '../network/ConnectivityService';

/**
 * Service de synchronisation intelligent pour les opérations offline
 */
class SyncService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.retryDelays = [1000, 3000, 10000, 30000, 60000]; // Backoff progressif
    this.maxRetries = 5;
    this.listeners = new Set();
  }

  async initialize() {
    await sqliteDatabase.initialize();
    await connectivityService.initialize();

    // Démarrer la synchronisation quand la connectivité revient
    connectivityService.addListener(this.onConnectivityChange.bind(this));

    console.log('✅ SyncService initialisé');
  }

  /**
   * Ajouter une opération à la queue de synchronisation
   */
  async addOperation(operation) {
    try {
      const operationId = await sqliteDatabase.addToSyncQueue({
        type: operation.type,
        entityType: operation.entityType,
        entityId: operation.entityId,
        localId: operation.localId,
        data: operation.data,
        endpoint: operation.endpoint,
        method: operation.method,
        headers: operation.headers
      });

      this.notifyListeners({
        type: 'operation_queued',
        operationId,
        operation
      });

      // Essayer de synchroniser immédiatement si connecté
      if (connectivityService.isConnected) {
        this.startSync();
      }

      return operationId;
    } catch (error) {
      console.error('❌ Erreur ajout opération sync:', error);
      throw error;
    }
  }

  /**
   * Démarrer la synchronisation
   */
  async startSync() {
    if (this.isRunning) return;
    if (!connectivityService.isConnected) return;

    this.isRunning = true;
    console.log('🔄 Démarrage synchronisation...');

    try {
      await this.processPendingOperations();
    } catch (error) {
      console.error('❌ Erreur pendant la synchronisation:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Traiter les opérations en attente
   */
  async processPendingOperations() {
    const operations = await sqliteDatabase.getPendingSyncOperations();
    
    if (operations.length === 0) {
      console.log('✅ Aucune opération en attente');
      return;
    }

    console.log(`📦 ${operations.length} opérations à synchroniser`);

    for (const operation of operations) {
      if (!connectivityService.isConnected) {
        console.log('🚫 Connexion perdue, arrêt de la synchronisation');
        break;
      }

      try {
        await this.executeOperation(operation);
        await sqliteDatabase.markSyncOperationCompleted(operation.id);
        
        this.notifyListeners({
          type: 'operation_completed',
          operation
        });

        console.log(`✅ Opération ${operation.type} synchronisée: ${operation.entityType}`);
      } catch (error) {
        console.error(`❌ Échec opération ${operation.id}:`, error);
        
        if (operation.retryCount >= this.maxRetries) {
          console.error(`🚫 Opération ${operation.id} abandonnée après ${this.maxRetries} tentatives`);
          await sqliteDatabase.markSyncOperationFailed(operation.id, error.message);
          
          this.notifyListeners({
            type: 'operation_failed',
            operation,
            error
          });
        } else {
          await sqliteDatabase.markSyncOperationFailed(operation.id, error.message);
          
          // Programmer un retry avec backoff
          const delay = this.retryDelays[Math.min(operation.retryCount, this.retryDelays.length - 1)];
          setTimeout(() => {
            if (connectivityService.isConnected) {
              this.startSync();
            }
          }, delay);
        }
      }
    }
  }

  /**
   * Exécuter une opération de synchronisation
   */
  async executeOperation(operation) {
    const { endpoint, method, data, headers } = operation;
    
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (method !== 'GET' && method !== 'DELETE') {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, requestOptions);

    if (!response.ok) {
      // Gestion spéciale des erreurs
      if (response.status === 409) {
        throw new Error(`Conflict: ${response.statusText}`);
      } else if (response.status === 401) {
        throw new Error(`Unauthorized: ${response.statusText}`);
      } else if (response.status >= 500) {
        throw new Error(`Server error: ${response.statusText}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const result = await response.json();
    
    // Si c'était une création, mettre à jour l'ID local avec l'ID serveur
    if (operation.type === 'CREATE' && result.data && result.data._id) {
      await this.updateLocalId(operation.localId, result.data._id);
    }

    return result;
  }

  /**
   * Mettre à jour un ID local avec l'ID serveur
   */
  async updateLocalId(localId, serverId) {
    // Cette méthode sera implémentée par les repositories spécifiques
    this.notifyListeners({
      type: 'id_updated',
      localId,
      serverId
    });
  }

  /**
   * Gestionnaire de changement de connectivité
   */
  onConnectivityChange({ isConnected }) {
    if (isConnected && !this.isRunning) {
      console.log('🌐 Connexion rétablie, reprise de la synchronisation');
      this.startSync();
    }
  }

  /**
   * Obtenir le statut de synchronisation
   */
  async getStatus() {
    const stats = await sqliteDatabase.getStats();
    
    return {
      isRunning: this.isRunning,
      isConnected: connectivityService.isConnected,
      pendingOperations: stats.pendingOperations,
      cachedItems: stats.cachedItems
    };
  }

  /**
   * Forcer une synchronisation complète
   */
  async forceSync() {
    if (!connectivityService.isConnected) {
      throw new Error('Aucune connexion réseau disponible');
    }

    await this.startSync();
  }

  /**
   * Ajouter un listener pour les événements de synchronisation
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notifier les listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('❌ Erreur dans listener sync:', error);
      }
    });
  }

  /**
   * Nettoyer les opérations terminées anciennes
   */
  async cleanup() {
    await sqliteDatabase.clearExpiredCache();
    // TODO: Nettoyer les opérations terminées de plus de 7 jours
  }

  /**
   * Arrêter le service
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.listeners.clear();
    this.isRunning = false;
  }
}

// Instance singleton
const syncService = new SyncService();

export default syncService;
