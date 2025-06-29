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
        body: JSON.stringify({ systemPrompt }),
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
