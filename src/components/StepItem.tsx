import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Badge } from 'react-native-paper';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Icon from 'react-native-vector-icons/FontAwesome5';
import rvIcon from '../../assets/icones/RV/rv_32.png';

interface StepItemProps {
  item: any;
  index: number;
  sortedSteps: any[];
  styles: any;
  getTravelInfoBackgroundColor: (note: string) => string;
  renderRightActions: (progress: any, dragX: any, stepId: string) => React.ReactNode;
  handleStepPress: (step: any) => void;
  loadedImagesRef: React.MutableRefObject<Set<string>>;
}

const StepItem = memo(({ 
  item, 
  index, 
  sortedSteps, 
  styles, 
  getTravelInfoBackgroundColor, 
  renderRightActions, 
  handleStepPress,
  loadedImagesRef 
}: StepItemProps) => {
  const step = item;
  const precomputed = step.precomputed || {};
  
  // Formatage des dates à la volée (pas de pré-calcul)
  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTime;
    }
  };

  // Fonction pour extraire l'URI de l'image
  const getImageUri = (thumbnail: any): string | null => {
    if (!thumbnail) return null;
    
    // Si c'est déjà une chaîne
    if (typeof thumbnail === 'string') {
      return thumbnail;
    }
    
    // Si c'est un objet avec une propriété uri
    if (typeof thumbnail === 'object' && thumbnail.uri) {
      return thumbnail.uri;
    }
    
    // Si c'est un objet avec une propriété url
    if (typeof thumbnail === 'object' && thumbnail.url) {
      return thumbnail.url;
    }
    
    return null;
  };

  // Fonction pour formater le temps de trajet avec unité
  const formatTravelTime = (travelTime: string | null | undefined) => {
    if (!travelTime || travelTime === 'Temps non calculé') {
      return 'Temps non calculé';
    }
    
    // Convertir en chaîne si ce n'est pas déjà le cas
    const travelTimeStr = String(travelTime);
    
    // Si le temps contient déjà des unités (h, min, etc.), le retourner tel quel
    if (travelTimeStr.includes('h') || travelTimeStr.includes('min') || travelTimeStr.includes('sec')) {
      return travelTimeStr;
    }
    
    // Sinon, ajouter les unités appropriées
    // Supposer que c'est en minutes si c'est un nombre
    const timeNumber = parseFloat(travelTimeStr);
    if (!isNaN(timeNumber)) {
      if (timeNumber >= 60) {
        const hours = Math.floor(timeNumber / 60);
        const minutes = Math.round(timeNumber % 60);
        return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
      } else {
        return `${Math.round(timeNumber)}min`;
      }
    }
    
    return travelTimeStr;
  };

  // Fonction pour formater la distance avec unité
  const formatDistance = (distance: string | null | undefined) => {
    if (!distance || distance === 'Distance non calculée') {
      return 'Distance non calculée';
    }
    
    // Convertir en chaîne si ce n'est pas déjà le cas
    const distanceStr = String(distance);
    
    // Si la distance contient déjà des unités (km, m), la retourner telle quelle
    if (distanceStr.includes('km') || distanceStr.includes('m') || distanceStr.includes('mi')) {
      return distanceStr;
    }
    
    // Sinon, ajouter l'unité km
    const distanceNumber = parseFloat(distanceStr);
    if (!isNaN(distanceNumber)) {
      if (distanceNumber >= 1) {
        return `${distanceNumber.toFixed(1)} km`;
      } else {
        return `${Math.round(distanceNumber * 1000)} m`;
      }
    }
    
    return distanceStr;
  };

  // Tracking des images chargées
  const handleImageLoad = (imageUri: string) => {
    if (imageUri && !loadedImagesRef.current.has(imageUri)) {
      loadedImagesRef.current.add(imageUri);
    }
  };

  return (
    <View key={step.id}>
      {/* Informations de trajet (seulement pour les étapes après la première) */}
      {index > 0 && (
        <View style={styles.travelInfoContainer}>
          <View style={styles.travelInfoLine} />
          <View style={[
            styles.travelInfo,
            { backgroundColor: getTravelInfoBackgroundColor(step.travelTimeNote) }
          ]}>
            <Image 
              source={rvIcon} 
              style={[styles.travelIcon, { width: 32, height: 32 }]} 
            />
            <Text style={styles.travelText}>
              {formatTravelTime(step.travelTimePreviousStep)}
            </Text>
            <Text style={styles.travelText}>
              {formatDistance(step.distancePreviousStep)}
            </Text>
          </View>
        </View>
      )}

      {/* Carte de l'étape */}
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, step.id)}
        rightThreshold={40}
      >
        <TouchableOpacity
          style={[
            styles.stepCard,
            precomputed.hasAlert && styles.stepCardAlert
          ]}
          onPress={() => handleStepPress(step)}
        >
          {/* Header avec couleur dynamique */}
          <View style={[
            styles.stepCardHeader,
            { backgroundColor: precomputed.stepColor || '#007BFF' }
          ]}>
            <View style={styles.stepHeaderLeft}>
              <View style={styles.stepIconContainer}>
                <Icon 
                  name={precomputed.stepIcon || 'map-marker-alt'} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View style={styles.stepHeaderInfo}>
                <Text style={styles.stepTitle} numberOfLines={1}>
                  {step.name}
                </Text>
                <Text style={styles.stepType}>
                  {precomputed.mainActivityType || step.type}
                </Text>
              </View>
            </View>
            
            <View style={styles.stepHeaderRight}>
              {precomputed.hasAlert && (
                <Badge style={styles.alertBadge}>!</Badge>
              )}
              {precomputed.activeCounts?.accommodations > 0 && (
                <Badge style={styles.accommodationBadge}>
                  {precomputed.activeCounts.accommodations}
                </Badge>
              )}
              {precomputed.activeCounts?.activities > 0 && (
                <Badge style={styles.activityBadge}>
                  {precomputed.activeCounts.activities}
                </Badge>
              )}
            </View>
          </View>

          {/* Contenu de la carte */}
          <View style={styles.stepCardContent}>
            {/* Thumbnail (si disponible) */}
            {(() => {
              const imageUri = getImageUri(step.thumbnail);
              return imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.stepThumbnail}
                  resizeMode="cover"
                  onLoad={() => handleImageLoad(imageUri)}
                  onError={(error) => {
                    console.warn('Erreur de chargement d\'image:', error.nativeEvent.error);
                  }}
                />
              ) : null;
            })()}

            {/* Dates */}
            <View style={styles.stepDatesContainer}>
              <View style={styles.stepDateRow}>
                <Icon name="play" size={12} color="#28a745" style={styles.stepDateIcon} />
                <Text style={styles.stepDateLabel}>Arrivée:</Text>
                <Text style={styles.stepDateTime}>
                  {formatDateTime(step.arrivalDateTime)}
                </Text>
              </View>
              <View style={styles.stepDateRow}>
                <Icon name="stop" size={12} color="#dc3545" style={styles.stepDateIcon} />
                <Text style={styles.stepDateLabel}>Départ:</Text>
                <Text style={styles.stepDateTime}>
                  {formatDateTime(step.departureDateTime)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
});

StepItem.displayName = 'StepItem';

export default StepItem;
