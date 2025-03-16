import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import {  formatInTimeZone } from 'date-fns-tz';
import { SectionList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

const InfosAccommodationTab = ({ formState, updateFormState ,step}) => {
    // console.log('Début composant InfosAccommodationTab');

    const [nameInput, setNameInput] = useState(formState.name || '');
    const [addressInput, setAddressInput] = useState(formState.address || '');

    const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
    const [pickerDate, setPickerDate] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());
    const [inputEnabled, setInputEnabled] = useState(true);

    const [formConfirmationDate, setFormConfirmationDate] = useState(
        formState.confirmationDateTime ? new Date(formState.confirmationDateTime) : null
      );

    const [formArrivalDate, setFormArrivalDate] = useState(
        formState.arrivalDateTime ? new Date(formState.arrivalDateTime) : null
      );
      const [formArrivalTime, setFormArrivalTime] = useState(
        formState.arrivalDateTime ? new Date(formState.arrivalDateTime) :  null
      );
      const [formDepartureDate, setFormDepartureDate] = useState(
        formState.departureDateTime ? new Date(formState.departureDateTime) :  null
      );
      const [formDepartureTime, setFormDepartureTime] = useState(
        formState.departureDateTime ? new Date(formState.departureDateTime) :  null
      );
      

    const googlePlacesRef = useRef(null);

    const openPicker = (type: string) => {
        let date;
        switch (type) {
            case 'confirmationDate':
                date = formConfirmationDate || new Date();
                break;
            case 'arrivalDate':
                date = formArrivalDate || parseISO(step.arrivalDateTime);
                break;
            case 'arrivalTime':
                date = formArrivalTime || parseISO(step.arrivalDateTime);
                break;
            case 'departureDate':
                date = formDepartureDate || parseISO(step.arrivalDateTime);
                break;
            case 'departureTime':
                date = formDepartureTime || parseISO(step.arrivalDateTime);
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
            // Utiliser directement la date sélectionnée car elle représente déjà l'heure en UTC
            const utcDate = selectedDate;
            console.log('utcDate:', utcDate);

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
                        onChangeText={(text) => updateFormState({ email: text })}
                        style={styles.input}
                    />
                );
            case 'reservationNumber':
                return (
                    <TextInput
                        label="N° Réservation"
                        value={formState.reservationNumber}
                        onChangeText={(text) => updateFormState({ reservationNumber: text })}
                        style={styles.input}
                    />
                );
            case 'confirmationDateTime':
                return (
                    <TouchableOpacity onPress={() => openPicker('confirmationDate')}>
                        <View pointerEvents="none">
                            <TextInput
                                label="Date de confirmation"
                                value={formState.confirmationDateTime ? format(parseISO(formState.confirmationDateTime), 'dd/MM/yyyy') : ''}
                                style={styles.input}
                                editable={false} // Rend le champ non éditable
                            />
                        </View>
                    </TouchableOpacity>
                );
            case 'arrivalDateTime':
                return (
                    <View style={styles.rowContainer}>
                        <View style={styles.rowItem}>
                            <TouchableOpacity onPress={() => openPicker('arrivalDate')}>
                                <View pointerEvents="none">
                                    <TextInput
                                        label="Date d'arrivée"
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
            case 'nights':
                return (
                    <TextInput
                        label="Nombre de nuits"
                        value={formState.nights ? formState.nights.toString() : '0'}
                        onChangeText={(text) => updateFormState({ nights: text })}
                        style={styles.input}
                    />
                );
            case 'price':
                return (
                    <TextInput
                        label="Prix"
                        value={formState.price ? formState.price.toString() : '0'}
                        onChangeText={(text) => updateFormState({ price: text })}
                        style={styles.input}
                    />
                );
            case 'notes':
                return (
                    <TextInput
                        label="Notes"
                        value={formState.notes}
                        onChangeText={(text) => updateFormState({ notes: text })}
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