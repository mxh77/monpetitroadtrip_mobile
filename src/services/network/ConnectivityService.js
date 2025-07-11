import NetInfo from '@react-native-community/netinfo';

/**
 * Service de détection et gestion de la connectivité réseau
 */
class ConnectivityService {
  constructor() {
    this.isConnected = true;
    this.connectionType = 'unknown';
    this.listeners = new Set();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Vérifier l'état initial
      const state = await NetInfo.fetch();
      this.updateConnectionState(state);

      // Écouter les changements
      this.unsubscribe = NetInfo.addEventListener(this.updateConnectionState.bind(this));
      
      this.initialized = true;
      console.log('✅ ConnectivityService initialisé:', {
        connected: this.isConnected,
        type: this.connectionType
      });
    } catch (error) {
      console.error('❌ Erreur initialisation ConnectivityService:', error);
      // Fallback: considérer comme connecté par défaut
      this.isConnected = true;
      this.connectionType = 'unknown';
    }
  }

  updateConnectionState(state) {
    const wasConnected = this.isConnected;
    
    this.isConnected = state.isConnected && state.isInternetReachable;
    this.connectionType = state.type;

    // Notifier les changements
    if (wasConnected !== this.isConnected) {
      console.log(`🌐 Connectivité changée: ${this.isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'} (${this.connectionType})`);
      this.notifyListeners({
        isConnected: this.isConnected,
        type: this.connectionType,
        wasConnected
      });
    }
  }

  /**
   * Ajouter un listener pour les changements de connectivité
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Retourner une fonction de cleanup
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notifier tous les listeners
   */
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Erreur dans listener connectivité:', error);
      }
    });
  }

  /**
   * Vérifier si l'appareil est connecté
   */
  async checkConnection() {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      console.error('❌ Erreur vérification connectivité:', error);
      return false;
    }
  }

  /**
   * Obtenir l'état de la connectivité
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      type: this.connectionType
    };
  }

  /**
   * Vérifier si on a une connexion de qualité suffisante
   */
  hasGoodConnection() {
    if (!this.isConnected) return false;
    
    // Éviter les uploads sur les connexions coûteuses
    const expensiveTypes = ['cellular', 'other'];
    return !expensiveTypes.includes(this.connectionType);
  }

  /**
   * Attendre qu'une connexion soit disponible
   */
  async waitForConnection(timeout = 30000) {
    if (this.isConnected) return true;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout waiting for connection'));
      }, timeout);

      const cleanup = this.addListener(({ isConnected }) => {
        if (isConnected) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(true);
        }
      });
    });
  }

  /**
   * Nettoyer les ressources
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

// Instance singleton
const connectivityService = new ConnectivityService();

export default connectivityService;
