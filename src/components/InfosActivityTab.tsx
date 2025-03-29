import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { SectionList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { newDateUTC } from '../utils/dateUtils';
import { Dropdown } from 'react-native-element-dropdown';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

const InfosActivityTab = ({ formState, updateFormState, step }) => {
    // console.log('Début composant InfosActivityTab');
    // console.log('step:', step);
    const [nameInput, setNameInput] = useState(formState.name || '');
    const [addressInput, setAddressInput] = useState(formState.address || '');

    const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
    const [pickerDate, setPickerDate] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());
    const [inputEnabled, setInputEnabled] = useState(true);

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


    const googlePlacesRef = useRef(null);

    const openPicker = (type: string) => {
        let date;
        console.log('type:', type);
        switch (type) {

            case 'confirmationDate':
                date = formConfirmationDate || new Date();
                break;
            case 'startDate':
                date = formStartDate || (step?.startDateTime ? parseISO(step.startDateTime) : new Date());
                break;
            case 'startTime':
                date = formStartTime || (step?.startDateTime ? parseISO(step.startDateTime) : new Date());
                break;
            case 'endDate':
                date = formEndDate || (step?.endDateTime ? parseISO(step.endDateTime) : new Date());
                break;
            case 'endTime':
                date = formEndTime || (step?.endDateTime ? parseISO(step.endDateTime) : new Date());
                break;
            default:
                date = new Date();
        }

        console.log('date:', date);
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
                    <TextInput
                        label="Nom de l'activité"
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
            case 'startDateTime':
                return (
                    <View style={styles.rowContainer}>
                        <View style={styles.rowItem}>
                            <TouchableOpacity onPress={() => openPicker('startDate')}>
                                <View pointerEvents="none">
                                    <TextInput
                                        label="Date de début"
                                        value={formStartDate ? formatInTimeZone(formStartDate, 'UTC', 'dd/MM/yyyy') : ''}
                                        style={styles.input}
                                        editable={false} // Rend le champ non éditable
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.rowItem}>
                            <TouchableOpacity onPress={() => openPicker('startTime')}>
                                <View pointerEvents="none">
                                    <TextInput
                                        label="Heure de début"
                                        value={formStartTime ? formatInTimeZone(formStartTime, 'UTC', 'HH:mm') : ''}
                                        style={styles.input}
                                        editable={false} // Rend le champ non éditable
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 'endDateTime':
                return (
                    <View style={styles.rowContainer}>
                        <View style={styles.rowItem}>
                            <TouchableOpacity onPress={() => openPicker('endDate')}>
                                <View pointerEvents="none">
                                    <TextInput
                                        label="Date de fin"
                                        value={formEndDate ? formatInTimeZone(formEndDate, 'UTC', 'dd/MM/yyyy') : ''}
                                        style={styles.input}
                                        editable={false} // Rend le champ non éditable
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.rowItem}>
                            <TouchableOpacity onPress={() => openPicker('endTime')}>
                                <View pointerEvents="none">
                                    <TextInput
                                        label="Heure de fin"
                                        value={formEndTime ? formatInTimeZone(formEndTime, 'UTC', 'HH:mm') : ''}
                                        style={styles.input}
                                        editable={false} // Rend le champ non éditable
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 'price':
                return (
                    <View style={styles.rowContainer}>
                        <View style={styles.rowItem}>
                            <TextInput
                                label="Prix"
                                value={formState.price ? formState.price.toString() : '0'}
                                onChangeText={(text) => updateFormState({ price: text })}
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <Dropdown
                                style={styles.dropdown}
                                data={[
                                    { label: 'EUR', value: 'EUR' },
                                    { label: 'USD', value: 'USD' },
                                    { label: 'CAD', value: 'CAD' },
                                ]}
                                labelField="label"
                                valueField="value"
                                placeholder="Sélectionner une devise"
                                value={formState.currency}
                                onChange={(item) => updateFormState({ currency: item.value })}
                            />
                        </View>
                    </View>
                );
            case 'notes':
                return (
                    <TextInput
                        label="Notes"
                        value={formState.notes}
                        onChangeText={(text) => updateFormState({ notes: text })}
                        style={[styles.input, styles.notesInput]}
                        multiline
                        numberOfLines={4}
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
                    { title: 'Dates', data: ['startDateTime', 'endDateTime'] },
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
    dropdown: {
        height: 65,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: '#fff',
      },
});

export default InfosActivityTab;