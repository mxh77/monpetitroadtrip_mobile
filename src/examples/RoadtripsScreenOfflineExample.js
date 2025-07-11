import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRepository, useSyncStatus, useListData } from '../hooks/useOffline';
import OfflineStatusBar from '../components/OfflineStatusBar';

/**
 * Exemple d'intégration du système offline avec un écran de roadtrips
 * Remplace les appels fetch existants
 */
const RoadtripsScreenOfflineExample = ({ token, navigation }) => {
  // Hook pour le repository des roadtrips
  const { repository: roadtripRepo, isReady } = useRepository('roadtrip');
  
  // Hook pour le statut de synchronisation
  const { status, isConnected, pendingOperations } = useSyncStatus();
  
  // Hook pour la liste des roadtrips avec cache automatique
  const { 
    data: roadtrips, 
    isLoading, 
    error, 
    refresh 
  } = useListData('roadtrip', 'getAllRoadtrips', [token]);

  // Fonction pour créer un nouveau roadtrip (remplace votre logique existante)
  const handleCreateRoadtrip = async (roadtripData) => {
    if (!roadtripRepo) return;

    try {
      // Création avec mise à jour optimiste
      const result = await roadtripRepo.createRoadtrip(roadtripData, token, {
        optimisticUpdate: true
      });

      console.log('✅ Roadtrip créé:', result.data._id);
      
      // Rafraîchir la liste
      await refresh(token);
      
      // Naviguer vers le nouveau roadtrip
      navigation.navigate('RoadtripDetail', { 
        roadtripId: result.data._id 
      });

    } catch (error) {
      console.error('❌ Erreur création roadtrip:', error);
      Alert.alert('Erreur', 'Impossible de créer le roadtrip');
    }
  };

  // Fonction pour supprimer un roadtrip
  const handleDeleteRoadtrip = async (roadtripId) => {
    if (!roadtripRepo) return;

    try {
      await roadtripRepo.deleteRoadtrip(roadtripId, token, {
        optimisticUpdate: true
      });

      console.log('✅ Roadtrip supprimé:', roadtripId);
      
      // Rafraîchir la liste
      await refresh(token);

    } catch (error) {
      console.error('❌ Erreur suppression roadtrip:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le roadtrip');
    }
  };

  // Gestion des erreurs réseau
  useEffect(() => {
    if (error) {
      if (!isConnected) {
        // En mode offline, ne pas montrer d'erreur si on a des données en cache
        if (!roadtrips || roadtrips.length === 0) {
          Alert.alert(
            'Mode hors ligne', 
            'Aucune donnée disponible. Connectez-vous pour synchroniser.'
          );
        }
      } else {
        Alert.alert('Erreur réseau', error.message);
      }
    }
  }, [error, isConnected, roadtrips]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initialisation des services offline...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Barre de statut offline */}
      <OfflineStatusBar 
        showDetails={true}
        onPress={(status) => {
          Alert.alert('Statut de synchronisation', JSON.stringify(status, null, 2));
        }}
      />

      {/* Votre UI existante ici */}
      <View style={{ padding: 16 }}>
        <Text>Roadtrips ({roadtrips.length})</Text>
        
        {/* Indicateur de chargement */}
        {isLoading && <Text>Chargement...</Text>}
        
        {/* Indicateur de mode offline */}
        {!isConnected && (
          <Text style={{ color: 'orange' }}>
            Mode hors ligne - {pendingOperations} modifications en attente
          </Text>
        )}

        {/* Liste des roadtrips */}
        {roadtrips.map(roadtrip => (
          <View key={roadtrip._id} style={{ padding: 8, borderBottomWidth: 1 }}>
            <Text>{roadtrip.title}</Text>
            {roadtrip._isPending && (
              <Text style={{ color: 'orange', fontSize: 12 }}>
                Synchronisation en cours...
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default RoadtripsScreenOfflineExample;
