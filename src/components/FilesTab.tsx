import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as DocumentPicker from 'expo-document-picker';

dayjs.extend(utc);

const FilesTab = ({ accommodation, files, setFiles }) => {
    const [fileToDelete, setFileToDelete] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (accommodation && accommodation.documents) {
            setFiles(accommodation.documents);
        }
    }, [accommodation]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            console.log('URL :', `https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}/documents`);
            const response = await fetch(`https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}/documents`);
            if (response.ok) {
                const updatedAccommodation = await response.json();
                console.log('Fichiers récupérés:', updatedAccommodation);
                setFiles(updatedAccommodation);
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération des fichiers.');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération des fichiers.');
        } finally {
            setLoading(false);
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
            setLoading(true);
            const response = await fetch(`https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}/documents/${fileId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchFiles();
                Alert.alert('Succès', 'Le fichier a été supprimé avec succès.');
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du fichier.');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du fichier.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenFile = (url) => {
        Linking.openURL(url).catch((err) => console.error('An error occurred', err));
    };

    const handleFileUpload = async () => {
        try {
            console.log('handleFileUpload');
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

            setLoading(true);
            console.log('formData:', formData);
            const response = await fetch(`https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}/documents`, {
                method: 'PATCH',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Données de l\'API:', data);

                fetchFiles();
                Alert.alert('Succès', 'Le fichier a été ajouté avec succès.');
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout du fichier.');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sélectionner un fichier.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.fileItem}
            onLongPress={() => handleLongPress(item._id)}
            onPress={() => handleOpenFile(item.url)}
        >
            <View style={styles.fileIconContainer}>
                <Icon name="file" size={40} color="#007BFF" />
            </View>
            <Text style={styles.fileName}>{item.name}</Text>
            {fileToDelete === item._id && (
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteIcon}>
                    <Icon name="trash" size={30} color="red" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    console.log('files:', files);
    return (
        <View style={styles.container}>
            {loading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#007BFF" />
                </View>
            )}
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
        backgroundColor: '#f9f9f9',
    },
    list: {
        paddingBottom: 20,
    },
    fileItem: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        position: 'relative',
        width: '45%',
    },
    fileIconContainer: {
        marginBottom: 10,
    },
    fileName: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    deleteIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#007BFF',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
});

export default FilesTab;