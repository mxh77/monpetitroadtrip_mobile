import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { formatDateJJMMAA } from '../utils/dateUtils';
import { openInGoogleMaps, openWebsite } from '../utils/utils';
import { TriangleCornerTopRight } from '../components/shapes';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Importer les icônes

const Accommodations = ({ step, navigation, fetchStep }) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={styles.tabContent}>
      {step.accommodations.map((accommodation, index) => (
        <Card key={index} style={styles.card}>
          <Card.Title titleStyle={styles.cardTitle} title={accommodation.name} />
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Icon name="arrow-right" size={16} color="green" style={{ marginRight: 5 }} />
                <Text style={styles.itemDateTime}>
                  {new Date(accommodation.arrivalDateTime).toLocaleString('fr-FR', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC'
                  })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Icon name="arrow-right" size={16} color="red" style={{ marginHorizontal: 5 }} />
                <Text style={styles.itemDateTime}>
                  {new Date(accommodation.departureDateTime).toLocaleString('fr-FR', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC'
                  })}
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Content>
            <TouchableOpacity onPress={() => navigation.navigate('EditAccommodation', { step: step, accommodation, refresh: fetchStep })}>
              <Image
                source={accommodation.thumbnail ? { uri: accommodation.thumbnail.url } : require('../../assets/default-thumbnail.png')}
                style={styles.thumbnail}
              />
            </TouchableOpacity>
            <Text style={styles.infoText}>{accommodation.address}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button
                mode="contained"
                onPress={() => openWebsite(accommodation.website)}
                style={styles.mapButton}
              >
                Ouvrir Site Web
              </Button>
              <Button
                mode="contained"
                onPress={() => openInGoogleMaps(accommodation.address)}
                style={styles.mapButton}
              >
                Ouvrir dans Google Maps
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
    <TouchableOpacity
      style={styles.triangleButtonContainer}
      onPress={() => navigation.navigate('EditAccommodation', { step, accommodation: null, refresh: fetchStep })}
    >
      <TriangleCornerTopRight style={styles.triangleButton} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDateTime: {
    fontSize: 14,
    color: 'gray',
  },
  infoText: {
    marginBottom: 8,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  mapButton: {
    marginTop: 8,
  },
  triangleButtonContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  triangleButton: {
    width: 50,
    height: 50,
  },
});

export default Accommodations;