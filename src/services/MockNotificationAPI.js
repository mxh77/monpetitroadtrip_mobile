import NotificationAPI from './NotificationAPI';

/**
 * Version de développement de NotificationAPI avec données mockées
 * À utiliser quand le backend n'a pas encore implémenté les endpoints
 */
class MockNotificationAPI extends NotificationAPI {
    constructor(baseURL) {
        super(baseURL);
        this.mockData = new Map(); // Map<roadtripId, Array<Notification>>
        this.initializeMockData();
    }

    initializeMockData() {
        // Données de test pour différents roadtrips
        const mockNotifications = [
            {
                _id: 'mock-1',
                title: '🤖 Chatbot - Suggestion d\'activité',
                message: 'J\'ai trouvé une randonnée intéressante près de votre prochaine étape !',
                type: 'chatbot_success',
                icon: 'success',
                read: false,
                roadtripId: '67ac491396003c7411aea948',
                userId: 'mock-user',
                data: { activityType: 'hiking' },
                createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
                readAt: null
            },
            {
                _id: 'mock-2', 
                title: '📅 Rappel de planification',
                message: 'N\'oubliez pas de réserver votre hébergement pour l\'étape de demain.',
                type: 'reminder',
                icon: 'info',
                read: false,
                roadtripId: '67ac491396003c7411aea948',
                userId: 'mock-user',
                data: { stepId: 'mock-step-1' },
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
                readAt: null
            },
            {
                _id: 'mock-3',
                title: '⚠️ Alerte météo',
                message: 'Risque de pluie prévu pour votre étape à Waterton demain.',
                type: 'system',
                icon: 'warning',
                read: true,
                roadtripId: '67ac491396003c7411aea948',
                userId: 'mock-user',
                data: { weather: 'rain', location: 'Waterton' },
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
                readAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString()
            }
        ];

        // Grouper par roadtripId
        mockNotifications.forEach(notification => {
            const roadtripId = notification.roadtripId;
            if (!this.mockData.has(roadtripId)) {
                this.mockData.set(roadtripId, []);
            }
            this.mockData.get(roadtripId).push(notification);
        });

        console.log('🧪 MockNotificationAPI initialisé avec', mockNotifications.length, 'notifications de test');
    }

    async getNotifications(roadtripId, options = {}) {
        console.log('🧪 MockNotificationAPI: getNotifications appelé pour', roadtripId);
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

        const notifications = this.mockData.get(roadtripId) || [];
        
        // Appliquer les filtres
        let filteredNotifications = [...notifications];
        
        if (options.unreadOnly) {
            filteredNotifications = filteredNotifications.filter(n => !n.read);
        }
        
        if (options.limit) {
            filteredNotifications = filteredNotifications.slice(0, options.limit);
        }

        // Trier par date (plus récent en premier)
        filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            success: true,
            data: filteredNotifications
        };
    }

    async markAsRead(roadtripId, notificationId) {
        console.log('🧪 MockNotificationAPI: markAsRead appelé pour', roadtripId, notificationId);
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));

        const notifications = this.mockData.get(roadtripId) || [];
        const notification = notifications.find(n => n._id === notificationId);
        
        if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            console.log('🧪 Notification marquée comme lue:', notificationId);
            return { success: true };
        }
        
        throw new Error('Notification not found');
    }

    async deleteNotification(roadtripId, notificationId) {
        console.log('🧪 MockNotificationAPI: deleteNotification appelé pour', roadtripId, notificationId);
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));

        const notifications = this.mockData.get(roadtripId) || [];
        const index = notifications.findIndex(n => n._id === notificationId);
        
        if (index !== -1) {
            notifications.splice(index, 1);
            console.log('🧪 Notification supprimée:', notificationId);
            return { success: true };
        }
        
        throw new Error('Notification not found');
    }

    // Méthode utilitaire pour ajouter des notifications de test
    addMockNotification(roadtripId, notification) {
        if (!this.mockData.has(roadtripId)) {
            this.mockData.set(roadtripId, []);
        }
        
        const newNotification = {
            _id: `mock-${Date.now()}`,
            title: notification.title || 'Notification de test',
            message: notification.message || 'Message de test',
            type: notification.type || 'system',
            icon: notification.icon || 'info',
            read: false,
            roadtripId,
            userId: 'mock-user',
            data: notification.data || {},
            createdAt: new Date().toISOString(),
            readAt: null,
            ...notification
        };
        
        this.mockData.get(roadtripId).unshift(newNotification);
        console.log('🧪 Nouvelle notification de test ajoutée:', newNotification.title);
        
        return newNotification;
    }

    // Méthode pour simuler l'arrivée de nouvelles notifications
    simulateNewNotification(roadtripId) {
        const messages = [
            { title: '🤖 Nouveau conseil du chatbot', message: 'J\'ai une suggestion pour votre prochaine étape !', type: 'chatbot_success', icon: 'success' },
            { title: '📍 Point d\'intérêt découvert', message: 'Un nouveau lieu intéressant a été ajouté près de votre itinéraire.', type: 'system', icon: 'info' },
            { title: '🛏️ Rappel hébergement', message: 'Pensez à confirmer votre réservation pour ce soir.', type: 'reminder', icon: 'warning' },
            { title: '🌦️ Mise à jour météo', message: 'Les conditions météo ont changé pour demain.', type: 'system', icon: 'warning' }
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        return this.addMockNotification(roadtripId, randomMessage);
    }
}

export default MockNotificationAPI;
