import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, Platform, Keyboard, Linking } from 'react-native';
import { TextInput, Card, Portal, Button } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { newDateUTC } from '../utils/dateUtils';
import { Dropdown } from 'react-native-element-dropdown';
import { ACTIVITY_TYPES, ActivityType } from '../../types';
import config from '../config';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

// Convertir les types d'activités en format dropdown
const ACTIVITY_TYPES_DROPDOWN = ACTIVITY_TYPES.map(type => ({
    label: type,
    value: type
}));

const InfosActivityTab = ({ formState, updateFormState, step }) => {
    const [addressInput, setAddressInput] = useState(formState.address || '');
    
    // États pour les suggestions d'adresse
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isAddressInputFocused, setIsAddressInputFocused] = useState(false);
    
    // États pour le positionnement de la liste d'adresses
    const [addressInputLayout, setAddressInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    
    // Animations pour le feedback visuel
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
    const [pickerDate, setPickerDate] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());

    const [formConfirmationDate, setFormConfirmationDate] = useState(
        formState.confirmationDateTime ? new Date(formState.confirmationDateTime) : null
    );

    const [formStartDate, setFormStartDate] = useState(
        formState.startDateTime ? new Date(formState.startDateTime) : null
    );
    const [formStartTime, setFormStartTime] = useState(
        formState.startDateTime ? new Date(formState.startDateTime) : null
    );
    const [formEndDate, setFormEndDate] = useState(
        formState.endDateTime ? new Date(formState.endDateTime) : null
    );
    const [formEndTime, setFormEndTime] = useState(
        formState.endDateTime ? new Date(formState.endDateTime) : null
    );

    // --- États Algolia ---
    const [algoliaSuggestions, setAlgoliaSuggestions] = useState([]);
    const [algoliaLoading, setAlgoliaLoading] = useState(false);
    const [algoliaError, setAlgoliaError] = useState('');
    const [algoliaTrail, setAlgoliaTrail] = useState(null);

    const addressInputContainerRef = useRef<View>(null);

    // --- Fonctions Algolia ---
    const getJwtToken = async () => '';

    const fetchAlgoliaSuggestions = async () => {
        setAlgoliaLoading(true);
        setAlgoliaError('');
        try {
            const token = await getJwtToken();
            const res = await fetch(`${config.BACKEND_URL}/activities/${formState._id}/search/algolia?hitsPerPage=5`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Erreur lors de la récupération des suggestions');
            const data = await res.json();
            setAlgoliaSuggestions(data.suggestions || []);
        } catch (e) {
            setAlgoliaError('Erreur lors de la récupération des suggestions');
        } finally {
            setAlgoliaLoading(false);
        }
    };

    const linkAlgolia = async (item) => {
        setAlgoliaLoading(true);
        setAlgoliaError('');
        try {
            const token = await getJwtToken();
            const res = await fetch(`${config.BACKEND_URL}/activities/${formState._id}/link/algolia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ objectID: item.objectID, name: item.name, slug: item.slug, updateActivityName: false }),
            });
            if (!res.ok) throw new Error('Erreur lors de l\'association');
            updateFormState({ algoliaId: item.objectID });
            setAlgoliaSuggestions([]);
        } catch (e) {
            setAlgoliaError('Erreur lors de l\'association');
        } finally {
            setAlgoliaLoading(false);
        }
    };

    const unlinkAlgolia = () => {
        updateFormState({ algoliaId: '' });
    };

    // Helper pour trouver le champ d'association Algolia
    const getAlgoliaId = () => formState.algoliaId || '';

    // Charger les infos de la randonnée associée si algoliaId existe
    useEffect(() => {
        const fetchAlgoliaTrail = async () => {
            const algoliaId = getAlgoliaId();
            if (!algoliaId) {
                setAlgoliaTrail(null);
                return;
            }
            setAlgoliaTrail(null);
            try {
                const token = await getJwtToken();
                const res = await fetch(`${config.BACKEND_URL}/activities/search/algolia`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ query: '', indexName: 'alltrails_primary_fr-FR', hitsPerPage: 1, filters: `objectID:${algoliaId}` }),
                });
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setAlgoliaTrail(data[0]);
                }
            } catch (e) {
                // ignore
            }
        };
        fetchAlgoliaTrail();
    }, [formState]);

    // Effet pour debounce la recherche d'adresse
    useEffect(() => {
        if (!isAddressInputFocused) {
            return;
        }

        const handler = setTimeout(() => {
            if (addressInput.length >= 2) {
                fetchSuggestions(addressInput);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [addressInput, isAddressInputFocused]);

    // Fonction pour obtenir les suggestions
    const fetchSuggestions = async (input: string) => {
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
        if (Platform.OS === 'android') {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, []);

    // Fermer les suggestions d'adresse si on touche en dehors du champ adresse
    useEffect(() => {
        const dismissSuggestions = Keyboard.addListener('keyboardDidHide', () => {
            setShowSuggestions(false);
            setSuggestions([]);
        });
        return () => {
            dismissSuggestions.remove();
        };
    }, []);

    const openPicker = (type: string) => {
        let date;
        switch (type) {
            case 'confirmationDate':
                date = formConfirmationDate || new Date();
                break;
            case 'startDate':
                date = formStartDate || (step?.arrivalDateTime ? parseISO(step.arrivalDateTime) : new Date());
                break;
            case 'startTime':
                date = formStartTime || (step?.arrivalDateTime ? parseISO(step.arrivalDateTime) : new Date());
                break;
            case 'endDate':
                date = formEndDate || (step?.departureDateTime ? parseISO(step.departureDateTime) : new Date());
                break;
            case 'endTime':
                date = formEndTime || (step?.departureDateTime ? parseISO(step.departureDateTime) : new Date());
                break;
            default:
                date = new Date();
        }
        setPickerDate(date);
        setTempDate(date);
        setShowPicker({ type, isVisible: true });
    };

    const handlePickerChange = (type: string, event: any, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setShowPicker({ type: '', isVisible: false });
            return;
        }
        setShowPicker({ type: '', isVisible: false });
        if (selectedDate) {
            const utcDate = selectedDate;

            if (type === 'confirmationDate') {
                setFormConfirmationDate(utcDate);
                updateFormState({ confirmationDateTime: utcDate.toISOString() });
            } else if (type === 'startDate') {
                const updatedDate = new Date(formState.startDateTime || utcDate);
                updatedDate.setUTCFullYear(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
                setFormStartDate(updatedDate);
                updateFormState({ startDateTime: updatedDate.toISOString() });
            } else if (type === 'startTime') {
                const updatedTime = new Date(formState.startDateTime || utcDate);
                updatedTime.setUTCHours(utcDate.getUTCHours(), utcDate.getUTCMinutes(), 0, 0);
                setFormStartTime(updatedTime);
                updateFormState({ startDateTime: updatedTime.toISOString() });
            } else if (type === 'endDate') {
                const updatedDate = new Date(formState.endDateTime || utcDate);
                updatedDate.setUTCFullYear(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
                setFormEndDate(updatedDate);
                updateFormState({ endDateTime: updatedDate.toISOString() });
            } else if (type === 'endTime') {
                const updatedTime = new Date(formState.endDateTime || utcDate);
                updatedTime.setUTCHours(utcDate.getUTCHours(), utcDate.getUTCMinutes(), 0, 0);
                setFormEndTime(updatedTime);
                updateFormState({ endDateTime: updatedTime.toISOString() });
            }
        }
    };

    const renderInputField = useCallback((field: string) => {
        switch (field) {
            case 'name':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="rv" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Nom de l'activité</Text>
                            </View>
                            <TextInput
                                value={formState.name}
                                onChangeText={(text) => updateFormState({ name: text })}
                                style={styles.modernInput}
                                mode="outlined"
                                placeholder="Ex: Randonnée au Mont-Blanc"
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
            case 'type':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="list" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Type d'activité</Text>
                            </View>
                            <Dropdown
                                style={styles.dropdown}
                                data={ACTIVITY_TYPES_DROPDOWN}
                                labelField="label"
                                valueField="value"
                                placeholder="Sélectionner un type"
                                value={formState.type}
                                onChange={(item) => updateFormState({ type: item.value as ActivityType })}
                                renderLeftIcon={() => (
                                    <Icon name="list" size={16} color="#666" style={{ marginRight: 8 }} />
                                )}
                            />
                        </Card.Content>
                    </Card>
                );
            case 'address':
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
                                        updateFormState({ address: text });
                                    }}
                                    onFocus={() => {
                                        setIsAddressInputFocused(true);
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
                                        setIsAddressInputFocused(false);
                                        setTimeout(() => {
                                            if (showSuggestions) {
                                                setShowSuggestions(false);
                                                setSuggestions([]);
                                            }
                                        }, 200);
                                    }}
                                    blurOnSubmit={false}
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
                                                    updateFormState({ address: '' });
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
                                                    top: addressInputLayout.y + addressInputLayout.height + 8,
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
                                                            updateFormState({ address: item.description });
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
            case 'website':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="globe" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Site Web</Text>
                            </View>
                            <TextInput
                                value={formState.website}
                                onChangeText={(text) => updateFormState({ website: text })}
                                style={styles.modernInput}
                                mode="outlined"
                                placeholder="https://example.com"
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
            case 'phone':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="phone" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Téléphone</Text>
                            </View>
                            <TextInput
                                value={formState.phone}
                                onChangeText={(text) => updateFormState({ phone: text })}
                                style={styles.modernInput}
                                mode="outlined"
                                placeholder="Ex: +33 1 23 45 67 89"
                                outlineColor="#E8E8E8"
                                activeOutlineColor="#4A90E2"
                                theme={{
                                    colors: {
                                        primary: '#4A90E2',
                                        outline: '#E8E8E8',
                                    }
                                }}
                                keyboardType="phone-pad"
                            />
                        </Card.Content>
                    </Card>
                );
            case 'email':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="envelope" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Email</Text>
                            </View>
                            <TextInput
                                value={formState.email}
                                onChangeText={(text) => updateFormState({ email: text })}
                                style={styles.modernInput}
                                mode="outlined"
                                placeholder="contact@activity.com"
                                outlineColor="#E8E8E8"
                                activeOutlineColor="#4A90E2"
                                theme={{
                                    colors: {
                                        primary: '#4A90E2',
                                        outline: '#E8E8E8',
                                    }
                                }}
                                keyboardType="email-address"
                            />
                        </Card.Content>
                    </Card>
                );
            case 'reservationNumber':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="ticket-alt" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>N° Réservation</Text>
                            </View>
                            <TextInput
                                value={formState.reservationNumber}
                                onChangeText={(text) => updateFormState({ reservationNumber: text })}
                                style={styles.modernInput}
                                mode="outlined"
                                placeholder="Ex: ACT123456"
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
            case 'confirmationDateTime':
                return (
                    <Card style={styles.dateTimeCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="calendar-check" size={20} color="#27AE60" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Date de confirmation</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => openPicker('confirmationDate')}
                                style={[styles.dateTimeButton, formConfirmationDate && styles.dateTimeButtonActive]}
                            >
                                <Text style={styles.dateTimeLabel}>Date</Text>
                                <Text style={[
                                    styles.dateTimeValue, 
                                    !formConfirmationDate && styles.dateTimeValueEmpty
                                ]}>
                                    {formConfirmationDate ? formatInTimeZone(formConfirmationDate, 'UTC', 'dd/MM/yyyy') : 'Sélectionner'}
                                </Text>
                            </TouchableOpacity>
                        </Card.Content>
                    </Card>
                );
            case 'startDateTime':
                return (
                    <Card style={styles.dateTimeCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="play" size={20} color="#27AE60" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Début</Text>
                            </View>
                            <View style={styles.dateTimeRow}>
                                <View style={styles.dateTimeItem}>
                                    <TouchableOpacity 
                                        onPress={() => openPicker('startDate')}
                                        style={[styles.dateTimeButton, formStartDate && styles.dateTimeButtonActive]}
                                    >
                                        <Text style={styles.dateTimeLabel}>Date</Text>
                                        <Text style={[
                                            styles.dateTimeValue, 
                                            !formStartDate && styles.dateTimeValueEmpty
                                        ]}>
                                            {formStartDate ? formatInTimeZone(formStartDate, 'UTC', 'dd/MM/yyyy') : 'Sélectionner'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.dateTimeItem}>
                                    <TouchableOpacity 
                                        onPress={() => openPicker('startTime')}
                                        style={[styles.dateTimeButton, formStartTime && styles.dateTimeButtonActive]}
                                    >
                                        <Text style={styles.dateTimeLabel}>Heure</Text>
                                        <Text style={[
                                            styles.dateTimeValue, 
                                            !formStartTime && styles.dateTimeValueEmpty
                                        ]}>
                                            {formStartTime ? formatInTimeZone(formStartTime, 'UTC', 'HH:mm') : 'Sélectionner'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                );
            case 'endDateTime':
                return (
                    <Card style={styles.dateTimeCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="stop" size={20} color="#E74C3C" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Fin</Text>
                            </View>
                            <View style={styles.dateTimeRow}>
                                <View style={styles.dateTimeItem}>
                                    <TouchableOpacity 
                                        onPress={() => openPicker('endDate')}
                                        style={[styles.dateTimeButton, formEndDate && styles.dateTimeButtonActive]}
                                    >
                                        <Text style={styles.dateTimeLabel}>Date</Text>
                                        <Text style={[
                                            styles.dateTimeValue, 
                                            !formEndDate && styles.dateTimeValueEmpty
                                        ]}>
                                            {formEndDate ? formatInTimeZone(formEndDate, 'UTC', 'dd/MM/yyyy') : 'Sélectionner'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.dateTimeItem}>
                                    <TouchableOpacity 
                                        onPress={() => openPicker('endTime')}
                                        style={[styles.dateTimeButton, formEndTime && styles.dateTimeButtonActive]}
                                    >
                                        <Text style={styles.dateTimeLabel}>Heure</Text>
                                        <Text style={[
                                            styles.dateTimeValue, 
                                            !formEndTime && styles.dateTimeValueEmpty
                                        ]}>
                                            {formEndTime ? formatInTimeZone(formEndTime, 'UTC', 'HH:mm') : 'Sélectionner'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                );
            case 'price':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="euro-sign" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Prix</Text>
                            </View>
                            <View style={styles.dateTimeRow}>
                                <View style={styles.dateTimeItem}>
                                    <TextInput
                                        value={formState.price ? formState.price.toString() : '0'}
                                        onChangeText={(text) => updateFormState({ price: text })}
                                        style={styles.modernInput}
                                        mode="outlined"
                                        placeholder="Ex: 50"
                                        outlineColor="#E8E8E8"
                                        activeOutlineColor="#4A90E2"
                                        theme={{
                                            colors: {
                                                primary: '#4A90E2',
                                                outline: '#E8E8E8',
                                            }
                                        }}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.dateTimeItem}>
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={[
                                            { label: 'EUR', value: 'EUR' },
                                            { label: 'USD', value: 'USD' },
                                            { label: 'CAD', value: 'CAD' },
                                        ]}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Devise"
                                        value={formState.currency}
                                        onChange={(item) => updateFormState({ currency: item.value })}
                                    />
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                );

            case 'notes':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content 
                            style={styles.cardContent}
                            onStartShouldSetResponder={() => {
                                // Fermer le DateTimePicker si on touche la carte des notes
                                if (showPicker.isVisible) {
                                    setShowPicker({ type: '', isVisible: false });
                                }
                                return false; // Permettre aux autres composants de gérer l'événement
                            }}
                        >
                            <View style={styles.fieldHeader}>
                                <Icon name="sticky-note" size={20} color="#9B59B6" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Notes</Text>
                            </View>
                            <TextInput
                                value={formState.notes}
                                onChangeText={(text) => {
                                    // Forcer la fermeture du DateTimePicker si il est ouvert
                                    if (showPicker.isVisible) {
                                        setShowPicker({ type: '', isVisible: false });
                                    }
                                    updateFormState({ notes: text });
                                }}
                                onFocus={() => {
                                    // Forcer la fermeture du DateTimePicker si il est ouvert
                                    if (showPicker.isVisible) {
                                        setShowPicker({ type: '', isVisible: false });
                                    }
                                }}
                                style={[styles.modernInput, { minHeight: 120 }]}
                                mode="outlined"
                                placeholder="Ajoutez vos notes, remarques ou informations importantes..."
                                outlineColor="#E8E8E8"
                                activeOutlineColor="#9B59B6"
                                theme={{
                                    colors: {
                                        primary: '#9B59B6',
                                        outline: '#E8E8E8',
                                    }
                                }}
                                multiline={true}
                                scrollEnabled={false}
                                blurOnSubmit={false}
                                returnKeyType="default"
                                textAlignVertical="top"
                            />
                        </Card.Content>
                    </Card>
                );

            default:
                return null;
        }
    }, [formState, updateFormState, addressInput, showPicker, formConfirmationDate, formStartDate, formStartTime, formEndDate, formEndTime]);

    const renderAlgoliaSection = () => {
        return (
            <Card style={styles.fieldCard}>
                <Card.Content>
                    {getAlgoliaId() && typeof getAlgoliaId() === 'string' && getAlgoliaId().length > 0 ? (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ marginBottom: 8 }}>
                                Randonnée liée : <Text style={{ fontWeight: 'bold' }}>{algoliaTrail?.name || getAlgoliaId()}</Text>
                            </Text>
                            <Button 
                                mode="text" 
                                onPress={() => {
                                    let url = undefined;
                                    if (algoliaTrail?.url) {
                                        url = algoliaTrail.url;
                                    } else if (algoliaTrail?.slug) {
                                        url = `https://www.alltrails.com/fr/${algoliaTrail.slug}`;
                                    } else if (getAlgoliaId() && getAlgoliaId().startsWith('trail-')) {
                                        url = `https://www.alltrails.com/fr/trail/${getAlgoliaId().replace('trail-', '')}`;
                                    }
                                    if (url) Linking.openURL(url);
                                }} 
                                style={{ marginTop: 8 }}
                            >
                                Voir sur AllTrails
                            </Button>
                            <Button 
                                mode="outlined" 
                                onPress={unlinkAlgolia} 
                                style={{ marginTop: 8 }}
                            >
                                Dissocier
                            </Button>
                        </View>
                    ) : (
                        <>
                            <Button 
                                mode="contained" 
                                onPress={fetchAlgoliaSuggestions} 
                                loading={algoliaLoading} 
                                style={{ marginBottom: 10 }}
                                disabled={!formState._id}
                            >
                                Suggestions automatiques
                            </Button>
                            {algoliaSuggestions.length > 0 && (
                                <View style={{ marginBottom: 10 }}>
                                    {algoliaSuggestions.map((item) => (
                                        <View key={item.objectID} style={{ marginBottom: 8, backgroundColor: '#fff', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#E0E0E0' }}>
                                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{item.name}</Text>
                                            <Text style={{ marginBottom: 2 }}>Distance : {item.distanceKm ? `${item.distanceKm} km` : 'N/A'}</Text>
                                            <Text style={{ marginBottom: 2 }}>Note : {item.rating || 'N/A'} ({item.numReviews || 0} avis)</Text>
                                            <Text style={{ marginBottom: 8 }}>Lieu : {item.slug}</Text>
                                            <Button mode="text" onPress={() => Linking.openURL(item.url)} style={{ marginBottom: 4 }}>
                                                Voir sur AllTrails
                                            </Button>
                                            <Button mode="contained" onPress={() => linkAlgolia(item)}>
                                                Associer
                                            </Button>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {algoliaError ? <Text style={{ color: 'red', marginTop: 8 }}>{algoliaError}</Text> : null}
                        </>
                    )}
                </Card.Content>
            </Card>
        );
    };

    const renderContent = () => {
        const data = [
            { type: 'sectionTitle', title: '🎯 Informations générales' },
            { type: 'field', field: 'name' },
            { type: 'field', field: 'type' },
            { type: 'field', field: 'address' },
            { type: 'field', field: 'website' },
            { type: 'field', field: 'phone' },
            { type: 'field', field: 'email' },
            { type: 'sectionTitle', title: '📅 Réservation' },
            { type: 'field', field: 'reservationNumber' },
            { type: 'field', field: 'confirmationDateTime' },
            { type: 'sectionTitle', title: '🕒 Horaires' },
            { type: 'field', field: 'startDateTime' },
            { type: 'field', field: 'endDateTime' },
            { type: 'sectionTitle', title: '💰 Tarification & Notes' },
            { type: 'field', field: 'price' },
            { type: 'field', field: 'notes' },
            { type: 'sectionTitle', title: '🥾 Randonnée associée (Algolia)' },
            { type: 'algolia' },
            { type: 'spacer' },
        ];

        const renderItem = ({ item }: { item: any }) => {
            switch (item.type) {
                case 'sectionTitle':
                    return <Text style={styles.sectionTitle}>{item.title}</Text>;
                case 'field':
                    return renderInputField(item.field);
                case 'algolia':
                    return renderAlgoliaSection();
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
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={false}
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => {
                    // Fermer les suggestions quand l'utilisateur commence à faire défiler
                    if (showSuggestions) {
                        setShowSuggestions(false);
                        setSuggestions([]);
                    }
                }}
                removeClippedSubviews={false}
            />
        );
    };

    return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            {renderContent()}
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
                            setPickerDate(tempDate);
                            setShowPicker({ type: '', isVisible: false });
                        }
                    }}
                />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 16,
        color: "#2C3E50",
        marginTop: 8,
        paddingHorizontal: 0,
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
        marginBottom: 10,
        overflow: 'visible',
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
    // Styles pour le dropdown
    dropdown: {
        height: 65,
        borderColor: '#E8E8E8',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: '#F8F9FA',
    },
});

export default InfosActivityTab;
