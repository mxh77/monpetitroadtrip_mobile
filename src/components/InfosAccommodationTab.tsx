import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { format } from 'date-fns';
import { SectionList } from 'react-native';
import { getTimeFromDate } from '../utils/dateUtils';

const InfosAccommodationTab = ({ formState, setFormState, openPicker, styles }) => {
    const renderInputField = (field: string) => {
        switch (field) {
            case 'name':
                return (
                    <TextInput
                        label="Nom de l'hébergement"
                        value={formState.name}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, name: text }))}
                        style={styles.input}
                    />
                );
            case 'address':
                return (
                    <TextInput
                        label="Adresse"
                        value={formState.address}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, address: text }))}
                        style={styles.input}
                    />
                );
            case 'website':
                return (
                    <TextInput
                        label="Site Web"
                        value={formState.website}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, website: text }))}
                        style={styles.input}
                    />
                );
            case 'phone':
                return (
                    <TextInput
                        label="Téléphone"
                        value={formState.phone}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, phone: text }))}
                        style={styles.input}
                    />
                );
            case 'email':
                return (
                    <TextInput
                        label="Mail"
                        value={formState.email}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, email: text }))}
                        style={styles.input}
                    />
                );
            case 'reservationNumber':
                return (
                    <TextInput
                        label="N° Réservation"
                        value={formState.reservationNumber}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, reservationNumber: text }))}
                        style={styles.input}
                    />
                );
            case 'confirmationDateTime':
                return (
                    <TextInput
                        label="Date de confirmation"
                        value={formState.confirmationDateTime ? format(formState.confirmationDateTime, 'dd/MM/yyyy') : ''}
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
                                value={format(formState.arrivalDateTime, 'dd/MM/yyyy')}
                                onFocus={() => openPicker('arrivalDate')}
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <TextInput
                                label="Heure d'arrivée"
                                value={getTimeFromDate(new Date(formState.arrivalDateTime))}
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
                                value={format(formState.departureDateTime, 'dd/MM/yyyy')}
                                onFocus={() => openPicker('departureDate')}
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <TextInput
                                label="Heure de départ"
                                value={getTimeFromDate(new Date(formState.departureDateTime))}
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
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, nights: parseInt(text, 10) || 0 }))}
                        style={styles.input}
                    />
                );
            case 'price':
                return (
                    <TextInput
                        label="Prix"
                        value={formState.price ? formState.price.toString() : '0'}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, price: text }))}
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
                    />
                );

            default:
                return null;
        }
    };

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
        </View>
    );
};

export default InfosAccommodationTab;