import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SectionList, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Accommodation } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import FilesTab from '../components/FilesTab';

type Props = StackScreenProps<RootStackParamList, 'EditAccommodation'>;
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

export default function EditAccommodationScreen({ route, navigation }: Props) {
  const { step, accommodation, refresh } = route.params;
  const isEditing = !!accommodation;
  console.log('Accommodation:', accommodation);

  const [thumbnail, setThumbnail] = useState(accommodation?.thumbnail ? { uri: accommodation.thumbnail.url } : null);

  const [addressInput, setAddressInput] = useState(accommodation?.address || '');
  const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
  const [pickerDate, setPickerDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
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

  const [formConfirmationDate, setFormConfirmationDate] = useState(new Date());
  const [formArrivalDate, setFormArrivalDate] = useState(new Date());
  const [formArrivalTime, setFormArrivalTime] = useState(new Date());
  const [formDepartureDate, setFormDepartureDate] = useState(new Date());
  const [formDepartureTime, setFormDepartureTime] = useState(new Date());

  const googlePlacesRef = useRef(null);

  const handleSave = async () => {
    console.log('Accommodation ID:', accommodation?._id);
    const url = isEditing
      ? `https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}`
      : `https://mon-petit-roadtrip.vercel.app/roadtrips/${step.roadtripId}/steps/${step.id}/accommodations`;
    console.log('formState:', formState);

    const payload = {
      ...formState,
      confirmationDateTime: formConfirmationDate.toISOString(),
      arrivalDateTime: new Date(Date.UTC(
        formArrivalDate.getUTCFullYear(),
        formArrivalDate.getUTCMonth(),
        formArrivalDate.getUTCDate(),
        formArrivalTime.getUTCHours(),
        formArrivalTime.getUTCMinutes()
      )).toISOString(),
      departureDateTime: new Date(Date.UTC(
        formDepartureDate.getUTCFullYear(),
        formDepartureDate.getUTCMonth(),
        formDepartureDate.getUTCDate(),
        formDepartureTime.getUTCHours(),
        formDepartureTime.getUTCMinutes())
      ).toISOString()
    };

    // Préparez le formulaire multipart/form-data
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    if (formState.thumbnail && typeof formState.thumbnail.url === 'string') {
      formData.append('thumbnail', {
        uri: formState.thumbnail.url,
        name: 'thumbnail.jpg',
        type: 'image/jpeg',
      } as any);
    }

    console.log(isEditing ? 'PUT Payload :' : 'POST Payload :', payload);
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

        navigation.goBack();
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    }
  };

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
            const url = `https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}`;

            try {
              const response = await fetch(url, {
                method: 'DELETE',
              });

              if (response.ok) {
                console.log('Succès', 'L\'hébergement a été supprimé avec succès.');
                Alert.alert('Succès', 'L\'hébergement a été supprimé avec succès.');
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

  useEffect(() => {
    if (formState.confirmationDateTime) {
      setFormConfirmationDate(parseISO(formState.confirmationDateTime));
    }
    if (formState.arrivalDateTime) {
      setFormArrivalDate(parseISO(formState.arrivalDateTime));
      setFormArrivalTime(parseISO(formState.arrivalDateTime));
    }
    if (formState.departureDateTime) {
      setFormDepartureDate(parseISO(formState.departureDateTime));
      setFormDepartureTime(parseISO(formState.departureDateTime));
    }
  }, [formState.confirmationDateTime, formState.arrivalDateTime, formState.departureDateTime]);

  useEffect(() => {
    if (addressInput !== formState.address) {
      console.log('Updating formState.address ', formState.address, 'with addressInput:', addressInput);
      setFormState((prevState) => ({ ...prevState, address: addressInput }));
    }
  }, [addressInput, formState.address]);

  const handlePickerChange = (type: string, event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker({ type: '', isVisible: false });
      return;
    }
    setShowPicker({ type: '', isVisible: false });
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (type === 'confirmationDate') {
        setFormConfirmationDate(newDate);
      }
      if (type === 'arrivalDate') {
        setFormArrivalDate(newDate);
      }
      if (type === 'arrivalTime') {
        setFormArrivalTime(newDate);
      }
      if (type === 'departureDate') {
        setFormDepartureDate(newDate);
      }
      if (type === 'departureTime') {
        setFormDepartureTime(newDate);
      }
    }
  };

  const openPicker = (type: string) => {
    let date;
    switch (type) {
      case 'confirmationDate':
        console.log('formConfirmationDate:', formConfirmationDate);
        date = new Date(Date.UTC(
          formConfirmationDate.getUTCFullYear(),
          formConfirmationDate.getUTCMonth(),
          formConfirmationDate.getUTCDate()
        ));
        break;
      case 'arrivalDate':
        console.log('formArrivalDate:', formArrivalDate);
        date = new Date(Date.UTC(
          formArrivalDate.getUTCFullYear(),
          formArrivalDate.getUTCMonth(),
          formArrivalDate.getUTCDate()
        ));
        break;
      case 'arrivalTime':
        date = new Date(Date.UTC(
          formArrivalTime.getUTCFullYear(),
          formArrivalTime.getUTCMonth(),
          formArrivalTime.getUTCDate(),
          formArrivalTime.getUTCHours(),
          formArrivalTime.getUTCMinutes()
        ));
        break;
      case 'departureDate':
        date = new Date(Date.UTC(
          formDepartureDate.getUTCFullYear(),
          formDepartureDate.getUTCMonth(),
          formDepartureDate.getUTCDate()
        ));
        break;
      case 'departureTime':
        date = new Date(Date.UTC(
          formDepartureTime.getUTCFullYear(),
          formDepartureTime.getUTCMonth(),
          formDepartureTime.getUTCDate(),
          formDepartureTime.getUTCHours(),
          formDepartureTime.getUTCMinutes()
        ));
        break;
      default:
        date = new Date();
    }
    setPickerDate(date);
    setTempDate(date);
    setShowPicker({ type, isVisible: true });
  };

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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.canceled) {
        Alert.alert("Annulé", "Sélection du fichier annulée.");
      } else {
        Alert.alert("Fichier sélectionné", result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner un fichier.");
      console.error(error);
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result) {
        const { uri, name, mimeType } = result.assets[0];
        const newFile = {
          uri,
          name,
          type: mimeType || 'application/octet-stream',
        };
  
        const formData = new FormData();
        formData.append('documents', {
          uri: newFile.uri,
          name: newFile.name,
          type: newFile.type,
        } as any);
  
        const response = await fetch(`https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}/documents`, {
          method: 'PATCH',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
  
        if (response.ok) {
          const updatedAccommodation = await response.json();
          setFiles(updatedAccommodation.documents);
          Alert.alert('Succès', 'Le fichier a été ajouté avec succès.');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout du fichier.');
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner un fichier.');
      console.error(error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}/documents/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedAccommodation = await response.json();
        setFiles(updatedAccommodation.documents);
        Alert.alert('Succès', 'Le fichier a été supprimé avec succès.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du fichier.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du fichier.');
      console.error(error);
    }
  }
  
  useEffect(() => {
    console.log('useEffect called');
    if (accommodation && accommodation.documents) {
      setFiles(accommodation.documents);
    }
  }, [accommodation]);

  const renderScene = SceneMap({
    infos: () => <InfosAccommodationTab formState={formState} setFormState={setFormState} openPicker={openPicker} styles={styles} />,
    files: () => <FilesTab files={files} handleFileUpload={handleFileUpload} handleDeleteFile={handleDeleteFile} />,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
      {showPicker.isVisible && (
        <DateTimePicker
          value={pickerDate}
          mode={showPicker.type.includes('Time') ? 'time' : 'date'}
          display="default"
          timeZoneName='UTC'
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              console.log('Selected date:', selectedDate);
              handlePickerChange(showPicker.type, event, selectedDate);
            } else {
              setPickerDate(tempDate); // Reset to the original date if cancelled
            }
          }}
        />
      )}
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
  filesContainer: {
    marginVertical: 20,
  },
  fileItem: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
});