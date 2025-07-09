/**
 * Script de test rapide pour les notifications
 * À exécuter dans la console du développeur ou via un bouton de test
 */

// Simulation d'une notification de test
const createTestNotification = (roadtripId, type = 'info') => {
    const testNotifications = {
        info: {
            _id: `test-${Date.now()}-info`,
            title: '📝 Information',
            message: 'Votre roadtrip a été mis à jour avec succès',
            type: 'system',
            icon: 'info',
            read: false,
            roadtripId,
            userId: 'test-user',
            data: { source: 'test' },
            createdAt: new Date().toISOString(),
            readAt: null
        },
        success: {
            _id: `test-${Date.now()}-success`,
            title: '✅ Succès',
            message: 'Votre demande de planification IA a été traitée',
            type: 'chatbot_success',
            icon: 'success',
            read: false,
            roadtripId,
            userId: 'test-user',
            data: { aiResponse: true },
            createdAt: new Date().toISOString(),
            readAt: null
        },
        error: {
            _id: `test-${Date.now()}-error`,
            title: '❌ Erreur',
            message: 'Impossible de sauvegarder vos modifications',
            type: 'chatbot_error',
            icon: 'error',
            read: false,
            roadtripId,
            userId: 'test-user',
            data: { errorCode: 'SAVE_FAILED' },
            createdAt: new Date().toISOString(),
            readAt: null
        },
        warning: {
            _id: `test-${Date.now()}-warning`,
            title: '⚠️ Attention',
            message: 'Vérifiez les dates de votre roadtrip, certaines semblent incohérentes',
            type: 'reminder',
            icon: 'warning',
            read: false,
            roadtripId,
            userId: 'test-user',
            data: { checkDates: true },
            createdAt: new Date().toISOString(),
            readAt: null
        }
    };

    return testNotifications[type] || testNotifications.info;
};

// Mock de l'API pour les tests
class MockNotificationAPI {
    constructor() {
        this.notifications = new Map();
        this.generateTestNotifications();
    }

    generateTestNotifications() {
        const roadtripIds = ['test-roadtrip-1', 'test-roadtrip-2'];
        const types = ['info', 'success', 'error', 'warning'];
        
        roadtripIds.forEach(roadtripId => {
            const notifications = [];
            types.forEach((type, index) => {
                // Créer 1-3 notifications de chaque type
                const count = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < count; i++) {
                    notifications.push(createTestNotification(roadtripId, type));
                }
            });
            this.notifications.set(roadtripId, notifications);
        });
    }

    async getNotifications(roadtripId, options = {}) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simuler latence réseau
        
        let notifications = this.notifications.get(roadtripId) || [];
        
        if (!options.includeRead) {
            notifications = notifications.filter(n => !n.read);
        }
        
        if (options.types && Array.isArray(options.types)) {
            notifications = notifications.filter(n => options.types.includes(n.type));
        }
        
        if (options.limit) {
            notifications = notifications.slice(0, options.limit);
        }
        
        return notifications;
    }

    async markAsRead(roadtripId, notificationId) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const notifications = this.notifications.get(roadtripId) || [];
        const notification = notifications.find(n => n._id === notificationId);
        
        if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
        }
        
        return { success: true };
    }

    async deleteNotification(roadtripId, notificationId) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const notifications = this.notifications.get(roadtripId) || [];
        const index = notifications.findIndex(n => n._id === notificationId);
        
        if (index !== -1) {
            notifications.splice(index, 1);
        }
        
        return { success: true };
    }

    // Méthode pour ajouter une nouvelle notification (test)
    addTestNotification(roadtripId, type = 'info') {
        const notifications = this.notifications.get(roadtripId) || [];
        const newNotification = createTestNotification(roadtripId, type);
        notifications.unshift(newNotification); // Ajouter au début
        this.notifications.set(roadtripId, notifications);
        return newNotification;
    }
}

// Tests unitaires simples
const runNotificationTests = async () => {
    console.log('🧪 Début des tests de notifications...');
    
    const mockAPI = new MockNotificationAPI();
    const testRoadtripId = 'test-roadtrip-1';
    
    try {
        // Test 1: Récupération des notifications
        console.log('📋 Test 1: Récupération des notifications...');
        const notifications = await mockAPI.getNotifications(testRoadtripId);
        console.log(`✅ Récupéré ${notifications.length} notifications`);
        
        // Test 2: Notifications non lues seulement
        console.log('👁️ Test 2: Notifications non lues...');
        const unreadNotifications = await mockAPI.getNotifications(testRoadtripId, { includeRead: false });
        console.log(`✅ ${unreadNotifications.length} notifications non lues`);
        
        // Test 3: Marquer comme lu
        if (unreadNotifications.length > 0) {
            console.log('✓ Test 3: Marquer comme lu...');
            const firstNotification = unreadNotifications[0];
            await mockAPI.markAsRead(testRoadtripId, firstNotification._id);
            console.log(`✅ Notification ${firstNotification._id} marquée comme lue`);
        }
        
        // Test 4: Supprimer une notification
        if (notifications.length > 1) {
            console.log('🗑️ Test 4: Suppression...');
            const toDelete = notifications[1];
            await mockAPI.deleteNotification(testRoadtripId, toDelete._id);
            console.log(`✅ Notification ${toDelete._id} supprimée`);
        }
        
        // Test 5: Ajouter une nouvelle notification
        console.log('➕ Test 5: Ajouter une notification...');
        const newNotification = mockAPI.addTestNotification(testRoadtripId, 'success');
        console.log(`✅ Nouvelle notification ajoutée: ${newNotification.title}`);
        
        console.log('🎉 Tous les tests passés avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur pendant les tests:', error);
    }
};

// Interface de test pour l'UI
const createTestInterface = () => {
    const testUI = {
        // Simuler useNotifications hook
        useNotifications: (roadtripId) => {
            const mockAPI = new MockNotificationAPI();
            return {
                notifications: [],
                unreadCount: 0,
                isLoading: false,
                error: null,
                
                // Méthodes async simulées
                markAsRead: async (rId, nId) => {
                    console.log(`🏷️ Marquage lecture: ${nId} pour roadtrip ${rId}`);
                    return mockAPI.markAsRead(rId, nId);
                },
                
                deleteNotification: async (rId, nId) => {
                    console.log(`🗑️ Suppression: ${nId} pour roadtrip ${rId}`);
                    return mockAPI.deleteNotification(rId, nId);
                },
                
                forceSync: async (rId) => {
                    console.log(`🔄 Synchronisation forcée pour roadtrip ${rId}`);
                    return mockAPI.getNotifications(rId);
                },
                
                boostPolling: (rId, duration) => {
                    console.log(`🚀 Boost polling: ${rId} pendant ${duration}ms`);
                }
            };
        }
    };
    
    return testUI;
};

// Simulateur de notifications en temps réel
class NotificationSimulator {
    constructor(roadtripId) {
        this.roadtripId = roadtripId;
        this.isRunning = false;
        this.interval = null;
        this.callbacks = new Set();
    }
    
    start(intervalMs = 5000) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log(`📡 Simulateur démarré pour ${this.roadtripId} (${intervalMs}ms)`);
        
        this.interval = setInterval(() => {
            this.generateRandomNotification();
        }, intervalMs);
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        console.log(`⏹️ Simulateur arrêté pour ${this.roadtripId}`);
    }
    
    generateRandomNotification() {
        const types = ['info', 'success', 'error', 'warning'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const notification = createTestNotification(this.roadtripId, randomType);
        
        console.log(`🔔 Nouvelle notification simulée:`, notification);
        
        // Notifier les callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(notification);
            } catch (error) {
                console.error('Erreur callback simulation:', error);
            }
        });
    }
    
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createTestNotification,
        MockNotificationAPI,
        runNotificationTests,
        createTestInterface,
        NotificationSimulator
    };
} else {
    // Pour le navigateur / React Native debugging
    window.NotificationTestUtils = {
        createTestNotification,
        MockNotificationAPI,
        runNotificationTests,
        createTestInterface,
        NotificationSimulator
    };
    
    console.log('🛠️ Utilitaires de test des notifications chargés!');
    console.log('Utilisez: NotificationTestUtils.runNotificationTests()');
}

// Auto-exécution des tests si dans un environnement de test
if (typeof global !== 'undefined' && global.__TEST_ENV__) {
    runNotificationTests();
}
