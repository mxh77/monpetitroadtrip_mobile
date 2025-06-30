// Solution alternative : Hook pour maintenir l'onglet actif
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export const useTabPersistence = () => {
  const currentTabRef = useRef<string | null>(null);

  const setCurrentTab = useCallback((tabName: string) => {
    currentTabRef.current = tabName;
  }, []);

  const getCurrentTab = useCallback(() => {
    return currentTabRef.current;
  }, []);

  // Sauvegarde l'onglet actif quand l'écran perd le focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cette fonction sera appelée quand l'écran perd le focus
        console.log('Tab persistence: Sauvegarde de l\'onglet actuel');
      };
    }, [])
  );

  return {
    setCurrentTab,
    getCurrentTab
  };
};
