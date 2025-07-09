import config from '../config';

class NotificationAPI {
    constructor(baseURL = config.BACKEND_URL) {
        this.baseURL = baseURL;
    }

    /**
     * Obtenir les notifications d'un roadtrip
     */
    async getNotifications(roadtripId, options = {}) {
        const {
            limit = 50,
            includeRead = true,
            types = null,
            token = null
        } = options;

        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (!includeRead) params.append('includeRead', 'false');
        if (types && Array.isArray(types)) {
            types.forEach(type => params.append('types', type));
        }

        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(
                `${this.baseURL}/roadtrips/${roadtripId}/notifications?${params}`,
                { 
                    method: 'GET',
                    headers 
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result.success ? result.notifications : [];
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
            throw error;
        }
    }

    /**
     * Marquer une notification comme lue
     */
    async markAsRead(roadtripId, notificationId, token = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(
                `${this.baseURL}/roadtrips/${roadtripId}/notifications/${notificationId}/read`,
                {
                    method: 'PATCH',
                    headers
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur marquage notification:', error);
            throw error;
        }
    }

    /**
     * Supprimer une notification
     */
    async deleteNotification(roadtripId, notificationId, token = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(
                `${this.baseURL}/roadtrips/${roadtripId}/notifications/${notificationId}`,
                {
                    method: 'DELETE',
                    headers
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur suppression notification:', error);
            throw error;
        }
    }

    /**
     * Obtenir le nombre de notifications non lues
     */
    async getUnreadCount(roadtripId, token = null) {
        try {
            const notifications = await this.getNotifications(roadtripId, {
                includeRead: false,
                limit: 100,
                token
            });
            return notifications.length;
        } catch (error) {
            console.error('Erreur comptage notifications:', error);
            return 0;
        }
    }
}

export default NotificationAPI;
