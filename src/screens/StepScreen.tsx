import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Step } from '../../types';
import { TabView, SceneMap } from 'react-native-tab-view';
import Geocoder from 'react-native-geocoding';
import Constants from 'expo-constants';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import GeneralInfo from '../components/GeneralInfo';
import Accommodations from '../components/Accommodations';
import Activities from '../components/Activities';

type Props = StackScreenProps<RootStackParamList, 'Step'>;

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';
Geocoder.init(GOOGLE_API_KEY);

export default function StepScreen({ route, navigation }: Props) {
    //Récupération des paramètres de navigation
    const { type, roadtripId, stepId: stepId, refresh } = route.params;
    console.log('Paramètres de navigation:', type, ', roadtripId:', roadtripId, ', stepId:', stepId);

    // États
    const [step, setStep] = useState<Step | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [coordinatesStep, setCoordinatesStep] = useState<{ latitude: number; longitude: number } | null>(null);
    const [coordinatesAccommodations, setCoordinatesAccommodations] = useState<Array<{
        address: string; latitude: number; longitude: number; name: string; arrivalDateTime: string
    }>>([]);
    const [coordinatesActivities, setCoordinatesActivities] = useState<Array<{
        address: string; latitude: number; longitude: number; name: string; arrivalDateTime: string
    }>>([]);
    const mapRef = useRef<MapView>(null);
    const [index, setIndex] = useState(0); // État pour suivre l'onglet actif
    const [routes, setRoutes] = useState([
        { key: 'infos', title: 'Infos' },
        // { key: 'planning', title: 'Planning' },
    ]);

    useEffect(() => {
        if (type === 'Stage') {
            setRoutes([
                { key: 'infos', title: 'Infos' },
                { key: 'accommodations', title: 'Hébergements' },
                { key: 'activities', title: 'Activités' },
                //{ key: 'planning', title: 'Planning' },
            ]);
        }
    }, [type]);


    // Appeler l'API lors du montage du composant
    useEffect(() => {
        fetchStep();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            // Bloquer l'action par défaut du retour
            e.preventDefault();

            // Naviguer vers RoadtripScreen
            console.log('Navigation vers RoadtripScreen', roadtripId);
            navigation.navigate('RoadTrip', { roadtripId });
        });

        // Nettoyage à la désactivation du composant
        return unsubscribe;
    }, [navigation]);

    // Fonction pour récupérer les coordonnées de l'étape
    const getCoordinates = async (address: string) => {
        try {
            const response = await Geocoder.from(address);
            const { lat, lng } = response.results[0].geometry.location;
            console.log(`Coordonnées pour ${address}:`);
            return { latitude: lat, longitude: lng };
        } catch (error) {
            console.warn('Erreur lors de la récupération des coordonnées:', error);
            return null; // Retourner null en cas d'erreur
        }
    };

    // Appeler l'API
    const fetchStep = async () => {
        try {
            const response = await fetch(`https://mon-petit-roadtrip.vercel.app/steps/${stepId}`);
            const data = await response.json();
            console.log('Données de l\'API:', data);

            const transformedData = {
                ...data,
                id: data._id,
            };
            setStep(transformedData);

            // Récupérer les coordonnées de l'adresse
            const coords = await getCoordinates(data.address);
            if (coords) {
                setCoordinatesStep(coords);
            }

            if (type === 'Stage') {
                const accommodations = data.accommodations;
                const accommodationCoords = await Promise.all(accommodations.map(async (accommodation: any) => {
                    const coords = await getCoordinates(accommodation.address);
                    return coords ? { ...accommodation, latitude: coords.latitude, longitude: coords.longitude } : null;
                }));
                setCoordinatesAccommodations(accommodationCoords.filter(coord => coord !== null));

                const activities = data.activities;
                const activityCoords = await Promise.all(activities.map(async (activity: any) => {
                    const coords = await getCoordinates(activity.address);
                    return coords ? { ...activity, latitude: coords.latitude, longitude: coords.longitude } : null;
                }));
                setCoordinatesActivities(activityCoords.filter(coord => coord !== null));
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'étape:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Utiliser un useEffect pour surveiller les changements de l'état step
    useEffect(() => {
        if (step) {
            console.log('Step mis à jour:', step.id, step.name, step.latitude, step.longitude);
        }
    }, [step]);

    // Utiliser un useEffect pour surveiller les changements des coordonnées
    useEffect(() => {
        if (coordinatesStep) {
            console.log('Coordonnées mises à jour:', coordinatesStep.latitude, coordinatesStep.longitude);
        }
    }, [coordinatesStep]);

    // Fonction pour ajuster la carte
    const adjustMap = () => {
        if (mapRef.current) {
            const allCoordinates = [
                coordinatesStep,
                ...coordinatesAccommodations,
                ...coordinatesActivities,
            ].filter(coord => coord && coord.latitude !== undefined && coord.longitude !== undefined);

            if (allCoordinates.length > 0) {
                console.log('Ajustement de la carte avec les coordonnées');
                mapRef.current.fitToCoordinates(allCoordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }
        }
    };

    // Ajuster la carte pour s'adapter aux marqueurs
    useEffect(() => {
        adjustMap();
    }, [coordinatesStep, coordinatesAccommodations, coordinatesActivities]);

    const renderMarkerAccommodations = useCallback(() => {
        if (!coordinatesAccommodations) return null;
        return coordinatesAccommodations.map((accommodation, index) => (
            <Marker
                key={`${accommodation.latitude}-${accommodation.longitude}`}
                coordinate={{
                    latitude: accommodation.latitude,
                    longitude: accommodation.longitude,
                }}
                title={accommodation.name}
                description={accommodation.address}
                tracksViewChanges={false}
            >
                <Fontawesome5 name="campground" size={24} color="green" />
            </Marker>
        ));
    }, [coordinatesAccommodations]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={fetchStep} style={{ padding: 10, marginRight: 10 }}>
                    <Fontawesome5 name="sync" size={20} color="black" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const renderMarkerActivities = useCallback(() => {
        if (!coordinatesActivities) return null;
        return coordinatesActivities.map((activity, index) => (
            <Marker
                key={`${activity.latitude}-${activity.longitude}`}
                coordinate={{
                    latitude: activity.latitude,
                    longitude: activity.longitude,
                }}
                title={activity.name}
                description={activity.address}
                tracksViewChanges={false}
            >
                <Fontawesome5 name="hiking" size={24} color="red" />
            </Marker>
        ));
    }, [coordinatesActivities]);

    const navigateToEditStepInfo = () => {
        navigation.navigate('EditStepInfo', { step: step, refresh: fetchStep });
    }

    const handleEventChange = async (event) => {
        const { id, startTime, endTime, type } = event;
        const updatedEvent = {
            startDateTime: startTime.toISOString(),
            endDateTime: endTime.toISOString(),
        };

        let uri = '';
        if (type === 'accommodation') {
            uri = `https://mon-petit-roadtrip.vercel.app/accommodations/${id}`;
        } else if (type === 'activity') {
            uri = `https://mon-petit-roadtrip.vercel.app/activities/${id}/dates`;
        }

        try {
            const response = await fetch(uri, {
                method: 'PATCH', // Utilisez PATCH au lieu de PUT
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedEvent),
            });

            if (response.ok) {
                console.log('Event updated successfully');
                // Mettre à jour l'état local des événements
                setStep((prevStep) => {
                    const updatedStep = { ...prevStep };
                    if (type === 'accommodation') {
                        updatedStep.accommodations = updatedStep.accommodations.map((accommodation) =>
                            accommodation._id === id ? { ...accommodation, arrivalDateTime: startTime, departureDateTime: endTime } : accommodation
                        );
                    } else if (type === 'activity') {
                        updatedStep.activities = updatedStep.activities.map((activity) =>
                            activity._id === id ? { ...activity, startDateTime: startTime, endDateTime: endTime } : activity
                        );
                    }
                    return updatedStep;
                });
            } else {
                console.error('Failed to update event');
            }
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const renderScene = SceneMap({
        infos: () => <GeneralInfo step={step} navigation={navigation} fetchStep={fetchStep} />,
        activities: () => type === 'Stage' ? <Activities step={step} navigation={navigation} fetchStep={fetchStep} /> : null,
        accommodations: () => type === 'Stage' ? <Accommodations step={step} navigation={navigation} fetchStep={fetchStep} /> : null,
        //planning: () => <Planning step={step} handleEventChange={handleEventChange} />,
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStep();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    if (!step || !coordinatesStep || coordinatesStep.latitude === undefined || coordinatesStep.longitude === undefined) {
        return (
            <View style={styles.errorContainer}>
                <Text>Erreur: Les coordonnées de l'étape ne sont pas disponibles.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={(ref) => {
                    mapRef.current = ref; // Assurez-vous que mapRef est mis à jour ici
                    console.log('MapView ref:'); // Ajoutez un log pour vérifier si la référence est attachée
                }}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: coordinatesStep.latitude,
                    longitude: coordinatesStep.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onMapReady={() => {
                    console.log('Carte prête.');
                    adjustMap();
                }}
            >
                {renderMarkerAccommodations()}
                {renderMarkerActivities()}
            </MapView>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: 0, height: 0 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        height: 400, // Ajoutez une hauteur fixe pour le MapView
    },
    tabContainer: {
        flex: 1,
    },
    tabContent: {
        padding: 16,
    },
    generalInfoContainer: {
        padding: 20,
        backgroundColor: "#fff",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    infoValue: {
        flex: 1,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 8,
    },
    editButton: {
        marginTop: 16,
    },
    card: {
        marginBottom: 16,
    },
    cardTitle: {
        fontWeight: 'bold',
    },
    thumbnail: {
        width: '100%',
        height: 150,
        marginBottom: 8,
    },
    mapButton: {
        marginTop: 8,
    },

    triangleButtonContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    triangleButton: {
        position: 'relative',
    },
});