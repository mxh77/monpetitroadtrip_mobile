import config from '../config';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, Alert, SectionList, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Modal, ScrollView, Animated, FlatList, Keyboard } from 'react-native';
import { Appbar, TextInput, Button, Card, Title, Paragraph, List, useTheme, Portal, Provider as PaperProvider } from 'react-native-paper';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { getTimeFromDate } from '../utils/dateUtils';
import { handleSmartNavigation } from '../utils/utils';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { Step } from '../../types';
import { useCompression } from '../utils/CompressionContext';
import { useImageCompression } from '../utils/imageCompression';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types'; // Ajustez le chemin si nécessaire
import DateTimePicker from '@react-native-community/datetimepicker';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

type Props = StackScreenProps<RootStackParamList, 'EditStepInfo'>;

export default function EditStepInfoScreen({ route, navigation }: Props) {
  const { step, refresh, returnTo, returnToTab } = route.params;
  console.log('Step ID:', step.id);
  const [isLoading, setIsLoading] = useState(false);
  const { setCompressionState } = useCompression();
  const imageCompressor = useImageCompression(setCompressionState);

  const [addressInput, setAddressInput] = useState(step.address || '');
  const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
  const [pickerDate, setPickerDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [thumbnail, setThumbnail] = useState(step.thumbnail ? { uri: step.thumbnail.url } : null);
  
  // États pour les suggestions d'adresse
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  // États pour le positionnement de la liste d'adresses
  const [addressInputLayout, setAddressInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Animations pour le feedback visuel
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
  const addressInputContainerRef = useRef<View>(null);

  // Fonction pour obtenir les suggestions
  const fetchSuggestions = async (input) => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&language=fr`
      );
      const data = await response.json();
      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Animation d'entrée
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animation de feedback pour la sauvegarde
  const animateSaveButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSave = async () => {
    animateSaveButton();
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
        Alert.alert(
          '✅ Succès',
          'Les informations de votre étape ont été sauvegardées avec succès !',
          [{ text: 'OK', style: 'default' }]
        );
        if (refresh) {
          refresh();
        }

        handleSmartNavigation(navigation, returnTo, returnToTab);
      } else {
        Alert.alert(
          '❌ Erreur',
          'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert(
        '❌ Erreur',
        'Une erreur de connexion est survenue. Vérifiez votre connexion internet et réessayez.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false); // Terminez le chargement
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Fontawesome5 name="save" size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.saveButtonText}>Sauver</Text>
          </View>
        </TouchableOpacity>
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
          <Card style={styles.fieldCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.fieldHeader}>
                <Icon name="map-marker-alt" size={20} color="#4A90E2" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>Nom de l'étape</Text>
              </View>
              <TextInput
                value={formState.name}
                onChangeText={(text) => setFormState((prevState) => ({ ...prevState, name: text }))}
                style={styles.modernInput}
                mode="outlined"
                placeholder="Ex: Visite du château de Versailles"
                outlineColor="#E8E8E8"
                activeOutlineColor="#4A90E2"
                theme={{
                  colors: {
                    primary: '#4A90E2',
                    outline: '#E8E8E8',
                  }
                }}
              />
            </Card.Content>
          </Card>
        );
      case 'stepAddress':
        return (
          <Card style={styles.fieldCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.fieldHeader}>
                <Icon name="map-pin" size={20} color="#4A90E2" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>Adresse</Text>
              </View>
              <View 
                ref={addressInputContainerRef}
                style={styles.addressContainer}
              >
                <TextInput
                  value={addressInput}
                  onChangeText={(text) => {
                    setAddressInput(text);
                    setFormState((prevState) => ({ ...prevState, address: text }));
                    fetchSuggestions(text);
                  }}
                  onFocus={() => {
                    // Mesurer la position du champ pour positionner la liste
                    addressInputContainerRef.current?.measureInWindow((x, y, width, height) => {
                      setAddressInputLayout({ x, y, width, height });
                    });
                    // Réafficher les suggestions si elles existent
                    if (addressInput.length >= 2) {
                      fetchSuggestions(addressInput);
                    }
                  }}
                  onBlur={() => {
                    // On utilise un petit délai pour permettre au clic sur une suggestion d'être enregistré
                    setTimeout(() => {
                      if (showSuggestions) {
                        setShowSuggestions(false);
                      }
                    }, 200);
                  }}
                  style={styles.modernInput}
                  mode="outlined"
                  placeholder="Rechercher une adresse..."
                  outlineColor="#E8E8E8"
                  activeOutlineColor="#4A90E2"
                  right={
                    addressInput.length > 0 ? (
                      <TextInput.Icon 
                        icon="close-circle" 
                        onPress={() => {
                          setAddressInput('');
                          setFormState((prevState) => ({ ...prevState, address: '' }));
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                      />
                    ) : null
                  }
                  theme={{
                    colors: {
                      primary: '#4A90E2',
                      outline: '#E8E8E8',
                    }
                  }}
                />
                
                {/* Liste des suggestions via Portal */}
                {showSuggestions && suggestions.length > 0 && (
                  <Portal>
                    <View 
                      style={[
                        styles.suggestionsContainer,
                        {
                          top: addressInputLayout.y + addressInputLayout.height,
                          left: addressInputLayout.x,
                          width: addressInputLayout.width,
                        }
                      ]}
                    >
                      <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => {
                              setAddressInput(item.description);
                              setFormState((prevState) => ({ ...prevState, address: item.description }));
                              setShowSuggestions(false);
                              setSuggestions([]);
                            }}
                          >
                            <Icon name="map-marker-alt" size={14} color="#666" style={styles.suggestionIcon} />
                            <Text style={styles.suggestionText} numberOfLines={2}>
                              {item.description}
                            </Text>
                          </TouchableOpacity>
                        )}
                        style={styles.suggestionsList}
                        keyboardShouldPersistTaps="always"
                      />
                    </View>
                  </Portal>
                )}
              </View>
            </Card.Content>
          </Card>
        );
      case 'arrivalDateTime':
        return (
          <Card style={styles.dateTimeCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.fieldHeader}>
                <Icon name="sign-in-alt" size={20} color="#27AE60" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>Arrivée</Text>
              </View>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <TouchableOpacity 
                    onPress={() => openPicker('arrivalDate')}
                    style={[styles.dateTimeButton, formArrivalDate && styles.dateTimeButtonActive]}
                  >
                    <Text style={styles.dateTimeLabel}>Date</Text>
                    <Text style={[
                      styles.dateTimeValue, 
                      !formArrivalDate && styles.dateTimeValueEmpty
                    ]}>
                      {formArrivalDate ? formatInTimeZone(formArrivalDate, 'UTC', 'dd/MM/yyyy') : 'Sélectionner'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateTimeItem}>
                  <TouchableOpacity 
                    onPress={() => openPicker('arrivalTime')}
                    style={[styles.dateTimeButton, formArrivalTime && styles.dateTimeButtonActive]}
                  >
                    <Text style={styles.dateTimeLabel}>Heure</Text>
                    <Text style={[
                      styles.dateTimeValue, 
                      !formArrivalTime && styles.dateTimeValueEmpty
                    ]}>
                      {formArrivalTime ? formatInTimeZone(formArrivalTime, 'UTC', 'HH:mm') : 'Sélectionner'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Content>
          </Card>
        );

      case 'departureDateTime':
        return (
          <Card style={styles.dateTimeCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.fieldHeader}>
                <Icon name="sign-out-alt" size={20} color="#E74C3C" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>Départ</Text>
              </View>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <TouchableOpacity 
                    onPress={() => openPicker('departureDate')}
                    style={[styles.dateTimeButton, formDepartureDate && styles.dateTimeButtonActive]}
                  >
                    <Text style={styles.dateTimeLabel}>Date</Text>
                    <Text style={[
                      styles.dateTimeValue, 
                      !formDepartureDate && styles.dateTimeValueEmpty
                    ]}>
                      {formDepartureDate ? formatInTimeZone(formDepartureDate, 'UTC', 'dd/MM/yyyy') : 'Sélectionner'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateTimeItem}>
                  <TouchableOpacity 
                    onPress={() => openPicker('departureTime')}
                    style={[styles.dateTimeButton, formDepartureTime && styles.dateTimeButtonActive]}
                  >
                    <Text style={styles.dateTimeLabel}>Heure</Text>
                    <Text style={[
                      styles.dateTimeValue, 
                      !formDepartureTime && styles.dateTimeValueEmpty
                    ]}>
                      {formDepartureTime ? formatInTimeZone(formDepartureTime, 'UTC', 'HH:mm') : 'Sélectionner'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Content>
          </Card>
        );
      case 'notes':
        return (
          <Card style={styles.fieldCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.fieldHeader}>
                <Icon name="sticky-note" size={20} color="#9B59B6" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>Notes</Text>
              </View>
              <TextInput
                value={formState.notes}
                onChangeText={(text) => setFormState((prevState) => ({ ...prevState, notes: text }))}
                style={[styles.modernInput, styles.notesContainer]}
                mode="outlined"
                placeholder="Ajoutez vos notes, remarques ou informations importantes..."
                multiline
                numberOfLines={5}
                outlineColor="#E8E8E8"
                activeOutlineColor="#9B59B6"
                theme={{
                  colors: {
                    primary: '#9B59B6',
                    outline: '#E8E8E8',
                  }
                }}
              />
            </Card.Content>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    const data = [
      { type: 'thumbnail' },
      { type: 'sectionTitle', title: '📍 Informations générales' },
      { type: 'field', field: 'stepName' },
      { type: 'field', field: 'stepAddress' },
      { type: 'sectionTitle', title: '🕒 Planification' },
      { type: 'field', field: 'arrivalDateTime' },
      { type: 'field', field: 'departureDateTime' },
      { type: 'sectionTitle', title: '📝 Notes & Remarques' },
      { type: 'field', field: 'notes' },
      { type: 'spacer' },
    ];

    const renderItem = ({ item }: { item: any }) => {
      switch (item.type) {
        case 'thumbnail':
          return (
            <View style={styles.thumbnailContainer}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <Animated.View style={[styles.thumbnailCard, { transform: [{ scale: scaleAnim }] }]}>
                  <Image
                    source={thumbnail ? { uri: thumbnail.uri } : require('../../assets/default-thumbnail.png')}
                    style={styles.thumbnail}
                  />
                  <View style={styles.thumbnailOverlay}>
                    <Icon name="camera" size={16} color="white" />
                    <Text style={styles.thumbnailOverlayText}>
                      {thumbnail ? 'Modifier la photo' : 'Ajouter une photo'}
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          );
        case 'sectionTitle':
          return <Text style={styles.sectionTitle}>{item.title}</Text>;
        case 'field':
          return renderInputField(item.field);
        case 'spacer':
          return <View style={{ height: 50 }} />;
        default:
          return null;
      }
    };

    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={{ flex: 1, backgroundColor: '#F5F7FA' }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      />
    );
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
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={{ color: 'white', marginTop: 16, fontSize: 16, fontWeight: '600' }}>
            Sauvegarde en cours...
          </Text>
        </View>
      </Modal>
      
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            if (showSuggestions) {
              setShowSuggestions(false);
              setSuggestions([]);
            }
          }}
        >
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
      
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
    padding: 16,
    paddingTop: 0, // Réduire le padding top pour FlatList
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#2C3E50",
    marginTop: 8,
    paddingHorizontal: 0, // S'assurer que le padding est cohérent
  },
  // Styles modernes pour les cartes
  fieldCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    overflow: 'visible',
  },
  cardContent: {
    padding: 16,
    overflow: 'visible',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldIcon: {
    marginRight: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  modernInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  addressContainer: {
    position: 'relative',
    zIndex: 999999,
    // Ajouter de l'espace en bas pour la liste de suggestions
    marginBottom: 10,
    overflow: 'visible',
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1000000,
  },
  // Styles pour les dates/heures modernisés
  dateTimeCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateTimeItem: {
    flex: 1,
  },
  dateTimeButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    minHeight: 56,
    justifyContent: 'center',
  },
  dateTimeButtonActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#EBF4FF',
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  dateTimeValueEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  // Thumbnail modernisé
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  thumbnailCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  thumbnail: {
    width: 200,
    height: 120,
    borderRadius: 16,
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailOverlayText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  // Styles pour les notes
  notesContainer: {
    minHeight: 120,
  },
  // Anciens styles conservés pour compatibilité
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Style pour le bouton de sauvegarde dans le header
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
  // Styles pour les suggestions Google Places
  suggestionsContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 1000000,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: 12,
    color: '#4A90E2',
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
});