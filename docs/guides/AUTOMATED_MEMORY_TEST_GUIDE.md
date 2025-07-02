# Guide d'Utilisation des Scripts de Test Mémoire Automatisés

> ⚠️ **NOUVEAU** : Les fichiers ont été réorganisés ! Utilisez `migrate-memory-tests.bat` pour migrer vers la nouvelle structure.

## 📁 Nouvelle Structure

```
testing/
├── memory/
│   ├── scripts/         # Scripts de test (.bat, .sh)
│   └── results/         # Résultats automatiques (.csv, .txt)
└── *.js                # Scripts de performance
```

## Vue d'ensemble

Nous avons créé 3 scripts différents pour tester les optimisations mémoire de manière automatisée :

1. **`testing/memory/scripts/automated-incremental-test.bat`** - Test interactif avec menu (Recommandé)
2. **`testing/memory/scripts/fully-automated-test.bat`** - Test entièrement automatisé
3. **`testing/memory/scripts/incremental-memory-test.bat`** - Script original (nécessite plus d'interaction)

## 🚀 Démarrage Rapide

### Migration (Si première utilisation)
```bash
# Migrer les scripts vers la nouvelle structure
migrate-memory-tests.bat

# Ou utiliser le lanceur direct
run-memory-tests.bat
```

### 1. Script Interactif avec Menu (Recommandé)

#### Utilisation
```bash
# Option 1: Lanceur depuis la racine
run-memory-tests.bat

# Option 2: Direct
cd testing/memory/scripts
automated-incremental-test.bat
```

### Menu disponible
1. **Baseline** - Test du code sans optimisations
2. **Images Optimized** - Test avec optimisations d'images uniquement
3. **FlatList Optimized** - Test avec optimisations FlatList uniquement
4. **States Optimized** - Test avec optimisations d'états uniquement
5. **All Optimized** - Test avec toutes les optimisations
6. **Test Complet Automatique** - Toutes les phases avec instructions
7. **Afficher les résultats** - Voir les résultats précédents
8. **Quitter**

### Avantages
- Flexible : testez une seule phase ou toutes
- Instructions claires pour chaque optimisation
- Navigation facile entre les options

### 2. Script Entièrement Automatisé

#### Utilisation
```bash
# Direct
cd testing/memory/scripts
fully-automated-test.bat
```

#### Fonctionnalités
- Test automatique de toutes les phases avec délais
- Navigation automatique simulée
- Analyse automatique des résultats
- Calcul automatique des améliorations

#### Prérequis
- L'app doit être installée et fonctionnelle
- Toutes les optimisations doivent être implémentées dans le code
- Vous devez être sur l'écran RoadTripsScreen au début
- L'écran ne doit pas être verrouillé

### Avantages
- Aucune intervention manuelle nécessaire
- Test rapide de toutes les phases
- Analyse automatique des résultats
- Calcul automatique du pourcentage d'amélioration

## Optimisations à Implémenter

### Phase 1: Images Optimized
Dans `RoadTripScreen.tsx`, ajoutez :
```typescript
// Réduire le cache d'images
const maxCachedImages = 5; // au lieu de 10

// GC forcé pour les images
useEffect(() => {
  const imageGCInterval = setInterval(() => {
    if (loadedImagesCount > maxCachedImages) {
      global.gc && global.gc();
    }
  }, 15000); // toutes les 15 secondes

  return () => clearInterval(imageGCInterval);
}, [loadedImagesCount]);
```

### Phase 2: FlatList Optimized
```typescript
<FlatList
  initialNumToRender={5}        // au lieu de 10
  maxToRenderPerBatch={3}       // au lieu de 10
  windowSize={3}                // au lieu de 10
  scrollEventThrottle={100}     // au lieu de 16
  onEndReachedThreshold={0.1}   // au lieu de 0.5
  removeClippedSubviews={true}
  // ... autres props
/>
```

### Phase 3: States Optimized
```typescript
// useCallback pour les fonctions
const handleStepPress = useCallback((step) => {
  // logique...
}, [/* dépendances */]);

// useMemo pour les calculs coûteux
const processedSteps = useMemo(() => {
  return steps.map(/* traitement */);
}, [steps]);

// Nettoyage dans useEffect
useEffect(() => {
  // setup...
  
  return () => {
    // cleanup listeners, timers, etc.
  };
}, []);
```

## Interprétation des Résultats

### Status
- **EXCELLENT** : < 10 MB d'augmentation
- **BON** : 10-20 MB d'augmentation
- **MODÉRÉ** : 20-50 MB d'augmentation
- **CRITIQUE** : > 50 MB d'augmentation

### Fichiers de Résultats
- Format CSV avec timestamp automatique
- Sauvegardés dans `testing/memory/results/`
- Colonnes : Date, Time, Phase, PSS_Before_KB, PSS_After_KB, Diff_KB, Diff_MB, Status
- Analyse automatique des améliorations

## 📊 Localisation des Résultats

Les résultats sont automatiquement sauvegardés dans :
- `testing/memory/results/automated_optimization_results_AAAAMMJJ.csv`
- `testing/memory/results/fully_automated_test_AAAAMMJJ.csv`
- `testing/memory/results/logcat*.txt`

## Méthodologie de Test

### Bonnes Pratiques
1. **Même roadtrip** : Utilisez toujours le même roadtrip pour tous les tests
2. **Conditions identiques** : Même appareil, même état de charge
3. **Redémarrage** : Redémarrez l'app entre les phases importantes
4. **Attente** : Laissez le temps à l'écran de se charger complètement

### Validation des Résultats
- Répétez les tests plusieurs fois pour confirmer
- Comparez avec les tests précédents
- Vérifiez que les optimisations sont bien actives

## Dépannage

### Erreurs Communes
1. **App non trouvée** : Vérifiez que l'app est installée
2. **Mesure impossible** : Vérifiez que l'app est ouverte et active
3. **Navigation échouée** : Ajustez les coordonnées de tap si nécessaire

### Configuration
- Modifiez `DELAY_SECONDS` pour ajuster les délais
- Changez `PACKAGE_NAME` si nécessaire
- Ajustez les coordonnées de tap dans le script automatisé

## Exemple de Résultats Typiques

```csv
Date,Time,Phase,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status
2024-01-15,14:30:00,Baseline,45000,125000,80000,78,CRITIQUE
2024-01-15,14:35:00,Images_Optimized,45000,85000,40000,39,MODÉRÉ
2024-01-15,14:40:00,FlatList_Optimized,45000,70000,25000,24,MODÉRÉ
2024-01-15,14:45:00,States_Optimized,45000,65000,20000,19,BON
2024-01-15,14:50:00,All_Optimized,45000,55000,10000,9,EXCELLENT
```

Dans cet exemple, les optimisations ont réduit la consommation de 78 MB à 9 MB, soit une amélioration de 88% !
