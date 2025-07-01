# DIAGNOSTIC SIMPLE - Performance Mon Petit Road Trip

## 🎯 Objectif
Identifier la cause principale du ralentissement progressif de l'application

## 📊 Questions de diagnostic

### 1. Comportement observé
- ❓ L'application devient-elle plus lente après avoir navigué plusieurs fois ?
- ❓ La lenteur apparaît-elle sur tous les écrans ou des écrans spécifiques ?
- ❓ Y a-t-il des écrans qui posent particulièrement problème ?

### 2. Écrans problématiques potentiels
- `RoadTripsScreen` - Liste des roadtrips
- `RoadTripScreen` - Détails d'un roadtrip avec onglets
- `StepScreen` - Détails d'une étape
- `EditRoadTripScreen` - Édition de roadtrip

### 3. Activation du monitoring natif

**Pour tester immédiatement :**
1. Lancez votre application
2. Secouez l'appareil ou appuyez sur Ctrl+M (émulateur)
3. Sélectionnez "Performance Monitor" 
4. Observez ces métriques :
   - **RAM** (doit rester < 200MB)
   - **JS Heap** (doit rester < 100MB)
   - **FPS** (doit rester proche de 60)

### 4. Test de navigation
1. Naviguez entre 3-4 écrans différents
2. Revenez à l'écran principal
3. Répétez 5-6 fois
4. Observez si les métriques augmentent constamment

## 📋 Résultats attendus du diagnostic

Si vous observez :
- **RAM qui augmente constamment** → Fuite mémoire
- **JS Heap qui grossit** → Objets non libérés
- **FPS qui chute** → Re-renders excessifs
- **Navigation lente** → Composants non optimisés

## ➡️ Prochaine étape
Une fois ce diagnostic fait, nous appliquerons **UNE SEULE CORRECTION** à la fois et testerons l'impact.
