import config from '../config';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, Alert, Modal, Pressable, RefreshControl, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Importer l'icône
import IconFA from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types';
import { FAB } from 'react-native-paper'; // Importer le b
import Constants from 'expo-constants';
import { useCustomFetch } from '../utils/utils';


type Props = StackScreenProps<RootStackParamList, 'RoadTrips'>;

type File = {
  _id: string;
  url: string;
  type: string;
  fileId: string;
  createdAt: string;
};

type Roadtrip = {
  _id: string;
  userId: string;
  name: string;
  days: number;
  startLocation: string;
  startDateTime: Date;
  endLocation: string;
  endDateTime: Date;
  currency: string;
  notes: string;
  photos: File[]; // Ajoutez cette propriété
  thumbnail?: File; // Ajoutez cette propriété
};

export default function RoadTripsScreen({ navigation, route }: Props) {
  const customFetch = useCustomFetch();

  const [roadtrips, setRoadtrips] = useState<Roadtrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // État pour gérer le rafraîchissement
  const [selectedRoadtrip, setSelectedRoadtrip] = useState<Roadtrip | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);

  const fetchRoadtrips = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await customFetch(`${config.BACKEND_URL}/roadtrips`, {
        signal // Ajouter le signal d'abort
      });
      
      if (signal?.aborted) return; // Arrêter si l'opération est annulée
      
      const data = await response.json();
      setRoadtrips(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        //console.error('Erreur lors de la récupération des roadtrips:', error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    
    fetchRoadtrips(controller.signal);
    navigation.setParams({ refresh: () => fetchRoadtrips() });
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginLeft: 16 }}>
          <Icon name="settings" size={26} color="#007BFF" />
        </TouchableOpacity>
      ),
    });

    // Cleanup : annuler la requête si le composant se démonte
    return () => {
      controller.abort();
    };
  }, []);

  const handleAddRoadtrip = () => {
    setChoiceModalVisible(true);
  };

  const handleEditRoadtrip = () => {
    if (selectedRoadtrip) {
      navigation.navigate('EditRoadTrip', { roadtripId: selectedRoadtrip._id }); // Naviguez vers la page de modification de roadtrip
      setModalVisible(false);
    }
  };

  const handleDeleteRoadtrip = async () => {
    if (selectedRoadtrip) {
      try {
        const response = await fetch(`${config.BACKEND_URL}/roadtrips/${selectedRoadtrip._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setRoadtrips(roadtrips.filter(roadtrip => roadtrip._id !== selectedRoadtrip._id));
          Alert.alert('Succès', 'Le roadtrip a été supprimé.');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du roadtrip.');
        }
      } catch (error) {
        Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
      } finally {
        setModalVisible(false);
      }
    }
  };

  const handleLongPress = (roadtrip: Roadtrip) => {
    setSelectedRoadtrip(roadtrip);
    setModalVisible(true);
  };

  // Optimisation : formatage des dates pré-calculé
  const roadtripsWithFormattedDates = useMemo(() => {
    return roadtrips.map(roadtrip => {
      // Convertir les chaînes de caractères en objets Date
      const startDate = roadtrip.startDateTime ? new Date(roadtrip.startDateTime) : null;
      const endDate = roadtrip.endDateTime ? new Date(roadtrip.endDateTime) : null;
      
      const startDateStr = startDate && !isNaN(startDate.getTime()) 
        ? startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
        : '';
      const endDateStr = endDate && !isNaN(endDate.getTime()) 
        ? endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
        : '';
      
      return {
        ...roadtrip,
        formattedDateRange: startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : ''
      };
    });
  }, [roadtrips]);

  // Optimisation : mémoïsation du rendu des éléments
  const renderRoadtripItem = useCallback(({ item }: { item: Roadtrip & { formattedDateRange: string } }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('RoadTrip', { roadtripId: item._id })}
      onLongPress={() => handleLongPress(item)}
    >
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail.url }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImagePlaceholderText}>No Image</Text>
        </View>
      )}
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardText}>{item.days} jours</Text>
      <Text style={styles.cardText}>{item.formattedDateRange}</Text>
      <Text style={styles.cardText}>{item.notes}</Text>
    </Pressable>
  ), [navigation]);

  // Optimisation : getItemLayout pour de meilleures performances de scroll
  const getItemLayout = useCallback((data: any, index: number) => {
    const ITEM_HEIGHT = 220; // Hauteur approximative de chaque carte
    const ITEM_MARGIN = 10;   // Marge entre les éléments
    return {
      length: ITEM_HEIGHT + ITEM_MARGIN,
      offset: (ITEM_HEIGHT + ITEM_MARGIN) * Math.floor(index / 2), // Division par 2 car numColumns=2
      index,
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoadtrips();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={roadtripsWithFormattedDates}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={renderRoadtripItem}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        removeClippedSubviews={true}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={100}
        windowSize={10}
        getItemLayout={getItemLayout}
      />
      <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={handleAddRoadtrip}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalButton} onPress={handleEditRoadtrip}>
              <Icon name="edit" size={24} color="#007BFF" />
              <Text style={styles.modalButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleDeleteRoadtrip}>
              <Icon name="delete" size={24} color="#FF0000" />
              <Text style={styles.modalButtonText}>Supprimer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={choiceModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setChoiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Créer un roadtrip</Text>
            <Text style={styles.modalSubtitle}>Choisissez votre méthode de création</Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setChoiceModalVisible(false);
                navigation.navigate('EditRoadTrip', {});
              }}
            >
              <Icon name="edit" size={20} color="#007BFF" style={styles.modalButtonIcon} />
              <View style={styles.modalButtonTextContainer}>
                <Text style={styles.modalButtonText}>Création classique</Text>
                <Text style={styles.modalButtonSubtext}>Formulaire détaillé</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setChoiceModalVisible(false);
                navigation.navigate('CreateRoadtripAI', {});
              }}
            >
              <IconFA name="magic" size={20} color="#007BFF" style={styles.modalButtonIcon} />
              <View style={styles.modalButtonTextContainer}>
                <Text style={styles.modalButtonText}>Création via IA</Text>
                <Text style={styles.modalButtonSubtext}>Décrivez votre roadtrip en langage naturel</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setChoiceModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  grid: {
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    color: '#fff',
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    paddingBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007BFF',
  },
  // Styles pour le modal ajout identiques à RoadTripScreen
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  modalButtonIcon: {
    marginRight: 12,
  },
  modalButtonTextContainer: {
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  modalButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  modalCancelButton: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#999',
  },
});