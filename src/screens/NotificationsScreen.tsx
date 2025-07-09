import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert 
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useNotifications } from '../hooks/useNotifications';
import NotificationListSimple from '../components/NotificationListSimple';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = StackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ route, navigation }: Props) {
    const { roadtripId } = route.params;
    const [showReadNotifications, setShowReadNotifications] = useState(false);
    
    const { 
        notifications,
        getUnreadCount, 
        getTotalUnreadCount,
        markAsRead,
        deleteNotification,
        forceSync,
        isLoading,
        error 
    } = useNotifications(roadtripId);

    const unreadCount = getUnreadCount(roadtripId);
    const totalUnreadCount = getTotalUnreadCount();

    const handleForceSync = async () => {
        try {
            await forceSync(roadtripId);
            Alert.alert('Succès', 'Notifications synchronisées');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de synchroniser les notifications');
        }
    };

    const toggleReadNotifications = () => {
        setShowReadNotifications(!showReadNotifications);
    };

    return (
        <View style={styles.container}>
            {/* Header avec statistiques */}
            <View style={styles.header}>
                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>
                        {unreadCount} nouvelles • {totalUnreadCount} total non lues
                    </Text>
                </View>
                
                <View style={styles.headerActions}>
                    <TouchableOpacity 
                        onPress={toggleReadNotifications}
                        style={styles.toggleButton}
                    >
                        <Icon 
                            name={showReadNotifications ? "visibility-off" : "visibility"} 
                            size={20} 
                            color="#666" 
                        />
                        <Text style={styles.toggleButtonText}>
                            {showReadNotifications ? 'Masquer lues' : 'Voir toutes'}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={handleForceSync}
                        style={styles.refreshButton}
                        disabled={isLoading}
                    >
                        <Icon 
                            name="refresh" 
                            size={20} 
                            color={isLoading ? "#ccc" : "#007BFF"} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Message d'erreur */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        Erreur: {error.message}
                    </Text>
                </View>
            )}

            {/* Liste des notifications */}
            <NotificationListSimple 
                notifications={notifications}
                roadtripId={roadtripId}
                maxItems={50}
                showReadNotifications={showReadNotifications}
                style={styles.notificationList}
                onRefresh={handleForceSync}
                onMarkAsRead={markAsRead}
                onDeleteNotification={deleteNotification}
                isLoading={isLoading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsContainer: {
        flex: 1,
    },
    statsText: {
        fontSize: 14,
        color: '#666',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    toggleButtonText: {
        fontSize: 12,
        color: '#666',
    },
    refreshButton: {
        padding: 8,
        borderRadius: 4,
    },
    errorContainer: {
        backgroundColor: '#fee2e2',
        padding: 12,
        margin: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
    },
    notificationList: {
        flex: 1,
        margin: 16,
        marginTop: 0,
    },
});
