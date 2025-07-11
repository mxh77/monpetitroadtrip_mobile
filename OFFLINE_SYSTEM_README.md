# Système Offline-First pour Mon Petit Roadtrip

## 🎯 Objectif

Permettre à l'utilisateur de continuer à utiliser l'application même sans connexion réseau, avec synchronisation automatique dès que la connectivité revient.

## ✅ Fonctionnalités

- **Mode offline complet** : L'app fonctionne sans connexion
- **Synchronisation automatique** : Reprise dès que le réseau revient
- **Mises à jour optimistes** : L'interface répond immédiatement
- **Cache intelligent** : Réduction des appels réseau
- **Compatible existant** : Aucune modification backend requise
- **Queue de synchronisation** : Toutes les opérations sont sauvegardées

## 🏗️ Architecture

```
src/
├── services/
│   ├── OfflineManager.js          # Gestionnaire principal
│   ├── database/
│   │   └── SqliteDatabase.js      # Base de données locale
│   ├── network/
│   │   └── ConnectivityService.js # Détection réseau
│   ├── sync/
│   │   └── SyncService.js         # Synchronisation
│   └── repositories/
│       ├── BaseOfflineRepository.js
│       ├── RoadtripRepository.js
│       ├── StepRepository.js
│       ├── ActivityRepository.js
│       ├── AccommodationRepository.js
│       ├── TaskRepository.js
│       ├── ChatRepository.js
│       ├── StoryRepository.js
│       ├── AuthRepository.js
│       └── SettingsRepository.js
├── hooks/
│   └── useOffline.js              # Hooks React
├── components/
│   └── OfflineStatusBar.tsx       # Barre de statut
└── examples/
    └── ...                        # Exemples d'intégration
```

## 🚀 Installation

1. **Installer les dépendances :**
```bash
npm install @react-native-community/netinfo expo-sqlite
```

2. **Initialiser dans App.tsx :**
```tsx
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
```

## 📝 Utilisation

### Avec les Repositories (Recommandé)

```javascript
import { RoadtripRepository } from './src/services';

// Créer un roadtrip (optimiste)
const result = await RoadtripRepository.createRoadtrip(data, token);

// Récupérer des roadtrips (avec cache)
const roadtrips = await RoadtripRepository.getAllRoadtrips(token);

// Mettre à jour (optimiste)
await RoadtripRepository.updateRoadtrip(id, updates, token);
```

### Avec les Hooks React

```javascript
import { useRepository, useSyncStatus, useListData } from './src/hooks/useOffline';

const MyComponent = ({ token }) => {
  // Liste avec cache automatique
  const { data: roadtrips, isLoading, refresh } = useListData(
    'roadtrip', 
    'getAllRoadtrips', 
    [token]
  );
  
  // Statut de synchronisation
  const { isConnected, pendingOperations } = useSyncStatus();
  
  // Repository direct
  const { repository } = useRepository('roadtrip');
  
  const handleCreate = async (data) => {
    const result = await repository.createRoadtrip(data, token);
    await refresh(); // Rafraîchir la liste
  };
  
  return (
    <View>
      {!isConnected && (
        <Text>Mode offline - {pendingOperations} en attente</Text>
      )}
      {/* Votre UI */}
    </View>
  );
};
```

## 🔄 Migration depuis fetch()

### Avant :
```javascript
const response = await fetch(`${config.BACKEND_URL}/api/roadtrips`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});
const result = await response.json();
```

### Après :
```javascript
import { RoadtripRepository } from './src/services';

const result = await RoadtripRepository.createRoadtrip(data, token, {
  optimisticUpdate: true // Réponse immédiate + sync en arrière-plan
});
```

## 📱 Composants d'Interface

### Barre de Statut Offline

```jsx
<OfflineStatusBar 
  showDetails={true}
  autoHide={true}
  hideDelay={3000}
  onPress={(status) => {
    // Afficher détails de synchronisation
  }}
/>
```

### Hook de Statut

```javascript
const { 
  isConnected, 
  pendingOperations, 
  isRunning,
  forceSync 
} = useSyncStatus();

// Forcer une synchronisation
await forceSync();
```

## 🎯 Repositories Disponibles

| Repository | Endpoints couverts |
|------------|-------------------|
| `RoadtripRepository` | `/api/roadtrips/*`, `/api/roadtrips/ai` |
| `StepRepository` | `/api/roadtrips/{id}/steps/*`, `/api/steps/*` |
| `ActivityRepository` | `/api/roadtrips/{roadtripId}/steps/{stepId}/activities/*` |
| `AccommodationRepository` | `/api/roadtrips/{roadtripId}/steps/{stepId}/accommodations/*` |
| `TaskRepository` | `/api/roadtrips/{roadtripId}/tasks/*` |
| `ChatRepository` | `/api/roadtrips/{roadtripId}/chat/*` |
| `StoryRepository` | `/api/steps/{stepId}/story/*` |
| `AuthRepository` | `/api/auth/*` |
| `SettingsRepository` | `/api/settings` |

## 🔧 Configuration Avancée

### Personnaliser le TTL du Cache

```javascript
const roadtrips = await RoadtripRepository.getAllRoadtrips(token, {
  useCache: true,
  cacheTTL: 10 * 60, // 10 minutes
  forceRefresh: false
});
```

### Désactiver les Mises à Jour Optimistes

```javascript
const result = await RoadtripRepository.createRoadtrip(data, token, {
  optimisticUpdate: false // Attendre la réponse serveur
});
```

### Mode Multipart (Upload de Fichiers)

```javascript
const result = await StoryRepository.addPhotoToStory(stepId, formData, token, {
  isMultipart: true,
  optimisticUpdate: true
});
```

## 🐛 Debugging

### Diagnostic Complet

```javascript
import { OfflineManager } from './src/services';

const diagnostic = await OfflineManager.runDiagnostic();
console.log('Diagnostic:', diagnostic);
```

### Nettoyer les Données Locales

```javascript
await OfflineManager.clearAllLocalData();
```

### Statistiques d'Utilisation

```javascript
const stats = await OfflineManager.getUsageStats();
console.log('Stats:', stats); // { pendingOperations: 5, cachedItems: 120 }
```

## ⚡ Optimisations

1. **Cache First** : Les données sont servies depuis le cache en premier
2. **Synchronisation en arrière-plan** : Les mises à jour ne bloquent pas l'UI
3. **Backoff progressif** : Les retry sont espacés intelligemment
4. **Compression automatique** : Les données sont optimisées pour SQLite
5. **Nettoyage automatique** : Le cache expiré est supprimé automatiquement

## 🔒 Sécurité

- Les tokens sont stockés de manière sécurisée
- Les données sensibles peuvent être chiffrées
- La synchronisation respecte l'authentification
- Les conflits de données sont détectés et résolus

## 📊 Monitoring

Le système fournit des métriques détaillées :
- Nombre d'opérations en attente
- Taille du cache
- Temps de synchronisation
- Taux de succès des opérations
- État de la connectivité

## 🎉 Avantages

- ✅ **UX fluide** : L'app répond toujours instantanément
- ✅ **Robustesse** : Fonctionne même avec une connexion instable  
- ✅ **Performance** : Moins d'appels réseau grâce au cache
- ✅ **Fiabilité** : Aucune perte de données, même hors ligne
- ✅ **Simplicité** : API similaire à vos appels existants
- ✅ **Évolutivité** : Facile d'ajouter de nouveaux endpoints
