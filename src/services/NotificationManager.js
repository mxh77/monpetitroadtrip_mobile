import NotificationAPI from './NotificationAPI';
import NotificationStore from '../stores/NotificationStore';
import PollingStrategy from './PollingStrategy';

class NotificationManager {
    constructor(options = {}) {
        this.api = new NotificationAPI(options.baseURL);
        this.store = new NotificationStore();
        this.polling = new PollingStrategy();
        this.activeRoadtrips = new Set();
        
        // Configuration
        this.defaultToken = options.token;
        this.pollingFrequency = options.pollingFrequency || 3000;
        this.backgroundFrequency = options.backgroundFrequency || 30000;
        this.enablePushNotifications = false; // Désactivé pour éviter les erreurs natives
        
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
                    console.log(`Notifications mises à jour pour ${data.roadtripId}: ${data.notifications.length} total, ${data.unreadCount} non lues`);
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
            console.log(`Roadtrip ${roadtripId} déjà surveillé`);
            return;
        }

        const effectiveToken = token || this.defaultToken;
        
        // Créer le callback de polling
        const pollCallback = async () => {
            try {
                const notifications = await this.api.getNotifications(roadtripId, {
                    token: effectiveToken,
                    includeRead: false,
                    limit: 50
                });
                
                this.store.updateNotifications(roadtripId, notifications);
            } catch (error) {
                this.onError(error, roadtripId);
                throw error; // Re-throw pour que PollingStrategy puisse gérer les retries
            }
        };

        // Démarrer le polling
        this.polling.start(roadtripId, pollCallback, {
            frequency: this.pollingFrequency,
            backgroundFrequency: this.backgroundFrequency
        });

        this.activeRoadtrips.add(roadtripId);
        console.log(`Surveillance démarrée pour roadtrip ${roadtripId}`);

        // Effectuer une première synchronisation immédiate
        pollCallback().catch(error => {
            console.warn('Erreur lors de la synchronisation initiale:', error);
        });
    }

    /**
     * Arrêter la surveillance d'un roadtrip
     */
    unwatchRoadtrip(roadtripId) {
        this.polling.stop(roadtripId);
        this.activeRoadtrips.delete(roadtripId);
        console.log(`Surveillance arrêtée pour roadtrip ${roadtripId}`);
    }

    /**
     * Arrêter toute surveillance
     */
    stopWatching() {
        this.polling.stopAll();
        this.activeRoadtrips.clear();
        console.log('Surveillance arrêtée pour tous les roadtrips');
    }

    /**
     * Marquer une notification comme lue
     */
    async markAsRead(roadtripId, notificationId, token = null) {
        try {
            const effectiveToken = token || this.defaultToken;
            await this.api.markAsRead(roadtripId, notificationId, effectiveToken);
            this.store.markAsRead(roadtripId, notificationId);
            
            console.log(`Notification ${notificationId} marquée comme lue`);
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
            
            console.log(`Notification ${notificationId} supprimée`);
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
            console.warn(`Roadtrip ${roadtripId} non surveillé`);
            return;
        }

        try {
            const effectiveToken = token || this.defaultToken;
            const notifications = await this.api.getNotifications(roadtripId, {
                token: effectiveToken,
                includeRead: false,
                limit: 50
            });
            
            this.store.updateNotifications(roadtripId, notifications);
            console.log(`Synchronisation forcée pour roadtrip ${roadtripId}`);
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
        console.log(`Polling boosté pour roadtrip ${roadtripId} pendant ${duration}ms`);
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
        console.log('Nouvelle notification:', notification);
        
        // Log simple au lieu des notifications push pour éviter les erreurs natives
        console.log(`🔔 [${roadtripId}] ${notification.title}: ${notification.message}`);
    }

    /**
     * Handler par défaut pour les erreurs
     */
    defaultErrorHandler(error, roadtripId) {
        console.error(`Erreur notifications roadtrip ${roadtripId}:`, error);
    }

    /**
     * Nettoyer les ressources
     */
    destroy() {
        this.stopWatching();
        this.store.clear();
        this.polling.destroy();
        console.log('NotificationManager détruit');
    }
}

export default NotificationManager;
