import React, { useEffect, useState, useRef } from 'react';
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
  const [status, setStatus] = useState<string | null>(null); // pending, processing, done, error
  const [jobId, setJobId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkOrGenerateStory();
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [stepId]);

  // Vérifie s'il existe déjà un récit, sinon lance la génération asynchrone
  const checkOrGenerateStory = async () => {
    setLoading(true);
    setError(null);
    setStory(null);
    setPrompt(null);
    setStatus(null);
    setJobId(null);
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/steps/${stepId}/story`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        setError('Non autorisé. Veuillez vous reconnecter.');
        setLoading(false);
      } else if (response.status === 404) {
        // Pas de récit, on lance la génération asynchrone
        fetchStoryAsync();
      } else if (response.status === 503) {
        setError('Service IA indisponible. Réessayez plus tard.');
        setLoading(false);
      } else if (!response.ok) {
        setError('Erreur serveur.');
        setLoading(false);
      } else {
        const data = await response.json();
        if (data.story) {
          setStory(data.story);
          setPrompt(data.prompt);
          setLoading(false);
        } else {
          // Pas de récit malgré 200, on lance la génération asynchrone
          fetchStoryAsync();
        }
      }
    } catch (e) {
      setError('Erreur réseau ou serveur.');
      setLoading(false);
    }
  };

  // Lancer la génération asynchrone et commencer le polling
  const fetchStoryAsync = async () => {
    setLoading(true);
    setError(null);
    setStory(null);
    setPrompt(null);
    setStatus(null);
    setJobId(null);
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/steps/${stepId}/story/async`, {
        method: 'POST',
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
        setJobId(data.jobId);
        setStatus(data.status);
        pollStatus(data.jobId);
      }
    } catch (e) {
      setError('Erreur réseau ou serveur.');
    }
  };

  // Polling du statut du job
  const pollStatus = async (jobId: string) => {
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/steps/${stepId}/story/${jobId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) setError('Job non trouvé.');
        else setError('Erreur lors du suivi du job.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setStatus(data.status);
      if (data.status === 'done') {
        setStory(data.result.story);
        setPrompt(data.result.prompt);
        setLoading(false);
      } else if (data.status === 'error') {
        setError(data.error || 'Erreur lors de la génération du récit.');
        setLoading(false);
      } else {
        // pending ou processing
        pollingRef.current = setTimeout(() => pollStatus(jobId), 2000);
      }
    } catch (e) {
      setError('Erreur réseau ou serveur pendant le suivi du job.');
      setLoading(false);
    }
  };

  // Regénérer = relancer la génération asynchrone (et effacer l'ancien récit)
  const regenerateStory = () => {
    if (pollingRef.current) clearTimeout(pollingRef.current);
    setStory(null);
    setPrompt(null);
    fetchStoryAsync();
  };

  // À adapter selon ton stockage JWT (AsyncStorage, SecureStore, etc.)
  const getJwtToken = async () => {
    // Exemple : return await AsyncStorage.getItem('jwt');
    return '';
  };

  return (
    <View style={styles.container}>
      {loading || status === 'pending' || status === 'processing' ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 40 }} />
          <Text style={{ marginTop: 24, fontSize: 16, color: '#555' }}>
            {status === 'pending' || status === 'processing'
              ? 'Génération du récit en cours...'
              : 'Chargement...'}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={regenerateStory} style={styles.retryButton}>
            <Fontawesome5 name="redo" size={18} color="#fff" />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Récit généré</Text>
          <Text style={styles.story}>{story}</Text>
          {/* <Text style={styles.subtitle}>Prompt utilisé</Text> */}
          {/* <Text style={styles.prompt}>{prompt}</Text> */}
          <TouchableOpacity onPress={regenerateStory} style={styles.regenerateButton}>
            <Fontawesome5 name="redo" size={18} color="#fff" />
            <Text style={styles.retryText}>Regénérer le récit</Text>
          </TouchableOpacity>
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
  regenerateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#28a745', padding: 10, borderRadius: 8, marginTop: 24, alignSelf: 'center' },
});
