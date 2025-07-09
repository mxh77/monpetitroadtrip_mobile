import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const NotificationButton = ({ 
    roadtripId,
    unreadCount = 0,
    onPress,
    style = {},
    iconSize = 24,
    iconColor = '#007BFF'
}) => {
    const handlePress = () => {
        if (onPress) {
            onPress(roadtripId);
        }
    };

    return (
        <View style={style}>
            <TouchableOpacity 
                onPress={handlePress}
                style={styles.button}
            >
                <Icon 
                    name="notifications" 
                    size={iconSize} 
                    color={iconColor} 
                />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = {
    button: {
        position: 'relative',
        padding: 8,
    },
    badge: {
        position: 'absolute',
        right: 2,
        top: 2,
        backgroundColor: '#FF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
};

export default NotificationButton;
