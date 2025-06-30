import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import AdvancedPlanning from '../components/AdvancedPlanning';
import { Step } from '../../types';

// Données de test pour le planning
const mockSteps: Step[] = [
  {
    id: '1',
    roadtripId: 'test-roadtrip',
    type: 'Stage',
    name: 'Paris',
    address: 'Paris, France',
    arrivalDateTime: '2025-07-01T14:00:00Z',
    departureDateTime: '2025-07-03T10:00:00Z',
    notes: 'Première étape',
    accommodations: [
      {
        _id: 'acc1',
        active: true,
        name: 'Hôtel des Invalides',
        address: '7ème arrondissement, Paris',
        arrivalDateTime: '2025-07-01T15:00:00Z',
        departureDateTime: '2025-07-03T11:00:00Z',
        notes: 'Hôtel avec vue sur les Invalides'
      }
    ],
    activities: [
      {
        _id: 'act1',
        active: true,
        name: 'Visite Tour Eiffel',
        address: 'Champ de Mars, Paris',
        startDateTime: '2025-07-01T16:00:00Z',
        endDateTime: '2025-07-01T18:00:00Z',
        notes: 'Visite guidée de la Tour Eiffel'
      },
      {
        _id: 'act2',
        active: true,
        name: 'Musée du Louvre',
        address: 'Rue de Rivoli, Paris',
        startDateTime: '2025-07-02T10:00:00Z',
        endDateTime: '2025-07-02T16:00:00Z',
        notes: 'Visite du musée du Louvre'
      }
    ]
  },
  {
    id: '2',
    roadtripId: 'test-roadtrip',
    type: 'Stop',
    name: 'Château de Fontainebleau',
    address: 'Fontainebleau, France',
    arrivalDateTime: '2025-07-03T14:00:00Z',
    departureDateTime: '2025-07-03T17:00:00Z',
    notes: 'Arrêt pour visiter le château'
  },
  {
    id: '3',
    roadtripId: 'test-roadtrip',
    type: 'Stage',
    name: 'Lyon',
    address: 'Lyon, France',
    arrivalDateTime: '2025-07-03T20:00:00Z',
    departureDateTime: '2025-07-05T09:00:00Z',
    notes: 'Découverte de Lyon',
    accommodations: [
      {
        _id: 'acc2',
        active: true,
        name: 'Hôtel Presqu\'île',
        address: 'Presqu\'île, Lyon',
        arrivalDateTime: '2025-07-03T21:00:00Z',
        departureDateTime: '2025-07-05T10:00:00Z',
        notes: 'Hôtel au centre de Lyon'
      }
    ],
    activities: [
      {
        _id: 'act3',
        active: true,
        name: 'Visite Vieux Lyon',
        address: 'Vieux Lyon, France',
        startDateTime: '2025-07-04T09:00:00Z',
        endDateTime: '2025-07-04T12:00:00Z',
        notes: 'Balade dans le Vieux Lyon'
      },
      {
        _id: 'act4',
        active: true,
        name: 'Parc de la Tête d\'Or',
        address: 'Parc de la Tête d\'Or, Lyon',
        startDateTime: '2025-07-04T14:00:00Z',
        endDateTime: '2025-07-04T17:00:00Z',
        notes: 'Promenade dans le parc'
      }
    ]
  }
];

const TestAdvancedPlanningScreen: React.FC = () => {
  const handleRefresh = () => {
    console.log('Test: Refresh called');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test du Planning Avancé</Text>
      <AdvancedPlanning
        roadtripId="test-roadtrip"
        steps={mockSteps}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});

export default TestAdvancedPlanningScreen;
