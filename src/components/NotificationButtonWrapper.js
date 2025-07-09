import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../hooks/useNotifications';
import NotificationButton from './NotificationButton';

/**
 * Wrapper pour NotificationButton qui utilise les hooks
 * À utiliser dans les composants normaux, pas dans les headers
 */
const NotificationButtonWrapper = ({ 
    roadtripId,
    style = {},
    iconSize = 24,
    iconColor = '#007BFF'
}) => {
    const { getUnreadCount, boostPolling } = useNotifications();
    const navigation = useNavigation();
    
    const unreadCount = getUnreadCount(roadtripId);

    const handlePress = (roadtripId) => {
        navigation.navigate('Notifications', { roadtripId });
        // Booster le polling quand l'utilisateur ouvre les notifications
        boostPolling(roadtripId, 30000);
    };

    return (
        <NotificationButton
            roadtripId={roadtripId}
            unreadCount={unreadCount}
            onPress={handlePress}
            style={style}
            iconSize={iconSize}
            iconColor={iconColor}
        />
    );
};

export default NotificationButtonWrapper;
