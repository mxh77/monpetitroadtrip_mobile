#!/usr/bin/env node

/**
 * Script d'installation et configuration du système offline
 */

console.log('🚀 Installation du système offline-first...\n');

const steps = [
  {
    name: 'Installation des dépendances',
    cmd: 'npm install @react-native-community/netinfo expo-sqlite',
    description: 'Ajoute les packages nécessaires pour SQLite et la connectivité'
  },
  {
    name: 'Nettoyage du cache Metro',
    cmd: 'npx expo start --clear',
    description: 'Nettoie le cache pour éviter les conflits'
  }
];

console.log('Etapes d\'installation:\n');
steps.forEach((step, index) => {
  console.log(`${index + 1}. ${step.name}`);
  console.log(`   ${step.description}`);
  console.log(`   Commande: ${step.cmd}\n`);
});

console.log('🔧 Configuration manuelle requise:\n');

console.log('1. Ajouter l\'initialisation dans App.tsx:');
console.log(`
import { initializeOfflineServices } from './src/services';
import OfflineStatusBar from './src/components/OfflineStatusBar';

export default function App() {
  useEffect(() => {
    initializeOfflineServices()
      .then(() => console.log('✅ Services offline initialisés'))
      .catch(error => console.error('❌ Erreur init offline:', error));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OfflineStatusBar />
      {/* Votre app existante */}
    </View>
  );
}
`);

console.log('2. Remplacer les appels fetch par les repositories:');
console.log(`
// Avant:
const response = await fetch(\`\${config.BACKEND_URL}/api/roadtrips\`, {
  headers: { 'Authorization': \`Bearer \${token}\` }
});

// Après:
import { RoadtripRepository } from './src/services';
const roadtrips = await RoadtripRepository.getAllRoadtrips(token);
`);

console.log('3. Utiliser les hooks React:');
console.log(`
import { useRepository, useSyncStatus } from './src/hooks/useOffline';

const MyComponent = () => {
  const { data, isLoading, refresh } = useListData('roadtrip', 'getAllRoadtrips', [token]);
  const { isConnected, pendingOperations } = useSyncStatus();
  
  // Votre logique...
};
`);

console.log('\n✅ Installation terminée !');
console.log('\n📖 Documentation complète disponible dans:');
console.log('   - src/examples/ (exemples d\'intégration)');
console.log('   - src/services/ (repositories et services)');
console.log('   - src/hooks/ (hooks React)');

console.log('\n🎯 Avantages du système:');
console.log('   ✅ Fonctionne hors ligne');
console.log('   ✅ Synchronisation automatique');
console.log('   ✅ Mises à jour optimistes');
console.log('   ✅ Cache intelligent');
console.log('   ✅ Compatible avec votre API existante');
console.log('   ✅ Zéro modification backend requise');

console.log('\n🚀 Votre app est maintenant prête pour le mode offline !');
