import config from '../config';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types';

type Props = StackScreenProps<RootStackParamList, 'AddActivityNaturalLanguage'>;

export default function AddActivityNaturalLanguageScreen({ route, navigation }: Props) {
  const { roadtripId, stepId, refresh } = route.params;
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  const requestLocationPermission = async () => {
    try {
      // Pour cette version simplifiée, nous désactivons la géolocalisation
      // TODO: Implémenter la géolocalisation avec @react-native-community/geolocation
      console.log('Géolocalisation désactivée temporairement');
      setLocationPermission(false);
      return false;
    } catch (error) {
      console.error('Erreur lors de la demande de permission de géolocalisation:', error);
      setLocationPermission(false);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Pour cette version simplifiée, nous retournons null
      // TODO: Implémenter la géolocalisation avec @react-native-community/geolocation
      console.log('Géolocalisation non disponible dans cette version');
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la localisation:', error);
      return null;
    }
  };

  const handleCreateActivity = async () => {
    if (!prompt.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une description pour votre activité.');
      return;
    }

    setLoading(true);

    try {
      // Tentative de récupération de la géolocalisation de l'utilisateur
      let userLocation = null;
      try {
        userLocation = await getCurrentLocation();
      } catch (locationError) {
        console.log('Impossible de récupérer la géolocalisation:', locationError);
        // On continue sans géolocalisation
      }
      
      const requestBody: any = {
        prompt: prompt.trim(),
      };

      // Ajouter la géolocalisation si disponible
      if (userLocation) {
        requestBody.userLatitude = userLocation.latitude;
        requestBody.userLongitude = userLocation.longitude;
      }

      const apiUrl = `${config.BACKEND_URL}/roadtrips/${roadtripId}/steps/${stepId}/activities/natural-language`;
      console.log('Appel API:', apiUrl);
      console.log('Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Ajouter l'authentification JWT si nécessaire
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Status de la réponse:', response.status);
      console.log('Headers de la réponse:', response.headers);

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Réponse non-JSON reçue:', textResponse);
        Alert.alert(
          'Erreur Serveur',
          'Le serveur a retourné une réponse invalide. Vérifiez que l\'API backend est démarrée et accessible.'
        );
        return;
      }

      const data = await response.json();
      console.log('Données reçues:', data);

      if (response.ok) {
        Alert.alert(
          'Succès',
          `Activité "${data.activity.name}" créée avec succès !`,
          [
            {
              text: 'OK',
              onPress: () => {
                refresh(); // Actualiser la liste des activités
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Erreur',
          data.message || `Erreur HTTP ${response.status}: ${data.error || 'Erreur inconnue'}`
        );
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'activité:', error);
      
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        Alert.alert(
          'Erreur de Communication',
          'Impossible de communiquer avec le serveur. Vérifiez :\n\n• Que le serveur backend est démarré\n• Que l\'URL est correcte\n• Votre connexion réseau'
        );
      } else {
        Alert.alert(
          'Erreur',
          'Une erreur réseau est survenue. Veuillez vérifier votre connexion et réessayer.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPermissionRequest = async () => {
    await requestLocationPermission();
  };

  const testServerConnection = async () => {
    try {
      const testUrl = `${config.BACKEND_URL}/roadtrips/${roadtripId}`;
      console.log('Test de connectivité:', testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('✅ Serveur OK', 'Le serveur backend est accessible et fonctionne correctement.');
      } else {
        Alert.alert('⚠️ Erreur Serveur', `Le serveur répond mais avec une erreur: ${response.status}`);
      }
    } catch (error) {
      console.error('Test de connectivité échoué:', error);
      Alert.alert(
        '❌ Serveur Non Accessible', 
        `Impossible de joindre le serveur à l'adresse:\n${config.BACKEND_URL}\n\nVérifiez que le serveur backend est démarré.`
      );
    }
  };

  const examples = [
    "Course à pied dans le parc dans 1 heure pendant 45 minutes",
    "Visite guidée du Louvre demain de 10h à 12h avec réservation",
    "Déjeuner au restaurant Le Procope demain à 12h30",
    "Shopping aux Champs-Élysées cet après-midi",
    "Randonnée au Mont-Blanc, Chamonix, départ 8h du refuge",
    "Spa et détente dans le coin en fin de journée"
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Icon name="magic" size={24} color="#007BFF" />
          <Text style={styles.title}>Ajouter une activité via IA</Text>
          <TouchableOpacity onPress={testServerConnection} style={styles.testButton}>
            <Icon name="wifi" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Décrivez votre activité en langage naturel et laissez l'IA faire le reste !
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description de votre activité :</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="Ex: Course à pied dans le parc demain matin à 8h pendant 45 minutes..."
            value={prompt}
            onChangeText={setPrompt}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <Icon name="map-marker-alt" size={16} color="#666" />
            <Text style={styles.locationTitle}>Géolocalisation (non disponible)</Text>
          </View>
          <Text style={styles.locationDescription}>
            La géolocalisation est temporairement désactivée. L'IA utilisera l'adresse de l'étape par défaut ou les adresses spécifiées dans votre description.
          </Text>
          <Text style={styles.locationStatusError}>
            ℹ️ Fonctionnalité en cours de développement - Spécifiez des adresses précises dans vos descriptions
          </Text>
        </View>

        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>Exemples :</Text>
          {examples.map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleItem}
              onPress={() => setPrompt(example)}
            >
              <Text style={styles.exampleText}>• {example}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateActivity}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Icon name="magic" size={16} color="white" style={styles.buttonIcon} />
                <Text style={styles.createButtonText}>Créer l'activité</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fafafa',
  },
  locationContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  locationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  locationButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  locationButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  locationButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007BFF',
    marginTop: 8,
  },
  locationButtonSecondaryText: {
    color: '#007BFF',
    fontWeight: '600',
  },
  locationStatus: {
    color: '#28a745',
    fontSize: 14,
    fontStyle: 'italic',
  },
  locationStatusError: {
    color: '#dc3545',
    fontSize: 14,
    fontStyle: 'italic',
  },
  examplesContainer: {
    marginBottom: 32,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  exampleItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007BFF',
  },
  exampleText: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#007BFF',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
