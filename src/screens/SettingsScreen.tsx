import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import config from '../config';
import Icon from 'react-native-vector-icons/FontAwesome5';

// Props de navigation
// Ajoutez 'Settings' dans RootStackParamList si besoin

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [algoliaSearchRadius, setAlgoliaSearchRadius] = useState<number>(50000);
  const [dragSnapInterval, setDragSnapInterval] = useState<number>(15); // Pas de déplacement en minutes
  const [enablePhotosInStories, setEnablePhotosInStories] = useState<boolean>(true); // Utiliser les photos dans les récits
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour le calcul des temps de trajet
  const [showTravelTimeModal, setShowTravelTimeModal] = useState(false);
  const [availableRoadtrips, setAvailableRoadtrips] = useState([]);
  const [selectedRoadtrip, setSelectedRoadtrip] = useState(null);
  const [travelTimeJob, setTravelTimeJob] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Options disponibles pour le pas de déplacement
  const snapIntervalOptions = [
    { value: 5, label: '5 minutes', description: 'Précision fine' },
    { value: 10, label: '10 minutes', description: 'Bon équilibre' },
    { value: 15, label: '15 minutes', description: 'Défaut recommandé' },
    { value: 30, label: '30 minutes', description: 'Planning rapide' },
    { value: 60, label: '1 heure', description: 'Vue d\'ensemble' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const getJwtToken = async () => '';

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError('Erreur lors du chargement des paramètres.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setSystemPrompt(data.systemPrompt || '');
      setAlgoliaSearchRadius(
        typeof data.algoliaSearchRadius === 'number' ? data.algoliaSearchRadius : 50000
      );
      setDragSnapInterval(
        typeof data.dragSnapInterval === 'number' ? data.dragSnapInterval : 15
      );
      setEnablePhotosInStories(
        typeof data.enablePhotosInStories === 'boolean' ? data.enablePhotosInStories : true
      );
      setLoading(false);
    } catch (e) {
      setError('Erreur réseau ou serveur.');
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (systemPrompt.length < 5) {
      Alert.alert('Le prompt doit contenir au moins 5 caractères.');
      return;
    }
    if (
      isNaN(algoliaSearchRadius) ||
      algoliaSearchRadius < 1000 ||
      algoliaSearchRadius > 200000
    ) {
      Alert.alert('Le rayon de recherche doit être entre 1 000m (1km) et 200 000m (200km).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ systemPrompt, algoliaSearchRadius, dragSnapInterval, enablePhotosInStories }),
      });
      if (!response.ok) {
        setError('Erreur lors de la sauvegarde.');
        setSaving(false);
        return;
      }
      setSaving(false);
      Alert.alert('Paramètres enregistrés !');
    } catch (e) {
      setError('Erreur réseau ou serveur.');
      setSaving(false);
    }
  };

  // Fonctions pour le calcul des temps de trajet
  const fetchAvailableRoadtrips = async () => {
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/roadtrips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const roadtrips = await response.json();
        setAvailableRoadtrips(roadtrips);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des roadtrips:', error);
    }
  };

  const startTravelTimeCalculation = async (roadtripId: string) => {
    setIsCalculating(true);
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/travel-time/refresh/async`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 409) {
        Alert.alert('Calcul en cours', 'Un calcul des temps de trajet est déjà en cours pour ce roadtrip.');
        setIsCalculating(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      setTravelTimeJob(result);
      
      // Commencer le polling du statut
      pollTravelTimeStatus(roadtripId, result.jobId);
      
    } catch (error) {
      console.error('Erreur lors du démarrage du calcul:', error);
      Alert.alert('Erreur', 'Impossible de démarrer le calcul des temps de trajet.');
      setIsCalculating(false);
    }
  };

  const pollTravelTimeStatus = async (roadtripId: string, jobId: string) => {
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/travel-time/jobs/${jobId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const status = await response.json();
        setTravelTimeJob(status);

        if (status.status === 'running') {
          // Continuer le polling toutes les 2 secondes
          setTimeout(() => pollTravelTimeStatus(roadtripId, jobId), 2000);
        } else if (status.status === 'completed') {
          setIsCalculating(false);
          // Afficher les résultats
          const summary = status.results?.summary;
          if (summary) {
            Alert.alert(
              'Calcul terminé !',
              `Distance totale: ${summary.totalDistance?.toFixed(2)} km\n` +
              `Temps total: ${Math.floor(summary.totalTravelTime / 60)}h ${summary.totalTravelTime % 60}m\n` +
              `Étapes traitées: ${status.results.stepsProcessed}\n` +
              `Erreurs: ${status.results.errors?.length || 0}`
            );
          } else {
            Alert.alert('Calcul terminé !', 'Les temps de trajet ont été mis à jour.');
          }
        } else if (status.status === 'failed') {
          setIsCalculating(false);
          Alert.alert('Erreur', 'Le calcul des temps de trajet a échoué.');
        }
      }
    } catch (error) {
      console.error('Erreur lors du polling:', error);
      setIsCalculating(false);
    }
  };

  const openTravelTimeModal = () => {
    fetchAvailableRoadtrips();
    setShowTravelTimeModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Prompt IA personnalisé :</Text>
        <TextInput
          style={styles.input}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          placeholder="Définissez votre prompt..."
          multiline
        />
      <Text style={styles.label}>Rayon de recherche Algolia (en mètres) :</Text>
      <TextInput
        style={styles.input}
        value={algoliaSearchRadius.toString()}
        onChangeText={text => {
          // Autoriser uniquement les chiffres
          const val = text.replace(/[^0-9]/g, '');
          setAlgoliaSearchRadius(val ? parseInt(val, 10) : 0);
        }}
        placeholder="Rayon en mètres (ex: 50000)"
        keyboardType="numeric"
        maxLength={6}
      />
      <Text style={{ color: '#888', marginBottom: 16, fontSize: 13 }}>
        (Min: 1 000m, Max: 200 000m. Défaut: 50 000m)
      </Text>

      <Text style={styles.label}>Pas de déplacement dans le planning :</Text>
      <Text style={{ color: '#888', marginBottom: 12, fontSize: 13 }}>
        Définit la précision du drag & drop lors de l'organisation de vos activités
      </Text>
      <View style={styles.optionsContainer}>
        {snapIntervalOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              dragSnapInterval === option.value && styles.optionButtonSelected
            ]}
            onPress={() => setDragSnapInterval(option.value)}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[
                  styles.optionText,
                  dragSnapInterval === option.value && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  dragSnapInterval === option.value && styles.optionDescriptionSelected
                ]}>
                  {option.description}
                </Text>
              </View>
              {dragSnapInterval === option.value && (
                <View style={styles.checkIcon}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Photos dans les récits */}
      <Text style={styles.sectionTitle}>Récits avec IA</Text>
      <Text style={styles.sectionDescription}>
        Configurez les fonctionnalités de génération de récits avec intelligence artificielle
      </Text>
      
      <TouchableOpacity
        style={[
          styles.photoToggleButton,
          enablePhotosInStories ? styles.photoToggleButtonEnabled : styles.photoToggleButtonDisabled
        ]}
        onPress={() => setEnablePhotosInStories(!enablePhotosInStories)}
      >
        <View style={styles.photoToggleContent}>
          <Icon 
            name={enablePhotosInStories ? "images" : "file-alt"} 
            size={20} 
            color={enablePhotosInStories ? "#28a745" : "#6c757d"} 
            style={styles.photoToggleIcon} 
          />
          <View style={styles.photoToggleTextContainer}>
            <Text style={[
              styles.photoToggleTitle,
              enablePhotosInStories ? styles.photoToggleTitleEnabled : styles.photoToggleTitleDisabled
            ]}>
              Utiliser les photos dans les récits
            </Text>
            <Text style={styles.photoToggleSubtext}>
              {enablePhotosInStories 
                ? "GPT-4o Vision analysera vos photos pour des récits enrichis" 
                : "GPT-4o-mini standard pour des récits textuels rapides"}
            </Text>
          </View>
          <View style={styles.photoToggleSwitch}>
            <View style={[
              styles.photoToggleSwitchTrack,
              enablePhotosInStories ? styles.photoToggleSwitchTrackEnabled : styles.photoToggleSwitchTrackDisabled
            ]}>
              <View style={[
                styles.photoToggleSwitchThumb,
                enablePhotosInStories ? styles.photoToggleSwitchThumbEnabled : styles.photoToggleSwitchThumbDisabled
              ]} />
            </View>
          </View>
        </View>
        <View style={styles.photoToggleDetails}>
          <View style={styles.photoToggleDetailRow}>
            <Icon name="dollar-sign" size={12} color="#6c757d" />
            <Text style={styles.photoToggleDetailText}>
              {enablePhotosInStories ? "Coût: Plus élevé avec analyse d'images" : "Coût: Économique sans images"}
            </Text>
          </View>
          <View style={styles.photoToggleDetailRow}>
            <Icon name="clock" size={12} color="#6c757d" />
            <Text style={styles.photoToggleDetailText}>
              {enablePhotosInStories ? "Vitesse: Plus lent avec analyse visuelle" : "Vitesse: Rapide sans analyse"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Section Calcul des temps de trajet */}
      <Text style={styles.sectionTitle}>Maintenance des roadtrips</Text>
      <Text style={styles.sectionDescription}>
        Recalculez les distances et temps de trajet pour corriger d'éventuelles incohérences
      </Text>
      
      <TouchableOpacity
        style={styles.travelTimeButton}
        onPress={openTravelTimeModal}
        disabled={isCalculating}
      >
        <View style={styles.travelTimeButtonContent}>
          <Icon name="route" size={20} color="#007AFF" style={styles.travelTimeIcon} />
          <View style={styles.travelTimeTextContainer}>
            <Text style={styles.travelTimeButtonText}>
              Calculer les temps de trajet
            </Text>
            <Text style={styles.travelTimeButtonSubtext}>
              Mise à jour automatique des distances et durées
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color="#007AFF" />
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={saving ? 'Sauvegarde...' : 'Enregistrer'} onPress={saveSettings} disabled={saving} />
      </ScrollView>
      
      {/* Modal pour le calcul des temps de trajet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTravelTimeModal}
        onRequestClose={() => setShowTravelTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Calculer les temps de trajet</Text>
            <Text style={styles.modalSubtitle}>
              Sélectionnez un roadtrip pour recalculer automatiquement les distances et temps de trajet entre les étapes
            </Text>
            
            {availableRoadtrips.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="map" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>Aucun roadtrip disponible</Text>
              </View>
            ) : (
              <ScrollView style={styles.roadtripList}>
                {availableRoadtrips.map((roadtrip) => (
                  <TouchableOpacity
                    key={roadtrip._id}
                    style={styles.roadtripItem}
                    onPress={() => {
                      setSelectedRoadtrip(roadtrip);
                      setShowTravelTimeModal(false);
                      startTravelTimeCalculation(roadtrip._id);
                    }}
                    disabled={isCalculating}
                  >
                    <View style={styles.roadtripItemContent}>
                      <Icon name="map-marked-alt" size={20} color="#007AFF" />
                      <View style={styles.roadtripItemText}>
                        <Text style={styles.roadtripItemName}>{roadtrip.name}</Text>
                        <Text style={styles.roadtripItemDetails}>
                          {roadtrip.steps?.length || 0} étapes
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={16} color="#ccc" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowTravelTimeModal(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de progression du calcul */}
      {isCalculating && travelTimeJob && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={true}
          onRequestClose={() => {}}
        >
          <View style={styles.progressModalOverlay}>
            <View style={styles.progressModalContent}>
              <Icon name="route" size={32} color="#007AFF" style={styles.progressIcon} />
              <Text style={styles.progressTitle}>Calcul en cours...</Text>
              <Text style={styles.progressSubtitle}>
                {selectedRoadtrip?.name}
              </Text>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${travelTimeJob.progress?.percentage || 0}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {travelTimeJob.progress?.percentage || 0}%
                </Text>
              </View>
              
              <Text style={styles.progressDetails}>
                {travelTimeJob.progress?.completed || 0} / {travelTimeJob.progress?.total || 0} étapes traitées
              </Text>
              
              {travelTimeJob.estimatedDuration && (
                <Text style={styles.progressEstimation}>
                  Temps estimé : {travelTimeJob.estimatedDuration}
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 80, marginBottom: 16, fontSize: 15 },
  error: { color: 'red', marginBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionTextSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  optionDescriptionSelected: {
    color: '#007AFF',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Styles pour la section temps de trajet
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  travelTimeButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#f0f8ff',
  },
  travelTimeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  travelTimeIcon: {
    marginRight: 12,
  },
  travelTimeTextContainer: {
    flex: 1,
  },
  travelTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  travelTimeButtonSubtext: {
    fontSize: 12,
    color: '#007AFF',
  },

  // Styles pour les modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
    width: '90%',
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
    lineHeight: 20,
  },
  modalCancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Styles pour la liste des roadtrips
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  roadtripList: {
    maxHeight: 300,
  },
  roadtripItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  roadtripItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roadtripItemText: {
    flex: 1,
    marginLeft: 12,
  },
  roadtripItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  roadtripItemDetails: {
    fontSize: 12,
    color: '#666',
  },

  // Styles pour le modal de progression
  progressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  progressIcon: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressEstimation: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

  // Styles pour la section photos dans les récits
  photoToggleButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
  },
  photoToggleButtonEnabled: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  photoToggleButtonDisabled: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  photoToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoToggleIcon: {
    marginRight: 12,
  },
  photoToggleTextContainer: {
    flex: 1,
  },
  photoToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  photoToggleTitleEnabled: {
    color: '#28a745',
  },
  photoToggleTitleDisabled: {
    color: '#6c757d',
  },
  photoToggleSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  photoToggleSwitch: {
    marginLeft: 12,
  },
  photoToggleSwitchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  photoToggleSwitchTrackEnabled: {
    backgroundColor: '#28a745',
  },
  photoToggleSwitchTrackDisabled: {
    backgroundColor: '#ccc',
  },
  photoToggleSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  photoToggleSwitchThumbEnabled: {
    alignSelf: 'flex-end',
  },
  photoToggleSwitchThumbDisabled: {
    alignSelf: 'flex-start',
  },
  photoToggleDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  photoToggleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  photoToggleDetailText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 6,
  },
});
