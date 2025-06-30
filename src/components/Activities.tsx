import config from '../config';
import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { formatDateJJMMAA } from '../utils/dateUtils';
import { openInGoogleMaps, openWebsite } from '../utils/utils';
import { TriangleCornerTopRight, TriangleCornerTopLeft } from './shapes';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Importer les icônes
import { Switch } from 'react-native-gesture-handler';

// Fonction utilitaire pour obtenir l'icône du type d'activité
const getActivityTypeIcon = (activityType?: string): string => {
  switch (activityType) {
    case 'Randonnée':
      return '🥾';
    case 'Courses':
      return '🛒';
    case 'Visite':
      return '🏛️';
    case 'Autre':
      return '📍';
    default:
      return '🎯';
  }
};


const Activities = ({ step, navigation, fetchStep, toggleActiveStatusActivity }) => {
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);

  // Trier les activités par active=true d'abord, puis par date croissante (startDateTime)
  const sortedActivities = [...step.activities].sort((a, b) => {
    // Tri 1er niveau : active=true d'abord
    if (a.active === b.active) {
      // Tri 2nd niveau : date début croissante
      return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
    }
    return b.active - a.active; // Les activités actives (true) viennent avant les inactives (false)
  });

  // Fonction pour gérer l'ajout classique d'une activité
  const handleAddActivityClassic = () => {
    setShowAddActivityModal(false);
    navigation.navigate('EditActivity', { step, activity: null, refresh: fetchStep });
  };

  // Fonction pour gérer l'ajout via langage naturel
  const handleAddActivityNaturalLanguage = () => {
    setShowAddActivityModal(false);
    navigation.navigate('AddActivityNaturalLanguage', {
      roadtripId: step.roadtripId,
      stepId: step.id,
      refresh: fetchStep, // Passer la fonction de rafraîchissement
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.tabContent}>
        {sortedActivities.map((activity, index) => (
          <Card
            key={index}
            style={[
              styles.card,
              !activity.active && styles.inactiveCard, // Appliquer une opacité faible si désactivé
            ]}
          >
            <Card.Title
              title={`${getActivityTypeIcon(activity.type)} ${activity.name}`}
              titleStyle={styles.cardTitle}
              right={() => (
                <Switch
                  value={activity.active}
                  onValueChange={() => toggleActiveStatusActivity(activity)}
                  style={styles.switch}
                />
              )}
            />
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
              
              {/* Affichage du type d'activité */}
              {activity.type && (
                <View style={{ marginTop: 8, paddingVertical: 4 }}>
                  <Text style={styles.activityType}>
                    Type: {activity.type}
                  </Text>
                </View>
              )}
            </Card.Content>
            <Card.Content>
              <TouchableOpacity
                onPress={() =>
                  activity.active &&
                  navigation.navigate('EditActivity', { step: step, activity, refresh: fetchStep })
                }
                disabled={!activity.active} // Désactiver si le toggle est off
              >
                <Image
                  source={
                    activity.thumbnail
                      ? { uri: activity.thumbnail.url }
                      : require('../../assets/default-thumbnail.png')
                  }
                  style={[
                    styles.thumbnail,
                    !activity.active && styles.disabledThumbnail, // Appliquer un style désactivé
                  ]}
                />
              </TouchableOpacity>
              <Text style={styles.infoText}>{activity.address}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Button
                  mode="contained"
                  onPress={() => openWebsite(activity.website)}
                  disabled={!activity.active} // Désactiver si le toggle est off
                  style={styles.mapButton}
                >
                  Ouvrir Site Web
                </Button>
                <Button
                  mode="contained"
                  onPress={() => openInGoogleMaps(activity.address)}
                  disabled={!activity.active} // Désactiver si le toggle est off
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
        onPress={() => setShowAddActivityModal(true)}
      >
        <TriangleCornerTopRight
          style={styles.triangleButton}
          onPress={() => setShowAddActivityModal(true)}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.triangleButtonContainerTopLeft}
        onPress={() => navigation.navigate('HikeSuggestions', { idStep: step.id })}
      >
        <TriangleCornerTopLeft style={styles.triangleButtonTopLeft} />
      </TouchableOpacity>
      
      {/* Modal de choix pour l'ajout d'activité */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddActivityModal}
        onRequestClose={() => setShowAddActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une activité</Text>
            <Text style={styles.modalSubtitle}>Comment souhaitez-vous ajouter votre activité ?</Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddActivityClassic}
            >
              <Icon name="edit" size={20} color="#007BFF" style={styles.modalButtonIcon} />
              <View style={styles.modalButtonTextContainer}>
                <Text style={styles.modalButtonText}>Ajout classique</Text>
                <Text style={styles.modalButtonSubtext}>Formulaire détaillé</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddActivityNaturalLanguage}
            >
              <Icon name="magic" size={20} color="#007BFF" style={styles.modalButtonIcon} />
              <View style={styles.modalButtonTextContainer}>
                <Text style={styles.modalButtonText}>Ajout via IA</Text>
                <Text style={styles.modalButtonSubtext}>Décrivez votre activité en langage naturel</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAddActivityModal(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  inactiveCard: {
    opacity: 0.5, // Appliquer une opacité faible pour les accommodations désactivées
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
  switch: {
    marginRight: 10, // Ajuste l'espacement à droite du Switch
  },
  disabledThumbnail: {
    opacity: 0.5, // Réduire l'opacité pour indiquer que l'image est désactivée
  },
  triangleButtonContainerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  triangleButtonTopLeft: {
    width: 50,
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalButtonIcon: {
    marginRight: 12,
  },
  modalButtonTextContainer: {
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  modalButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  modalCancelButton: {
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  modalCancelText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  activityType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default Activities;