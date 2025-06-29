import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Text } from 'react-native';
import { FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import config from '../config';

const PhotosTabEntity = ({ entityType, entity, photos, setPhotos }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (entity && entity.photos) {
            fetchPhotos();
            setPhotos(entity.photos);
        }
    }, [entity]);

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.BACKEND_URL}/${entityType}/${entity._id}/photos`);
            if (response.ok) {
                const photosEntity = await response.json();
                setPhotos(photosEntity);
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération des photos.');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération des photos.');
        } finally {
            setLoading(false);
        }
    };

    const handleLongPress = (photoId) => {
        setSelectionMode(true);
        setSelected([photoId]);
    };

    const handleSelect = (photoId) => {
        if (!selectionMode) return;
        setSelected((prev) =>
            prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
        );
    };

    const handleCancelSelection = () => {
        setSelectionMode(false);
        setSelected([]);
    };

    const handleDeleteSelected = () => {
        Alert.alert(
            'Supprimer',
            `Supprimer ${selected.length} photo(s) ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive', onPress: deleteSelectedPhotos
                },
            ]
        );
    };

    const deleteSelectedPhotos = async () => {
        setLoading(true);
        for (const photoId of selected) {
            try {
                await fetch(`${config.BACKEND_URL}/${entityType}/${entity._id}/photos/${photoId}`, { method: 'DELETE' });
            } catch {}
        }
        await fetchPhotos();
        setSelectionMode(false);
        setSelected([]);
        setLoading(false);
    };

    const handlePhotoUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: true });
            if (result.canceled) return;
            const files = result.assets || [];
            if (!files.length) {
                Alert.alert('Erreur', 'Aucune photo sélectionnée.');
                return;
            }
            const formData = new FormData();
            files.forEach((file) => {
                const { uri, name, mimeType } = file;
                formData.append('photos', {
                    uri,
                    name,
                    type: mimeType || 'image/jpeg',
                } as any);
            });
            setLoading(true);
            const response = await fetch(`${config.BACKEND_URL}/${entityType}/${entity._id}/photos`, {
                method: 'PATCH',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.ok) {
                fetchPhotos();
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout des photos.');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sélectionner des photos.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const isSelected = selected.includes(item._id);
        return (
            <TouchableOpacity
                style={[styles.photoItem, isSelected && styles.selectedPhoto]}
                onLongPress={() => handleLongPress(item._id)}
                onPress={() => selectionMode ? handleSelect(item._id) : null}
                activeOpacity={selectionMode ? 0.7 : 1}
            >
                <Image source={{ uri: item.url }} style={styles.photo} />
                {selectionMode && (
                    <View style={styles.checkboxOverlay}>
                        <Icon
                            name={isSelected ? 'check-circle' : 'circle-thin'}
                            size={28}
                            color={isSelected ? '#2196F3' : '#fff'}
                        />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {selectionMode && (
                <View style={styles.selectionBar}>
                    <Text style={styles.selectionText}>{selected.length} sélectionnée(s)</Text>
                    <TouchableOpacity onPress={handleDeleteSelected} style={styles.actionButton}>
                        <Icon name="trash" size={28} color="#d32f2f" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCancelSelection} style={styles.actionButton}>
                        <Icon name="close" size={28} color="#333" />
                    </TouchableOpacity>
                </View>
            )}
            {loading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#007BFF" />
                </View>
            )}
            <FlatList
                data={photos}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                numColumns={3}
                extraData={selected}
            />
            <FAB
                style={styles.fab}
                small
                icon="plus"
                onPress={handlePhotoUpload}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    list: {
        paddingBottom: 20,
        paddingHorizontal: 2,
    },
    photoItem: {
        flex: 1,
        aspectRatio: 1,
        margin: 2,
        backgroundColor: '#eee',
        borderRadius: 8,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    selectedPhoto: {
        borderWidth: 3,
        borderColor: '#2196F3',
    },
    photo: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    checkboxOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 14,
        padding: 2,
    },
    selectionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    selectionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
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
    actionButton: {
        marginHorizontal: 8,
        padding: 4,
    },
});

export default PhotosTabEntity;
