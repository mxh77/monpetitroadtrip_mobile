import config from '../config';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Importer les icônes
import { RootStackParamList, Roadtrip, File } from '../../types';
import { FAB } from 'react-native-paper'; // Importer le bouton flottant
import Swipeable from 'react-native-gesture-handler/Swipeable'; // Importer Swipeable de react-native-gesture-handler
import { checkDateConsistency } from '../utils/controls'; // Importer la fonction checkDateConsistency
import Timetable from '../components/timetable/src'; // Importer Timetable
import rvIcon from '../../assets/icones/RV/rv_32.png';
import { getMinStartDateTime } from '../utils/dateUtils';

type Props = StackScreenProps<RootStackParamList, 'RoadTrip'>;

const Tab = createBottomTabNavigator();

export default function RoadTripScreen({ route, navigation }: Props) {
  const { roadtripId } = route.params;
  const [roadtrip, setRoadtrip] = useState<Roadtrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [errors, setErrors] = useState<{ message: string, stepId: string, stepType: string }[]>([]);

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
    } finally {
      setLoading(false); // Terminez le chargement
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

  // Afficher une icône de notification en haut à droite
  useEffect(() => {
    console.log('Mise à jour de la barre de navigation');
    navigation.setOptions({
      headerRight: () => (
        alertCount > 0 ? (
          <TouchableOpacity onPress={() => navigation.navigate('Errors', { roadtripId, errors })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
              <Icon name="bell" size={24} color={alertCount > 0 ? 'red' : 'gray'} />
              {alertCount > 0 && (
                <Text style={{ color: 'red', marginLeft: 10 }}>{alertCount}</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : null
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
    navigation.navigate('CreateStep', {
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
        Alert.alert('Succès', 'Le step a été supprimé.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du step.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
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
    </View>
  );

  // console.log('Sorted steps:', sortedSteps); // Ajoutez ce log pour vérifier les steps triés

  const RoadTripPlanning = () => {
    // console.log('Sorted steps:', sortedSteps); // Ajoutez ce log pour vérifier les steps triés

    const events = sortedSteps.flatMap(step => {
      // console.log('Processing step:', step);

      if (step.type === 'Stop') {
        const stopEvent = {
          id: step.id,
          title: step.name,
          startTime: new Date(step.arrivalDateTime),
          endTime: new Date(new Date(step.arrivalDateTime).getTime() + 3600000), // Assuming each event lasts 1 hour
          color: 'blue',
          type: 'stop',
        };
        console.log('Stop event:', stopEvent);
        return [stopEvent];
      } else if (step.type === 'Stage') {
        const accommodations = step.accommodations?.map(accommodation => {
          const accommodationEvent = {
            id: accommodation._id,
            title: accommodation.name,
            startTime: new Date(accommodation.arrivalDateTime),
            endTime: new Date(accommodation.departureDateTime),
            color: 'green',
            type: 'accommodation',
          };
          console.log('Accommodation event:', accommodationEvent);
          return accommodationEvent;
        }) || [];

        const activities = step.activities?.map(activity => {
          const activityEvent = {
            id: activity._id,
            title: activity.name,
            startTime: new Date(activity.startDateTime),
            endTime: new Date(activity.endDateTime),
            color: 'orange',
            type: 'activity',
          };
          console.log('Activity event:', activityEvent);
          return activityEvent;
        }) || [];

        console.log('Stage events:', [...accommodations, ...activities]);
        return [...accommodations, ...activities];
      }

      return [];
    });

    console.log('Events:', events); // Ajoutez ce log pour vérifier les événements

    return (
      <View style={styles.container}>
        <Timetable
          events={events}
          mode="week"
          startHour={0}
          endHour={24}
          defaultScrollHour={16}
          slotDuration={15}
          currentDate={new Date(roadtrip.steps[0].arrivalDateTime)} // Date de début du roadtrip
          onEventPress={(event) => console.log('Event press:', event)}
          onEventChange={(event) => console.log('Event change:', event)}
          ratioWidthEventsMax={1}
          isDraggable={false}
        />
      </View>
    );
  };

  return (
    <Tab.Navigator id={undefined}>
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
});