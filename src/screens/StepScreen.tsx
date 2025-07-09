import config from '../config';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator, 
    Modal, 
    ScrollView,
    Dimensions,
    Animated,
    SafeAreaView,
    StatusBar
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Step } from '../../types';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Geocoder from 'react-native-geocoding';
import Constants from 'expo-constants';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GeneralInfo from '../components/GeneralInfo';
import Accommodations from '../components/Accommodations';
import Activities from '../components/Activities';
import { TriangleCornerTopRight } from '../components/shapes';
import { getActivityTypeIcon, getActivityTypeColor } from '../utils/activityIcons';
import ChatLayout from '../components/ChatLayout';
import { useChatBot } from '../hooks/useChatBot';
import NotificationButton from '../components/NotificationButton';
import { useNotifications } from '../hooks/useNotifications';

const { width, height } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Step'>;

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';
Geocoder.init(GOOGLE_API_KEY);

export default function StepScreen({ route, navigation }: Props) {
    //Récupération des paramètres de navigation
    const { type, roadtripId, stepId: stepId, refresh } = route.params;

    // États
    const [step, setStep] = useState<Step | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // 🤖 Hook pour le chatbot
    const { isChatAvailable } = useChatBot(roadtripId);
    
    // 🔔 Hook pour les notifications
    const { getUnreadCount, boostPolling, unreadCount } = useNotifications(roadtripId);
    
    const [coordinatesStep, setCoordinatesStep] = useState<{ latitude: number; longitude: number } | null>(null);
    const [coordinatesAccommodations, setCoordinatesAccommodations] = useState<Array<{
        _id: string; address: string; latitude: number; longitude: number; name: string; arrivalDateTime: string; active?: boolean
    }>>([]);
    const [coordinatesActivities, setCoordinatesActivities] = useState<Array<{
        _id: string; address: string; latitude: number; longitude: number; name: string; arrivalDateTime: string; active?: boolean
    }>>([]);
    const mapRef = useRef<MapView>(null);
    const [index, setIndex] = useState(0);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const mapHeight = useRef(new Animated.Value(300)).current;
    
    // Configuration des onglets avec icônes et badges
    const [routes, setRoutes] = useState([
        { 
            key: 'infos', 
            title: 'Infos',
            icon: 'information-circle',
            iconLib: 'MaterialIcons'
        },
    ]);

    useEffect(() => {
        if (type === 'Stage') {
            setRoutes([
                { 
                    key: 'infos', 
                    title: 'Infos',
                    icon: 'information-circle',
                    iconLib: 'MaterialIcons'
                },
                { 
                    key: 'accommodations', 
                    title: 'Hébergements',
                    icon: 'bed',
                    iconLib: 'Fontawesome5'
                },
                { 
                    key: 'activities', 
                    title: 'Activités',
                    icon: 'hiking',
                    iconLib: 'Fontawesome5'
                },
            ]);
        } else if (type === 'Transport') {
            setRoutes([
                { 
                    key: 'infos', 
                    title: 'Infos',
                    icon: 'truck',
                    iconLib: 'Fontawesome5'
                },
            ]);
        }
    }, [type]);


    // Fonction pour basculer la taille de la carte
    const toggleMapSize = () => {
        setIsMapExpanded(!isMapExpanded);
        Animated.timing(mapHeight, {
            toValue: isMapExpanded ? 300 : height * 0.7,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    // Fonction pour centrer la carte sur tous les marqueurs
    const centerMapOnMarkers = () => {
        adjustMap();
    };

    // Fonction pour réinitialiser le zoom de la carte
    const resetMapZoom = () => {
        if (mapRef.current && coordinatesStep) {
            mapRef.current.animateToRegion({
                latitude: coordinatesStep.latitude,
                longitude: coordinatesStep.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }, 1000);
        }
    };

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
        setIsLoading(true);
        try {
            const response = await fetch(`${config.BACKEND_URL}/steps/${stepId}`);
            const data = await response.json();
            // console.log('Données de l\'API:', data);

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
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Utiliser un useEffect pour surveiller les changements de l'état step
    useEffect(() => {
        if (step) {
            // console.log('Step mis à jour:', step.id, step.name, step.latitude, step.longitude);
        }
    }, [step]);

    // Utiliser un useEffect pour surveiller les changements des coordonnées
    useEffect(() => {
        if (coordinatesStep) {
            // console.log('Coordonnées mises à jour:', coordinatesStep.latitude, coordinatesStep.longitude);
        }
    }, [coordinatesStep]);

    //Gestion des toggles pour les accommodations
    const toggleActiveStatusAccommodation = async (accommodation) => {
        const previousActive = accommodation.active; // Sauvegarder l'état précédent
        const updatedActive = !previousActive; // Inverser l'état actif

        try {
            // Mettre à jour localement les coordonnées des hébergements
            setCoordinatesAccommodations((prev) =>
                prev.map((acc) =>
                    acc._id === accommodation._id ? { ...acc, active: updatedActive } : acc
                )
            );

            // Mettre à jour localement l'état de l'accommodation dans `step`
            setStep((prevStep) => ({
                ...prevStep,
                accommodations: prevStep.accommodations.map((acc) =>
                    acc._id === accommodation._id ? { ...acc, active: updatedActive } : acc
                ),
            }));

            // Réajuster la carte
            adjustMap();

            // Envoyer la mise à jour au backend
            const response = await fetch(
                `${config.BACKEND_URL}/accommodations/${accommodation._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...accommodation, active: updatedActive }),
                }
            );

            if (response.ok) {
                console.log('Toggle Hébergement mis à jour avec succès');
            } else {
                console.error('Erreur lors de la mise à jour de l\'hébergement');
                // Restaurer l'état précédent en cas d'erreur
                setCoordinatesAccommodations((prev) =>
                    prev.map((acc) =>
                        acc._id === accommodation._id ? { ...acc, active: previousActive } : acc
                    )
                );
                setStep((prevStep) => ({
                    ...prevStep,
                    accommodations: prevStep.accommodations.map((acc) =>
                        acc._id === accommodation._id ? { ...acc, active: previousActive } : acc
                    ),
                }));
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            // Restaurer l'état précédent en cas d'erreur
            setCoordinatesAccommodations((prev) =>
                prev.map((acc) =>
                    acc._id === accommodation._id ? { ...acc, active: previousActive } : acc
                )
            );
            setStep((prevStep) => ({
                ...prevStep,
                accommodations: prevStep.accommodations.map((acc) =>
                    acc._id === accommodation._id ? { ...acc, active: previousActive } : acc
                ),
            }));
        }
    };

    //Gestion des toggles pour les activities
    const toggleActiveStatusActivity = async (activity) => {
        const previousActive = activity.active; // Sauvegarder l'état précédent
        const updatedActive = !previousActive; // Inverser l'état actif

        try {
            // Mettre à jour localement les coordonnées des hébergements
            setCoordinatesActivities((prev) =>
                prev.map((acc) =>
                    acc._id === activity._id ? { ...acc, active: updatedActive } : acc
                )
            );

            // Mettre à jour localement l'état de l'activity dans `step`
            setStep((prevStep) => ({
                ...prevStep,
                activities: prevStep.activities.map((acc) =>
                    acc._id === activity._id ? { ...acc, active: updatedActive } : acc
                ),
            }));

            // Réajuster la carte
            adjustMap();

            // Envoyer la mise à jour au backend
            const response = await fetch(
                `${config.BACKEND_URL}/activities/${activity._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...activity, active: updatedActive }),
                }
            );

            if (response.ok) {
                console.log('Toggle Activité mis à jour avec succès');
            } else {
                console.error('Erreur lors de la mise à jour de l\'hébergement');
                // Restaurer l'état précédent en cas d'erreur
                setCoordinatesActivities((prev) =>
                    prev.map((acc) =>
                        acc._id === activity._id ? { ...acc, active: previousActive } : acc
                    )
                );
                setStep((prevStep) => ({
                    ...prevStep,
                    activities: prevStep.activities.map((acc) =>
                        acc._id === activity._id ? { ...acc, active: previousActive } : acc
                    ),
                }));
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            // Restaurer l'état précédent en cas d'erreur
            setCoordinatesActivities((prev) =>
                prev.map((acc) =>
                    acc._id === activity._id ? { ...acc, active: previousActive } : acc
                )
            );
            setStep((prevStep) => ({
                ...prevStep,
                activities: prevStep.activities.map((acc) =>
                    acc._id === activity._id ? { ...acc, active: previousActive } : acc
                ),
            }));
        }
    };

    // Fonction pour ajuster la carte
    const adjustMap = () => {
        console.log('Ajustement de la carte avec les coordonnées');
        if (mapRef.current) {
            const allCoordinates = [
                coordinatesStep,
                ...coordinatesAccommodations.filter(acc => acc.active),
                ...coordinatesActivities.filter(act => act.active),
            ].filter(coord => coord && coord.latitude !== undefined && coord.longitude !== undefined);

            console.log('Coordonnées utilisées pour ajuster la carte:', allCoordinates);

            if (allCoordinates.length > 0) {
                // console.log('Ajustement de la carte avec les coordonnées');
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

    // Rendu des marqueurs avec des icônes personnalisées
    const renderMarkerAccommodations = useCallback(() => {
        if (!coordinatesAccommodations) return null;

        const activeAccommodations = coordinatesAccommodations.filter(accommodation => accommodation.active);

        return activeAccommodations.map((accommodation, index) => (
            <Marker
                key={`accommodation-${accommodation._id}`}
                coordinate={{
                    latitude: accommodation.latitude,
                    longitude: accommodation.longitude,
                }}
                title={accommodation.name}
                description={accommodation.address}
                tracksViewChanges={false}
            >
                <View style={styles.markerContainer}>
                    <View style={[styles.markerIcon, { backgroundColor: '#4CAF50' }]}>
                        <Fontawesome5 name="bed" size={16} color="white" />
                    </View>
                    <View style={styles.markerTriangle} />
                </View>
            </Marker>
        ));
    }, [coordinatesAccommodations]);

    // Rendu personnalisé de la barre d'onglets
    const renderTabBar = (props: any) => (
        <TabBar
            {...props}
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
            labelStyle={styles.tabLabel}
            activeColor="#007BFF"
            inactiveColor="#666"
            renderIcon={({ route, focused, color }) => {
                const routeConfig = routes.find(r => r.key === route.key);
                if (!routeConfig) return null;
                
                const IconComponent = routeConfig.iconLib === 'MaterialIcons' ? MaterialIcons : Fontawesome5;
                
                return (
                    <View style={styles.tabIconContainer}>
                        <IconComponent 
                            name={routeConfig.icon} 
                            size={20} 
                            color={color} 
                        />
                        {route.key === 'accommodations' && step?.accommodations?.length > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{step.accommodations.length}</Text>
                            </View>
                        )}
                        {route.key === 'activities' && step?.activities?.length > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{step.activities.length}</Text>
                            </View>
                        )}
                    </View>
                );
            }}
            renderLabel={({ route, focused, color }) => (
                <Text style={[styles.tabLabel, { color, fontSize: focused ? 12 : 11 }]}>
                    {route.title}
                </Text>
            )}
        />
    );

    const renderMarkerActivities = useCallback(() => {
        if (!coordinatesActivities) return null;

        const activeActivities = coordinatesActivities.filter(activity => activity.active);

        return activeActivities.map((activity, index) => (
            <Marker
                key={`activity-${activity._id}`}
                coordinate={{
                    latitude: activity.latitude,
                    longitude: activity.longitude,
                }}
                title={activity.name}
                description={activity.address}
                tracksViewChanges={false}
            >
                <View style={styles.markerContainer}>
                    <View style={[styles.markerIcon, { backgroundColor: getActivityTypeColor((activity as any).type || 'Randonnée') }]}>
                        <Fontawesome5 name={getActivityTypeIcon((activity as any).type || 'Randonnée')} size={16} color="white" />
                    </View>
                    <View style={styles.markerTriangle} />
                </View>
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
            uri = `${config.BACKEND_URL}/accommodations/${id}`;
        } else if (type === 'activity') {
            uri = `${config.BACKEND_URL}/activities/${id}/dates`;
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
        infos: () => (
            <ScrollView style={styles.sceneContainer}>
                <GeneralInfo step={step} navigation={navigation} fetchStep={fetchStep} />
            </ScrollView>
        ),
        activities: () => type === 'Stage' ? (
            <ScrollView style={styles.sceneContainer}>
                <Activities 
                    step={step} 
                    navigation={navigation} 
                    fetchStep={fetchStep} 
                    toggleActiveStatusActivity={toggleActiveStatusActivity} 
                />
            </ScrollView>
        ) : null,
        accommodations: () => type === 'Stage' ? (
            <ScrollView style={styles.sceneContainer}>
                <Accommodations 
                    step={step} 
                    navigation={navigation} 
                    fetchStep={fetchStep} 
                    toggleActiveStatusAccommodation={toggleActiveStatusAccommodation} 
                />
            </ScrollView>
        ) : null,
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStep();
    }, []);

    // Appeler l'API lors du montage du composant
    useEffect(() => {
        fetchStep();
    }, []);

    // Configuration du header personnalisé
    useEffect(() => {
        navigation.setOptions({
            headerStyle: {
                backgroundColor: '#007BFF',
                elevation: 0,
                shadowOpacity: 0,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            title: step?.name || 'Étape',
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <NotificationButton 
                        roadtripId={roadtripId}
                        unreadCount={unreadCount}
                        onPress={(roadtripId) => {
                            navigation.navigate('Notifications', { roadtripId });
                            boostPolling(roadtripId, 30000);
                        }}
                        style={{ marginRight: 10 }}
                        iconSize={18}
                        iconColor="white"
                    />
                    <TouchableOpacity onPress={fetchStep} style={styles.headerButton}>
                        <Fontawesome5 name="sync" size={18} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('StepStory', { stepId: step?.id })} 
                        style={styles.headerButton}
                    >
                        <Fontawesome5 name="book-open" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, step, roadtripId, unreadCount, boostPolling]);

    // Rendu du skeleton loading
    const SkeletonLoader = () => (
        <View style={styles.skeletonContainer}>
            <View style={styles.skeletonMap} />
            <View style={styles.skeletonTabBar} />
            <View style={styles.skeletonContent}>
                <View style={styles.skeletonCard} />
                <View style={styles.skeletonCard} />
                <View style={styles.skeletonCard} />
            </View>
        </View>
    );

    if (isLoading) {
        return <SkeletonLoader />;
    }

    if (!step || !coordinatesStep || coordinatesStep.latitude === undefined || coordinatesStep.longitude === undefined) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#FF5722" />
                <Text style={styles.errorText}>Erreur: Les coordonnées de l'étape ne sont pas disponibles.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchStep}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ChatLayout showChatButton={isChatAvailable}>
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#007BFF" barStyle="light-content" />
            
            {/* Carte avec contrôles */}
            <View style={styles.mapContainer}>
                <Animated.View style={[styles.mapWrapper, { height: mapHeight }]}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={{
                            latitude: coordinatesStep.latitude,
                            longitude: coordinatesStep.longitude,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        }}
                        onMapReady={adjustMap}
                        showsUserLocation={true}
                        showsMyLocationButton={false}
                    >
                        {/* Marqueur principal de l'étape */}
                        <Marker
                            coordinate={coordinatesStep}
                            title={step.name}
                            description={step.address}
                        >
                            <View style={styles.markerContainer}>
                                <View style={[styles.markerIcon, { backgroundColor: type === 'Transport' ? '#FF9800' : '#007BFF' }]}>
                                    {type === 'Transport' ? (
                                        <Fontawesome5 name="truck" size={20} color="white" />
                                    ) : (
                                        <MaterialIcons name="place" size={20} color="white" />
                                    )}
                                </View>
                                <View style={styles.markerTriangle} />
                            </View>
                        </Marker>
                        
                        {renderMarkerAccommodations()}
                        {renderMarkerActivities()}
                    </MapView>
                    
                    {/* Contrôles de la carte */}
                    <View style={styles.mapControls}>
                        <TouchableOpacity style={styles.mapControlButton} onPress={toggleMapSize}>
                            <MaterialIcons 
                                name={isMapExpanded ? "fullscreen-exit" : "fullscreen"} 
                                size={24} 
                                color="white" 
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mapControlButton} onPress={centerMapOnMarkers}>
                            <MaterialIcons name="my-location" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mapControlButton} onPress={resetMapZoom}>
                            <MaterialIcons name="zoom-out-map" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>

            {/* Onglets avec contenu */}
            <View style={styles.tabContainer}>
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    renderTabBar={renderTabBar}
                    onIndexChange={setIndex}
                    initialLayout={{ width }}
                    lazy={true}
                    swipeEnabled={true}
                />
            </View>
        </SafeAreaView>
        </ChatLayout>
    );
}

const styles = StyleSheet.create({
    // Conteneurs principaux
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    
    // Chargement et erreurs
    skeletonContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    skeletonMap: {
        height: 300,
        backgroundColor: '#e0e0e0',
        marginBottom: 2,
    },
    skeletonTabBar: {
        height: 48,
        backgroundColor: '#e0e0e0',
        marginBottom: 16,
    },
    skeletonContent: {
        flex: 1,
        paddingHorizontal: 16,
    },
    skeletonCard: {
        height: 120,
        backgroundColor: '#e0e0e0',
        borderRadius: 12,
        marginBottom: 16,
    },
    
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 32,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 16,
        lineHeight: 24,
    },
    retryButton: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Header
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        marginLeft: 16,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },

    // Carte
    mapContainer: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mapWrapper: {
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    mapControls: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'column',
    },
    mapControlButton: {
        backgroundColor: 'rgba(0, 123, 255, 0.9)',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    // Marqueurs
    markerContainer: {
        alignItems: 'center',
    },
    markerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    markerTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 0,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'white',
        marginTop: -1,
    },

    // Onglets
    tabContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    tabBar: {
        backgroundColor: 'white',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabIndicator: {
        backgroundColor: '#007BFF',
        height: 3,
        borderRadius: 2,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'none',
        marginTop: 4,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tabBadge: {
        position: 'absolute',
        top: -8,
        right: -12,
        backgroundColor: '#FF5722',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    tabBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Contenu des scènes
    sceneContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },

    // Styles hérités (conservés pour compatibilité)
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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