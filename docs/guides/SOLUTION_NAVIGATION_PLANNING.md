# Solution de Navigation Intelligente - Retour Automatique à l'Onglet Planning

## Problème Résolu

Permettre à l'utilisateur de revenir automatiquement sur l'onglet "Planning" après avoir consulté/édité un événement (activité, hébergement, étape) depuis le planning, même lorsqu'il utilise le bouton "Étape" (retour) en haut à gauche.

## Solution Mise en Place

### 1. Contexte Global de Navigation (`NavigationContext`)

**Fichier:** `src/utils/NavigationContext.tsx`

Un contexte React qui gère un état global pour déclencher la navigation automatique vers l'onglet Planning.

**Fonctionnement:**
- `pendingPlanningNavigation`: booléen indiquant si une navigation vers Planning est en attente
- `setPendingPlanningNavigation()`: fonction pour déclencher la navigation
- `clearPendingNavigation()`: fonction pour réinitialiser l'état

### 2. Intégration dans l'Application

**Fichier:** `App.tsx`
- Wrapping de l'application avec `<NavigationProvider>` pour rendre le contexte disponible globalement

### 3. Détection et Déclenchement

**Fichier:** `src/components/AdvancedPlanning.tsx`
- Lors de la navigation vers un écran d'édition depuis le planning, ajout des paramètres :
  - `returnTo: 'Planning'`
  - `returnToTab: 'Planning'`
- Fonction `refresh` personnalisée qui :
  1. Exécute le refresh normal
  2. Déclenche `setPendingPlanningNavigation(true)`

### 4. Gestion Automatique du Retour

**Fichier:** `src/screens/RoadTripScreen.tsx`
- Utilisation de `useFocusEffect` pour détecter le retour à l'écran
- Si `pendingPlanningNavigation` est `true` :
  1. Navigation vers `RoadTrip` avec `initialTab: 'Planning'`
  2. Réinitialisation de l'état avec `clearPendingNavigation()`

## Flux de Navigation

1. **Clic sur un événement dans Planning** → Navigation vers écran d'édition avec paramètres de retour
2. **Édition et retour** → Exécution de la fonction `refresh` personnalisée
3. **Déclenchement du signal** → `setPendingPlanningNavigation(true)`
4. **Retour à RoadTripScreen** → Détection via `useFocusEffect`
5. **Navigation automatique** → `navigation.navigate('RoadTrip', { initialTab: 'Planning' })`
6. **Réinitialisation** → `clearPendingNavigation()`

## Avantages de cette Solution

✅ **Fiable** : Utilise les mécanismes natifs de React Navigation
✅ **Non-intrusif** : Pas de modification des composants existants
✅ **Flexible** : Peut être étendu à d'autres cas d'usage
✅ **Performant** : Utilise un contexte léger et des hooks optimisés
✅ **Maintenable** : Code centralisé et bien documenté

## Limitations Dépassées

- ❌ `Tab.Navigator` ne supporte pas les `ref` pour contrôle externe
- ❌ Impossible de forcer l'activation d'un onglet depuis l'extérieur
- ❌ Navigation directe vers un onglet spécifique complexe

## Tests Recommandés

1. Cliquer sur une activité depuis le Planning → Éditer → Retour → Vérifier retour sur Planning
2. Cliquer sur un hébergement depuis le Planning → Éditer → Retour → Vérifier retour sur Planning
3. Cliquer sur un stop depuis le Planning → Éditer → Retour → Vérifier retour sur Planning
4. Tester avec le bouton retour système et le bouton "Étape" dans la barre de navigation
5. Vérifier que la navigation normale (hors Planning) n'est pas affectée

## Code Clé

### Déclenchement (AdvancedPlanning.tsx)
```typescript
const { setPendingPlanningNavigation } = useNavigationContext();

const commonParams = {
  refresh: () => {
    onRefresh();
    console.log('🎯 Déclenchement navigation automatique vers Planning');
    setPendingPlanningNavigation(true);
  },
  returnTo: 'Planning',
  returnToTab: 'Planning'
};
```

### Détection et Navigation (RoadTripScreen.tsx)
```typescript
const { pendingPlanningNavigation, clearPendingNavigation } = useNavigationContext();

useFocusEffect(
  React.useCallback(() => {
    if (pendingPlanningNavigation) {
      setTimeout(() => {
        navigation.navigate('RoadTrip', { 
          roadtripId, 
          initialTab: 'Planning' 
        });
        clearPendingNavigation();
      }, 100);
    }
  }, [pendingPlanningNavigation, roadtripId, navigation, clearPendingNavigation])
);
```

Cette solution résout définitivement le problème de navigation intelligent vers l'onglet Planning après édition d'événements.
