import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { TriangleCornerTopRight } from '../components/shapes';

dayjs.extend(utc);

const FilesTab = ({ files, handleFileUpload, handleDeleteFile }) => {
    const [fileToDelete, setFileToDelete] = useState(null);

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

    const handleOpenFile = (url) => {
        Linking.openURL(url).catch((err) => console.error('An error occurred', err));
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.triangleButtonContainer}
                onPress={handleFileUpload}
            >
                <TriangleCornerTopRight style={styles.triangleButton} />
            </TouchableOpacity>
            <FlatList
                data={files}
                keyExtractor={(item) => item._id}
                numColumns={2}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.fileItem}
                        onLongPress={() => handleLongPress(item._id)}
                    >
                        <TouchableOpacity onPress={() => handleOpenFile(item.url)}>
                            <Icon name="file" size={30} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.fileName}>{item.name}</Text>
                        <Text style={styles.fileDate}>{dayjs.utc(item.createdAt).format('DD/MM/YY HH:mm')}</Text>
                        {fileToDelete === item._id && (
                            <TouchableOpacity
                                style={styles.deleteIcon}
                                onPress={() => handleDelete(item._id)}
                            >
                                <Icon name="trash" size={20} color="red" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text>Aucun fichier disponible</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    fileItem: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        margin: 10,
        position: 'relative',
    },
    fileName: {
        marginTop: 10,
        fontWeight: 'bold',
    },
    fileDate: {
        marginTop: 5,
        color: '#888',
    },
    deleteIcon: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
    triangleButtonContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    triangleButton: {
        width: 50,
        height: 50,
    },
});

export default FilesTab;