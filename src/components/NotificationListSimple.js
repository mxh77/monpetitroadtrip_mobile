import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import NotificationItem from './NotificationItem';

const NotificationListSimple = ({ 
    notifications = [],
    roadtripId,
    maxItems = 10,
    showReadNotifications = false,
    style = {},
    onRefresh = null,
    onMarkAsRead = null,
    onDeleteNotification = null,
    isLoading = false
}) => {
    const [refreshing, setRefreshing] = useState(false);

    // Filtrer et trier les notifications
    let displayNotifications = [...notifications];
    
    if (!showReadNotifications) {
        displayNotifications = displayNotifications.filter(n => !n.read);
    }
    
    // Trier par date de création (plus récent en premier)
    displayNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Limiter le nombre d'éléments
    displayNotifications = displayNotifications.slice(0, maxItems);

    const handleRefresh = async () => {
        if (!onRefresh) return;
        
        setRefreshing(true);
        try {
            await onRefresh();
        } catch (error) {
            console.error('Erreur refresh notifications:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        if (!onMarkAsRead) return;
        
        try {
            await onMarkAsRead(roadtripId, notificationId);
        } catch (error) {
            console.error('Erreur marquage notification:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        if (!onDeleteNotification) return;
        
        try {
            await onDeleteNotification(roadtripId, notificationId);
        } catch (error) {
            console.error('Erreur suppression notification:', error);
        }
    };

    const renderNotification = ({ item }) => (
        <NotificationItem
            notification={item}
            onMarkAsRead={() => handleMarkAsRead(item._id)}
            onDelete={() => handleDelete(item._id)}
            showActions={true}
        />
    );

    if (displayNotifications.length === 0) {
        return (
            <View style={[styles.emptyContainer, style]}>
                <Text style={styles.emptyText}>
                    {showReadNotifications 
                        ? 'Aucune notification' 
                        : 'Aucune nouvelle notification'
                    }
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <FlatList
                data={displayNotifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item._id}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#007BFF"
                            title="Actualisation..."
                        />
                    ) : undefined
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContent: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
};

export default NotificationListSimple;
