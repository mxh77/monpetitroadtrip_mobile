import NotificationAPI from './NotificationAPI';
import MockNotificationAPI from './MockNotificationAPI';
import NotificationStore from '../stores/NotificationStore';
import PollingStrategy from './PollingStrategy';

/**
 * Version simplifiée du NotificationManager sans dépendances natives
 * Compatible avec tous les environnements Expo (managed, bare, etc.)
 */
class SimpleNotificationManager {
    constructor(options = {}) {
        // Utiliser l'API mockée en mode développement si les endpoints ne sont pas disponibles
        const useMockAPI = options.useMockAPI !== false; // Par défaut, utiliser mock
        
        if (useMockAPI) {
            this.api = new MockNotificationAPI(options.baseURL);
            console.log('🧪 SimpleNotificationManager initialisé avec MockNotificationAPI');
        } else {
            this.api = new NotificationAPI(options.baseURL);
            console.log('🔗 SimpleNotificationManager initialisé avec NotificationAPI réelle');
        }
        
        this.store = new NotificationStore();
        this.polling = new PollingStrategy();
        this.activeRoadtrips = new Set();
        this.pendingRequests = new Map(); // Éviter les requêtes simultanées
        
        // Configuration
        this.defaultToken = options.token;
        this.pollingFrequency = options.pollingFrequency || 3000;
        this.backgroundFrequency = options.backgroundFrequency || 30000;
        
        // Callbacks personnalisés
        this.onNewNotification = options.onNewNotification || this.defaultNewNotificationHandler;
        this.onError = options.onError || this.defaultErrorHandler;
        
        this.setupStoreListeners();
    }

    /**
     * Configurer les listeners du store
     */
    setupStoreListeners() {
        this.store.subscribe((event, data) => {
            switch (event) {
                case 'new_notification':
                    this.onNewNotification(data.notification, data.roadtripId);
                    break;
                case 'notifications_updated':
                    console.log(`📱 Notifications mises à jour pour ${data.roadtripId}: ${data.notifications.length} total, ${data.unreadCount} non lues`);
                    break;
            }
        });
    }

    /**
     * Mettre à jour le token d'authentification
     */
    setToken(token) {
        this.defaultToken = token;
    }

    /**
     * Démarrer la surveillance d'un roadtrip
     */
    watchRoadtrip(roadtripId, token = null) {
        if (this.activeRoadtrips.has(roadtripId)) {
            console.log(`📡 Roadtrip ${roadtripId} déjà surveillé`);
            return;
        }

        const effectiveToken = token || this.defaultToken;
        
        // Créer le callback de polling
        const pollCallback = async () => {
            // Éviter les appels simultanés pour le même roadtrip
            if (this.pendingRequests.has(roadtripId)) {
                console.log(`⏳ Requête déjà en cours pour roadtrip ${roadtripId}, skip...`);
                return;
            }
            
            this.pendingRequests.set(roadtripId, true);
            
            try {
                console.log(`🔄 Polling notifications pour roadtrip ${roadtripId}...`);
                const result = await this.api.getNotifications(roadtripId, {
                    token: effectiveToken,
                    includeRead: false,
                    limit: 50
                });
                
                console.log(`📡 Réponse API pour ${roadtripId}:`, {
                    result: result,
                    resultType: typeof result,
                    isArray: Array.isArray(result),
                    resultNotifications: result?.notifications,
                    notificationsType: typeof result?.notifications,
                    isNotificationsArray: Array.isArray(result?.notifications)
                });
                
                // Extraire les données du résultat et s'assurer que c'est un tableau
                // L'API renvoie maintenant directement les notifications depuis NotificationAPI
                const notifications = Array.isArray(result) ? result : [];
                
                console.log(`📦 Notifications extraites pour ${roadtripId}:`, {
                    count: notifications.length,
                    notifications: notifications.map(n => ({ _id: n._id, title: n.title, read: n.read }))
                });
                
                this.store.updateNotifications(roadtripId, notifications);
            } catch (error) {
                this.onError(error, roadtripId);
                throw error; // Re-throw pour que PollingStrategy puisse gérer les retries
            } finally {
                this.pendingRequests.delete(roadtripId);
            }
        };

        // Démarrer le polling
        this.polling.start(roadtripId, pollCallback, {
            frequency: this.pollingFrequency,
            backgroundFrequency: this.backgroundFrequency
        });

        this.activeRoadtrips.add(roadtripId);
        console.log(`✅ Surveillance démarrée pour roadtrip ${roadtripId}`);

        // Effectuer une première synchronisation immédiate
        pollCallback().catch(error => {
            console.warn('⚠️ Erreur lors de la synchronisation initiale:', error);
        });
    }

    /**
     * Arrêter la surveillance d'un roadtrip
     */
    unwatchRoadtrip(roadtripId) {
        this.polling.stop(roadtripId);
        this.activeRoadtrips.delete(roadtripId);
        console.log(`⏹️ Surveillance arrêtée pour roadtrip ${roadtripId}`);
    }

    /**
     * Arrêter toute surveillance
     */
    stopWatching() {
        this.polling.stopAll();
        this.activeRoadtrips.clear();
        console.log('🛑 Surveillance arrêtée pour tous les roadtrips');
    }

    /**
     * Marquer une notification comme lue
     */
    async markAsRead(roadtripId, notificationId, token = null) {
        try {
            const effectiveToken = token || this.defaultToken;
            await this.api.markAsRead(roadtripId, notificationId, effectiveToken);
            this.store.markAsRead(roadtripId, notificationId);
            
            console.log(`✓ Notification ${notificationId} marquée comme lue`);
        } catch (error) {
            this.onError(error, roadtripId);
            throw error;
        }
    }

    /**
     * Supprimer une notification
     */
    async deleteNotification(roadtripId, notificationId, token = null) {
        try {
            const effectiveToken = token || this.defaultToken;
            await this.api.deleteNotification(roadtripId, notificationId, effectiveToken);
            this.store.removeNotification(roadtripId, notificationId);
            
            console.log(`🗑️ Notification ${notificationId} supprimée`);
        } catch (error) {
            this.onError(error, roadtripId);
            throw error;
        }
    }

    /**
     * Obtenir les notifications d'un roadtrip
     */
    getNotifications(roadtripId) {
        return this.store.getNotifications(roadtripId);
    }

    /**
     * Obtenir le nombre de notifications non lues
     */
    getUnreadCount(roadtripId) {
        return this.store.getUnreadCount(roadtripId);
    }

    /**
     * Obtenir le total des notifications non lues
     */
    getTotalUnreadCount() {
        return this.store.getTotalUnreadCount();
    }

    /**
     * Forcer une synchronisation
     */
    async forceSync(roadtripId, token = null) {
        if (!this.activeRoadtrips.has(roadtripId)) {
            console.warn(`⚠️ Roadtrip ${roadtripId} non surveillé`);
            return;
        }

        try {
            const effectiveToken = token || this.defaultToken;
            const result = await this.api.getNotifications(roadtripId, {
                token: effectiveToken,
                includeRead: false,
                limit: 50
            });
            
            // Extraire les données du résultat et s'assurer que c'est un tableau
            const notifications = Array.isArray(result?.data) ? result.data : 
                                Array.isArray(result) ? result : [];
            
            this.store.updateNotifications(roadtripId, notifications);
            console.log(`🔄 Synchronisation forcée pour roadtrip ${roadtripId}`);
        } catch (error) {
            this.onError(error, roadtripId);
            throw error;
        }
    }

    /**
     * Booster temporairement la fréquence de polling
     */
    boostPolling(roadtripId, duration = 30000) {
        this.polling.boost(roadtripId, duration);
        console.log(`🚀 Polling boosté pour roadtrip ${roadtripId} pendant ${duration}ms`);
    }

    /**
     * S'abonner aux changements de notifications
     */
    subscribe(callback) {
        return this.store.subscribe(callback);
    }

    /**
     * Handler par défaut pour les nouvelles notifications
     */
    defaultNewNotificationHandler(notification, roadtripId) {
        console.log(`🔔 [${roadtripId}] ${notification.title}: ${notification.message}`);
        
        // Vous pouvez ajouter ici d'autres types de feedback :
        // - Sons via Audio API
        // - Vibrations via Haptics
        // - Toast messages
        // - etc.
    }

    /**
     * Handler par défaut pour les erreurs
     */
    defaultErrorHandler(error, roadtripId) {
        console.error(`❌ Erreur notifications roadtrip ${roadtripId}:`, error);
    }

    /**
     * Simuler une nouvelle notification (uniquement avec MockAPI)
     */
    simulateNotification(roadtripId) {
        if (this.api.simulateNewNotification) {
            const newNotification = this.api.simulateNewNotification(roadtripId);
            console.log('🧪 Simulation d\'une nouvelle notification:', newNotification.title);
            
            // Forcer une synchronisation pour déclencher les événements
            this.syncNotifications(roadtripId);
            
            return newNotification;
        } else {
            console.warn('⚠️ Simulation de notifications non disponible avec l\'API réelle');
        }
    }

    /**
     * Vérifier si on utilise l'API mockée
     */
    isUsingMockAPI() {
        return !!this.api.simulateNewNotification;
    }

    /**
     * Nettoyer les ressources
     */
    destroy() {
        this.stopWatching();
        this.store.clear();
        this.polling.destroy();
        console.log('🧹 SimpleNotificationManager détruit');
    }
}

export default SimpleNotificationManager;
