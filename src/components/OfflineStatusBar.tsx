import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
// import offlineManager from '../services/OfflineManager'; // Temporairement commenté

/**
 * Composant pour afficher le statut de synchronisation offline
 */
const OfflineStatusBar = ({ 
  style = {},
  showDetails = false,
  onPress = null,
  autoHide = true,
  hideDelay = 3000
}) => {
  const [status, setStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    let mounted = true;
    let hideTimeout = null;

    const updateStatus = async () => {
      try {
        // TODO: Remplacer par offlineManager.getGlobalStatus() une fois le service créé
        const globalStatus = {
          connectivity: { isConnected: true, type: 'wifi' },
          pendingOperations: 0,
          isRunning: false,
          cachedItems: 0
        };
        
        if (mounted) {
          setStatus(globalStatus);
          
          // Afficher la barre si il y a des opérations en attente ou pas de connexion
          const shouldShow = !globalStatus.connectivity.isConnected || 
                           globalStatus.pendingOperations > 0;
          
          if (shouldShow !== isVisible) {
            setIsVisible(shouldShow);
            
            Animated.timing(fadeAnim, {
              toValue: shouldShow ? 1 : 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
            
            // Auto-hide après délai si connexion rétablie
            if (shouldShow && autoHide && globalStatus.connectivity.isConnected) {
              hideTimeout = setTimeout(() => {
                if (mounted) {
                  setIsVisible(false);
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }
              }, hideDelay);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur mise à jour status offline:', error);
      }
    };

    // Mise à jour initiale
    updateStatus();

    // Écouter les changements
    // const unsubscribe = offlineManager.addSyncStatusListener((event) => {
    //   updateStatus();
    // });

    // Polling périodique
    const interval = setInterval(updateStatus, 5000);

    return () => {
      mounted = false;
      if (hideTimeout) clearTimeout(hideTimeout);
      // if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [isVisible, fadeAnim, autoHide, hideDelay]);

  if (!status || !isVisible) {
    return null;
  }

  const getStatusInfo = () => {
    const { connectivity, pendingOperations, isRunning } = status;

    if (!connectivity.isConnected) {
      return {
        text: pendingOperations > 0 
          ? `Mode hors ligne - ${pendingOperations} modifications en attente`
          : 'Mode hors ligne',
        color: '#FF6B35',
        icon: '📱'
      };
    }

    if (isRunning) {
      return {
        text: 'Synchronisation en cours...',
        color: '#4CAF50',
        icon: '🔄'
      };
    }

    if (pendingOperations > 0) {
      return {
        text: `${pendingOperations} modifications en attente`,
        color: '#FF9800',
        icon: '⏳'
      };
    }

    return {
      text: 'Synchronisé',
      color: '#4CAF50',
      icon: '✅'
    };
  };

  const statusInfo = getStatusInfo();

  const handlePress = async () => {
    if (onPress) {
      onPress(status);
    } else if (status.connectivity.isConnected && status.pendingOperations > 0) {
      // Force sync par défaut
      try {
        // await offlineManager.forceGlobalSync();
        console.log('Force sync temporairement désactivé');
      } catch (error) {
        console.error('❌ Erreur force sync:', error);
      }
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      <TouchableOpacity 
        style={[styles.statusBar, { backgroundColor: statusInfo.color }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{statusInfo.icon}</Text>
          <Text style={styles.text}>{statusInfo.text}</Text>
          
          {showDetails && status && (
            <Text style={styles.details}>
              {status.connectivity.type} • {status.cachedItems} cache
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  details: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default OfflineStatusBar;
