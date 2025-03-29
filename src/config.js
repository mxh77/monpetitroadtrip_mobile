import { BACKEND_URL_DEV, BACKEND_URL_PROD, GOOGLE_API_KEY } from '@env';
import Constants from 'expo-constants';

console.log('Environnement détecté :', Constants.executionEnvironment);
console.log('URL Backend utilisée :', BACKEND_URL);

// Détecter l'environnement d'exécution
const isDevelopment =
    __DEV__ || // Mode développement dans React Native
    Constants.executionEnvironment === 'storeClient' || // Expo Go
    Constants.executionEnvironment === 'local'; // Développement local
const BACKEND_URL = isDevelopment ? BACKEND_URL_DEV : BACKEND_URL_PROD;

const config = {
    BACKEND_URL,
    GOOGLE_API_KEY
};

export default config;