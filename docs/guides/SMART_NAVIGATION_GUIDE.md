# Guide de Navigation Intelligente - Retour au Planning

## Problème résolu
Lorsqu'un utilisateur clique sur un événement dans le planning (AdvancedPlanning) et navigue vers un écran d'édition (EditActivity, EditAccommodation, etc.), le retour via le bouton "Étape" doit ramener l'utilisateur à l'onglet Planning et non à l'onglet "Liste des étapes".

## Solution implémentée

### 1. Paramètres de navigation enrichis (AdvancedPlanning.tsx)
Quand un utilisateur clique sur un événement depuis le planning, la navigation inclut des paramètres spéciaux :
```typescript
const commonParams = {
  refresh: onRefresh,
  returnTo: 'Planning', // Indique d'où vient l'utilisateur
  returnToTab: 'Planning' // Spécifie l'onglet de retour
};
```

### 2. Types étendus (types.ts)
Les types de navigation ont été étendus pour supporter ces nouveaux paramètres :
```typescript
RoadTrip: { roadtripId: string; returnToTab?: string; initialTab?: string };
EditActivity: { step: Step; activity: Activity; refresh: () => void; returnTo?: string; returnToTab?: string; };
EditAccommodation: { step: Step; accommodation: Accommodation; refresh: () => void; returnTo?: string; returnToTab?: string; };
EditStepInfo: { step: Step; refresh: () => void; returnTo?: string; returnToTab?: string; };
EditStageInfo: { stage: Step; refresh: () => void; returnTo?: string; returnToTab?: string; };
```

### 3. Navigation intelligente (utils/utils.ts)
La fonction `handleSmartNavigation` détecte si l'utilisateur vient du planning et navigue en conséquence :
```typescript
export const handleSmartNavigation = (navigation: any, returnTo?: string, returnToTab?: string) => {
  if (returnTo === 'Planning' && returnToTab === 'Planning') {
    // Navigation directe vers l'onglet Planning
    navigation.navigate('RoadTrip', {
      roadtripId: roadtripId,
      screen: 'Planning'
    });
  } else {
    // Navigation normale (goBack)
    navigation.goBack();
  }
};
```

### 4. Écrans d'édition mis à jour
Tous les écrans d'édition utilisent maintenant `handleSmartNavigation` au lieu de `navigation.goBack()` :
- EditActivityScreen.tsx
- EditAccommodationScreen.tsx
- EditStepInfoScreen.tsx
- EditStageInfoScreen.tsx

### 5. RoadTripScreen avec gestion d'onglet initial
Le RoadTripScreen peut maintenant recevoir un paramètre `initialTab` pour forcer l'affichage d'un onglet spécifique :
```typescript
const [tabInitialRouteName] = useState(initialTab || 'Liste des étapes');
```

## Flux de navigation

1. **Utilisateur dans le Planning** → Clique sur un événement
2. **AdvancedPlanning** → Navigue vers l'écran d'édition avec `returnTo: 'Planning'`
3. **Écran d'édition** → Utilisateur clique sur "Étape" (sauvegarde ou retour)
4. **handleSmartNavigation** → Détecte `returnTo: 'Planning'` et navigue vers `RoadTrip` avec `screen: 'Planning'`
5. **RoadTripScreen** → S'ouvre directement sur l'onglet Planning

## Test du système

Pour tester que le système fonctionne :
1. Aller dans le planning d'un roadtrip
2. Cliquer sur n'importe quel événement (activité, hébergement, stop)
3. Modifier quelque chose et sauvegarder OU simplement appuyer sur le bouton retour
4. Vérifier que vous revenez bien sur l'onglet Planning et non sur "Liste des étapes"

## Points d'attention

- Le système fonctionne uniquement pour les clics depuis le planning (AdvancedPlanning)
- Si l'utilisateur accède aux écrans d'édition depuis d'autres endroits, la navigation reste normale (`goBack()`)
- Les paramètres `returnTo` et `returnToTab` sont optionnels et n'affectent pas les autres flux de navigation
