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

/**
 * Gère intelligemment la navigation de retour selon d'où vient l'utilisateur
 * @param navigation - Objet de navigation React Navigation
 * @param returnTo - D'où vient l'utilisateur (ex: 'Planning')
 * @param returnToTab - Onglet de retour spécifique (ex: 'Planning')
 */
export const handleSmartNavigation = (
  navigation: any, 
  returnTo?: string, 
  returnToTab?: string
) => {
  console.log('🔄 Smart Navigation:', { returnTo, returnToTab });
  
  if (returnTo === 'Planning' && returnToTab === 'Planning') {
    // Si l'utilisateur vient du planning, on force le retour vers l'onglet Planning
    console.log('✅ Retour au planning détecté - Navigation forcée vers l\'onglet Planning');
    
    // Au lieu d'utiliser goBack(), on navigue explicitement vers l'onglet Planning
    // On doit d'abord obtenir les paramètres du roadtrip actuel
    const state = navigation.getState();
    const roadTripRoute = state.routes.find((route: any) => route.name === 'RoadTrip');
    const roadtripId = roadTripRoute?.params?.roadtripId;
    
    if (roadtripId) {
      // Navigation directe vers l'onglet Planning du RoadTrip
      navigation.navigate('RoadTrip', {
        roadtripId: roadtripId,
        screen: 'Planning' // Utiliser screen au lieu d'initialTab pour forcer l'onglet
      });
    } else {
      console.warn('❌ roadtripId non trouvé, fallback vers goBack()');
      navigation.goBack();
    }
  } else {
    // Navigation normale (goBack)
    console.log('✅ Navigation normale (goBack)');
    navigation.goBack();
  }
};
