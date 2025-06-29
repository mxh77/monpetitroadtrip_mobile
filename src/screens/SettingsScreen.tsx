import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import config from '../config';

// Props de navigation
// Ajoutez 'Settings' dans RootStackParamList si besoin

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [algoliaSearchRadius, setAlgoliaSearchRadius] = useState<number>(50000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ systemPrompt, algoliaSearchRadius }),
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

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" /></View>
    );
  }

  return (
    <View style={styles.container}>
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
      <Text style={{ color: '#888', marginBottom: 8, fontSize: 13 }}>
        (Min: 1 000m, Max: 200 000m. Défaut: 50 000m)
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={saving ? 'Sauvegarde...' : 'Enregistrer'} onPress={saveSettings} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 80, marginBottom: 16, fontSize: 15 },
  error: { color: 'red', marginBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
