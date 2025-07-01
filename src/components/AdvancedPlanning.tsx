import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  PanResponder,
  Animated
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Step, Activity, Accommodation, ActivityType } from '../../types';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, formatISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import config from '../config';
import { useNavigationContext } from '../utils/NavigationContext';
import { getActivityTypeEmoji } from '../utils/activityIcons';

interface AdvancedPlanningProps {
  roadtripId: string;
  steps: Step[];
  onRefresh: () => void;
  onSilentRefresh?: () => void; // Refresh sans changement d'onglet
  dragSnapInterval?: number; // Pas de déplacement en minutes (défaut: 15)
  navigation?: any; // Objet de navigation pour naviguer vers les écrans d'édition
}

interface PlanningEvent {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  type: 'accommodation' | 'activity' | 'stop';
  color: string;
  stepId: string;
  address?: string;
  notes?: string;
  activityType?: string; // Type spécifique pour les activités
}

interface TimeSlot {
  hour: number;
  minutes: number;
}

const COLORS = {
  accommodation: '#4CAF50',
  activity: '#FF9800',
  stop: '#2196F3'
};

const HOUR_HEIGHT = 60;
const HOURS_IN_DAY = 24;

// Fonction utilitaire pour parser une date ISO sans conversion de fuseau horaire
const parseLocalDateTime = (isoString: string): Date => {
  // Extraire les composants de la date sans conversion UTC
  const date = new Date(isoString);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() + offsetMs);
};

// Fonction utilitaire pour convertir une date locale en ISO sans conversion de fuseau horaire
const toLocalISOString = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString();
};

const AdvancedPlanning: React.FC<AdvancedPlanningProps> = ({
  roadtripId,
  steps,
  onRefresh,
  onSilentRefresh,
  dragSnapInterval = 15, // Défaut: 15 minutes
  navigation
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<PlanningEvent | null>(null);
  const [dragPosition, setDragPosition] = useState(new Animated.ValueXY());
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastStepsVersion, setLastStepsVersion] = useState<string>(''); // Pour détecter les vrais changements

  // Contexte de navigation pour déclencher le retour automatique au Planning
  const { setPendingPlanningNavigation } = useNavigationContext();

  const screenDimensions = Dimensions.get('window');

  // Initialiser la date sur le premier jour du roadtrip
  useEffect(() => {
    if (steps.length > 0 && !isInitialized) {
      // Trouver le premier step du roadtrip (le plus ancien)
      const sortedSteps = [...steps].sort((a, b) => 
        parseLocalDateTime(a.arrivalDateTime).getTime() - parseLocalDateTime(b.arrivalDateTime).getTime()
      );
      
      if (sortedSteps.length > 0) {
        const firstStepDate = parseLocalDateTime(sortedSteps[0].arrivalDateTime);
        setSelectedDate(firstStepDate);
        console.log('Planning initialisé sur la date:', format(firstStepDate, 'dd/MM/yyyy', { locale: fr }));
      }
      setIsInitialized(true);
    }
  }, [steps, isInitialized]);

  // Convertir les steps en événements (seulement lors de vraies modifications)
  useEffect(() => {
    // Créer une "empreinte" des données pour détecter les vrais changements
    const stepsSignature = JSON.stringify(steps.map(step => ({
      id: step.id,
      name: step.name,
      arrivalDateTime: step.arrivalDateTime,
      departureDateTime: step.departureDateTime,
      accommodations: step.accommodations?.map(acc => ({
        _id: acc._id,
        name: acc.name,
        arrivalDateTime: acc.arrivalDateTime,
        departureDateTime: acc.departureDateTime
      })),
      activities: step.activities?.map(act => ({
        _id: act._id,
        name: act.name,
        startDateTime: act.startDateTime,
        endDateTime: act.endDateTime
      }))
    })));

    // Ne convertir que si les données ont vraiment changé
    if (stepsSignature !== lastStepsVersion) {
      console.log('🔄 Vraie modification des données détectée - Reconversion des événements');
      
      const convertStepsToEvents = (): PlanningEvent[] => {
        const allEvents: PlanningEvent[] = [];

        steps.forEach(step => {
          if (step.type === 'Stop') {
            allEvents.push({
              id: step.id,
              title: step.name,
              startDateTime: step.arrivalDateTime,
              endDateTime: step.departureDateTime || step.arrivalDateTime,
              type: 'stop',
              color: COLORS.stop,
              stepId: step.id,
              address: step.address,
              notes: step.notes
            });
          } else if (step.type === 'Stage') {
            // Hébergements
            step.accommodations?.forEach(accommodation => {
              allEvents.push({
                id: accommodation._id,
                title: accommodation.name,
                startDateTime: accommodation.arrivalDateTime,
                endDateTime: accommodation.departureDateTime,
                type: 'accommodation',
                color: COLORS.accommodation,
                stepId: step.id,
                address: accommodation.address,
                notes: accommodation.notes
              });
            });

            // Activités
            step.activities?.forEach(activity => {
              allEvents.push({
                id: activity._id,
                title: activity.name,
                startDateTime: activity.startDateTime,
                endDateTime: activity.endDateTime,
                type: 'activity',
                color: COLORS.activity,
                stepId: step.id,
                address: activity.address,
                notes: activity.notes,
                activityType: activity.type
              });
            });
          }
        });

        return allEvents.sort((a, b) => 
          parseLocalDateTime(a.startDateTime).getTime() - parseLocalDateTime(b.startDateTime).getTime()
        );
      };

      setEvents(convertStepsToEvents());
      setLastStepsVersion(stepsSignature);
    } else {
      console.log('✅ Pas de changement significatif - Conservation des événements optimistes');
    }
  }, [steps, lastStepsVersion]);

  // Filtrer les événements selon la vue
  const filteredEvents = useMemo(() => {
    if (viewMode === 'day') {
      return events.filter(event => {
        const eventDate = parseLocalDateTime(event.startDateTime);
        return eventDate.getFullYear() === selectedDate.getFullYear() &&
               eventDate.getMonth() === selectedDate.getMonth() &&
               eventDate.getDate() === selectedDate.getDate();
      });
    } else {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      
      return events.filter(event => {
        const eventDate = parseLocalDateTime(event.startDateTime);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });
    }
  }, [events, selectedDate, viewMode]);

  // Grouper les événements par jour pour la vue semaine
  const eventsByDay = useMemo(() => {
    if (viewMode === 'day') return { [format(selectedDate, 'yyyy-MM-dd')]: filteredEvents };

    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const grouped: { [key: string]: PlanningEvent[] } = {};

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = events.filter(event => {
        const eventDate = parseLocalDateTime(event.startDateTime);
        return eventDate.getFullYear() === day.getFullYear() &&
               eventDate.getMonth() === day.getMonth() &&
               eventDate.getDate() === day.getDate();
      });
    }

    return grouped;
  }, [events, selectedDate, viewMode]);

  // Fonction pour calculer la position d'un événement
  const getEventPosition = (event: PlanningEvent, dayWidth: number) => {
    // Parser les dates sans conversion de fuseau horaire
    const startTime = parseLocalDateTime(event.startDateTime);
    const endTime = parseLocalDateTime(event.endDateTime);
    
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    const top = startHour * HOUR_HEIGHT;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 30);
    
    return {
      top,
      height,
      width: dayWidth - 20,
      left: 10
    };
  };

  // Fonction pour valider qu'un événement peut être mis à jour
  const validateEventForUpdate = (event: PlanningEvent): { valid: boolean; message?: string } => {
    // Vérifier que l'événement a une adresse
    if (!event.address || event.address.trim() === '') {
      return {
        valid: false,
        message: `L'événement "${event.title}" n'a pas d'adresse renseignée. Veuillez d'abord ajouter une adresse pour permettre le calcul des itinéraires.`
      };
    }

    // Vérifier que le step parent a une adresse (pour les stops)
    if (event.type === 'stop') {
      const step = steps.find(s => s.id === event.stepId);
      if (!step?.address || step.address.trim() === '') {
        return {
          valid: false,
          message: `L'étape "${event.title}" n'a pas d'adresse renseignée. Veuillez d'abord ajouter une adresse pour permettre le calcul des itinéraires.`
        };
      }
    }

    return { valid: true };
  };

  // Fonction pour mettre à jour un événement via l'API avec mise à jour optimiste
  const updateEvent = async (event: PlanningEvent, newStartTime: Date, newEndTime: Date) => {
    try {
      // Validation avant mise à jour
      const validation = validateEventForUpdate(event);
      if (!validation.valid) {
        Alert.alert('Impossible de déplacer l\'événement', validation.message);
        return;
      }

      // Créer les nouvelles dates sans conversion de fuseau horaire
      const newStartDateTime = toLocalISOString(newStartTime);
      const newEndDateTime = toLocalISOString(newEndTime);

      // 🚀 MISE À JOUR OPTIMISTE : Mettre à jour immédiatement l'état local
      const previousEvents = [...events]; // Sauvegarder l'état précédent
      const updatedEvents = events.map(evt => 
        evt.id === event.id 
          ? { ...evt, startDateTime: newStartDateTime, endDateTime: newEndDateTime }
          : evt
      );
      setEvents(updatedEvents);
      console.log(`✅ Mise à jour optimiste de ${event.title} effectuée localement`);

      // 🌐 SYNCHRONISATION EN ARRIÈRE-PLAN : Appeler l'API
      let response;
      
      if (event.type === 'activity') {
        response = await fetch(`${config.BACKEND_URL}/activities/${event.id}/dates`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDateTime: newStartDateTime,
            endDateTime: newEndDateTime
          })
        });
      } else if (event.type === 'accommodation') {
        response = await fetch(`${config.BACKEND_URL}/accommodations/${event.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            arrivalDateTime: newStartDateTime,
            departureDateTime: newEndDateTime
          })
        });
      } else if (event.type === 'stop') {
        // Identifier le type de step (Stage ou Stop) pour utiliser la bonne API
        const step = steps.find(s => s.id === event.stepId);
        const apiPath = step?.type === 'Stage' ? 'stages' : 'stops';
        
        response = await fetch(`${config.BACKEND_URL}/${apiPath}/${event.stepId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            arrivalDateTime: newStartDateTime,
            departureDateTime: newEndDateTime
          })
        });
      }

      console.log(`🔄 Synchronisation ${event.type} ${event.id}:`, {
        url: response?.url,
        status: response?.status,
        startDateTime: newStartDateTime,
        endDateTime: newEndDateTime
      });

      if (response && response.ok) {
        console.log('✅ Synchronisation API réussie - Pas de rechargement nécessaire');
        // ✨ OPTIMISATION : Plus de refresh global ! L'état local est déjà à jour
      } else {
        const errorText = response ? await response.text() : 'Pas de réponse';
        console.error('❌ Erreur API:', errorText);
        
        // 🔄 ROLLBACK : Restaurer l'état précédent en cas d'erreur
        setEvents(previousEvents);
        console.log('🔄 Rollback effectué - État restauré');
        
        // Traitement spécifique pour l'erreur d'adresses manquantes
        if (errorText.includes('Origin and destination must be provided')) {
          Alert.alert(
            'Adresses manquantes', 
            'Impossible de calculer l\'itinéraire car certaines étapes n\'ont pas d\'adresse renseignée. Veuillez compléter les adresses de vos étapes dans les détails de chaque étape.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Erreur', `Impossible de mettre à jour l'événement: ${response?.status || 'Erreur inconnue'}\n\n${errorText}`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      
      // 🔄 ROLLBACK en cas d'erreur de réseau
      const previousEvents = events.map(evt => 
        evt.id === event.id 
          ? { ...evt, startDateTime: event.startDateTime, endDateTime: event.endDateTime }
          : evt
      );
      setEvents(previousEvents);
      console.log('🔄 Rollback après erreur réseau effectué');
      
      // Traitement spécifique pour les erreurs de réseau/parsing
      let errorMessage = 'Erreur de connexion';
      if (error.message.includes('Origin and destination must be provided')) {
        errorMessage = 'Adresses manquantes pour le calcul d\'itinéraire. Veuillez vérifier que toutes vos étapes ont une adresse renseignée.';
      } else {
        errorMessage = `Erreur de connexion: ${error.message}`;
      }
      
      Alert.alert('Erreur', errorMessage);
    }
  };

  // Fonction utilitaire pour arrondir une date à l'intervalle de snapping
  const snapToInterval = (date: Date, intervalMinutes: number): Date => {
    const minutes = date.getMinutes();
    const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
    const newDate = new Date(date);
    newDate.setMinutes(snappedMinutes, 0, 0); // Réinitialiser secondes et millisecondes
    return newDate;
  };

  // Gestionnaire de drag & drop avec snapping
  const createPanResponder = (event: PlanningEvent) => {
    let isDragging = false;
    let startTime = 0;
    
    // Vérifier si l'événement peut être déplacé
    const validation = validateEventForUpdate(event);
    const canBeDragged = validation.valid;
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Considérer comme un drag seulement si le mouvement est suffisant ET que l'élément peut être déplacé
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return canBeDragged && distance > 10; // Seuil de 10 pixels pour différencier clic et drag
      },
      onPanResponderGrant: () => {
        console.log('🎯 PanResponder Grant:', { event: event.title, canBeDragged });
        if (canBeDragged) {
          setDraggedEvent(event);
        }
        startTime = Date.now();
        isDragging = false;
        console.log('⏰ Start time set:', startTime);
      },
      onPanResponderMove: (_, gestureState) => {
        if (!canBeDragged) return; // Pas de mouvement pour les éléments non-draggables
        
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) { // Si le mouvement dépasse le seuil, c'est un drag
          isDragging = true;
          dragPosition.setValue({ x: 0, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        console.log('📱 PanResponder Release:', { 
          isDragging, 
          duration, 
          distance, 
          canBeDragged, 
          event: event.title,
          hasNavigation: !!navigation,
          startTime,
          endTime
        });
        
        // Si c'est un clic rapide sans mouvement significatif
        // Relâcher les contraintes pour faciliter la détection du clic
        if (!isDragging && (duration < 500 || duration > 1000000000) && distance < 15) {
          console.log('🔥 CLIC DÉTECTÉ (conditions assouplies):', { event: event.title, type: event.type, hasNavigation: !!navigation });
          navigateToEditScreen(event);
        } else if (isDragging && canBeDragged) {
          // Logique de drag existante (seulement pour les éléments draggables)
          const deltaY = gestureState.dy;
          
          // 🎯 NOUVEAU : Calcul du snapping basé sur l'intervalle paramétrable
          const minutesDelta = (deltaY / HOUR_HEIGHT) * 60; // Conversion en minutes
          const snappedMinutesDelta = Math.round(minutesDelta / dragSnapInterval) * dragSnapInterval;
          
          const originalStart = parseLocalDateTime(event.startDateTime);
          const originalEnd = parseLocalDateTime(event.endDateTime);
          const duration = originalEnd.getTime() - originalStart.getTime();
          
          // Application du snapping
          const newStart = new Date(originalStart.getTime() + (snappedMinutesDelta * 60 * 1000));
          const newEnd = new Date(newStart.getTime() + duration);
          
          // Validation des horaires (rester dans la journée)
          if (newStart.getHours() < 0 || newEnd.getHours() >= 24) {
            console.log('Déplacement annulé : heure invalide');
            Alert.alert('Attention', 'Impossible de déplacer l\'événement en dehors de la journée');
          } else {
            console.log(`🎯 Déplacement avec snapping ${dragSnapInterval}min de ${event.title}:`, {
              deltaOriginal: `${Math.round(minutesDelta)}min`,
              deltaSnapped: `${snappedMinutesDelta}min`,
              from: `${format(originalStart, 'HH:mm')} - ${format(originalEnd, 'HH:mm')}`,
              to: `${format(newStart, 'HH:mm')} - ${format(newEnd, 'HH:mm')}`
            });
            updateEvent(event, newStart, newEnd);
          }
        }
        
        setDraggedEvent(null);
        dragPosition.setValue({ x: 0, y: 0 });
        isDragging = false;
      }
    });
  };

  // Fonction pour naviguer vers l'écran d'édition approprié
  const navigateToEditScreen = (event: PlanningEvent) => {
    console.log('🚀 navigateToEditScreen appelé:', { event: event.title, type: event.type, hasNavigation: !!navigation });
    
    if (!navigation) {
      console.log('❌ Navigation non disponible');
      return;
    }

    const step = steps.find(s => s.id === event.stepId);
    if (!step) {
      console.log('❌ Step non trouvé:', event.stepId);
      return;
    }

    console.log('✅ Step trouvé:', step.name, 'Type:', event.type);

    // 🔧 Approche simplifiée : passer directement les dates mises à jour sans conversion
    // Les dates dans les événements sont déjà au bon format pour l'affichage
    // Testons en passant directement les dates de l'événement

    // Paramètres communs pour indiquer le retour au planning
    const commonParams = {
      refresh: () => {
        onRefresh();
        // Déclencher la navigation automatique vers l'onglet Planning après refresh
        console.log('🎯 Déclenchement navigation automatique vers Planning');
        setPendingPlanningNavigation(true);
      },
      returnTo: 'Planning', // Indiquer que l'utilisateur vient du planning
      returnToTab: 'Planning' // Spécifier l'onglet de retour
    };

    switch (event.type) {
      case 'activity':
        const activity = step.activities?.find(a => a._id === event.id);
        if (activity) {
          // 🔧 TEST : Passer directement les dates du planning sans conversion
          const updatedActivity = {
            ...activity,
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime
          };
          console.log('✅ Navigation vers EditActivity avec heures mises à jour (sans conversion):', { 
            stepName: step.name, 
            activityName: activity.name,
            originalStart: activity.startDateTime,
            eventStartDateTime: event.startDateTime,
            finalStartDateTime: updatedActivity.startDateTime
          });
          navigation.navigate('EditActivity', {
            step: step,
            activity: updatedActivity,
            ...commonParams
          });
        } else {
          console.log('❌ Activité non trouvée:', event.id);
        }
        break;
      
      case 'accommodation':
        const accommodation = step.accommodations?.find(a => a._id === event.id);
        if (accommodation) {
          // 🔧 TEST : Passer directement les dates du planning sans conversion
          const updatedAccommodation = {
            ...accommodation,
            arrivalDateTime: event.startDateTime,
            departureDateTime: event.endDateTime
          };
          console.log('✅ Navigation vers EditAccommodation avec heures mises à jour (sans conversion):', { 
            stepName: step.name, 
            accommodationName: accommodation.name,
            originalArrival: accommodation.arrivalDateTime,
            eventStartDateTime: event.startDateTime,
            finalArrivalDateTime: updatedAccommodation.arrivalDateTime
          });
          navigation.navigate('EditAccommodation', {
            step: step,
            accommodation: updatedAccommodation,
            ...commonParams
          });
        } else {
          console.log('❌ Hébergement non trouvé:', event.id);
        }
        break;
      
      case 'stop':
        // 🔧 TEST : Passer directement les dates du planning sans conversion
        const updatedStep = {
          ...step,
          arrivalDateTime: event.startDateTime,
          departureDateTime: event.endDateTime
        };
        
        if (step.type === 'Stop') {
          console.log('✅ Navigation vers EditStepInfo avec heures mises à jour (sans conversion):', { 
            stepName: step.name,
            originalArrival: step.arrivalDateTime,
            eventStartDateTime: event.startDateTime,
            finalArrivalDateTime: updatedStep.arrivalDateTime
          });
          navigation.navigate('EditStepInfo', {
            step: updatedStep,
            ...commonParams
          });
        } else {
          // Si c'est un Stage, on navigue vers l'édition du stage
          console.log('✅ Navigation vers EditStageInfo avec heures mises à jour (sans conversion):', { 
            stepName: step.name,
            originalArrival: step.arrivalDateTime,
            eventStartDateTime: event.startDateTime,
            finalArrivalDateTime: updatedStep.arrivalDateTime
          });
          navigation.navigate('EditStageInfo', {
            stage: updatedStep,
            ...commonParams
          });
        }
        break;
    }
  };

  // Rendu d'un événement
  const renderEvent = (event: PlanningEvent, dayWidth: number) => {
    const position = getEventPosition(event, dayWidth);
    const panResponder = createPanResponder(event);
    
    // Vérifier si l'événement peut être déplacé (a une adresse)
    const validation = validateEventForUpdate(event);
    const canBeDragged = validation.valid;
    
    return (
      <Animated.View
        key={event.id}
        style={[
          styles.event,
          {
            top: position.top,
            height: position.height,
            width: position.width,
            left: position.left,
            backgroundColor: event.color,
            opacity: draggedEvent?.id === event.id ? 0.8 : (canBeDragged ? 1 : 0.6),
            elevation: draggedEvent?.id === event.id ? 5 : 2,
            zIndex: draggedEvent?.id === event.id ? 1000 : 1,
            borderWidth: canBeDragged ? 0 : 2,
            borderColor: canBeDragged ? 'transparent' : '#ff9800',
            borderStyle: canBeDragged ? 'solid' : 'dashed',
            // Appliquer la transformation à tout l'élément
            transform: draggedEvent?.id === event.id ? dragPosition.getTranslateTransform() : [],
          }
        ]}
      >
        {/* TouchableOpacity pour le clic - toujours fonctionnel */}
        <TouchableOpacity
          style={styles.eventTouchable}
          onPress={() => {
            console.log('🔥 CLIC DIRECT DÉTECTÉ:', { event: event.title, type: event.type });
            navigateToEditScreen(event);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.type === 'activity' && event.activityType ? 
              `${getActivityTypeEmoji(event.activityType)} ${event.title}` : 
              event.title
            }
            {!canBeDragged && ' ⚠️'}
          </Text>
          <Text style={styles.eventTime}>
            {format(parseLocalDateTime(event.startDateTime), 'HH:mm')} - {format(parseLocalDateTime(event.endDateTime), 'HH:mm')}
          </Text>
          {event.address ? (
            <Text style={styles.eventAddress} numberOfLines={1}>
              📍 {event.address}
            </Text>
          ) : (
            <Text style={[styles.eventAddress, { color: '#ff9800', fontStyle: 'italic' }]} numberOfLines={1}>
              ⚠️ Adresse manquante
            </Text>
          )}
        </TouchableOpacity>
        
        {/* Overlay PanResponder pour le drag - seulement pour les éléments draggables */}
        {canBeDragged && (
          <View
            {...panResponder.panHandlers}
            style={styles.dragOverlay}
          />
        )}
      </Animated.View>
    );
  };

  // Rendu de la grille horaire
  const renderTimeGrid = () => {
    const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);
    
    return (
      <View style={styles.timeGrid}>
        {hours.map(hour => (
          <View key={hour} style={styles.hourLine}>
            <Text style={styles.hourLabel}>
              {hour.toString().padStart(2, '0')}:00
            </Text>
            <View style={styles.hourSeparator} />
          </View>
        ))}
      </View>
    );
  };

  // Rendu de la vue jour
  const renderDayView = () => {
    const dayWidth = isFullScreen ? screenDimensions.width - 80 : screenDimensions.width - 120;
    
    return (
      <ScrollView style={styles.dayContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.dayContent}>
          {renderTimeGrid()}
          <View style={[styles.eventsContainer, { width: dayWidth }]}>
            {filteredEvents.map(event => renderEvent(event, dayWidth))}
          </View>
        </View>
      </ScrollView>
    );
  };

  // Rendu de la vue semaine
  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const dayWidth = isFullScreen ? (screenDimensions.width - 80) / 7 : (screenDimensions.width - 120) / 7;
    
    return (
      <ScrollView style={styles.weekContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.weekHeader}>
          {Array.from({ length: 7 }, (_, i) => {
            const day = addDays(weekStart, i);
            return (
              <View key={i} style={[styles.dayHeader, { width: dayWidth }]}>
                <Text style={styles.dayHeaderText}>
                  {format(day, 'EEE', { locale: fr })}
                </Text>
                <Text style={styles.dayHeaderDate}>
                  {format(day, 'd')}
                </Text>
              </View>
            );
          })}
        </View>
        
        <View style={styles.weekContent}>
          {renderTimeGrid()}
          
          <View style={styles.weekEventsContainer}>
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(weekStart, i);
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[dayKey] || [];
              
              return (
                <View key={i} style={[styles.dayColumn, { width: dayWidth }]}>
                  {dayEvents.map(event => renderEvent(event, dayWidth))}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  // Rendu des contrôles de navigation
  const renderControls = () => (
    <View style={styles.controls}>
      <View style={styles.dateNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            if (viewMode === 'day') {
              setSelectedDate(prev => addDays(prev, -1));
            } else {
              setSelectedDate(prev => addDays(prev, -7));
            }
          }}
        >
          <Icon name="chevron-left" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dateButton}>
          <Text style={styles.dateText}>
            {viewMode === 'day' 
              ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
              : `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM', { locale: fr })} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: fr })}`
            }
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            if (viewMode === 'day') {
              setSelectedDate(prev => addDays(prev, 1));
            } else {
              setSelectedDate(prev => addDays(prev, 7));
            }
          }}
        >
          <Icon name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.viewControls}>
        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => {
            if (steps.length > 0) {
              const sortedSteps = [...steps].sort((a, b) => 
                parseLocalDateTime(a.arrivalDateTime).getTime() - parseLocalDateTime(b.arrivalDateTime).getTime()
              );
              if (sortedSteps.length > 0) {
                const firstStepDate = parseLocalDateTime(sortedSteps[0].arrivalDateTime);
                setSelectedDate(firstStepDate);
              }
            }
          }}
        >
          <Icon name="home" size={16} color="#666" />
          <Text style={styles.todayButtonText}>Début</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewButton, viewMode === 'day' && styles.activeViewButton]}
          onPress={() => setViewMode('day')}
        >
          <Text style={[styles.viewButtonText, viewMode === 'day' && styles.activeViewButtonText]}>
            Jour
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewButton, viewMode === 'week' && styles.activeViewButton]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.viewButtonText, viewMode === 'week' && styles.activeViewButtonText]}>
            Semaine
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.fullScreenButton}
          onPress={() => setIsFullScreen(!isFullScreen)}
        >
          <Icon 
            name={isFullScreen ? 'fullscreen-exit' : 'fullscreen'} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Rendu principal
  const planningContent = (
    <View style={[styles.container, isFullScreen && styles.fullScreenContainer]}>
      {renderControls()}
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.accommodation }]} />
          <Text style={styles.legendText}>Hébergements</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.activity }]} />
          <Text style={styles.legendText}>Activités</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.stop }]} />
          <Text style={styles.legendText}>Stops</Text>
        </View>
      </View>
      
      {viewMode === 'day' ? renderDayView() : renderWeekView()}
    </View>
  );

  if (isFullScreen) {
    return (
      <Modal
        visible={isFullScreen}
        animationType="slide"
        onRequestClose={() => setIsFullScreen(false)}
      >
        {planningContent}
      </Modal>
    );
  }

  return planningContent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fullScreenContainer: {
    paddingTop: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  activeViewButton: {
    backgroundColor: '#2196F3',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeViewButtonText: {
    color: '#fff',
  },
  fullScreenButton: {
    padding: 8,
    marginLeft: 8,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#e3f2fd',
    marginRight: 8,
  },
  todayButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  dayContainer: {
    flex: 1,
  },
  dayContent: {
    flexDirection: 'row',
  },
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingLeft: 60,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  dayHeaderText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  dayHeaderDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weekContent: {
    flexDirection: 'row',
  },
  weekEventsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  dayColumn: {
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  timeGrid: {
    width: 60,
    backgroundColor: '#fff',
  },
  hourLine: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  hourLabel: {
    fontSize: 12,
    color: '#666',
    position: 'absolute',
    top: -8,
  },
  hourSeparator: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
  },
  eventsContainer: {
    position: 'relative',
    flex: 1,
    minHeight: HOURS_IN_DAY * HOUR_HEIGHT,
  },
  event: {
    position: 'absolute',
    borderRadius: 8,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
  },
  eventAddress: {
    fontSize: 9,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  eventTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

export default AdvancedPlanning;
