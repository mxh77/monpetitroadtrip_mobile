import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { CreateRoadtripAIScreenProps } from '../../types';

const CreateRoadtripAI: React.FC<CreateRoadtripAIScreenProps> = ({ navigation, route }) => {
  // États pour les champs principaux (à compléter selon besoins réels)
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [budget, setBudget] = useState('');
  const [travelers, setTravelers] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  // Exemples pour l'assistant IA
  const examples = [
    "Un roadtrip de 7 jours en famille, départ de Lyon, budget 1500€, nature et gastronomie",
    "Voyage entre amis, Paris à Marseille, 5 jours, camping, plages et randonnées",
    "Découverte culturelle en couple, Bordeaux, hôtels, musées et bons restaurants"
  ];

  const handleCreateRoadtrip = () => {
    setLoading(true);
    // TODO: Appel API IA
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Icon name="magic" size={24} color="#007BFF" />
          <Text style={styles.title}>Créer un roadtrip via l'IA</Text>
        </View>
        <Text style={styles.subtitle}>
          Décrivez votre roadtrip idéal ou complétez les critères ci-dessous, l'IA s'occupe du reste !
        </Text>
        {/* Section Configuration Initiale */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Point de départ</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Lyon, France"
            value={startLocation}
            onChangeText={setStartLocation}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Destination (optionnelle)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Marseille, France"
            value={destination}
            onChangeText={setDestination}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dates ou durée</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: 12/08/2025 au 19/08/2025 ou 7 jours"
            value={dates}
            onChangeText={setDates}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Budget</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: 1500€"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre de voyageurs</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: 2 adultes, 2 enfants"
            value={travelers}
            onChangeText={setTravelers}
          />
        </View>
        {/* Section IA Interactive */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Décrivez votre roadtrip idéal :</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="Ex: Un roadtrip nature, plages, randonnées, hébergements insolites..."
            value={prompt}
            onChangeText={setPrompt}
            textAlignVertical="top"
          />
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
            onPress={handleCreateRoadtrip}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Icon name="magic" size={16} color="white" style={styles.buttonIcon} />
                <Text style={styles.createButtonText}>Créer mon roadtrip</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
    minHeight: 48,
    backgroundColor: '#fafafa',
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

export default CreateRoadtripAI;
