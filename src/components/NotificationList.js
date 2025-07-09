import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from './NotificationItem';

const NotificationList = ({ 
    roadtripId, 
    maxItems = 10,
    showReadNotifications = false,
    style = {},
    onRefresh = null
}) => {
    const notificationHook = useNotifications();
    const { getNotifications, markAsRead, deleteNotification, forceSync, isLoading, subscribe } = notificationHook;
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const updateNotifications = () => {
            let allNotifications = getNotifications(roadtripId);
            
            if (!showReadNotifications) {
                allNotifications = allNotifications.filter(n => !n.read);
            }
            
            // Trier par date de création (plus récent en premier)
            allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            setNotifications(allNotifications.slice(0, maxItems));
        };

        // Mise à jour initiale
        updateNotifications();

        // S'abonner aux changements
        const unsubscribe = subscribe((event, data) => {
            if (data.roadtripId === roadtripId && 
                (event === 'notifications_updated' || event === 'new_notification')) {
                updateNotifications();
            }
        });

        return unsubscribe;
    }, [roadtripId, maxItems, showReadNotifications, getNotifications, subscribe]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(roadtripId, notificationId);
        } catch (error) {
            console.error('Erreur marquage notification:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await deleteNotification(roadtripId, notificationId);
        } catch (error) {
            console.error('Erreur suppression notification:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await forceSync(roadtripId);
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error('Erreur actualisation:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const renderNotification = ({ item }) => (
        <NotificationItem
            notification={item}
            onMarkAsRead={() => handleMarkAsRead(item._id)}
            onDelete={() => handleDelete(item._id)}
        />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {showReadNotifications ? 'Aucune notification' : 'Aucune nouvelle notification'}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, style]}>
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3b82f6']}
                        tintColor="#3b82f6"
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e1e8ed',
        overflow: 'hidden',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
};

export default NotificationList;
