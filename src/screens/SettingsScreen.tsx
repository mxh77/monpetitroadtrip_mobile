import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import config from '../config';

// Props de navigation
// Ajoutez 'Settings' dans RootStackParamList si besoin

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [algoliaSearchRadius, setAlgoliaSearchRadius] = useState<number>(50000);
  const [dragSnapInterval, setDragSnapInterval] = useState<number>(15); // Pas de déplacement en minutes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ systemPrompt, algoliaSearchRadius, dragSnapInterval }),
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
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={saving ? 'Sauvegarde...' : 'Enregistrer'} onPress={saveSettings} disabled={saving} />
      </ScrollView>
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
});
