import config from '../config';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Activity, ActivityType } from '../../types';
import { formatDateTimeUTC2Digits, formatDateJJMMAA, getTimeFromDate, formatTimeHHMM } from '../utils/dateUtils';
import { handleSmartNavigation } from '../utils/utils';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import InfosActivityTab from '../components/InfosActivityTab';
import FilesTabEntity from '../components/FilesTabEntity';
import PhotosTabEntity from '../components/PhotosTabEntity';
import { useCompression } from '../utils/CompressionContext';
import { useImageCompression } from '../utils/imageCompression';

type Props = StackScreenProps<RootStackParamList, 'EditActivity'>;

export default function EditActivityScreen({ route, navigation }: Props) {
  const { step, activity, refresh, returnTo, returnToTab } = route.params;
  const isEditing = !!activity;
  // console.log('Activity:', activity);
  const [isLoading, setIsLoading] = useState(false);
  const { setCompressionState } = useCompression();
  const imageCompressor = useImageCompression(setCompressionState);

  const [thumbnail, setThumbnail] = useState(activity?.thumbnail ? { uri: activity.thumbnail.url } : null);
  const [files, setFiles] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'infos', title: 'Infos' },
    { key: 'files', title: 'Fichiers' },
    { key: 'photos', title: 'Photos' },
  ]);

  const [formState, setFormState] = useState<Activity>({
    _id: activity?._id || '',
    name: activity?.name || '',
    address: activity?.address || '',
    type: activity?.type || 'Randonnée',
    website: activity?.website || '',
    phone: activity?.phone || '',
    email: activity?.email || '',
    reservationNumber: activity?.reservationNumber || '',
    confirmationDateTime: activity?.confirmationDateTime || '',
    startDateTime: activity?.startDateTime || '',
    endDateTime: activity?.endDateTime || '',
    price: activity?.price || '0',
    currency: activity?.currency || 'EUR',
    notes: activity?.notes || '',
    thumbnail: activity?.thumbnail || null,
    active: activity?.active || false, // Added the missing 'active' property
    algoliaId: activity?.algoliaId || '', // Ajout du champ pour la randonnée associée
  });

  const updateFormState = useCallback((newState) => {
    console.log("Mise à jour de l'état dans le parent avec :", newState);
    setFormState((prevState) => {
      const updatedState = { ...prevState, ...newState };
      console.log("État mis à jour dans le parent :", updatedState);
      return updatedState;
    });
  }, []);

  const handleSave = async () => {
    if (!formState.address) {
      Alert.alert('Erreur', 'L\'adresse est obligatoire.');
      return;
    }

    setIsLoading(true);

    console.log('Activity ID:', activity?._id);
    const url = isEditing
      ? `${config.BACKEND_URL}/activities/${activity._id}`
      : `${config.BACKEND_URL}/roadtrips/${step.roadtripId}/steps/${step.id}/activities`;
    console.log('formState:', formState);

    // Préparez le formulaire multipart/form-data
    const formData = new FormData();
    formData.append('data', JSON.stringify(formState));

    if (formState.thumbnail && typeof formState.thumbnail.url === 'string') {
      formData.append('thumbnail', {
        uri: formState.thumbnail.url,
        name: 'thumbnail.jpg',
        type: 'image/jpeg',
      } as any);
    }

    console.log(isEditing ? 'PUT Payload :' : 'POST Payload :', formState);
    console.log(isEditing ? 'PUT Data :' : 'POST Data :', formData);

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
      });

      if (response.ok) {
        const updatedData = await response.json();
        console.log('Succès', 'Les informations ont été sauvegardées avec succès.');
        Alert.alert('Succès', 'Les informations ont été sauvegardées avec succès.');
        if (refresh) {
          refresh();
        }

        handleSmartNavigation(navigation, returnTo, returnToTab);
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsLoading(false); // Terminez le chargement
    }
  };

  const handleDelete = async () => {
    if (!activity?._id) return;

    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette activité ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true); // Start loading
            const url = `${config.BACKEND_URL}/activities/${activity._id}`;

            try {
              const response = await fetch(url, {
                method: 'DELETE',
              });

              if (response.ok) {
                console.log('Succès', 'L\'activité a été supprimée avec succès.');
                Alert.alert('Succès', 'L\'activité a été supprimée avec succès.');
                if (refresh) {
                  refresh();
                }

                handleSmartNavigation(navigation, returnTo, returnToTab);
              } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
            } finally {
              setIsLoading(false); // End loading
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    console.log('useEffect called');
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {isEditing && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Fontawesome5 name="trash-alt" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.deleteButtonText}>Supprimer</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Fontawesome5 name="save" size={16} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Sauver</Text>
            </View>
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowOpacity: 0.1,
      },
      headerTitleStyle: {
        color: '#2C3E50',
        fontWeight: '600',
        fontSize: 18,
      },
    });
  }, [navigation, handleSave, handleDelete]);

  const pickImage = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (result.granted === false) {
      alert('Permission to access gallery is required!');
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      if (pickerResult.assets && pickerResult.assets.length > 0) {
        // Compresser l'image thumbnail
        const compressedImage = await imageCompressor.compressImage({
          uri: pickerResult.assets[0].uri,
          name: 'thumbnail.jpg',
          mimeType: 'image/jpeg'
        });
        
        setThumbnail({ uri: compressedImage.uri });
        setFormState((prevState) => ({ 
          ...prevState, 
          thumbnail: { 
            url: compressedImage.uri, 
            type: 'image', 
            name: 'thumbnail', 
            fileId: '', 
            createdAt: '' 
          } 
        }));
      }
    }
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'infos':
        return <InfosActivityTab formState={formState} updateFormState={updateFormState} step={step} />;
      case 'files':
        return <FilesTabEntity entityType="activities" entity={activity} files={files} setFiles={setFiles} />;
      case 'photos':
        return <PhotosTabEntity entityType="activities" entity={activity} photos={photos} setPhotos={setPhotos} />;
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Modal
        transparent={true}
        animationType="fade"
        visible={isLoading}
        onRequestClose={() => { }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      </Modal>
      <View style={styles.thumbnailContainer}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={thumbnail ? { uri: thumbnail.uri } : require('../../assets/default-thumbnail.png')}
            style={styles.thumbnail}
          />
        </TouchableOpacity>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: 0, height: 0 }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowItem: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    flex: 1,
    marginBottom: 10,
    padding: 5,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 100,
  },
  clearIcon: {
    marginRight: 10,
    marginTop: 10,
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  thumbnail: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  changeThumbnailText: {
    marginTop: 10,
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Styles pour les boutons du header
  saveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});