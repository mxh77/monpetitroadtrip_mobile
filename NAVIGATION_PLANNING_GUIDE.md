# Guide de Navigation Intelligente pour le Planning

## Problème résolu
Lorsqu'un utilisateur clique sur un événement dans le planning (onglet "Planning") pour l'éditer, puis qu'il quitte l'écran d'édition, il retournait automatiquement à l'onglet "Liste des étapes" au lieu de revenir à l'onglet "Planning".

## Solution implémentée

### 1. Paramètres de navigation étendus
- Ajout de `returnTo` et `returnToTab` dans les types de navigation
- Ajout de `initialTab` dans les paramètres de `RoadTrip`

### 2. Navigation intelligente
La fonction `handleSmartNavigation` dans `src/utils/utils.ts` :
- Détecte quand l'utilisateur vient du planning
- Force la navigation vers l'onglet Planning via `navigation.navigate()` avec `initialTab: 'Planning'`
- Utilise `goBack()` classique pour les autres cas

### 3. Passage des paramètres
Dans `AdvancedPlanning.tsx`, la fonction `navigateToEditScreen` passe :
```typescript
const commonParams = {
  refresh: onRefresh,
  returnTo: 'Planning',
  returnToTab: 'Planning'
};
```

### 4. Gestion dans RoadTripScreen
- Lecture du paramètre `initialTab` 
- Configuration du `Tab.Navigator` avec `initialRouteName={tabInitialRouteName}`

## Test de la fonctionnalité

### Scénario 1 : Navigation depuis le Planning
1. Aller sur l'onglet "Planning"
2. Cliquer sur un événement (activité, hébergement, stop)
3. Modifier l'élément et sauvegarder (ou annuler)
4. ✅ **Résultat attendu** : Retour sur l'onglet "Planning"

### Scénario 2 : Navigation normale
1. Aller sur l'onglet "Liste des étapes" 
2. Cliquer sur une étape pour l'éditer
3. Modifier l'élément et sauvegarder (ou annuler)
4. ✅ **Résultat attendu** : Retour sur l'onglet "Liste des étapes"

## Écrans concernés
- `src/components/AdvancedPlanning.tsx` - Composant planning
- `src/screens/RoadTripScreen.tsx` - Écran principal avec onglets
- `src/screens/EditActivityScreen.tsx` - Édition d'activité
- `src/screens/EditAccommodationScreen.tsx` - Édition d'hébergement  
- `src/screens/EditStepInfoScreen.tsx` - Édition d'étape (Stop)
- `src/screens/EditStageInfoScreen.tsx` - Édition d'étape (Stage)
- `src/utils/utils.ts` - Fonction de navigation intelligente
- `types.ts` - Types TypeScript étendus

## Logs de debug
Pour diagnostiquer les problèmes, rechercher dans les logs :
- `🔄 Smart Navigation:` - Appel de la fonction de navigation intelligente
- `✅ Retour au planning détecté` - Détection du retour forcé vers Planning
- `🔄 RoadTripScreen - Paramètres reçus:` - Paramètres reçus par RoadTripScreen
