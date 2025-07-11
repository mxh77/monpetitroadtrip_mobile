# Guide de Migration - Système Offline-First

## 🎯 Stratégie de Migration Progressive

Pour minimiser les risques de régression, nous procédons par étapes :

### Phase 1 : Installation et Test (✅ Terminée)
- ✅ Infrastructure offline créée
- ✅ Repositories pour tous vos endpoints
- ✅ Système de synchronisation
- ✅ Cache SQLite
- ✅ Détection de connectivité

### Phase 2 : Migration Graduelle (Recommandée)

## 📝 Plan de Migration par Composant

### 1. AdvancedPlanning.tsx - PRIORITÉ HAUTE

**Problème actuel :** Appels fetch directs dans la gestion des événements

**Migration :**
```tsx
// AVANT (lignes 307-360)
response = await fetch(`${config.BACKEND_URL}/activities/${event.id}/dates`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ startDateTime: newStartDateTime, endDateTime: newEndDateTime })
});

// APRÈS
import { ActivityRepository, StepRepository, AccommodationRepository } from '../services';

const handleEventChange = async (event, newStartDateTime, newEndDateTime) => {
  // Mise à jour optimiste (instantanée)
  const updatedEvents = events.map(e => 
    e.id === event.id ? { ...e, start: newStartDateTime, end: newEndDateTime } : e
  );
  setEvents(updatedEvents);

  try {
    // Synchronisation en arrière-plan
    if (event.type === 'activity') {
      await ActivityRepository.updateActivityDates(event.id, {
        startDateTime: newStartDateTime,
        endDateTime: newEndDateTime
      }, token);
    } else if (event.type === 'accommodation') {
      await AccommodationRepository.updateAccommodationDates(event.id, {
        arrivalDateTime: newStartDateTime,
        departureDateTime: newEndDateTime
      }, token);
    } else if (event.type === 'step') {
      await StepRepository.updateStepDates(event.stepId, {
        arrivalDateTime: newStartDateTime,
        departureDateTime: newEndDateTime
      }, token);
    }
  } catch (error) {
    // La synchronisation sera retentée automatiquement
    console.log('Synchronisation programmée pour plus tard');
  }
};
```

**Avantages :**
- ✅ Réponse UI instantanée (même hors ligne)
- ✅ Synchronisation automatique en arrière-plan
- ✅ Pas de régression fonctionnelle

### 2. ChatBot.tsx - PRIORITÉ MOYENNE

**Migration :**
```tsx
// AVANT (ligne 72+)
const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/chat/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  },
  body: JSON.stringify({ query: currentInput, conversationId }),
});

// APRÈS
import { ChatRepository } from '../services';
import { useSyncStatus } from '../hooks/useOffline';

const ChatBotComponent = () => {
  const { isConnected } = useSyncStatus();

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (isConnected) {
        // Mode connecté - réponse IA en temps réel
        const response = await ChatRepository.sendChatQuery(
          roadtripId, 
          userMessage.content, 
          conversationId, 
          token
        );
        
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response.data.content,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        // Mode offline - sauvegarder localement
        await ChatRepository.saveChatMessageLocally(
          roadtripId, 
          conversationId, 
          userMessage
        );
        
        setMessages(prev => [...prev, {
          id: `offline_${Date.now()}`,
          role: 'assistant',
          content: 'Message sauvegardé. Je répondrai dès que la connexion sera rétablie.',
          timestamp: new Date().toISOString(),
          isOffline: true
        }]);
      }
    } catch (error) {
      console.error('Erreur chat:', error);
    } finally {
      setIsLoading(false);
    }
  };
};
```

### 3. Ecrans de Liste (Roadtrips, Steps, etc.) - PRIORITÉ MOYENNE

**Migration avec hooks :**
```tsx
import { useListData, useSyncStatus } from '../hooks/useOffline';

const RoadtripsScreen = ({ token }) => {
  // Remplacement de tous les useState et fetch
  const { 
    data: roadtrips, 
    isLoading, 
    error, 
    refresh 
  } = useListData('roadtrip', 'getAllRoadtrips', [token]);
  
  const { isConnected, pendingOperations } = useSyncStatus();

  const handleCreateRoadtrip = async (data) => {
    try {
      const result = await RoadtripRepository.createRoadtrip(data, token);
      await refresh(); // Rafraîchir la liste
      navigation.navigate('RoadtripDetail', { roadtripId: result.data._id });
    } catch (error) {
      Alert.alert('Erreur', 'Création en cours... Sera synchronisé plus tard.');
    }
  };

  return (
    <View>
      <OfflineStatusBar />
      {/* Votre UI existante */}
    </View>
  );
};
```

## 🔧 Intégration Progressive

### Étape 1 : Initialisation Globale

**Dans App.tsx :**
```tsx
import { initializeOfflineServices } from './src/services';
import OfflineStatusBar from './src/components/OfflineStatusBar';

export default function App() {
  useEffect(() => {
    initializeOfflineServices()
      .then(() => console.log('✅ Offline services ready'))
      .catch(error => console.error('❌ Offline init error:', error));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OfflineStatusBar showDetails={__DEV__} />
      {/* Votre app existante */}
    </View>
  );
}
```

### Étape 2 : Migration d'un Composant Test

Commencer par un composant simple pour valider :

```tsx
// Choisir un composant avec peu d'appels API
const SimpleTestComponent = () => {
  const { data, isLoading, error } = useListData('roadtrip', 'getAllRoadtrips', [token]);
  
  if (error && !data?.length) {
    return <Text>Mode offline - aucune donnée disponible</Text>;
  }
  
  return (
    <FlatList 
      data={data}
      renderItem={({ item }) => (
        <Text>{item.title} {item._isPending && '(sync...)'}</Text>
      )}
    />
  );
};
```

### Étape 3 : Migration du Planning (Critique)

**Test en parallèle :**
```tsx
const AdvancedPlanning = () => {
  const [useOfflineMode, setUseOfflineMode] = useState(__DEV__); // Toggle en dev

  const handleEventChangeOffline = async (event, start, end) => {
    // Nouvelle méthode avec repositories
  };

  const handleEventChangeLegacy = async (event, start, end) => {
    // Ancienne méthode avec fetch
  };

  return (
    <View>
      {__DEV__ && (
        <Switch 
          value={useOfflineMode}
          onValueChange={setUseOfflineMode}
          title="Mode Offline"
        />
      )}
      <YourPlanningComponent 
        onEventChange={useOfflineMode ? handleEventChangeOffline : handleEventChangeLegacy}
      />
    </View>
  );
};
```

## 📊 Validation et Tests

### Scénarios de Test

1. **Mode connecté normal :**
   - Toutes les opérations fonctionnent comme avant
   - Performance améliorée grâce au cache

2. **Mode offline :**
   - L'UI répond instantanément
   - Les modifications sont sauvegardées localement
   - Indicateur de statut visible

3. **Reconnexion :**
   - Synchronisation automatique
   - Résolution des conflits
   - Mise à jour des données

4. **Connexion instable :**
   - Retry automatique
   - Pas de perte de données
   - UX fluide

### Commandes de Test

```bash
# Test en mode développement
npm start

# Test de build
npm run android:debug

# Simulation de perte de réseau
# (utiliser les dev tools du simulateur)
```

## 🚨 Points d'Attention

### Changements Requis Minimaux

1. **Imports :** Ajouter les nouveaux services
2. **Initialisation :** Une ligne dans App.tsx
3. **Remplacer fetch() :** Par les repositories
4. **Gestion d'erreur :** Adapter pour le mode offline

### Aucun Changement Requis

- ✅ Structure de données existante
- ✅ Logique métier
- ✅ Navigation
- ✅ Styles/UI
- ✅ Backend/API

## 🎉 Résultats Attendus

Après migration complète :

- 📱 **UX améliorée** : Réponse instantanée même hors ligne
- 🚀 **Performance** : Moins d'appels réseau, cache intelligent
- 🔄 **Fiabilité** : Synchronisation automatique, pas de perte de données
- 🛡️ **Robustesse** : Gestion des connexions instables
- 📊 **Monitoring** : Visibilité sur le statut de synchronisation

## 📞 Support

En cas de problème :
1. Vérifier les logs de synchronisation
2. Utiliser `OfflineManager.runDiagnostic()`
3. Tester avec les exemples fournis
4. Rollback possible vers l'ancien système fetch()
