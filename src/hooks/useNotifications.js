import { useContext, useEffect, useState } from 'react';
import { NotificationContext } from '../context/NotificationContext';

export const useNotifications = (roadtripId = null) => {
    const notificationManager = useContext(NotificationContext);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    if (!notificationManager) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }

    // Auto-watch roadtrip si fourni
    useEffect(() => {
        if (roadtripId && notificationManager) {
            notificationManager.watchRoadtrip(roadtripId);
            
            return () => {
                notificationManager.unwatchRoadtrip(roadtripId);
            };
        }
    }, [roadtripId, notificationManager]);

    // S'abonner aux changements de notifications
    useEffect(() => {
        if (!notificationManager) return;

        const updateLocalState = () => {
            if (roadtripId) {
                setNotifications(notificationManager.getNotifications(roadtripId));
                setUnreadCount(notificationManager.getUnreadCount(roadtripId));
            }
        };

        // Mise à jour initiale
        updateLocalState();

        // S'abonner aux changements
        const unsubscribe = notificationManager.subscribe((event, data) => {
            if (roadtripId && data.roadtripId === roadtripId) {
                updateLocalState();
            }
        });

        return unsubscribe;
    }, [notificationManager, roadtripId]);

    const markAsRead = async (targetRoadtripId, notificationId) => {
        const roadtrip = targetRoadtripId || roadtripId;
        if (!roadtrip) throw new Error('roadtripId requis');

        setIsLoading(true);
        setError(null);
        
        try {
            await notificationManager.markAsRead(roadtrip, notificationId);
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteNotification = async (targetRoadtripId, notificationId) => {
        const roadtrip = targetRoadtripId || roadtripId;
        if (!roadtrip) throw new Error('roadtripId requis');

        setIsLoading(true);
        setError(null);
        
        try {
            await notificationManager.deleteNotification(roadtrip, notificationId);
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const forceSync = async (targetRoadtripId) => {
        const roadtrip = targetRoadtripId || roadtripId;
        if (!roadtrip) throw new Error('roadtripId requis');

        setIsLoading(true);
        setError(null);
        
        try {
            await notificationManager.forceSync(roadtrip);
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        // Données locales (pour le roadtrip courant)
        notifications,
        unreadCount,
        
        // Données globales
        getNotifications: (id) => notificationManager.getNotifications(id || roadtripId),
        getUnreadCount: (id) => notificationManager.getUnreadCount(id || roadtripId),
        getTotalUnreadCount: () => notificationManager.getTotalUnreadCount(),
        
        // Actions
        watchRoadtrip: (id) => notificationManager.watchRoadtrip(id),
        unwatchRoadtrip: (id) => notificationManager.unwatchRoadtrip(id),
        markAsRead,
        deleteNotification,
        forceSync,
        boostPolling: (id, duration) => notificationManager.boostPolling(id || roadtripId, duration),
        
        // État
        isLoading,
        error,
        
        // Utilitaires
        subscribe: (callback) => notificationManager.subscribe(callback)
    };
};
