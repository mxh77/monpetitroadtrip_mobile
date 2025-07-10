import config from '../config';
import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { Button, StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image, Modal, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Importer les icônes
import { RootStackParamList, Roadtrip, File } from '../../types';
import { FAB, Card, Badge } from 'react-native-paper'; // Importer le bouton flottant et les composants Material
import Swipeable from 'react-native-gesture-handler/Swipeable'; // Importer Swipeable de react-native-gesture-handler
import { checkDateConsistency } from '../utils/controls'; // Importer la fonction checkDateConsistency
import Timetable from '../components/timetable/src'; // Importer Timetable
import AdvancedPlanning from '../components/AdvancedPlanning'; // Importer le nouveau planning
import rvIcon from '../../assets/icones/RV/rv_32.png';
import { getMinStartDateTime } from '../utils/dateUtils';
import { RefreshControl } from 'react-native-gesture-handler';
import { useNavigationContext } from '../utils/NavigationContext';
import { getActivityTypeIcon, getActivityTypeEmoji, getActivityTypeColor } from '../utils/activityIcons';
import TasksScreen from './TasksScreen';
import { useTabPersistence } from '../hooks/useTabPersistence';
import ChatLayout from '../components/ChatLayout';
import { useChatBot } from '../hooks/useChatBot';
import NotificationButton from '../components/NotificationButton';
import { useNotifications } from '../hooks/useNotifications';
import { PERFORMANCE_CONFIG, trackPerformance, throttle, debounce } from '../config/performance';
import StepItem from '../components/StepItem';
import ChatBot from '../components/ChatBot';

// 🧪 Utilitaires de test mémoire
interface MemoryStats {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  timestamp: number;
  context: string;
}

const getMemoryUsage = (context: string): MemoryStats => {
  const timestamp = Date.now();
  
  // Tentative d'accès aux métriques de performance (si disponibles)
  // @ts-ignore - Les métriques mémoire ne sont pas toujours disponibles sur toutes les plateformes
  if (global.performance && (global.performance as any).memory) {
    const memory = (global.performance as any).memory;
    return {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      timestamp,
      context
    };
  }
  
  // Fallback pour React Native
  return {
    timestamp,
    context
  };
};

const formatMemorySize = (bytes?: number): string => {
  if (!bytes) return 'N/A';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

const logMemoryComparison = (before: MemoryStats, after: MemoryStats) => {
  console.log('🧪 ===== TEST MÉMOIRE =====');
  console.log(`📊 Contexte: ${before.context} → ${after.context}`);
  console.log(`⏱️  Durée: ${after.timestamp - before.timestamp}ms`);
  
  if (before.usedJSHeapSize && after.usedJSHeapSize) {
    const diff = after.usedJSHeapSize - before.usedJSHeapSize;
    const percentage = ((diff / before.usedJSHeapSize) * 100).toFixed(2);
    
    console.log(`💾 Mémoire JS utilisée:`);
    console.log(`   Avant: ${formatMemorySize(before.usedJSHeapSize)}`);
    console.log(`   Après: ${formatMemorySize(after.usedJSHeapSize)}`);
    console.log(`   Différence: ${diff > 0 ? '+' : ''}${formatMemorySize(diff)} (${percentage}%)`);
    
    if (before.totalJSHeapSize && after.totalJSHeapSize) {
      console.log(`📈 Heap total:`);
      console.log(`   Avant: ${formatMemorySize(before.totalJSHeapSize)}`);
      console.log(`   Après: ${formatMemorySize(after.totalJSHeapSize)}`);
    }
    
    // Alertes pour les fuites importantes
    if (diff > 10 * 1024 * 1024) { // Plus de 10MB
      console.warn('⚠️  ALERTE: Possible fuite mémoire JS détectée (+10MB)');
    } else if (diff > 5 * 1024 * 1024) { // Plus de 5MB
      console.warn('⚠️  ATTENTION: Augmentation mémoire JS significative (+5MB)');
    } else if (diff < 0) {
      console.log('✅ Mémoire JS libérée correctement');
    }
  } else {
    console.log('ℹ️  Métriques mémoire JS détaillées non disponibles sur cette plateforme');
  }
  
  // Information complémentaire sur vos mesures ADB
  console.log('📱 Pour mesures système complètes (PSS), utilisez:');
  console.log('   adb shell dumpsys meminfo com.maxime.heron.monpetitroadtrip.debug | findstr "TOTAL PSS"');
  
  console.log('🧪 =========================');
};

type Props = StackScreenProps<RootStackParamList, 'RoadTrip'>;

const Tab = createBottomTabNavigator();

export default function RoadTripScreen({ route, navigation }: Props) {
  const { roadtripId, initialTab } = route.params || {};
  const [roadtrip, setRoadtrip] = useState<Roadtrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement
  const [alertCount, setAlertCount] = useState(0);
  const [errors, setErrors] = useState<{ message: string, stepId: string, stepType: string }[]>([]);
  // État pour le modal d'ajout d'étape ET le chatbot
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [dragSnapInterval, setDragSnapInterval] = useState(15); // Pas de déplacement en minutes (défaut: 15min)
  
  // 📱 Hook de persistance des onglets
  const { activeTab, changeTab, forceTab, isLoaded } = useTabPersistence(roadtripId, initialTab || 'Liste des étapes');
  
  // 🤖 Hook pour le chatbot
  const { isChatAvailable } = useChatBot(roadtripId);
  
  // 🔔 Hook pour les notifications - OPTIMISÉ pour éviter les dropped frames
  // Ne polling que quand l'écran est actif/focusé
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const { unreadCount, boostPolling } = useNotifications(isScreenFocused ? roadtripId : null);
  
  // État pour forcer le remontage du navigator
  const [navigatorKey, setNavigatorKey] = useState(0);
  
  // 🧪 États pour le monitoring mémoire
  const memoryStatsRef = useRef<MemoryStats | null>(null);
  const loadedImagesRef = useRef<Set<string>>(new Set()); // Tracking des images chargées
  
  // 📜 Référence pour préserver la position du scroll
  const flatListRef = useRef<any>(null);
  const scrollPositionRef = useRef(0);
  
  // 🔒 Références SIMPLIFIÉES pour éviter les re-renders pendant le polling
  const roadtripDataRef = useRef<Roadtrip | null>(null);
  const lastPollingHashRef = useRef<string>('');
  const isScrollingRef = useRef(false);
  const pendingUpdateRef = useRef<Roadtrip | null>(null);
  
  // Contexte de navigation pour gérer le retour automatique au Planning (optionnel)
  let pendingPlanningNavigation = false;
  let clearPendingNavigation = () => {};
  
  try {
    const navigationContext = useNavigationContext();
    pendingPlanningNavigation = navigationContext.pendingPlanningNavigation;
    clearPendingNavigation = navigationContext.clearPendingNavigation;
  } catch (error) {
    // Contexte non disponible, utiliser les valeurs par défaut
    console.warn('NavigationContext non disponible, fonctionnalité de navigation automatique désactivée');
  }
  
  // Déterminer l'onglet initial (par défaut: Liste des étapes, ou Planning si spécifié)
  const [tabInitialRouteName] = useState(initialTab || 'Liste des étapes');

  // Gérer la navigation automatique vers l'onglet Planning
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 RoadTripScreen focus, pendingPlanningNavigation:', pendingPlanningNavigation);
      console.log('🔄 RoadTripScreen focus, activeTab actuel:', activeTab);
      
      // ✅ Activer les notifications quand l'écran est focusé
      setIsScreenFocused(true);
      
      // 🧪 Mesure mémoire au focus
      const focusMemory = getMemoryUsage('Focus sur RoadTripScreen');
      if (memoryStatsRef.current) {
        logMemoryComparison(memoryStatsRef.current, focusMemory);
        memoryStatsRef.current = focusMemory; // Mise à jour de la référence
      }
      
      if (pendingPlanningNavigation) {
        console.log('🎯 Navigation automatique vers l\'onglet Planning');
        // Forcer l'onglet Planning via le hook de persistance
        forceTab('Planning');
        // Forcer le remontage du navigator pour prendre en compte le changement
        setNavigatorKey(prev => prev + 1);
        clearPendingNavigation();
      }
      
      // ❌ Désactiver les notifications quand l'écran perd le focus
      return () => {
        console.log('🔄 RoadTripScreen blur - désactivation des notifications');
        setIsScreenFocused(false);
      };
    }, [pendingPlanningNavigation, roadtripId, navigation, clearPendingNavigation, activeTab, forceTab])
  );

  // Charger les paramètres utilisateur au démarrage
  useEffect(() => {
    loadUserSettings();
  }, []);

  // Log pour debug
  useEffect(() => {
    console.log('🔄 RoadTripScreen - Paramètres reçus:', { roadtripId, initialTab, tabInitialRouteName });
  }, [roadtripId, initialTab, tabInitialRouteName]);

  // 🔍 Monitoring mémoire et lifecycle
  useEffect(() => {
    console.log('🚀 RoadTripScreen - Composant monté');
    
    // 🧪 Mesure mémoire initiale
    memoryStatsRef.current = getMemoryUsage('Montage du composant');
    console.log('🧪 Mémoire au montage:', memoryStatsRef.current);
    
    // Forcer le garbage collector périodiquement (si disponible) - MOINS FRÉQUENT
    const memoryCleanupInterval = setInterval(() => {
      if (global.gc) {
        console.log('🧹 Nettoyage mémoire forcé');
        global.gc();
        
        // 🧪 Mesure après nettoyage
        const currentMemory = getMemoryUsage('Après nettoyage forcé');
        if (memoryStatsRef.current) {
          logMemoryComparison(memoryStatsRef.current, currentMemory);
        }
      }
    }, PERFORMANCE_CONFIG.MEMORY_CLEANUP_INTERVAL); // Utiliser la config
    
    return () => {
      console.log('🔄 RoadTripScreen - Composant démonté - Nettoyage complet');
      
      // 🧪 Mesure mémoire avant démontage
      const finalMemory = getMemoryUsage('Démontage du composant');
      if (memoryStatsRef.current) {
        logMemoryComparison(memoryStatsRef.current, finalMemory);
      }
      
      clearInterval(memoryCleanupInterval);
      
      // Nettoyage explicite des références
      setRoadtrip(null);
      setErrors([]);
      memoryStatsRef.current = null;
      
      // 🧪 Nettoyage tracking des images
      console.log(`🖼️ Images chargées durant la session: ${loadedImagesRef.current.size}`);
      loadedImagesRef.current.clear();
    };
  }, []);

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

  const fetchRoadtrip = async (signal?: AbortSignal) => {
    setLoading(true); // Commencez le chargement
    
    // 🧪 Mesure mémoire avant le fetch
    const beforeFetch = getMemoryUsage('Avant fetchRoadtrip');
    
    try {
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}`, {
        signal // Ajouter le signal d'abort
      });
      const data = await response.json();
      console.log('🔍 Données brutes de l\'API - Nombre d\'étapes:', data.steps?.length || 0);
      // console.log('🔍 Données brutes de l\'API:', data); // Désactivé pour éviter la saturation des logs

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

      // Vérifier si les données ont réellement changé pour éviter les re-renders inutiles
      const currentDataHash = JSON.stringify({
        steps: filteredData.steps.map(s => ({ id: s.id, name: s.name, arrivalDateTime: s.arrivalDateTime })),
        name: filteredData.name
      });
      
      const previousDataHash = roadtrip ? JSON.stringify({
        steps: roadtrip.steps.map(s => ({ id: s.id, name: s.name, arrivalDateTime: s.arrivalDateTime })),
        name: roadtrip.name
      }) : '';

      // Ne mettre à jour que si les données ont changé
      if (currentDataHash !== previousDataHash) {
        setRoadtrip(filteredData);
        console.log('🔍 Roadtrip mis à jour - Nombre d\'étapes filtrées:', filteredData.steps?.length || 0);
      } else {
        console.log('🔍 Roadtrip inchangé - Pas de mise à jour nécessaire');
      }
      // console.log('Roadtrip récupéré:', filteredData); // Désactivé pour éviter la saturation des logs

    } catch (error) {
      console.error('Erreur lors de la récupération du roadtrip:', error);
      handleBackendError(error, 'lors de la récupération du roadtrip');
    } finally {
      setLoading(false); // Terminez le chargement
      
      // 🧪 Mesure mémoire après le fetch
      const afterFetch = getMemoryUsage('Après fetchRoadtrip');
      logMemoryComparison(beforeFetch, afterFetch);
    }
  };

  // Fonction de refresh silencieux ULTRA-OPTIMISÉE (sans loading) pour éviter TOUS les re-renders
  const fetchRoadtripSilent = async () => {
    try {
      // Ne pas faire de polling si l'utilisateur est en train de scroller
      if (isScrollingRef.current) {
        console.log('🔍 Polling: Skip - utilisateur en train de scroller');
        return;
      }

      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}`);
      const data = await response.json();

      // Créer un hash minimal pour détecter les vrais changements
      const quickHash = JSON.stringify({
        stepCount: data.steps?.length || 0,
        stepIds: data.steps?.map((s: any) => s._id).sort().join(',') || '',
        name: data.name,
        lastModified: data.updatedAt || data._id // Utiliser un champ de modification si disponible
      });

      // Si rien n'a changé, ne faire AUCUNE mise à jour d'état
      if (quickHash === lastPollingHashRef.current) {
        console.log('🔍 Polling: Aucun changement détecté - Skip complet');
        return;
      }

      console.log('🔍 Polling: Changement détecté - Analyse détaillée...');

      // Seulement si changement détecté, faire l'analyse complète
      const { alerts, errorMessages } = checkDateConsistency(data);
      
      // Ne mettre à jour les alertes que si elles ont changé
      if (alerts !== alertCount) {
        setAlertCount(alerts);
      }
      
      // Ne mettre à jour les erreurs que si elles ont changé
      const currentErrorsHash = JSON.stringify(errorMessages.map(e => ({ stepId: e.stepId, message: e.message })));
      const previousErrorsHash = JSON.stringify(errors.map(e => ({ stepId: e.stepId, message: e.message })));
      
      if (currentErrorsHash !== previousErrorsHash) {
        setErrors(errorMessages);
      }

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

      // Comparer avec les données actuelles pour éviter les re-renders inutiles
      const currentFullHash = JSON.stringify({
        steps: filteredData.steps.map(s => ({
          id: s.id,
          name: s.name,
          arrivalDateTime: s.arrivalDateTime,
          departureDateTime: s.departureDateTime,
          type: s.type,
          thumbnail: s.thumbnail,
          travelTimePreviousStep: s.travelTimePreviousStep,
          distancePreviousStep: s.distancePreviousStep,
          travelTimeNote: s.travelTimeNote,
          accommodations: s.accommodations,
          activities: s.activities
        })),
        name: filteredData.name
      });
      
      const previousFullHash = roadtripDataRef.current ? JSON.stringify({
        steps: roadtripDataRef.current.steps.map(s => ({
          id: s.id,
          name: s.name,
          arrivalDateTime: s.arrivalDateTime,
          departureDateTime: s.departureDateTime,
          type: s.type,
          thumbnail: s.thumbnail,
          travelTimePreviousStep: s.travelTimePreviousStep,
          distancePreviousStep: s.distancePreviousStep,
          travelTimeNote: s.travelTimeNote,
          accommodations: s.accommodations,
          activities: s.activities
        })),
        name: roadtripDataRef.current.name
      }) : '';

      // Mettre à jour les références
      roadtripDataRef.current = filteredData;
      lastPollingHashRef.current = quickHash;
      
      // Mise à jour SIMPLIFIÉE pour éviter le scintillement
      if (currentFullHash !== previousFullHash) {
        if (isScrollingRef.current) {
          // Stocker la mise à jour en attente
          pendingUpdateRef.current = filteredData;
        } else {
          // Mise à jour immédiate si pas de scroll
          setRoadtrip(filteredData);
        }
      }

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
    const controller = new AbortController();
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRoadtrip(controller.signal);
    });
    
    // Cleanup : annuler la requête si le composant se démonte
    return () => {
      console.log('🧹 Cleanup: Annulation des requêtes et listeners');
      controller.abort();
      unsubscribe();
    };
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
    return () => {
      console.log('🧹 Cleanup: Suppression du beforeRemove listener');
      unsubscribe();
    };
  }, [navigation]);

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

  // Afficher les boutons dans le header supérieur
  useEffect(() => {
    console.log('Mise à jour de la barre de navigation');
    
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          {/* Bouton Chatbot */}
          {isChatAvailable && (
            <TouchableOpacity 
              onPress={() => setChatVisible(true)}
              style={{ marginRight: 15 }}
            >
              <Icon name="robot" size={24} color="#007BFF" />
            </TouchableOpacity>
          )}
          
          {/* Bouton de notifications */}
          <NotificationButton 
            roadtripId={roadtripId}
            unreadCount={unreadCount}
            onPress={(roadtripId) => {
              navigation.navigate('Notifications', { roadtripId });
              boostPolling(roadtripId, 30000);
            }}
            style={{ marginRight: 10 }}
          />
        </View>
      ),
    });
  }, [navigation, roadtripId, unreadCount, boostPolling, isChatAvailable]);

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

  // Optimisation : memoization de renderRightActions pour éviter les re-créations
  const renderRightActions = useCallback((progress, dragX, stepId: string) => {
    // Calcul de l'animation pour un effet d'apparition progressive
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    
    // Utilisation de l'animation pour l'opacité et le déplacement
    return (
      <View style={styles.rightActionsContainer}>
        <Animated.View 
          style={[
            styles.deleteActionContainer,
            {
              transform: [{ translateX: trans }],
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => confirmDeleteStep(stepId)}
          >
            <Icon name="trash-alt" size={22} color="white" />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }, []);

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

  // Optimisation : memoization des fonctions utilitaires pour le restyling des étapes
  
  // Fonction pour déterminer le type d'activité principal d'une étape
  const getStepMainActivityType = useCallback((step: any): string => {
    if (step.type === 'Transport') return 'Transport';
    
    // Pour les étapes de type Stage, prendre le type de la première activité active
    if (step.activities && step.activities.length > 0) {
      const activeActivity = step.activities.find((activity: any) => activity.active !== false);
      if (activeActivity && activeActivity.type) {
        return activeActivity.type;
      }
    }
    
    // Par défaut, considérer comme une visite
    return 'Visite';
  }, []);

  // Fonction pour compter les éléments actifs d'une étape
  const getStepActiveCounts = useCallback((step: any) => {
    const activeAccommodations = step.accommodations ? 
      step.accommodations.filter((acc: any) => acc.active !== false).length : 0;
    const activeActivities = step.activities ? 
      step.activities.filter((act: any) => act.active !== false).length : 0;
    
    return { accommodations: activeAccommodations, activities: activeActivities };
  }, []);

  // Fonction pour obtenir l'icône de l'étape en fonction de son type
  const getStepIcon = useCallback((step: any): string => {
    if (step.type === 'Transport') return 'truck';
    
    const mainActivityType = getStepMainActivityType(step);
    return getActivityTypeIcon(mainActivityType);
  }, [getStepMainActivityType]);

  // Fonction pour obtenir la couleur de l'étape
  const getStepColor = useCallback((step: any): string => {
    if (step.type === 'Transport') return '#FF9800'; // Orange pour transport
    
    const mainActivityType = getStepMainActivityType(step);
    return getActivityTypeColor(mainActivityType);
  }, [getStepMainActivityType]);

  // Optimisation : mémoïsation du tri des steps avec pré-calculs OPTIMISÉE POUR ÉVITER LES RE-RENDERS
  const sortedSteps = useMemo(() => {
    return trackPerformance('sortedSteps calculation', () => {
      if (!roadtrip?.steps) return [];
      
      // Séparer le tri des pré-calculs coûteux
      const sorted = roadtrip.steps.slice().sort((a, b) =>
        new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime()
      );
      
      // Seulement les pré-calculs essentiels pour éviter les re-renders
      return sorted.map(step => ({
        ...step,
        accommodations: step.accommodations || [],
        activities: step.activities || [],
        // Pré-calculs LÉGERS uniquement
        precomputed: {
          mainActivityType: getStepMainActivityType(step),
          stepColor: getStepColor(step),
          stepIcon: getStepIcon(step),
          activeCounts: getStepActiveCounts(step),
          hasAlert: errors.some(error => error.stepId === step.id),
          // Supprimer les formatages coûteux - les faire à la volée
        }
      }));
    });
  }, [
    roadtrip?.steps?.length, // Utiliser uniquement la longueur pour éviter les re-renders
    roadtrip?.steps?.map(s => s.id).join(','), // Vérifier seulement les IDs
    errors.length // Utiliser seulement la longueur
  ]); // Dépendances minimalistes pour éviter les re-calculs

  // 🔍 Monitoring des re-renders après la déclaration de sortedSteps
  useEffect(() => {
    console.log('🔄 RoadTripScreen - Re-render détecté, sortedSteps:', sortedSteps?.length || 0);
  }, [sortedSteps]);

  const getTravelInfoBackgroundColor = useCallback((note) => {
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
  }, []);

  // Optimisation : renderItem SIMPLIFIÉ
  const renderStepItem = useCallback(({ item, index }) => {
    return (
      <StepItem
        item={item}
        index={index}
        sortedSteps={sortedSteps}
        styles={styles}
        getTravelInfoBackgroundColor={getTravelInfoBackgroundColor}
        renderRightActions={renderRightActions}
        handleStepPress={handleStepPress}
        loadedImagesRef={loadedImagesRef}
      />
    );
  }, []); // Aucune dépendance pour éviter les re-créations

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

  console.log('🔍 Sorted steps - Nombre d\'étapes triées:', sortedSteps.length);
  // console.log('Sorted steps:', sortedSteps); // Désactivé pour éviter la saturation des logs

  const StepList = () => (
    <View style={styles.container}>
      <Text style={styles.title}>{roadtrip.name}</Text>
      <FlatList
        ref={flatListRef}
        data={sortedSteps}
        keyExtractor={(item) => item.id} // Utiliser l'ID simple pour plus de stabilité
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={renderStepItem}
        // Optimisations de performance FlatList - Mode FLUIDE SIMPLE
        removeClippedSubviews={false}             // Désactivé pour éviter les saccades
        initialNumToRender={10}                   // Plus d'éléments initiaux
        maxToRenderPerBatch={5}                   // Batches plus gros
        updateCellsBatchingPeriod={50}            // Plus réactif
        windowSize={10}                           // Fenêtre plus large
        scrollEventThrottle={16}                  // 60fps
        legacyImplementation={false}
        // Anti-fuite mémoire
        onEndReachedThreshold={0.1}               
        disableVirtualization={false}
        // Stabilité visuelle
        showsVerticalScrollIndicator={true}
        bounces={true}                            
        overScrollMode="auto"
        // Supprimer getItemLayout pour éviter les saccades
        // extraData supprimé pour éviter les re-renders                     
        // PRÉSERVATION SIMPLE DE LA POSITION DU SCROLL
        onScroll={(event) => {
          scrollPositionRef.current = event.nativeEvent.contentOffset.y;
        }}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 1000,        // Très tolérant pour éviter les sauts
        }}
        // Simplifier la gestion du contenu
        onContentSizeChange={() => {
          // Ne rien faire pour éviter les conflits
        }}
        // Tracking du scroll SIMPLIFIÉ
        onScrollBeginDrag={() => {
          isScrollingRef.current = true;
        }}
        onScrollEndDrag={() => {
          // Délai court pour le drag
          setTimeout(() => {
            isScrollingRef.current = false;
            
            // Appliquer une mise à jour en attente s'il y en a une
            if (pendingUpdateRef.current) {
              setRoadtrip(pendingUpdateRef.current);
              pendingUpdateRef.current = null;
            }
          }, 300);
        }}
        onMomentumScrollBegin={() => {
          isScrollingRef.current = true;
        }}
        onMomentumScrollEnd={() => {
          // Délai après momentum
          setTimeout(() => {
            isScrollingRef.current = false;
            
            // Appliquer une mise à jour en attente s'il y en a une
            if (pendingUpdateRef.current) {
              setRoadtrip(pendingUpdateRef.current);
              pendingUpdateRef.current = null;
            }
          }, 500);
        }}
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
      
      {/* FAB pour ajouter une étape - Retour à la position originale */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddStep}
        color="white"
      />
      
      {/* ChatBot Modal */}
      {isChatAvailable && (
        <ChatBot
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          roadtripId={roadtripId}
          token={''} // Récupérer le token si nécessaire
        />
      )}
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

  const RoadTripTasks = () => {
    return (
      <TasksScreen 
        roadtripId={roadtripId}
        navigation={navigation}
      />
    );
  };

  // Attendre que la persistance soit chargée avant de rendre le Navigator
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ChatLayout showChatButton={false}>
      <Tab.Navigator
        key={`${navigatorKey}-${activeTab}`}
        id={undefined}
        initialRouteName={activeTab}
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Sauvegarder l'onglet actuel
            changeTab(route.name);
          },
        })}
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
        name="Tâches"
        component={RoadTripTasks}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="tasks" color={color} size={size} />
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
    </ChatLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
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
  
  // Nouveaux styles pour les cartes d'étapes modernes
  stepCard: {
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  stepCardAlert: {
    borderColor: '#ffc107',
    borderWidth: 2,
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  stepHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepHeaderInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  stepType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  stepHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertBadge: {
    backgroundColor: '#ffc107',
  },
  accommodationBadge: {
    backgroundColor: '#28a745',
  },
  activityBadge: {
    backgroundColor: '#17a2b8',
  },
  stepCardContent: {
    padding: 16,
  },
  stepThumbnail: {
    width: '100%',
    height: 120, // Réduit de 160 à 120 pour économiser la mémoire
    borderRadius: 8,
    marginBottom: 12,
  },
  stepDatesContainer: {
    marginTop: 8,
  },
  stepDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepDateIcon: {
    marginRight: 8,
    width: 16,
  },
  stepDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginRight: 8,
    minWidth: 50,
  },
  stepDateTime: {
    fontSize: 12,
    color: '#495057',
    flex: 1,
  },

  // Styles existants (gardés pour compatibilité)
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
  deleteButton: {
    backgroundColor: '#e63946',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  rightActionsContainer: {
    width: 80,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  deleteActionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  travelInfoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    position: 'relative',
  },
  travelInfo: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  travelInfoLine: {
    width: 4,
    height: 28,
    backgroundColor: '#e3e6ea',
    borderRadius: 2,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  travelIcon: {
    marginVertical: 6,
    opacity: 0.8,
  },
  travelIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 4,
  },
  travelTextContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  travelText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 2,
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
  // Style FAB - Retour à la position originale
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007BFF',
  },
});