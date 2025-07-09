class NotificationStore {
    constructor() {
        this.notifications = new Map(); // Map<roadtripId, Array<Notification>>
        this.unreadCounts = new Map(); // Map<roadtripId, Number>
        this.lastSync = new Map(); // Map<roadtripId, Date>
        this.listeners = new Set();
    }

    /**
     * Ajouter un listener pour les changements
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notifier tous les listeners
     */
    notify(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Erreur listener notification:', error);
            }
        });
    }

    /**
     * Mettre à jour les notifications d'un roadtrip
     */
    updateNotifications(roadtripId, notifications) {
        const previous = this.notifications.get(roadtripId) || [];
        // S'assurer que notifications est un tableau
        let safeNotifications = Array.isArray(notifications) ? notifications : [];
        
        // DÉDOUBLONNER par _id pour éviter les duplicatas
        const uniqueNotifications = [];
        const seenIds = new Set();
        
        for (const notification of safeNotifications) {
            if (notification._id && !seenIds.has(notification._id)) {
                seenIds.add(notification._id);
                uniqueNotifications.push(notification);
            } else if (notification._id) {
                console.warn(`⚠️ Notification dupliquée détectée et ignorée: ${notification._id}`);
            }
        }
        
        safeNotifications = uniqueNotifications;
        
        console.log(`🗃️ Store update pour ${roadtripId}:`, {
            previousCount: previous.length,
            receivedCount: Array.isArray(notifications) ? notifications.length : 0,
            duplicatesRemoved: (Array.isArray(notifications) ? notifications.length : 0) - safeNotifications.length,
            finalCount: safeNotifications.length,
            previousIds: previous.map(n => n._id),
            newIds: safeNotifications.map(n => n._id)
        });
        
        this.notifications.set(roadtripId, safeNotifications);
        this.lastSync.set(roadtripId, new Date());

        // Calculer les nouvelles notifications
        const newNotifications = this.findNewNotifications(previous, safeNotifications);
        
        // Mettre à jour le compteur non lues
        const unreadCount = safeNotifications.filter(n => !n.read).length;
        this.unreadCounts.set(roadtripId, unreadCount);

        console.log(`📱 Notifications mises à jour pour ${roadtripId}: ${safeNotifications.length} total, ${unreadCount} non lues`);

        // Notifier les changements
        this.notify('notifications_updated', {
            roadtripId,
            notifications: safeNotifications,
            newNotifications,
            unreadCount
        });

        // Notifier chaque nouvelle notification individuellement
        newNotifications.forEach(notification => {
            this.notify('new_notification', {
                roadtripId,
                notification
            });
        });
    }

    /**
     * Trouver les nouvelles notifications
     */
    findNewNotifications(previous, current) {
        // S'assurer que les paramètres sont des tableaux
        const safePrevious = Array.isArray(previous) ? previous : [];
        const safeCurrent = Array.isArray(current) ? current : [];
        
        const previousIds = new Set(safePrevious.map(n => n._id));
        return safeCurrent.filter(n => !previousIds.has(n._id));
    }

    /**
     * Marquer une notification comme lue
     */
    markAsRead(roadtripId, notificationId) {
        const notifications = this.notifications.get(roadtripId) || [];
        const updated = notifications.map(n => 
            n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n
        );
        
        this.updateNotifications(roadtripId, updated);
    }

    /**
     * Supprimer une notification
     */
    removeNotification(roadtripId, notificationId) {
        const notifications = this.notifications.get(roadtripId) || [];
        const updated = notifications.filter(n => n._id !== notificationId);
        
        this.updateNotifications(roadtripId, updated);
    }

    /**
     * Obtenir les notifications d'un roadtrip
     */
    getNotifications(roadtripId) {
        return this.notifications.get(roadtripId) || [];
    }

    /**
     * Obtenir le nombre de notifications non lues
     */
    getUnreadCount(roadtripId) {
        return this.unreadCounts.get(roadtripId) || 0;
    }

    /**
     * Obtenir le total des notifications non lues pour tous les roadtrips
     */
    getTotalUnreadCount() {
        return Array.from(this.unreadCounts.values()).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Vérifier si des notifications ont été récemment synchronisées
     */
    isRecentlySync(roadtripId, maxAgeMs = 30000) {
        const lastSync = this.lastSync.get(roadtripId);
        if (!lastSync) return false;
        
        return (Date.now() - lastSync.getTime()) < maxAgeMs;
    }

    /**
     * Nettoyer les données d'un roadtrip
     */
    clearRoadtrip(roadtripId) {
        this.notifications.delete(roadtripId);
        this.unreadCounts.delete(roadtripId);
        this.lastSync.delete(roadtripId);
        
        this.notify('roadtrip_cleared', { roadtripId });
    }

    /**
     * Nettoyer toutes les données
     */
    clear() {
        this.notifications.clear();
        this.unreadCounts.clear();
        this.lastSync.clear();
        
        this.notify('store_cleared', {});
    }
}

export default NotificationStore;
