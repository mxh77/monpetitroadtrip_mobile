import config from '../config';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, Alert, SectionList, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Modal } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { getTimeFromDate } from '../utils/dateUtils';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { Step } from '../../types';
import { useCompression } from '../utils/CompressionContext';
import { useImageCompression } from '../utils/imageCompression';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

type Props = StackScreenProps<RootStackParamList, 'EditStepInfo'>;

export default function EditStepInfoScreen({ route, navigation }: Props) {
  const { step, refresh } = route.params;
  console.log('Step ID:', step.id);
  const [isLoading, setIsLoading] = useState(false);
  const { setCompressionState } = useCompression();
  const imageCompressor = useImageCompression(setCompressionState);

  const [addressInput, setAddressInput] = useState(step.address || '');
  const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
  const [pickerDate, setPickerDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [thumbnail, setThumbnail] = useState(step.thumbnail ? { uri: step.thumbnail.url } : null);

  const [formState, setFormState] = useState<Step>({
    id: step.id || '',
    name: step.name || '',
    address: step.address || '',
    arrivalDateTime: step.arrivalDateTime ||'',
    departureDateTime: step.departureDateTime || '',
    notes: step.notes || '',
    thumbnail: step.thumbnail || null,
    roadtripId: step.roadtripId || '',
    type: step.type || '',
  });

  const [formArrivalDate, setFormArrivalDate] = useState<Date | null>(null);
  const [formArrivalTime, setFormArrivalTime] = useState<Date | null>(null);
  const [formDepartureDate, setFormDepartureDate] = useState<Date | null>(null);
  const [formDepartureTime, setFormDepartureTime] = useState<Date | null>(null);

  console.log('formState:', formState);

  const googlePlacesRef = useRef(null);

  const handleSave = async () => {
    setIsLoading(true);
    const isEdit = !!step.id;
    const url = isEdit ? `${config.BACKEND_URL}/steps/${step.id}` : `${config.BACKEND_URL}/steps`;
    const method = isEdit ? 'PUT' : 'POST';

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

    console.log('Méthode:', method);
    console.log('Payload:', JSON.stringify(formState));

    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
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
    } finally {
      setIsLoading(false); // Terminez le chargement
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={{ padding: 10, marginRight: 10 }}>
          <Fontawesome5 name="save" size={30} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave]);

  useEffect(() => {
       if (formState.arrivalDateTime) {
        setFormArrivalDate(parseISO(formState.arrivalDateTime));
        setFormArrivalTime(parseISO(formState.arrivalDateTime));
      }
      if (formState.departureDateTime) {
        setFormDepartureDate(parseISO(formState.departureDateTime));
        setFormDepartureTime(parseISO(formState.departureDateTime));
      }
    }, [formState.arrivalDateTime, formState.departureDateTime]);

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
      // Utiliser directement la date sélectionnée car elle représente déjà l'heure en UTC
      const utcDate = selectedDate;
      console.log('utcDate:', utcDate);


      if (type === 'arrivalDate') {
        const updatedDate = new Date(formState.arrivalDateTime || utcDate);
        updatedDate.setUTCFullYear(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        setFormArrivalDate(updatedDate);
        setFormState((prevState) => ({ ...prevState, arrivalDateTime: updatedDate.toISOString() }));
        }
      if (type === 'arrivalTime') {
        const updatedTime = new Date(formState.arrivalDateTime || utcDate);
        updatedTime.setUTCHours(utcDate.getUTCHours(), utcDate.getUTCMinutes());
        setFormArrivalTime(updatedTime);
        setFormState((prevState) => ({ ...prevState, arrivalDateTime: updatedTime.toISOString() }));
      }
      if (type === 'departureDate') {
        const updatedDate = new Date(formState.departureDateTime || utcDate);
        updatedDate.setUTCFullYear(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        setFormDepartureDate(updatedDate);
        setFormState((prevState) => ({ ...prevState, departureDateTime: updatedDate.toISOString() }));        
      }
      if (type === 'departureTime') {
        const updatedTime = new Date(formState.departureDateTime || utcDate);
        updatedTime.setUTCHours(utcDate.getUTCHours(), utcDate.getUTCMinutes());
        setFormDepartureTime(updatedTime);
        setFormState((prevState) => ({ ...prevState, departureDateTime: updatedTime.toISOString() }));
      }

    }
  };

  const openPicker = (type: string) => {
    let date;
    switch (type) {
      case 'arrivalDate':
        date = formArrivalDate || new Date();
        break;
      case 'arrivalTime':
        date = formArrivalTime || new Date();
        break;
      case 'departureDate':
        date = formDepartureDate || new Date();
        break;
      case 'departureTime':
        date = formDepartureTime || new Date();
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

  const renderInputField = (field: string) => {
    switch (field) {
      case 'stepName':
        return (
          <TextInput
            label="Nom de l'étape"
            value={formState.name}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, name: text }))}
            style={styles.input}
          />
        );
      case 'stepAddress':
        return (
          <View style={styles.input}>
            <GooglePlacesAutocomplete
              ref={googlePlacesRef}
              placeholder="Adresse"
              onPress={(data, details = null) => {
                console.log('Address selected:', data.description);
                setAddressInput(data.description);
              }}
              query={{
                key: GOOGLE_API_KEY,
                language: 'fr',
              }}
              textInputProps={{
                value: addressInput,
                onChangeText: (text) => {
                  console.log("onChangeText (text:", text, "addressInput:", addressInput, "formState.address:", formState.address, ")");
                  if (text !== "" || (text === "" && addressInput !== formState.address)) {
                    console.log('Setting addressInput to:', text, " / addressInput:", addressInput, " / formState.address:", formState.address, ")");
                    setAddressInput(text);
                  }
                },
              }}
              listViewDisplayed={false}
              fetchDetails={true}
              enablePoweredByContainer={false}
              styles={{
                textInputContainer: {
                  backgroundColor: 'rgba(0,0,0,0)',
                  borderTopWidth: 0,
                  borderBottomWidth: 0,
                },
                textInput: {
                  marginLeft: 0,
                  marginRight: 0,
                  height: 38,
                  color: '#5d5d5d',
                  fontSize: 16,
                },
                predefinedPlacesDescription: {
                  color: '#1faadb',
                },
              }}
              renderRightButton={() => (
                <TouchableOpacity onPress={() => {
                  setAddressInput('');
                }}>
                  <Icon name="times-circle" size={20} color="gray" style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            />
          </View>
        );
      case 'arrivalDateTime':
        return (
          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              <TouchableOpacity onPress={() => openPicker('arrivalDate')}>
                <View pointerEvents="none">
                  <TextInput
                    label="Date de d'arrivée"
                    value={formArrivalDate ? formatInTimeZone(formArrivalDate, 'UTC', 'dd/MM/yyyy') : ''}
                    style={styles.input}
                    editable={false} // Rend le champ non éditable
                  />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.rowItem}>
              <TouchableOpacity onPress={() => openPicker('arrivalTime')}>
                <View pointerEvents="none">
                  <TextInput
                    label="Heure d'arrivée"
                    value={formArrivalTime ? formatInTimeZone(formArrivalTime, 'UTC', 'HH:mm') : ''}
                    style={styles.input}
                    editable={false} // Rend le champ non éditable
                  />
                </View>
              </TouchableOpacity>

            </View>
          </View>
        );


      case 'departureDateTime':
        return (
          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              <TouchableOpacity onPress={() => openPicker('departureDate')}>
                <View pointerEvents="none">
                  <TextInput
                    label="Date de départ"
                    value={formDepartureDate ? formatInTimeZone(formDepartureDate, 'UTC', 'dd/MM/yyyy') : ''}
                    style={styles.input}
                    editable={false} // Rend le champ non éditable
                  />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.rowItem}>
              <TouchableOpacity onPress={() => openPicker('departureTime')}>
                <View pointerEvents="none">
                  <TextInput
                    label="Heure de départ"
                    value={formDepartureTime ? formatInTimeZone(formDepartureTime, 'UTC', 'HH:mm') : ''}
                    style={styles.input}
                    editable={false} // Rend le champ non éditable
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'notes':
        return (
          <TextInput
            label="Notes"
            value={formState.notes}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, notes: text }))}
            style={[styles.input, styles.notesInput]}
            multiline
            numberOfLines={4}
          />
        );
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
      <SectionList
        sections={[
          { title: 'Informations de l\'étape', data: ['stepName', 'stepAddress'] },
          { title: 'Dates et heures', data: ['arrivalDateTime', 'departureDateTime'] },
          { title: 'Notes', data: ['notes'] },
        ]}
        renderItem={({ item }) => <View key={item}>{renderInputField(item)}</View>}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
      />
      {showPicker.isVisible && (
        <DateTimePicker
          value={pickerDate}
          mode={showPicker.type.includes('Time') ? 'time' : 'date'}
          display="default"
          timeZoneName='UTC'
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
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
  input: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});