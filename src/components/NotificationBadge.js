import React from 'react';
import { View, Text } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

const NotificationBadge = ({ roadtripId, style = {} }) => {
    const { getUnreadCount } = useNotifications();
    const unreadCount = getUnreadCount(roadtripId);

    if (unreadCount === 0) return null;

    return (
        <View style={[styles.badge, style]}>
            <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
        </View>
    );
};

const styles = {
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ff4757',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        zIndex: 1000,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
    },
};

export default NotificationBadge;
