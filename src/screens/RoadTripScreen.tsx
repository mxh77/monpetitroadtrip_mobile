import config from '../config';
import React, { useEffect, useState, useRef } from 'react';
import { Button, StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Importer les icônes
import { RootStackParamList, Roadtrip, File } from '../../types';
import { FAB } from 'react-native-paper'; // Importer le bouton flottant
import Swipeable from 'react-native-gesture-handler/Swipeable'; // Importer Swipeable de react-native-gesture-handler
import { checkDateConsistency } from '../utils/controls'; // Importer la fonction checkDateConsistency
import Timetable from '../components/timetable/src'; // Importer Timetable
import AdvancedPlanning from '../components/AdvancedPlanning'; // Importer le nouveau planning
import rvIcon from '../../assets/icones/RV/rv_32.png';
import { getMinStartDateTime } from '../utils/dateUtils';
import { RefreshControl } from 'react-native-gesture-handler';
import { useNavigationContext } from '../utils/NavigationContext';

type Props = StackScreenProps<RootStackParamList, 'RoadTrip'>;

const Tab = createBottomTabNavigator();

export default function RoadTripScreen({ route, navigation }: Props) {
  const { roadtripId, initialTab } = route.params || {};
  const [roadtrip, setRoadtrip] = useState<Roadtrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement
  const [alertCount, setAlertCount] = useState(0);
  const [errors, setErrors] = useState<{ message: string, stepId: string, stepType: string }[]>([]);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [dragSnapInterval, setDragSnapInterval] = useState(15); // Pas de déplacement en minutes (défaut: 15min)
  const [currentTab, setCurrentTab] = useState(initialTab || 'Liste des étapes');
  
  // Contexte de navigation pour gérer le retour automatique au Planning
  const { pendingPlanningNavigation, clearPendingNavigation } = useNavigationContext();
  
  // Déterminer l'onglet initial (par défaut: Liste des étapes, ou Planning si spécifié)
  const [tabInitialRouteName] = useState(initialTab || 'Liste des étapes');

  // Gérer la navigation automatique vers l'onglet Planning
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 RoadTripScreen focus, pendingPlanningNavigation:', pendingPlanningNavigation);
      if (pendingPlanningNavigation) {
        console.log('🎯 Navigation automatique vers l\'onglet Planning');
        // Utiliser setTimeout pour laisser le temps au composant de se rendre
        setTimeout(() => {
          if (navigation) {
            // Reset vers RoadTrip avec onglet Planning
            navigation.navigate('RoadTrip', { 
              roadtripId, 
              initialTab: 'Planning' 
            });
          }
          clearPendingNavigation();
        }, 100);
      }
    }, [pendingPlanningNavigation, roadtripId, navigation, clearPendingNavigation])
  );

  // Charger les paramètres utilisateur au démarrage
  useEffect(() => {
    loadUserSettings();
  }, []);

  // Log pour debug
  useEffect(() => {
    console.log('🔄 RoadTripScreen - Paramètres reçus:', { roadtripId, initialTab, tabInitialRouteName });
  }, [roadtripId, initialTab, tabInitialRouteName]);

  const getJwtToken = async () => '';

  const loadUserSettings = async () => {
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const userDragSnapInterval = typeof data.dragSnapInterval === 'number' ? data.dragSnapInterval : 15;
        setDragSnapInterval(userDragSnapInterval);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des paramètres utilisateur:', error);
      // Garder la valeur par défaut en cas d'erreur
    }
  };

  const fetchRoadtrip = async () => {
    setLoading(true); // Commencez le chargement
    try {
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}`);
      const data = await response.json();
      // console.log('Données de l\'API:', data);

      // Vérifiez la cohérence des dates et mettez à jour le nombre d'alertes
      const { alerts, errorMessages } = checkDateConsistency(data);
      console.log('Alertes:', alerts);
      setAlertCount(alerts);
      setErrors(errorMessages);

      // Vérifier les adresses manquantes
      const missingAddresses = checkMissingAddresses(data.steps);
      if (missingAddresses.length > 0) {
        console.warn('Adresses manquantes détectées:', missingAddresses);
        // Afficher une alerte pour informer l'utilisateur
        setTimeout(() => {
          Alert.alert(
            'Adresses manquantes détectées',
            `${missingAddresses.length} élément(s) n'ont pas d'adresse renseignée. Cela peut causer des erreurs lors du calcul d'itinéraires. Consultez les détails de vos étapes pour les compléter.`,
            [{ text: 'OK' }]
          );
        }, 1000); // Délai pour éviter les conflits avec d'autres alertes
      }

      // Filtrer les données pour ne conserver que les champs nécessaires
      const filteredData: Roadtrip = {
        idRoadtrip: data._id,
        name: data.name,
        steps: data.steps.map((step: any) => ({
          id: step._id,
          type: step.type,
          name: step.name,
          arrivalDateTime: step.arrivalDateTime,
          departureDateTime: step.departureDateTime,
          thumbnail: step.thumbnail, // Ajouter la propriété thumbnail
          travelTimePreviousStep: step.travelTimePreviousStep,
          distancePreviousStep: step.distancePreviousStep,
          travelTimeNote: step.travelTimeNote,
          accommodations: step.accommodations || [],
          activities: step.activities || [],
        })),
      };

      setRoadtrip(filteredData);
      console.log('Roadtrip récupéré:', filteredData);

    } catch (error) {
      console.error('Erreur lors de la récupération du roadtrip:', error);
      handleBackendError(error, 'lors de la récupération du roadtrip');
    } finally {
      setLoading(false); // Terminez le chargement
    }
  };

  // Fonction de refresh silencieux (sans loading) pour éviter le changement d'onglet
  const fetchRoadtripSilent = async () => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}`);
      const data = await response.json();

      // Vérifiez la cohérence des dates et mettez à jour le nombre d'alertes
      const { alerts, errorMessages } = checkDateConsistency(data);
      console.log('Alertes (refresh silencieux):', alerts);
      setAlertCount(alerts);
      setErrors(errorMessages);

      // Vérifier les adresses manquantes (mode silencieux)
      const missingAddresses = checkMissingAddresses(data.steps);
      if (missingAddresses.length > 0) {
        console.warn('Adresses manquantes détectées (refresh silencieux):', missingAddresses);
      }

      // Filtrer les données pour ne conserver que les champs nécessaires
      const filteredData: Roadtrip = {
        idRoadtrip: data._id,
        name: data.name,
        steps: data.steps.map((step: any) => ({
          id: step._id,
          type: step.type,
          name: step.name,
          arrivalDateTime: step.arrivalDateTime,
          departureDateTime: step.departureDateTime,
          thumbnail: step.thumbnail,
          travelTimePreviousStep: step.travelTimePreviousStep,
          distancePreviousStep: step.distancePreviousStep,
          travelTimeNote: step.travelTimeNote,
          accommodations: step.accommodations || [],
          activities: step.activities || [],
        })),
      };

      setRoadtrip(filteredData);
      console.log('Roadtrip récupéré (refresh silencieux):', filteredData);

    } catch (error) {
      console.error('Erreur lors de la récupération du roadtrip (refresh silencieux):', error);
      // En mode silencieux, on ne montre pas d'alerte sauf pour les erreurs d'adresses critiques
      if (error?.message?.includes('Origin and destination must be provided') || 
          (typeof error === 'string' && error.includes('Origin and destination must be provided'))) {
        handleBackendError(error, 'lors du rafraîchissement');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRoadtrip();
    });
    return unsubscribe;
  }, [navigation, roadtripId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Bloquer l'action par défaut du retour
      e.preventDefault();

      // Naviguer vers RoadtripScreen
      console.log('Navigation vers RoadtripsScreen');
      navigation.navigate('RoadTrips');
    });

    // Nettoyage à la désactivation du composant
    return unsubscribe;
  }, [navigation]);

  // Afficher une icône de notification et paramètres en haut à droite
  useEffect(() => {
    console.log('Mise à jour de la barre de navigation');
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          {/* Alertes existantes */}
          {alertCount > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Errors', { roadtripId, errors })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                <Icon name="bell" size={24} color="red" />
                <Text style={{ color: 'red', marginLeft: 10 }}>{alertCount}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, alertCount, errors]);

  // Fonction pour gérer la navigation vers la page de détails du step
  const handleStepPress = (step: any) => {
    navigation.navigate('Step', {
      type: step.type,
      roadtripId,
      stepId: step.id,
      refresh: fetchRoadtrip, // Passer la fonction de rafraîchissement
    });
  };

  // Fonction pour gérer la navigation vers la page de création d'un nouveau step (CreateStepScreen)
  const handleAddStep = () => {
    setShowAddStepModal(true);
  }

  // Fonction pour gérer l'ajout classique d'un step
  const handleAddStepClassic = () => {
    setShowAddStepModal(false);
    navigation.navigate('CreateStep', {
      roadtripId,
      refresh: fetchRoadtrip, // Passer la fonction de rafraîchissement
    });
  }

  // Fonction pour gérer l'ajout via langage naturel
  const handleAddStepNaturalLanguage = () => {
    setShowAddStepModal(false);
    navigation.navigate('AddStepNaturalLanguage', {
      roadtripId,
      refresh: fetchRoadtrip, // Passer la fonction de rafraîchissement
    });
  }

  // Fonction pour gérer la suppression d'un step selon le type (Stage ou Stop)
  const handleDeleteStep = async (stepId: string) => {
    try {
      let response;
      //Adapter l'appel API selon le type de step
      response = await fetch(`${config.BACKEND_URL}/steps/${stepId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRoadtrip(); // Recharger les données
        Alert.alert('Succès', 'L\'étape a été supprimée.');
      } else {
        const errorText = await response.text();
        console.error('Erreur de suppression:', errorText);
        handleBackendError(`Erreur ${response.status}: ${errorText}`, 'lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      handleBackendError(error, 'lors de la suppression');
    }
  }

  // Fonction pour afficher une alerte de confirmation avant suppression du stage ou du stop
  const confirmDeleteStep = (stepId: string) => {
    Alert.alert(
      'Supprimer le step',
      'Êtes-vous sûr de vouloir supprimer ce step ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => handleDeleteStep(stepId) },
      ],
      { cancelable: true }
    );
  };

  const renderRightActions = (stepId: string) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteStep(stepId)}>
      <Icon name="trash" size={24} color="white" />
    </TouchableOpacity>
  );

  // Fonction pour gérer le rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true); // Démarrer l'animation de rafraîchissement
    await fetchRoadtrip(); // Recharger les données
    setRefreshing(false); // Arrêter l'animation de rafraîchissement
  };

  // Fonction pour vérifier les adresses manquantes
  const checkMissingAddresses = (steps: any[]) => {
    const missingAddresses = [];
    
    steps.forEach(step => {
      // Vérifier l'adresse du step lui-même
      if (!step.address || step.address.trim() === '') {
        missingAddresses.push({
          type: 'step',
          name: step.name,
          id: step.id
        });
      }
      
      // Vérifier les activités
      step.activities?.forEach(activity => {
        if (!activity.address || activity.address.trim() === '') {
          missingAddresses.push({
            type: 'activity',
            name: activity.name,
            id: activity._id,
            stepName: step.name
          });
        }
      });
      
      // Vérifier les hébergements
      step.accommodations?.forEach(accommodation => {
        if (!accommodation.address || accommodation.address.trim() === '') {
          missingAddresses.push({
            type: 'accommodation',
            name: accommodation.name,
            id: accommodation._id,
            stepName: step.name
          });
        }
      });
    });
    
    return missingAddresses;
  };

  // Fonction pour gérer les erreurs backend et les afficher de manière conviviale
  const handleBackendError = (error: any, context: string = '') => {
    console.error(`Erreur backend ${context}:`, error);
    
    let title = 'Erreur';
    let message = 'Une erreur est survenue. Veuillez réessayer.';
    
    if (typeof error === 'string') {
      if (error.includes('Origin and destination must be provided')) {
        title = 'Adresses manquantes';
        message = 'Impossible de calculer l\'itinéraire car certaines étapes n\'ont pas d\'adresse renseignée.\n\nVeuillez compléter les adresses dans les détails de vos étapes (icône de localisation).';
      } else if (error.includes('Network request failed')) {
        title = 'Problème de connexion';
        message = 'Vérifiez votre connexion internet et réessayez.';
      } else if (error.includes('404')) {
        title = 'Ressource introuvable';
        message = 'L\'élément demandé n\'existe plus ou a été supprimé.';
      } else if (error.includes('500')) {
        title = 'Erreur serveur';
        message = 'Le serveur rencontre des difficultés. Veuillez réessayer dans quelques instants.';
      } else {
        message = error;
      }
    } else if (error.message) {
      if (error.message.includes('Origin and destination must be provided')) {
        title = 'Adresses manquantes';
        message = 'Certaines étapes n\'ont pas d\'adresse, ce qui empêche le calcul des itinéraires.\n\nConseil : Vérifiez et complétez les adresses de vos étapes.';
      } else {
        message = error.message;
      }
    }
    
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  // Fonction pour valider les données avant les appels API critiques
  const validateDataForApiCall = (steps: any[], actionDescription: string = 'cette action') => {
    const missingAddresses = checkMissingAddresses(steps);
    
    if (missingAddresses.length > 0) {
      console.warn(`Validation échouée pour ${actionDescription}:`, missingAddresses);
      
      const details = missingAddresses
        .slice(0, 3) // Limiter l'affichage à 3 éléments
        .map(item => `• ${item.name} (${item.type})`)
        .join('\n');
      
      Alert.alert(
        'Action impossible',
        `${actionDescription} nécessite que toutes les adresses soient renseignées.\n\nÉléments sans adresse :\n${details}${missingAddresses.length > 3 ? '\n... et plus' : ''}\n\nVeuillez compléter les adresses dans les détails de vos étapes.`,
        [{ text: 'OK' }]
      );
      
      return false;
    }
    
    return true;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!roadtrip) {
    return (
      <View style={styles.container}>
        <Text>Erreur lors de la récupération du roadtrip.</Text>
      </View>
    );
  }

  // Triez les steps par arrivalDateTime
  const sortedSteps = roadtrip.steps.sort((a, b) =>
    new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime()
  ).map(step => ({
    ...step,
    accommodations: step.accommodations || [],
    activities: step.activities || [],
  }));

  console.log('Sorted steps:', sortedSteps); // Ajoutez ce log pour vérifier les steps triés

  const getTravelInfoBackgroundColor = (note) => {
    switch (note) {
      case 'ERROR':
        return '#ffcccc'; // Rouge clair
      case 'WARNING':
        return '#fff3cd'; // Jaune clair
      case 'OK':
        return '#d4edda'; // Vert clair
      default:
        return '#f0f0f0'; // Gris clair par défaut
    }
  };

  const StepList = () => (
    <View style={styles.container}>
      <Text style={styles.title}>{roadtrip.name}</Text>
      <FlatList
        data={sortedSteps}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item, index }) => (
          <>
            {index > 0 && (
              <View style={styles.travelInfoContainer}>
                <View style={styles.travelInfoLine} />
                <Image source={rvIcon} style={styles.travelIcon} />
                <View style={[styles.travelInfo, { backgroundColor: getTravelInfoBackgroundColor(sortedSteps[index].travelTimeNote) }]}>
                  <Text style={styles.travelText}>
                    Temps de trajet : {Math.floor(sortedSteps[index].travelTimePreviousStep / 60)}h {sortedSteps[index].travelTimePreviousStep % 60}m
                  </Text>
                  <Text style={styles.travelText}>
                    Distance : {sortedSteps[index].distancePreviousStep}km
                  </Text>
                </View>
                <View style={styles.travelInfoLine} />
              </View>
            )}
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleStepPress(item)}
              >
                <View style={styles.itemHeader}>
                  <Icon
                    name={item.type === 'Stage' ? 'bed' : 'flag'}
                    size={20}
                    color="#007BFF"
                    style={styles.itemIcon}
                  />
                  <Text style={styles.itemTitle}>{item.name}</Text>
                </View>
                <Image
                  source={item.thumbnail?.url ? { uri: item.thumbnail.url } : require('../../assets/default-thumbnail.png')}
                  style={styles.thumbnail}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Icon name="arrow-right" size={16} color="green" style={{ marginRight: 5 }} />
                    <Text style={styles.itemDateTime}>
                      {new Date(item.arrivalDateTime).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'UTC'
                      })}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

                    <Icon name="arrow-right" size={16} color="red" style={{ marginHorizontal: 5 }} />
                    <Text style={styles.itemDateTime}>
                      {new Date(item.departureDateTime).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'UTC'
                      })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Swipeable>
          </>
        )}
      />
      <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={handleAddStep}
      />
      
      {/* Modal de choix d'ajout d'étape */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddStepModal}
        onRequestClose={() => setShowAddStepModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une étape</Text>
            <Text style={styles.modalSubtitle}>Choisissez votre méthode d'ajout</Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddStepClassic}
            >
              <Icon name="edit" size={20} color="#007BFF" style={styles.modalButtonIcon} />
              <View style={styles.modalButtonTextContainer}>
                <Text style={styles.modalButtonText}>Ajout classique</Text>
                <Text style={styles.modalButtonSubtext}>Formulaire détaillé</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddStepNaturalLanguage}
            >
              <Icon name="magic" size={20} color="#007BFF" style={styles.modalButtonIcon} />
              <View style={styles.modalButtonTextContainer}>
                <Text style={styles.modalButtonText}>Ajout via IA</Text>
                <Text style={styles.modalButtonSubtext}>Décrivez votre étape en langage naturel</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAddStepModal(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  // console.log('Sorted steps:', sortedSteps); // Ajoutez ce log pour vérifier les steps triés

  const RoadTripPlanning = () => {
    return (
      <AdvancedPlanning
        roadtripId={roadtripId}
        steps={sortedSteps}
        onRefresh={fetchRoadtrip}
        onSilentRefresh={fetchRoadtripSilent}
        dragSnapInterval={dragSnapInterval}
        navigation={navigation}
      />
    );
  };

  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName={currentTab}
      key={currentTab}
    >
      <Tab.Screen
        name="Liste des étapes"
        component={StepList}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="list" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Planning"
        component={RoadTripPlanning}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" color={color} size={size} />
          ),
          headerShown: false,

        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  item: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 16,
  },
  itemDateTime: {
    fontSize: 14,
    color: 'gray',
  },
  thumbnail: {
    width: '100%',
    height: 150,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007BFF',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '80%',
  },
  travelInfoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  travelInfo: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  travelInfoLine: {
    width: 2,
    height: 20,
    backgroundColor: 'gray',
  },
  travelIcon: {
    marginVertical: 5,
  },
  travelText: {
    fontSize: 14,
    color: 'gray',
  },
  // Styles pour le modal
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