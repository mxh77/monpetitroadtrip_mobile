import { useState, useEffect, useCallback } from 'react';

interface TabPersistenceState {
  [roadtripId: string]: string;
}

// État global pour persister les onglets durant la session
let globalTabState: TabPersistenceState = {};

export const useTabPersistence = (roadtripId: string, defaultTab: string = 'Liste des étapes') => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger l'onglet sauvegardé au montage
  useEffect(() => {
    const loadActiveTab = () => {
      try {
        const savedTab = globalTabState[roadtripId];
        if (savedTab) {
          console.log('📱 Onglet restauré pour roadtrip', roadtripId, ':', savedTab);
          setActiveTab(savedTab);
        } else {
          console.log('📱 Aucun onglet sauvegardé pour roadtrip', roadtripId, ', utilisation du défaut:', defaultTab);
        }
      } catch (error) {
        console.warn('Erreur lors du chargement de l\'onglet actif:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    if (roadtripId) {
      loadActiveTab();
    } else {
      setIsLoaded(true);
    }
  }, [roadtripId, defaultTab]);

  // Fonction pour changer et sauvegarder l'onglet actuel
  const changeTab = useCallback((tabName: string) => {
    console.log('🎯 Persistance: Changement d\'onglet vers:', tabName, 'pour roadtrip:', roadtripId);
    setActiveTab(tabName);

    // Sauvegarder dans l'état global
    try {
      globalTabState[roadtripId] = tabName;
      console.log('✅ Onglet sauvegardé avec succès dans la session');
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde de l\'onglet actif:', error);
    }
  }, [roadtripId]);

  // Fonction pour forcer un onglet spécifique (utilisée par la navigation automatique)
  const forceTab = useCallback((tabName: string) => {
    console.log('🔄 Persistance: Onglet forcé vers:', tabName);
    changeTab(tabName);
  }, [changeTab]);

  return {
    activeTab,
    changeTab,
    forceTab,
    isLoaded
  };
};
