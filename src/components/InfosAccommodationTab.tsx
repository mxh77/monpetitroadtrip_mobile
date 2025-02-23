import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { SectionList } from 'react-native';
import { getTimeFromDate } from '../utils/dateUtils';
import { Accommodation } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

const InfosAccommodationTab = ({ formState, updateFormState }) => {
    console.log('Début composant InfosAccommodationTab');

    const [nameInput, setNameInput] = useState(formState.name || '');
    const [addressInput, setAddressInput] = useState(formState.address || '');

    const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
    const [pickerDate, setPickerDate] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());

    const [confirmationDate, setConfirmationDate] = useState(new Date(formState.confirmationDateTime));  // Date sans heure
    const [arrivalDate, setArrivalDate] = useState(new Date(formState.arrivalDateTime));  // Date sans heure
    const [arrivalTime, setArrivalTime] = useState(new Date(formState.arrivalDateTime));  // Heure sans date
    const [departureDate, setDepartureDate] = useState(new Date(formState.departureDateTime));  // Date sans heure
    const [departureTime, setDepartureTime] = useState(new Date(formState.departureDateTime));  // Heure sans date

    const googlePlacesRef = useRef(null);


    const openPicker = (type: string) => {
        let date;
        switch (type) {
            case 'confirmationDate':
                console.log('confirmationDateTime:', confirmationDate);
                date = new Date(Date.UTC(
                    confirmationDate.getUTCFullYear(),
                    confirmationDate.getUTCMonth(),
                    confirmationDate.getUTCDate()
                ));
                break;
            case 'arrivalDate':
                console.log('arrivalDate:', arrivalDate);
                date = new Date(Date.UTC(
                    arrivalDate.getUTCFullYear(),
                    arrivalDate.getUTCMonth(),
                    arrivalDate.getUTCDate()
                ));
                break;
            case 'arrivalTime':
                console.log('arrivalTime:', arrivalTime);
                date = new Date(Date.UTC(
                    arrivalTime.getUTCFullYear(),
                    arrivalTime.getUTCMonth(),
                    arrivalTime.getUTCDate(),
                    arrivalTime.getUTCHours(),
                    arrivalTime.getUTCMinutes()
                ));
                break;
            case 'departureDate':
                console.log('departureDate:', departureDate);
                date = new Date(Date.UTC(
                    departureDate.getUTCFullYear(),
                    departureDate.getUTCMonth(),
                    departureDate.getUTCDate()
                ));
                break;
            case 'departureTime':
                console.log('departureTime:', departureTime);
                date = new Date(Date.UTC(
                    departureTime.getUTCFullYear(),
                    departureTime.getUTCMonth(),
                    departureTime.getUTCDate(),
                    departureTime.getUTCHours(),
                    departureTime.getUTCMinutes()
                ));
                break;
            default:
                date = new Date();
        }
        setPickerDate(date);
        setTempDate(date);
        setShowPicker({ type, isVisible: true });
    };

    const handlePickerChange = (type: string, event: any, selectedDate?: Date) => {
        console.log('handlePickerChange type:', type, 'event:', event, 'selectedDate:', selectedDate);
        if (event.type === 'dismissed') {
            setShowPicker({ type: '', isVisible: false });
            return;
        }
        setShowPicker({ type: '', isVisible: false });
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            console.log('newDate:', newDate);

            if (type === 'confirmationDate') {
                setConfirmationDate(newDate);
                updateFormState({
                    confirmationDateTime: selectedDate.toISOString(),
                });
            }
            if (type === 'arrivalDate') {
                setArrivalDate(newDate);
                updateFormState({
                    arrivalDateTime: new Date(Date.UTC(
                        selectedDate.getUTCFullYear(),
                        selectedDate.getUTCMonth(),
                        selectedDate.getUTCDate(),
                        arrivalTime.getUTCHours(),
                        arrivalTime.getUTCMinutes()
                    )).toISOString(),
                });
            }
            if (type === 'arrivalTime') {
                setArrivalTime(newDate);
                updateFormState({
                    arrivalDateTime: new Date(Date.UTC(
                        arrivalDate.getUTCFullYear(),
                        arrivalDate.getUTCMonth(),
                        arrivalDate.getUTCDate(),
                        selectedDate.getUTCHours(),
                        selectedDate.getUTCMinutes()
                    )).toISOString(),
                });
            }
            if (type === 'departureDate') {
                setDepartureDate(newDate);
                updateFormState({
                    departureDateTime: new Date(Date.UTC(
                        selectedDate.getUTCFullYear(),
                        selectedDate.getUTCMonth(),
                        selectedDate.getUTCDate(),
                        departureTime.getUTCHours(),
                        departureTime.getUTCMinutes()
                    )).toISOString(),
                });
            }
            if (type === 'departureTime') {
                setDepartureTime(newDate);
                updateFormState({
                    departureDateTime: new Date(Date.UTC(
                        departureDate.getUTCFullYear(),
                        departureDate.getUTCMonth(),
                        departureDate.getUTCDate(),
                        selectedDate.getUTCHours(),
                        selectedDate.getUTCMinutes()
                    )).toISOString(),
                });
            }

            console.log('Date sélectionnée:', selectedDate);
            console.log('arrivalDate:', arrivalDate);
            console.log('arrivalTime:', arrivalTime);
            console.log('formState.arrivalDateTime:', formState.arrivalDateTime);
        }
    };

    const renderInputField = useCallback((field: string) => {
        switch (field) {
            case 'name':
                return (
                    <TextInput
                        label="Nom de l'hébergement"
                        value={formState.name}
                        onChangeText={(text) => updateFormState({ name: text })}
                        style={styles.input}
                    />
                );
            case 'address':
                return (
                    <View style={styles.input}>
                        <GooglePlacesAutocomplete
                            ref={googlePlacesRef}
                            placeholder="Adresse"
                            onPress={(data, details = null) => {
                                setAddressInput(data.description);
                                if (formState.address !== data.description) {
                                    updateFormState({ address: data.description });
                                }
                            }}
                            query={{
                                key: GOOGLE_API_KEY,
                                language: 'fr',
                            }}
                            textInputProps={{
                                value: addressInput,
                                onChangeText: (text) => {
                                    if (text !== "" || (text === "" && addressInput !== formState.address)) {
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
            case 'website':
                return (
                    <TextInput
                        label="Site Web"
                        value={formState.website}
                        onChangeText={(text) => updateFormState({ website: text })}
                        style={styles.input}
                    />
                );
            case 'phone':
                return (
                    <TextInput
                        label="Téléphone"
                        value={formState.phone}
                        onChangeText={(text) => updateFormState({ phone: text })}
                        style={styles.input}
                    />
                );
            case 'email':
                return (
                    <TextInput
                        label="Mail"
                        value={formState.email}
                        onChangeText={(text) => updateFormState({email: text })}
                        style={styles.input}
                    />
                );
            case 'reservationNumber':
                return (
                    <TextInput
                        label="N° Réservation"
                        value={formState.reservationNumber}
                        onChangeText={(text) => updateFormState({reservationNumber: text })}
                        style={styles.input}
                    />
                );
            case 'confirmationDateTime':
                return (
                    <TextInput
                        label="Date de confirmation"
                        value={confirmationDate ? format(new Date(confirmationDate), 'dd/MM/yyyy') : ''}
                        onFocus={() => openPicker('confirmationDate')}
                        style={styles.input}
                    />
                );
            case 'arrivalDateTime':
                return (
                    <View style={styles.rowContainer}>
                        <View style={styles.rowItem}>
                            <TextInput
                                label="Date d'arrivée"
                                value={arrivalDate ? format(new Date(arrivalDate), 'dd/MM/yyyy') : ''}
                                onFocus={() => openPicker('arrivalDate')}
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <TextInput
                                label="Heure d'arrivée"
                                value={arrivalTime ? arrivalTime.toISOString().substring(11, 16) : ''}
                                onFocus={() => openPicker('arrivalTime')}
                                style={styles.input}
                            />
                        </View>
                    </View>
                );
            case 'departureDateTime':
                return (
                    <View style={styles.rowContainer}>
                        <View style={styles.rowItem}>
                            <TextInput
                                label="Date de départ"
                                value={departureDate ? format(new Date(departureDate), 'dd/MM/yyyy') : ''}
                                onFocus={() => openPicker('departureDate')}
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <TextInput
                                label="Heure de départ"
                                value={departureTime ? departureTime.toISOString().substring(11, 16) : ''}
                                onFocus={() => openPicker('departureTime')}
                                style={styles.input}
                            />
                        </View>
                    </View>
                );
            case 'nights':
                return (
                    <TextInput
                        label="Nombre de nuits"
                        value={formState.nights ? formState.nights.toString() : '0'}
                        onChangeText={(text) => updateFormState({nights: text })}
                        style={styles.input}
                    />
                );
            case 'price':
                return (
                    <TextInput
                        label="Prix"
                        value={formState.price ? formState.price.toString() : '0'}
                        onChangeText={(text) => updateFormState({price: text })}
                        style={styles.input}
                    />
                );
            case 'notes':
                return (
                    <TextInput
                        label="Notes"
                        value={formState.notes}
                        onChangeText={(text) => updateFormState({notes: text })}
                        style={[styles.input, styles.notesInput]}
                    />
                );

            default:
                return null;
        }
    }, [formState, updateFormState, addressInput]);

    return (
        <View style={styles.container}>
            <SectionList
                sections={[
                    { title: 'Informations Générales', data: ['name', 'address', 'website', 'phone', 'email'] },
                    { title: 'Réservation', data: ['reservationNumber', 'confirmationDateTime'] },
                    { title: 'Dates de séjour', data: ['arrivalDateTime', 'departureDateTime', 'nights'] },
                    { title: 'Autres informations', data: ['price', 'notes'] },
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
                            console.log('Selected date:', selectedDate);
                            handlePickerChange(showPicker.type, event, selectedDate);
                        } else {
                            setPickerDate(tempDate); // Reset to the original date if cancelled
                            setShowPicker({ type: '', isVisible: false }); // Ensure picker is closed
                        }
                    }}
                />
            )}
        </View>
    );
};

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

export default InfosAccommodationTab;