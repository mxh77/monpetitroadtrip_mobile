import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Card, Button, Divider } from 'react-native-paper';
import config from '../config';

const HikeSuggestionsScreen = ({ route, navigation }) => {
  const { idStep } = route.params;
  const [hikes, setHikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHikes = async () => {
      try {
        const URL = `${config.BACKEND_URL}/steps/${idStep}/hikes-suggestion`;
        console.log('Fetching hikes from URL:', URL);
        const response = await fetch(URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        const data = await response.json();
        console.log('Fetched hikes:', data);
        if (data.hikes) {
          setHikes(data.hikes);
        } else {
          console.error('La réponse ne contient pas de clé "hikes".');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des suggestions de randonnées :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHikes();
  }, [idStep]);

  const handleGenerateSummary = async (idTrail) => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/steps/trails/${idTrail}/reviews/summary`);
      const summary = await response.json();
      alert(`Synthèse des avis : ${summary}`);
    } catch (error) {
      console.error('Erreur lors de la génération de la synthèse des avis :', error);
    }
  };

  const handleSelectHike = (hike) => {
    navigation.navigate('EditActivity', { activity: hike });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des suggestions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {hikes.map((hike) => (
        <Card key={hike.id} style={styles.card}>
          <Image
            source={{
              uri: hike.thumbnail || 'https://via.placeholder.com/150',
            }}
            style={styles.thumbnail}
          />
          <Card.Title
            title={hike.name}
            titleStyle={styles.cardTitle}
            titleNumberOfLines={2} // Ensures the title wraps to a new line if it's too long
          />
          <Divider style={styles.divider} />
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.infoText}>🌟 Popularité : {hike.popularity.toFixed(1)}</Text>
              <Text style={styles.infoText}>⭐ Note : {hike.avgRating}/5</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.infoText}>📏 Longueur : {(hike.length / 1000).toFixed(2)} km</Text>
              <Text style={styles.infoText}>⏱️ Durée : {Math.ceil(hike.durationMinutes / 60)} h</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.infoText}>⛰️ Dénivelé : {hike.elevationGain.toFixed(1)} m</Text>
              <Text style={styles.infoText}>🛤️ Type : {hike.routeType}</Text>
            </View>
            <Text style={styles.description}>{hike.description}</Text>
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button
              mode="contained"
              onPress={() => handleGenerateSummary(hike.id)}
              style={styles.actionButton}
            >
              Synthèse des avis
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleSelectHike(hike)}
              style={styles.actionButton}
            >
              Sélectionner
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: 150,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#777',
    marginTop: 8,
    fontStyle: 'italic',
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  actionButton: {
    marginHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
  },
});

export default HikeSuggestionsScreen;