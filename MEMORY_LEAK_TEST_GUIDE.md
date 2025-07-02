# 🧪 Guide de Test de Fuites Mémoire - RoadTripScreen

## Contexte
Vos mesures ADB ont révélé une fuite mémoire importante :
- **Avant navigation** : 428,378 KB (~418 MB)
- **Après navigation** : 811,309 KB (~792 MB)
- **Augmentation** : 382,931 KB (~374 MB) 🚨

## Outils de Monitoring Disponibles

### 1. Monitoring en Temps Réel (Code)
Le code `RoadTripScreen.tsx` contient maintenant :
- ✅ Mesures mémoire JS au montage/démontage
- ✅ Tracking des images chargées
- ✅ Monitoring mémoire au focus/navigation
- ✅ Nettoyage forcé périodique

### 2. Scripts de Test Automatisés

#### Windows : `memory-leak-test.bat` (Version Standard)
```bash
# Lancer le test automatisé
.\memory-leak-test.bat
```

#### Windows : `memory-leak-test-improved.bat` (Version Améliorée)
```bash
# Version avec meilleure extraction des données et encodage corrigé
.\memory-leak-test-improved.bat
```

#### Linux/Mac : `memory-leak-test.sh`
```bash
# Rendre exécutable
chmod +x memory-leak-test.sh

# Lancer le test
./memory-leak-test.sh
```

**Note** : Les problèmes d'encodage dans les versions Windows ont été corrigés. Utilisez la version "improved" pour de meilleurs résultats.

## Procédure de Test

### Étape 1 : Préparation
1. **Démarrer l'application** sur le dispositif/émulateur
2. **Aller à l'écran d'accueil** (RoadTripsScreen)
3. **Ouvrir les logs** : `adb logcat | grep "🧪\|🖼️\|🧹"`

### Étape 2 : Test Manuel
```bash
# Mesure AVANT
adb shell dumpsys meminfo com.maxime.heron.monpetitroadtrip.debug | findstr "TOTAL PSS"

# [NAVIGATION vers RoadTripScreen]

# Mesure APRÈS
adb shell dumpsys meminfo com.maxime.heron.monpetitroadtrip.debug | findstr "TOTAL PSS"
```

### Étape 3 : Test Automatisé
```bash
# Utiliser le script automatique
.\memory-leak-test.bat
```

## Analyse des Résultats

### Seuils d'Alerte
- 🟢 **< 10 MB** : Normal
- 🟡 **10-50 MB** : Modéré, surveiller
- 🟠 **50-100 MB** : Important, corriger
- 🔴 **> 100 MB** : Critique, fuite majeure

### Types de Fuites Communes

#### 1. Images Non Libérées
```jsx
// ❌ Problématique
<Image source={{uri: url}} />

// ✅ Optimisé
<Image 
  source={{uri: url}}
  onLoad={() => trackImage(url)}
  onError={() => untrackImage(url)}
  onLoadEnd={() => maybeCleanup()}
/>
```

#### 2. Listeners Non Nettoyés
```jsx
// ❌ Problématique
useEffect(() => {
  navigation.addListener('focus', handler);
}, []);

// ✅ Optimisé
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', handler);
  return unsubscribe; // CRITIQUE : nettoyer
}, []);
```

#### 3. États Non Nettoyés
```jsx
// ❌ Problématique
const [largeData, setLargeData] = useState([]);

// ✅ Optimisé
useEffect(() => {
  return () => {
    setLargeData([]); // Nettoyer à la sortie
  };
}, []);
```

## Corrections Implémentées

### 1. Monitoring Mémoire
- ✅ Mesures au montage/démontage
- ✅ Comparaisons avant/après opérations
- ✅ Alertes automatiques pour les fuites

### 2. Gestion des Images
- ✅ Tracking des images chargées
- ✅ Nettoyage automatique si > 10 images
- ✅ Gestion des erreurs de chargement

### 3. Nettoyage Explicite
- ✅ Intervalles clearés
- ✅ États remis à null
- ✅ Références vidées

## Prochaines Étapes

### 1. Test Immédiat
```bash
# Tester avec la version améliorée (encodage corrigé)
.\memory-leak-test-improved.bat

# Ou version standard si problème
.\memory-leak-test.bat
```

## Problèmes d'Encodage Résolus

### Symptômes
- Caractères corrompus : `├®`, `┬®`, `├¿`
- Valeurs PSS vides : `PSS: KB`
- Emojis non affichés

### Solutions Appliquées
1. **Ajout de `chcp 65001`** pour l'UTF-8
2. **Suppression des caractères Unicode** (emojis)
3. **Amélioration de l'extraction PSS** avec tokens fixes
4. **Version améliorée** : `memory-leak-test-improved.bat`

### 2. Analyse des Logs
```bash
# Surveiller les logs pendant le test
adb logcat | grep "🧪\|📊\|⚠️\|🚨"
```

### 3. Tests Répétés
- Faire plusieurs cycles navigation avant/arrière
- Mesurer la tendance (augmentation constante = fuite)
- Tester sur différents roadtrips (taille variable)

## Commandes Utiles

### Monitoring Continu
```bash
# Surveiller PSS en temps réel
watch "adb shell dumpsys meminfo com.maxime.heron.monpetitroadtrip.debug | grep 'TOTAL PSS'"

# Logs filtrés
adb logcat | grep -E "🧪|Memory|GC|Image"

# Forcer le garbage collection
adb logcat | grep "🧹 Nettoyage"
```

### Analyse Détaillée
```bash
# Détails par composant
adb shell dumpsys meminfo com.maxime.heron.monpetitroadtrip.debug

# Processus système
adb shell dumpsys meminfo

# Statistiques globales
adb shell cat /proc/meminfo
```

## Attentes après Corrections

Avec les optimisations implémentées, l'augmentation mémoire devrait être :
- 🎯 **< 50 MB** : Objectif réaliste
- 🎯 **< 20 MB** : Objectif optimal

**Testez maintenant et comparez avec vos 374 MB initiaux !**
