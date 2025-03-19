import config from '../config';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, SectionList, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Accommodation } from '../../types';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { formatDateTimeUTC2Digits, formatDateJJMMAA, getTimeFromDate, formatTimeHHMM } from '../utils/dateUtils';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { format, parseISO, set } from 'date-fns';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import InfosAccommodationTab from '../components/InfosAccommodationTab';
// import FilesTab from '../components/FilesTab';
// import FilesTabAccommodation from '../components/FilesTabAccommodation';
import FilesTabEntity from '../components/FilesTabEntity';

type Props = StackScreenProps<RootStackParamList, 'EditAccommodation'>;
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

export default function EditAccommodationScreen({ route, navigation }: Props) {
  const { step, accommodation, refresh } = route.params;
  const isEditing = !!accommodation;
  // console.log('EditAccommodationScreen', step);
  const [isLoading, setIsLoading] = useState(false);

  const [thumbnail, setThumbnail] = useState(accommodation?.thumbnail ? { uri: accommodation.thumbnail.url } : null);
  const [files, setFiles] = useState<any[]>([]);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'infos', title: 'Infos' },
    { key: 'files', title: 'Fichiers' },
  ]);

  const [formState, setFormState] = useState<Accommodation>({
    _id: accommodation?._id || '',
    name: accommodation?.name || '',
    address: accommodation?.address || '',
    website: accommodation?.website || '',
    phone: accommodation?.phone || '',
    email: accommodation?.email || '',
    reservationNumber: accommodation?.reservationNumber || '',
    confirmationDateTime: accommodation?.confirmationDateTime || '',
    arrivalDateTime: accommodation?.arrivalDateTime || '',
    departureDateTime: accommodation?.departureDateTime || '',
    nights: accommodation?.nights || 0,
    price: accommodation?.price || '0',
    notes: accommodation?.notes || '',
    thumbnail: accommodation?.thumbnail || null,
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
    console.log('Accommodation ID:', accommodation?._id);
    const url = isEditing
      ? `${config.BACKEND_URL}/accommodations/${accommodation._id}`
      : `${config.BACKEND_URL}/roadtrips/${step.roadtripId}/steps/${step.id}/accommodations`;

    // console.log('formState:', formState);

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
        // Alert.alert('Succès', 'Les informations ont été sauvegardées avec succès.');
        if (refresh) {
          refresh();
        }

        navigation.goBack();
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!accommodation?._id) return;

    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cet hébergement ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const url = `${config.BACKEND_URL}/accommodations/${accommodation._id}`;

            try {
              const response = await fetch(url, {
                method: 'DELETE',
              });

              if (response.ok) {
                console.log('Succès', 'L\'hébergement a été supprimé avec succès.');
                // Alert.alert('Succès', 'L\'hébergement a été supprimé avec succès.');
                if (refresh) {
                  refresh();
                }

                navigation.goBack();
              } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    console.log('useEffect Navigation, handleSave, handleDelete');
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {isEditing && (
            <TouchableOpacity onPress={handleDelete} style={{ padding: 10, marginRight: 10 }}>
              <Fontawesome5 name="trash-alt" size={30} color="red" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={{ padding: 10, marginRight: 10 }}>
            <Fontawesome5 name="save" size={30} color="black" />
          </TouchableOpacity>
        </View>
      ),
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
        setThumbnail({ uri: pickerResult.assets[0].uri });
        setFormState((prevState) => ({ ...prevState, thumbnail: { url: pickerResult.assets[0].uri, type: 'image', name: 'thumbnail', fileId: '', createdAt: '' } }));
      }
    }
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'infos':
        return <InfosAccommodationTab formState={formState} updateFormState={updateFormState} step={step} />;
      case 'files':
        // return <FilesTab entityType="accommodations" entity={accommodation} files={files} setFiles={setFiles} />;
        // return <FilesTabAccommodation accommodation={accommodation} files={files} setFiles={setFiles} />;
        return <FilesTabEntity entityType="accommodations" entity={accommodation} files={files} setFiles={setFiles} />;
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

});