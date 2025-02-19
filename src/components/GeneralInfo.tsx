import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { formatDateJJMMAA } from '../utils/dateUtils';
import { openInGoogleMaps } from '../utils/utils';
import Icon from 'react-native-vector-icons/FontAwesome5';

const GeneralInfo = ({ step, navigation, fetchStep }) => {
  const formattedArrivalDateTime = step.arrivalDateTime ? formatDateJJMMAA(step.arrivalDateTime) : 'N/A';
  const formattedDepartureDateTime = step.departureDateTime ? formatDateJJMMAA(step.departureDateTime) : 'N/A';

  return (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Title titleStyle={styles.cardTitle} title={step.name} />
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Icon name="arrow-right" size={16} color="green" style={{ marginRight: 5 }} />
              <Text style={styles.itemDateTime}>{formattedArrivalDateTime}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Icon name="arrow-right" size={16} color="red" style={{ marginHorizontal: 5 }} />
              <Text style={styles.itemDateTime}>{formattedDepartureDateTime}</Text>
            </View>
          </View>
        </Card.Content>
        <Card.Content>
          <TouchableOpacity onPress={() => navigation.navigate('EditStepInfo', { step: step, refresh: fetchStep })}>
            <Image
              source={step.thumbnail ? { uri: step.thumbnail.url } : require('../../assets/default-thumbnail.png')}
              style={styles.thumbnail}
            />
          </TouchableOpacity>
          <Text style={styles.infoText}>{step.address}</Text>
        </Card.Content>
        <Card.Content>
          <Text style={styles.infoLabel}>Notes :</Text>
          <Text style={styles.infoValue}>{step.notes}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
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
  infoLabel: {
    fontWeight: 'bold',
    marginTop: 16,
  },
  infoValue: {
    marginTop: 8,
  },
});

export default GeneralInfo;