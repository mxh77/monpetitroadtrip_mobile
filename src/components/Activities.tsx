import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { formatDateJJMMAA } from '../utils/dateUtils';
import { openInGoogleMaps, openWebsite } from '../utils/utils';
import { TriangleCornerTopRight } from './shapes';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Importer les icônes

const Activities = ({ step, navigation, fetchStep }) => {
  // Trier les activités par date croissante (startDateTime)
  const sortedActivities = step.activities.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.tabContent}>
        {sortedActivities.map((activity, index) => (
          <Card key={index} style={styles.card}>
            <Card.Title titleStyle={styles.cardTitle} title={activity.name} />
            <Card.Content>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Icon name="arrow-right" size={16} color="green" style={{ marginRight: 5 }} />
                  <Text style={styles.itemDateTime}>
                    {new Date(activity.startDateTime).toLocaleString('fr-FR', {
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
                    {new Date(activity.endDateTime).toLocaleString('fr-FR', {
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
              <TouchableOpacity onPress={() => navigation.navigate('EditActivity', { step: null, activity, refresh: fetchStep })}>
                <Image
                  source={activity.thumbnail ? { uri: activity.thumbnail.url } : require('../../assets/default-thumbnail.png')}
                  style={styles.thumbnail}
                />
              </TouchableOpacity>
              <Text style={styles.infoText}>{activity.address}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Button
                  mode="contained"
                  onPress={() => openWebsite(activity.website)}
                  style={styles.mapButton}
                >
                  Ouvrir Site Web
                </Button>
                <Button
                  mode="contained"
                  onPress={() => openInGoogleMaps(activity.address)}
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
        onPress={() => navigation.navigate('EditActivity', { step, activity: null, refresh: fetchStep })}
      >
        <TriangleCornerTopRight style={styles.triangleButton} />
      </TouchableOpacity>
    </View>
  );
};

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

export default Activities;