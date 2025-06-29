import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import config from '../config';

// Props de navigation
 type Props = StackScreenProps<RootStackParamList, 'StepStory'>;

export default function StepStoryScreen({ route, navigation }: Props) {
  const { stepId } = route.params;
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStory();
  }, [stepId]);

  const fetchStory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer le token JWT (à adapter selon ton stockage)
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/step-story/${stepId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        setError('Non autorisé. Veuillez vous reconnecter.');
      } else if (response.status === 404) {
        setError('Step non trouvé.');
      } else if (response.status === 503) {
        setError('Service IA indisponible. Réessayez plus tard.');
      } else if (!response.ok) {
        setError('Erreur serveur.');
      } else {
        const data = await response.json();
        setStory(data.story);
        setPrompt(data.prompt);
      }
    } catch (e) {
      setError('Erreur réseau ou serveur.');
    } finally {
      setLoading(false);
    }
  };

  // À adapter selon ton stockage JWT (AsyncStorage, SecureStore, etc.)
  const getJwtToken = async () => {
    // Exemple : return await AsyncStorage.getItem('jwt');
    return '';
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchStory} style={styles.retryButton}>
            <Fontawesome5 name="redo" size={18} color="#fff" />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Récit généré</Text>
          <Text style={styles.story}>{story}</Text>
          <Text style={styles.subtitle}>Prompt utilisé</Text>
          <Text style={styles.prompt}>{prompt}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  story: { fontSize: 16, marginBottom: 32, color: '#222' },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  prompt: { fontSize: 13, color: '#666', backgroundColor: '#f4f4f4', padding: 10, borderRadius: 8 },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontSize: 16, marginBottom: 16 },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007BFF', padding: 10, borderRadius: 8 },
  retryText: { color: '#fff', marginLeft: 8 },
});
