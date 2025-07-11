import syncService from './sync/SyncService';
import connectivityService from './network/ConnectivityService';
import sqliteDatabase from './database/SqliteDatabase';

// Repositories
import roadtripRepository from './repositories/RoadtripRepository';
import stepRepository from './repositories/StepRepository';
import activityRepository from './repositories/ActivityRepository';
import accommodationRepository from './repositories/AccommodationRepository';
import taskRepository from './repositories/TaskRepository';
import chatRepository from './repositories/ChatRepository';
import storyRepository from './repositories/StoryRepository';
import authRepository from './repositories/AuthRepository';
import settingsRepository from './repositories/SettingsRepository';

/**
 * Gestionnaire central pour tous les services offline
 */
class OfflineManager {
  constructor() {
    this.initialized = false;
    this.repositories = {
      roadtrip: roadtripRepository,
      step: stepRepository,
      activity: activityRepository,
      accommodation: accommodationRepository,
      task: taskRepository,
      chat: chatRepository,
      story: storyRepository,
      auth: authRepository,
      settings: settingsRepository
    };
    
    this.syncStatusListeners = new Set();
  }

  /**
   * Initialiser tous les services offline
   */
  async initialize() {
    if (this.initialized) return;

    console.log('🚀 Initialisation OfflineManager...');
    
    try {
      // 1. Initialiser la base de données
      await sqliteDatabase.initialize();
      
      // 2. Initialiser la connectivité
      await connectivityService.initialize();
      
      // 3. Initialiser le service de synchronisation
      await syncService.initialize();
      
      // 4. Écouter les événements de synchronisation
      syncService.addListener(this.onSyncEvent.bind(this));
      
      this.initialized = true;
      console.log('✅ OfflineManager initialisé avec succès');
      
      // 5. Démarrer la synchronisation si connecté
      if (connectivityService.isConnected) {
        await syncService.startSync();
      }
      
    } catch (error) {
      console.error('❌ Erreur initialisation OfflineManager:', error);
      throw error;
    }
  }

  /**
   * Obtenir un repository spécifique
   */
  getRepository(type) {
    if (!this.repositories[type]) {
      throw new Error(`Repository '${type}' non trouvé`);
    }
    return this.repositories[type];
  }

  /**
   * Obtenir le statut global de synchronisation
   */
  async getGlobalStatus() {
    await this.ensureInitialized();
    
    const syncStatus = await syncService.getStatus();
    const connectivityInfo = connectivityService.getConnectionInfo();
    
    return {
      ...syncStatus,
      connectivity: connectivityInfo,
      repositories: Object.keys(this.repositories)
    };
  }

  /**
   * Forcer une synchronisation globale
   */
  async forceGlobalSync() {
    await this.ensureInitialized();
    return await syncService.forceSync();
  }

  /**
   * Nettoyer toutes les données locales
   */
  async clearAllLocalData() {
    await this.ensureInitialized();
    await sqliteDatabase.clearAll();
    console.log('🧹 Toutes les données locales nettoyées');
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStats() {
    await this.ensureInitialized();
    return await sqliteDatabase.getStats();
  }

  /**
   * Gestionnaire d'événements de synchronisation
   */
  onSyncEvent(event) {
    console.log('📡 Événement sync:', event.type);
    
    // Notifier les listeners
    this.syncStatusListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('❌ Erreur dans listener sync status:', error);
      }
    });
  }

  /**
   * Ajouter un listener pour les événements de synchronisation
   */
  addSyncStatusListener(callback) {
    this.syncStatusListeners.add(callback);
    
    return () => {
      this.syncStatusListeners.delete(callback);
    };
  }

  /**
   * Vérifier si le service est connecté
   */
  isConnected() {
    return connectivityService.isConnected;
  }

  /**
   * Attendre une connexion
   */
  async waitForConnection(timeout = 30000) {
    return await connectivityService.waitForConnection(timeout);
  }

  /**
   * Mode développement - réinitialiser tout
   */
  async resetForDevelopment() {
    console.log('🔄 Réinitialisation mode développement...');
    
    await this.clearAllLocalData();
    
    // Redémarrer les services
    await this.destroy();
    await this.initialize();
    
    console.log('✅ Réinitialisation terminée');
  }

  /**
   * Obtenir un résumé des opérations en attente
   */
  async getPendingOperationsSummary() {
    await this.ensureInitialized();
    
    const operations = await sqliteDatabase.getPendingSyncOperations();
    
    const summary = operations.reduce((acc, op) => {
      if (!acc[op.entityType]) {
        acc[op.entityType] = { create: 0, update: 0, delete: 0 };
      }
      acc[op.entityType][op.type.toLowerCase()]++;
      return acc;
    }, {});

    return {
      total: operations.length,
      byType: summary,
      oldestOperation: operations.length > 0 ? operations[0].createdAt : null
    };
  }

  /**
   * Diagnostic complet du système
   */
  async runDiagnostic() {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      initialized: this.initialized,
      connectivity: connectivityService.getConnectionInfo(),
      syncStatus: await syncService.getStatus(),
      pendingOperations: await this.getPendingOperationsSummary(),
      repositories: Object.keys(this.repositories),
      database: await sqliteDatabase.getStats()
    };

    console.log('🔍 Diagnostic OfflineManager:', diagnostic);
    return diagnostic;
  }

  /**
   * S'assurer que le service est initialisé
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Nettoyer toutes les ressources
   */
  async destroy() {
    if (syncService) {
      syncService.destroy();
    }
    if (connectivityService) {
      connectivityService.destroy();
    }
    
    this.syncStatusListeners.clear();
    this.initialized = false;
    
    console.log('🧹 OfflineManager nettoyé');
  }
}

// Instance singleton
const offlineManager = new OfflineManager();

export default offlineManager;
