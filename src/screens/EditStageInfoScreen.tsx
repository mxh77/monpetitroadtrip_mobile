import config from '../config';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, Alert, SectionList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { format, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { getTimeFromDate } from '../utils/dateUtils';
import { handleSmartNavigation } from '../utils/utils';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

type Props = StackScreenProps<RootStackParamList, 'EditStageInfo'>;

export default function EditStageInfoScreen({ route, navigation }: Props) {
  const { stage, refresh, returnTo, returnToTab } = route.params;
  //console.log('Étape:', stage);
  console.log('Stage ID:', stage.id);

  const [addressInput, setAddressInput] = useState(stage.address || '');
  const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
  const [pickerDate, setPickerDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());

  const [formState, setFormState] = useState({
    title: stage.name || '',
    address: stage.address || '',
    arrivalDate: parseISO(stage.arrivalDateTime) || new Date(),
    arrivalTime: parseISO(stage.arrivalDateTime) || new Date(),
    departureDate: parseISO(stage.departureDateTime) || new Date(),
    departureTime: parseISO(stage.departureDateTime) || new Date(),
    notes: stage.notes || '',
  });

  console.log('formState:', formState);

  const googlePlacesRef = useRef(null);

  const handleSave = async () => {

    const isEdit = !!stage.id;
    const url = isEdit ? `${config.BACKEND_URL}/stages/${stage.id}` : `${config.BACKEND_URL}/stages`;
    const method = isEdit ? 'PUT' : 'POST';
    const payload = {
      name: formState.title,
      address: formState.address,
      arrivalDateTime: new Date(Date.UTC(
        formState.arrivalDate.getUTCFullYear(),
        formState.arrivalDate.getUTCMonth(),
        formState.arrivalDate.getUTCDate(),
        formState.arrivalTime.getUTCHours(),
        formState.arrivalTime.getUTCMinutes()
      )).toISOString(),
      departureDateTime: new Date(Date.UTC(
        formState.departureDate.getUTCFullYear(),
        formState.departureDate.getUTCMonth(),
        formState.departureDate.getUTCDate(),
        formState.departureTime.getUTCHours(),
        formState.departureTime.getUTCMinutes()
      )).toISOString(),
      notes: formState.notes,
    };

    console.log('Méthode:', method);
    console.log('Payload:', JSON.stringify(payload));

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
  }, [navigation,handleSave]);

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
      if (type === 'arrivalDate') setFormState((prevState) => ({ ...prevState, arrivalDate: newDate }));
      if (type === 'arrivalTime') setFormState((prevState) => ({ ...prevState, arrivalTime: newDate }));
      if (type === 'departureDate') setFormState((prevState) => ({ ...prevState, departureDate: newDate }));
      if (type === 'departureTime') setFormState((prevState) => ({ ...prevState, departureTime: newDate }));
    }
  };

  const openPicker = (type: string) => {
    let date;
    switch (type) {
      case 'arrivalDate':
        date = new Date(Date.UTC(
          formState.arrivalDate.getUTCFullYear(),
          formState.arrivalDate.getUTCMonth(),
          formState.arrivalDate.getUTCDate()
        ));
        break;
      case 'arrivalTime':
        date = new Date(Date.UTC(
          formState.arrivalTime.getUTCFullYear(),
          formState.arrivalTime.getUTCMonth(),
          formState.arrivalTime.getUTCDate(),
          formState.arrivalTime.getUTCHours(),
          formState.arrivalTime.getUTCMinutes()
        ));
        break;
      case 'departureDate':
        date = new Date(Date.UTC(
          formState.departureDate.getUTCFullYear(),
          formState.departureDate.getUTCMonth(),
          formState.departureDate.getUTCDate()
        ));
        break;
      case 'departureTime':
        date = new Date(Date.UTC(
          formState.departureTime.getUTCFullYear(),
          formState.departureTime.getUTCMonth(),
          formState.departureTime.getUTCDate(),
          formState.departureTime.getUTCHours(),
          formState.departureTime.getUTCMinutes()
        ));
        break;
      default:
        date = new Date();
    }
    setPickerDate(date);
    setTempDate(date);
    setShowPicker({ type, isVisible: true });
  };

  const renderInputField = (field: string) => {
    switch (field) {
      case 'stageTitle':
        return (
          <TextInput
            label="Nom de l'étape"
            value={formState.title}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, title: text }))}
            style={styles.input}
          />
        );
      case 'stageAddress':
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
      case 'arrivalDate':
        return (
          <TextInput
            label="Date d'arrivée"
            value={format(formState.arrivalDate, 'dd/MM/yyyy')}
            onFocus={() => openPicker('arrivalDate')}
            style={styles.input}
          />
        );
      case 'arrivalTime':
        return (
          <TextInput
            label="Heure d'arrivée"
            //Par défaut, afficher l'heure sans tenir compte du fuseau horaire
            value={getTimeFromDate(formState.arrivalTime)}
            onFocus={() => openPicker('arrivalTime')}
            style={styles.input}
          />
        );
      case 'departureDate':
        return (
          <TextInput
            label="Date de départ"
            value={format(formState.departureDate, 'dd/MM/yyyy')}
            onFocus={() => openPicker('departureDate')}
            style={styles.input}
          />
        );
      case 'departureTime':
        return (
          <TextInput
            label="Heure de départ"
            value={getTimeFromDate(formState.departureTime)}
            onFocus={() => openPicker('departureTime')}
            style={styles.input}
          />
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
      <SectionList
        sections={[
          { title: 'Informations de l\'étape', data: ['stageTitle', 'stageAddress'] },
          { title: 'Dates et heures', data: ['arrivalDate', 'arrivalTime', 'departureDate', 'departureTime'] },
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
  notesInput: {
    height: 100,
  },
  clearIcon: {
    marginRight: 10,
    marginTop: 10,
  },
});