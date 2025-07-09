import React, { createContext, useEffect, useState } from 'react';
import SimpleNotificationManager from '../services/SimpleNotificationManager';
import config from '../config';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ 
    children, 
    token = null,
    pollingFrequency = 3000,
    enablePushNotifications = false, // Désactivé par défaut pour éviter les erreurs natives
    useMockAPI = true // Utiliser l'API mockée par défaut en développement
}) => {
    const [notificationManager, setNotificationManager] = useState(null);

    useEffect(() => {
        // Créer le gestionnaire de notifications
        const manager = new SimpleNotificationManager({
            token,
            baseURL: config.BACKEND_URL,
            pollingFrequency,
            enablePushNotifications,
            useMockAPI,
            onNewNotification: (notification, roadtripId) => {
                // Handler personnalisé pour les nouvelles notifications
                console.log('🔔 Nouvelle notification reçue:', notification.title);
            },
            onError: (error, roadtripId) => {
                console.error(`Erreur notifications roadtrip ${roadtripId}:`, error);
            }
        });

        setNotificationManager(manager);

        // Cleanup
        return () => {
            manager.destroy();
        };
    }, [token, pollingFrequency, enablePushNotifications]);

    // Mettre à jour le token quand il change
    useEffect(() => {
        if (notificationManager && token) {
            notificationManager.setToken(token);
        }
    }, [notificationManager, token]);

    return (
        <NotificationContext.Provider value={notificationManager}>
            {children}
        </NotificationContext.Provider>
    );
};
