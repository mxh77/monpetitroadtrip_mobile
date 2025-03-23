import Constants from 'expo-constants';

// const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL;
const BACKEND_URL = 'https://mon-petit-roadtrip.vercel.app'
// const BACKEND_URL = 'http://192.168.1.2:3000'
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey;

const config = {
    BACKEND_URL,
    GOOGLE_API_KEY
};

export default config;