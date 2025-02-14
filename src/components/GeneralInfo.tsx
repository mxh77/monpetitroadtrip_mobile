import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDateTimeUTC2Digits } from '../utils/dateUtils';

const GeneralInfo = ({ step, navigation, fetchStep }) => {
  const formattedArrivalDateTime = step.arrivalDateTime ? formatDateTimeUTC2Digits(step.arrivalDateTime) : 'N/A';
  const formattedDepartureDateTime = step.departureDateTime ? formatDateTimeUTC2Digits(step.departureDateTime) : 'N/A';

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.generalInfoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom de l'étape :</Text>
          <Text style={styles.infoValue}>{step.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Adresse :</Text>
          <Text style={styles.infoValue}>{step.address}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('EditStepInfo', { step: step, refresh: fetchStep })}>
          <Image
            source={step.thumbnail ? { uri: step.thumbnail.url } : require('../../assets/default-thumbnail.png')}
            style={styles.thumbnail}
          />
        </TouchableOpacity>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date et heure d'arrivée :</Text>
          <Text style={styles.infoValue}>{formattedArrivalDateTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date et heure de départ :</Text>
          <Text style={styles.infoValue}>{formattedDepartureDateTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Notes :</Text>
          <Text style={styles.infoValue}>{step.notes}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
  },
  generalInfoContainer: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
});

export default GeneralInfo;