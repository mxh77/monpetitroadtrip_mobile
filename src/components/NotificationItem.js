import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const NotificationItem = ({ 
    notification, 
    onMarkAsRead, 
    onDelete,
    showActions = true 
}) => {
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}j`;
    };

    const getIconName = (iconType) => {
        const iconMap = {
            'success': 'check-circle',
            'error': 'error',
            'info': 'info',
            'warning': 'warning'
        };
        return iconMap[iconType] || 'notifications';
    };

    const getIconColor = (iconType) => {
        const colorMap = {
            'success': '#4CAF50',
            'error': '#F44336',
            'info': '#2196F3',
            'warning': '#FF9800'
        };
        return colorMap[iconType] || '#757575';
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer la notification',
            'Êtes-vous sûr de vouloir supprimer cette notification ?',
            [
                {
                    text: 'Annuler',
                    style: 'cancel',
                },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: onDelete,
                },
            ]
        );
    };

    return (
        <View style={[
            styles.container,
            !notification.read && styles.unreadContainer
        ]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Icon 
                        name={getIconName(notification.icon)} 
                        size={20} 
                        color={getIconColor(notification.icon)}
                        style={styles.icon}
                    />
                    <Text style={[
                        styles.title,
                        !notification.read && styles.unreadText
                    ]}>
                        {notification.title}
                    </Text>
                    <Text style={styles.time}>
                        {formatTime(notification.createdAt)}
                    </Text>
                </View>
                
                <Text style={styles.message}>{notification.message}</Text>
                
                {notification.data && Object.keys(notification.data).length > 0 && (
                    <View style={styles.dataContainer}>
                        <Text style={styles.dataText}>
                            Données: {JSON.stringify(notification.data, null, 2)}
                        </Text>
                    </View>
                )}
            </View>
            
            {showActions && (
                <View style={styles.actions}>
                    {!notification.read && (
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={onMarkAsRead}
                        >
                            <Icon name="visibility" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleDelete}
                    >
                        <Icon name="delete" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = {
    container: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f4',
        backgroundColor: 'white',
    },
    unreadContainer: {
        backgroundColor: '#f0f9ff',
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    icon: {
        marginRight: 8,
    },
    title: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    unreadText: {
        fontWeight: 'bold',
    },
    time: {
        fontSize: 11,
        color: '#6b7280',
    },
    message: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
        marginTop: 2,
    },
    dataContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
    },
    dataText: {
        fontSize: 10,
        color: '#6b7280',
        fontFamily: 'monospace',
    },
    actions: {
        flexDirection: 'column',
        gap: 4,
    },
    actionButton: {
        padding: 6,
        borderRadius: 4,
    },
};

export default NotificationItem;
