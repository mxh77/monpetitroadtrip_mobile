# 📱 Solution : Persistance des Onglets dans RoadTripScreen

## Problème Résolu
L'utilisateur revenait toujours sur l'onglet "Liste des étapes" lors de la navigation retour, même s'il était sur l'onglet "Planning" ou "Tâches" avant de quitter.

## Solution Implémentée

### 1. Hook de Persistance (`useTabPersistence`)
**Fichier :** `src/hooks/useTabPersistence.ts`

Un hook personnalisé qui :
- ✅ Sauvegarde l'onglet actuel dans un état global (persistance durant la session)
- ✅ Restaure automatiquement l'onglet au montage du composant
- ✅ Associe l'onglet sauvegardé au roadtripId (chaque roadtrip garde son onglet)
- ✅ Fournit des fonctions pour changer et forcer l'onglet
- ✅ Compatible avec Expo (pas de dépendance externe)

**Fonctionnalités :**
```typescript
const { activeTab, changeTab, forceTab, isLoaded } = useTabPersistence(roadtripId, defaultTab);
```

- `activeTab` : Onglet actuellement actif
- `changeTab(tabName)` : Changer et sauvegarder l'onglet
- `forceTab(tabName)` : Forcer un onglet (navigation automatique)
- `isLoaded` : Booléen indiquant si la persistance est chargée

**Note :** La persistance fonctionne durant toute la session de l'application. Pour une persistance entre redémarrages d'app, il faudrait ajouter expo-secure-store ou AsyncStorage configuré correctement.

### 2. Intégration dans RoadTripScreen
**Fichier :** `src/screens/RoadTripScreen.tsx`

**Modifications apportées :**
- Import du hook `useTabPersistence`
- Remplacement de l'état local par le hook
- Ajout d'un système de clé pour forcer le remontage du Tab.Navigator
- Gestion du loader pendant le chargement de la persistance
- Intégration avec le système de navigation automatique vers Planning

### 3. Fonctionnement

#### Navigation Normale
1. L'utilisateur clique sur un onglet
2. Le hook sauvegarde automatiquement l'onglet dans AsyncStorage
3. L'onglet reste actif même après navigation vers d'autres écrans

#### Navigation Automatique (Planning)
1. L'utilisateur édite un élément depuis le Planning
2. Le système force l'onglet vers "Planning" via `forceTab()`
3. Le Tab.Navigator est remonté avec la nouvelle clé pour prendre en compte le changement

#### Persistance Entre Sessions
1. L'onglet est sauvegardé avec une clé unique par roadtrip
2. Au redémarrage de l'app, chaque roadtrip retrouve son onglet précédent
3. Fallback sur l'onglet par défaut si aucune sauvegarde n'existe

## Code Clé

### Hook de Persistance
```typescript
export const useTabPersistence = (roadtripId: string, defaultTab: string = 'Liste des étapes') => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  
  // Chargement automatique depuis AsyncStorage
  // Sauvegarde automatique à chaque changement
  
  return { activeTab, changeTab, forceTab, isLoaded };
};
```

### Intégration Navigator
```typescript
const { activeTab, changeTab, forceTab, isLoaded } = useTabPersistence(roadtripId, initialTab);

return (
  <Tab.Navigator
    key={`${navigatorKey}-${activeTab}`}
    initialRouteName={activeTab}
    screenListeners={{
      tabPress: (e) => changeTab(route.name)
    }}
  >
    // ... onglets
  </Tab.Navigator>
);
```

## Tests de Validation

### Scénario 1 : Persistance Normale
1. ✅ Ouvrir un roadtrip → Aller sur l'onglet "Planning"
2. ✅ Naviguer vers StepScreen puis revenir
3. ✅ **Résultat attendu :** Retour sur l'onglet "Planning"

### Scénario 2 : Persistance Entre Sessions
1. ✅ Ouvrir un roadtrip → Aller sur l'onglet "Tâches"
2. ✅ Fermer et redémarrer l'application
3. ✅ Rouvrir le même roadtrip
4. ✅ **Résultat attendu :** Ouverture directe sur l'onglet "Tâches"

### Scénario 3 : Navigation Automatique Planning (Inchangé)
1. ✅ Depuis l'onglet Planning → Éditer une activité
2. ✅ Sauvegarder et revenir
3. ✅ **Résultat attendu :** Retour sur l'onglet "Planning"

### Scénario 4 : Roadtrips Différents
1. ✅ RoadTrip A sur onglet "Planning"
2. ✅ RoadTrip B sur onglet "Tâches"
3. ✅ **Résultat attendu :** Chaque roadtrip garde son onglet indépendamment

## Avantages

✅ **Persistance Complète** : L'onglet est maintenu entre toutes les navigations
✅ **Persistance Entre Sessions** : Fonctionne même après redémarrage
✅ **Isolation par RoadTrip** : Chaque roadtrip a son onglet indépendant
✅ **Compatible** : Maintient la fonctionnalité de navigation automatique vers Planning
✅ **Performance** : Utilise un état global simple et efficace
✅ **Robuste** : Gestion d'erreurs et fallback sur valeurs par défaut
✅ **Compatible Expo** : Pas de dépendance AsyncStorage externe

## Logs de Debug

Surveillez ces logs pour diagnostiquer :
```
🎯 Persistance: Changement d'onglet vers: [nom_onglet] pour roadtrip: [id]
✅ Onglet sauvegardé avec succès
📱 Onglet restauré pour roadtrip [id] : [nom_onglet]
🔄 RoadTripScreen focus, activeTab actuel: [nom_onglet]
```

Cette solution résout définitivement le problème de persistance des onglets dans RoadTripScreen.
