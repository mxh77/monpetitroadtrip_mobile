import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, Platform, Keyboard } from 'react-native';
import { TextInput, Card, Portal } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { newDateUTC } from '../utils/dateUtils';
import { Dropdown } from 'react-native-element-dropdown';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

const InfosAccommodationTab = ({ formState, updateFormState, step }) => {
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

    const [formArrivalDate, setFormArrivalDate] = useState(
        formState.arrivalDateTime ? new Date(formState.arrivalDateTime) : null
    );
    const [formArrivalTime, setFormArrivalTime] = useState(
        formState.arrivalDateTime ? new Date(formState.arrivalDateTime) : null
    );
    const [formDepartureDate, setFormDepartureDate] = useState(
        formState.departureDateTime ? new Date(formState.departureDateTime) : null
    );
    const [formDepartureTime, setFormDepartureTime] = useState(
        formState.departureDateTime ? new Date(formState.departureDateTime) : null
    );

    const addressInputContainerRef = useRef<View>(null);

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
            case 'arrivalDate':
                date = formArrivalDate || (step?.arrivalDateTime ? parseISO(step.arrivalDateTime) : new Date());
                break;
            case 'arrivalTime':
                date = formArrivalTime || (step?.arrivalDateTime ? parseISO(step.arrivalDateTime) : new Date());
                break;
            case 'departureDate':
                date = formDepartureDate || (step?.departureDateTime ? parseISO(step.departureDateTime) : new Date());
                break;
            case 'departureTime':
                date = formDepartureTime || (step?.departureDateTime ? parseISO(step.departureDateTime) : new Date());
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
            } else if (type === 'arrivalDate') {
                const updatedDate = new Date(formState.arrivalDateTime || utcDate);
                updatedDate.setUTCFullYear(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
                setFormArrivalDate(updatedDate);
                updateFormState({ arrivalDateTime: updatedDate.toISOString() });
            } else if (type === 'arrivalTime') {
                const updatedTime = new Date(formState.arrivalDateTime || utcDate);
                updatedTime.setUTCHours(utcDate.getUTCHours(), utcDate.getUTCMinutes(), 0, 0);
                setFormArrivalTime(updatedTime);
                updateFormState({ arrivalDateTime: updatedTime.toISOString() });
            } else if (type === 'departureDate') {
                const updatedDate = new Date(formState.departureDateTime || utcDate);
                updatedDate.setUTCFullYear(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
                setFormDepartureDate(updatedDate);
                updateFormState({ departureDateTime: updatedDate.toISOString() });
            } else if (type === 'departureTime') {
                const updatedTime = new Date(formState.departureDateTime || utcDate);
                updatedTime.setUTCHours(utcDate.getUTCHours(), utcDate.getUTCMinutes(), 0, 0);
                setFormDepartureTime(updatedTime);
                updateFormState({ departureDateTime: updatedTime.toISOString() });
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
                                <Icon name="home" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Nom de l'hébergement</Text>
                            </View>
                            <TextInput
                                value={formState.name}
                                onChangeText={(text) => updateFormState({ name: text })}
                                style={styles.modernInput}
                                mode="outlined"
                                placeholder="Ex: Hôtel des Voyageurs"
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
                                placeholder="contact@hotel.com"
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
                                placeholder="Ex: RES123456"
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
            case 'nights':
                return (
                    <Card style={styles.fieldCard} elevation={2}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.fieldHeader}>
                                <Icon name="moon" size={20} color="#4A90E2" style={styles.fieldIcon} />
                                <Text style={styles.fieldLabel}>Nombre de nuits</Text>
                            </View>
                            <TextInput
                                value={formState.nights ? formState.nights.toString() : '0'}
                                onChangeText={(text) => updateFormState({ nights: text })}
                                style={styles.modernInput}
                                mode="outlined"
                                placeholder="Ex: 3"
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
                                        placeholder="Ex: 120"
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
    }, [formState, updateFormState, addressInput]);

    const renderContent = () => {
        const data = [
            { type: 'sectionTitle', title: '🏠 Informations générales' },
            { type: 'field', field: 'name' },
            { type: 'field', field: 'address' },
            { type: 'field', field: 'website' },
            { type: 'field', field: 'phone' },
            { type: 'field', field: 'email' },
            { type: 'sectionTitle', title: '📅 Réservation' },
            { type: 'field', field: 'reservationNumber' },
            { type: 'field', field: 'confirmationDateTime' },
            { type: 'sectionTitle', title: '🕒 Dates de séjour' },
            { type: 'field', field: 'arrivalDateTime' },
            { type: 'field', field: 'departureDateTime' },
            { type: 'field', field: 'nights' },
            { type: 'sectionTitle', title: '💰 Tarification & Notes' },
            { type: 'field', field: 'price' },
            { type: 'field', field: 'notes' },
            { type: 'spacer' },
        ];

        const renderItem = ({ item }: { item: any }) => {
            switch (item.type) {
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
    // Anciens styles conservés pour compatibilité
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
    dropdown: {
        height: 65,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: '#fff',
    },
});

export default InfosAccommodationTab;