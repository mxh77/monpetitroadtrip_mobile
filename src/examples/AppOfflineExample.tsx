import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import OfflineStatusBar from '../components/OfflineStatusBar';

/**
 * Exemple d'intégration du système offline dans App.tsx
 * Copiez ce code dans votre App.tsx principal
 */
export default function AppOfflineExample() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initializeOfflineServices = async () => {
      try {
        console.log('🚀 Initialisation des services offline...');
        
        // TODO: Décommenter quand les services seront prêts
        // const { initializeOfflineServices } = await import('../services');
        // await initializeOfflineServices();
        
        // Simulation pour le moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setOfflineReady(true);
        console.log('✅ Services offline initialisés avec succès');
        
      } catch (error) {
        console.error('❌ Erreur initialisation offline:', error);
        setInitError(error.message);
        
        // L'app peut continuer à fonctionner sans le système offline
        Alert.alert(
          'Mode dégradé', 
          'Le système offline n\'est pas disponible, mais l\'app fonctionne normalement.'
        );
      }
    };

    initializeOfflineServices();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      
      {/* Barre de statut offline - Apparaît seulement si nécessaire */}
      <OfflineStatusBar 
        showDetails={__DEV__} 
        autoHide={true}
      />
      
      {/* Votre contenu d'app existant */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, marginBottom: 20 }}>
          Mon Petit Roadtrip
        </Text>
        
        {offlineReady ? (
          <Text style={{ color: 'green' }}>
            ✅ Système offline prêt
          </Text>
        ) : initError ? (
          <Text style={{ color: 'red' }}>
            ❌ Erreur: {initError}
          </Text>
        ) : (
          <Text style={{ color: 'orange' }}>
            🔄 Initialisation...
          </Text>
        )}
      </View>
    </View>
  );
}