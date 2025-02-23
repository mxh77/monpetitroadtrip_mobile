import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { TriangleCornerTopRight } from '../components/shapes';
import * as DocumentPicker from 'expo-document-picker';
import { FAB } from 'react-native-paper'; // Importer le bouton flottant

dayjs.extend(utc);

const FilesTab = ({ accommodation, files, setFiles }) => {
    const [fileToDelete, setFileToDelete] = useState(null);

    useEffect(() => {
        if (accommodation?.documents && files !== accommodation.documents) {
            setFiles(accommodation.documents);
        }
    }, [accommodation, files]);

    const fetchFiles = async () => {
        try {
            const response = await fetch(`https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}`);
            if (response.ok) {
                const updatedAccommodation = await response.json();
                setFiles(updatedAccommodation.documents);
            } else {
                Alert.alert('Erreur', 'Impossible de récupérer les fichiers.');
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement des fichiers:', error);
        }
    };

    const handleLongPress = (fileId) => {
        setFileToDelete(fileId);
    };

    const handleDelete = (fileId) => {
        Alert.alert(
            'Confirmation',
            'Êtes-vous sûr de vouloir supprimer ce fichier ?',
            [
                {
                    text: 'Annuler',
                    style: 'cancel',
                },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        handleDeleteFile(fileId);
                        setFileToDelete(null);
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleDeleteFile = async (fileId) => {
        try {
            const response = await fetch(`https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}/documents/${fileId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchFiles(); // Rafraîchir la liste depuis l'API
                Alert.alert('Succès', 'Le fichier a été supprimé avec succès.');
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du fichier.');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du fichier.');
        }
    };

    const handleOpenFile = (url) => {
        Linking.openURL(url).catch((err) => console.error('An error occurred', err));
    };

    const handleFileUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({});

            if (result.canceled) return; // Vérifie si l'utilisateur a annulé

            const file = result.assets[0]; // Récupérer le fichier sélectionné

            if (!file) {
                Alert.alert('Erreur', 'Aucun fichier sélectionné.');
                return;
            }

            const { uri, name, mimeType } = file; // `mimeType` est bien dans `assets[0]`

            const newFile = {
                uri,
                name,
                type: mimeType || 'application/octet-stream', // Défaut si `mimeType` est undefined
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
                fetchFiles(); // Rafraîchir la liste après l'upload
                Alert.alert('Succès', 'Le fichier a été ajouté avec succès.');
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout du fichier.');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sélectionner un fichier.');
            console.error(error);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.fileItem}
            onLongPress={() => handleLongPress(item._id)}
            onPress={() => handleOpenFile(item.url)}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Text>{item.name}</Text>
                {fileToDelete === item._id && (
                    <TouchableOpacity onPress={() => handleDelete(item._id)}>
                        <Icon name="trash" size={20} color="red" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={files}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                numColumns={2}
            />
            <FAB
                style={styles.fab}
                small
                icon="plus"
                onPress={handleFileUpload}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    list: {
        paddingBottom: 20,
    },
    fileItem: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        margin: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#007BFF',
    },
});

export default FilesTab;