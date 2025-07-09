import config from './src/config';
import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types'; // Importer le type
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RoadTripsScreen from './src/screens/RoadTripsScreen'; // Assurez-vous que le nom du fichier est correct
import RoadTripScreen from './src/screens/RoadTripScreen';
import EditRoadTripScreen from './src/screens/EditRoadTripScreen';
import StepScreen from './src/screens/StepScreen';
import StageScreen from './src/screens/StageScreen';
import StopScreen from './src/screens/StopScreen';
import CreateStepScreen from './src/screens/CreateStepScreen';
import AddStepNaturalLanguageScreen from './src/screens/AddStepNaturalLanguageScreen';
import AddActivityNaturalLanguageScreen from './src/screens/AddActivityNaturalLanguageScreen';
import EditStepInfoScreen from './src/screens/EditStepInfoScreen';
import EditStageInfoScreen from './src/screens/EditStageInfoScreen';
import EditStopInfoScreen from './src/screens/EditStopInfoScreen';
import EditAccommodationScreen from './src/screens/EditAccommodationScreen';
import EditActivityScreen from './src/screens/EditActivityScreen';
import HikeSuggestionsScreen from './src/screens/HikeSuggestionsScreen';
import ErrorsScreen from './src/screens/ErrorsScreen';
import StepStoryScreen from './src/screens/StepStoryScreen';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Importer l'icône
import SettingsScreen from './src/screens/SettingsScreen';
import TasksScreen from './src/screens/TasksScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import TaskEditScreen from './src/screens/TaskEditScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { CompressionProvider } from './src/utils/CompressionContext';
import CompressionProgressIndicator from './src/components/CompressionProgressIndicator';
import { NavigationProvider } from './src/utils/NavigationContext';
import { ChatProvider } from './src/context/ChatContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import CreateRoadtripAI from './src/screens/CreateRoadtripAI';

const Stack = createStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4A90E2',
    accent: '#f1c40f',
  },
};

export default function App() {
  console.log('Backend URL:', config.BACKEND_URL); // Vérifiez si l'URL est correcte
  return (
    <PaperProvider theme={theme}>
      <NotificationProvider
        pollingFrequency={3000}
        enablePushNotifications={false}
        useMockAPI={false}
      >
        <ChatProvider>
          <NavigationProvider>
            <CompressionProvider>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Home" id={undefined}>
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Se connecter' }} />
              <Stack.Screen
                name="RoadTrips"
                component={RoadTripsScreen}
                options={({ navigation, route }) => ({
                  headerTitle: 'MES ROADTRIPS',
                  headerTitleAlign: 'center', // Centrer le titre
                  headerRight: () => (
                    <Icon
                      name="logout"
                      size={24}
                      color="#007BFF"
                      onPress={() => navigation.navigate('Home')}
                      style={{ marginRight: 16 }}
                    />
                  ),
                  headerLeft: () => (
                    <Icon
                      name="refresh"
                      size={24}
                      color="#007BFF"
                      onPress={() => {
                        if (route.params?.refresh) {
                          route.params.refresh();
                        }
                      }}
                      style={{ marginLeft: 16 }}
                    />
                  ),
                })}
              />
              <Stack.Screen name="RoadTrip" component={RoadTripScreen} options={{ title: 'Mes RoadTrips' }} />
              <Stack.Screen name="EditRoadTrip" component={EditRoadTripScreen} options={{ title: 'Modifier le RoadTrip' }} />
              <Stack.Screen name="Step" component={StepScreen} options={{ title: 'Liste des étapes' }} />
              <Stack.Screen name="Stage" component={StageScreen} options={{ title: 'Liste des étapes' }} />
              <Stack.Screen name="Stop" component={StopScreen} options={{ title: 'Liste des étapes' }} />
              <Stack.Screen name="CreateStep" component={CreateStepScreen} options={{ title: 'Etape' }} />
              <Stack.Screen name="AddStepNaturalLanguage" component={AddStepNaturalLanguageScreen} options={{ title: 'Ajouter une étape via IA' }} />
              <Stack.Screen name="AddActivityNaturalLanguage" component={AddActivityNaturalLanguageScreen} options={{ title: 'Ajouter une activité via IA' }} />
              <Stack.Screen name="EditStepInfo" component={EditStepInfoScreen} options={{ title: 'Etape' }} />
              <Stack.Screen name="EditStageInfo" component={EditStageInfoScreen} options={{ title: 'Etape' }} />
              <Stack.Screen name="EditStopInfo" component={EditStopInfoScreen} options={{ title: 'Arrêt' }} />
              <Stack.Screen name="EditAccommodation" component={EditAccommodationScreen} options={{ title: 'Etape' }} />
              <Stack.Screen name="EditActivity" component={EditActivityScreen} options={{ title: 'Etape' }} />
              <Stack.Screen name="HikeSuggestions" component={HikeSuggestionsScreen} options={{ title: 'Suggestions de Randonnées' }} />
              <Stack.Screen
                name="StepStory"
                component={StepStoryScreen}
                options={{ title: 'Récit du Step' }}
              />
              <Stack.Screen name="Errors" component={ErrorsScreen} options={{ title: 'Erreurs détectées' }} />
              <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Tâches' }} />
              <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Détail de la tâche' }} />
              <Stack.Screen name="TaskEdit" component={TaskEditScreen} options={{ title: 'Éditer la tâche' }} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />
              <Stack.Screen name="CreateRoadtripAI" component={CreateRoadtripAI} options={{ title: "Créer un roadtrip via l'IA" }} />
            </Stack.Navigator>
            <CompressionProgressIndicator />
          </NavigationContainer>
        </CompressionProvider>
      </NavigationProvider>
      </ChatProvider>
      </NotificationProvider>
    </PaperProvider>
  );
}