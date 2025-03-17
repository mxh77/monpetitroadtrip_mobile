import { Linking } from 'react-native';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const openInGoogleMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
};

export const openWebsite = (url: string) => {
    Linking.openURL(url);
};

export const useCustomFetch = () => {
  const navigation = useNavigation();

  const customFetch = async (url, options) => {
    try {
      const response = await fetch(url, options);

      console.log('Réponse de l\'API:', response);

      if (response.status === 401) {
        Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
        navigation.navigate('Home' as never);
        return null;
      }

      return response;
    } catch (error) {
      console.error('Erreur lors de la requête:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la requête.');
      return null;
    }
  };

  return customFetch;
};
