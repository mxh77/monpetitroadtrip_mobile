# 🧪 Structure de Test Organisée

## 📁 Nouvelle Organisation

```
testing/
├── 🧠 memory/              # Tests de mémoire
│   ├── scripts/            # Scripts .bat, .sh
│   └── results/            # Résultats .csv, logs
├── ⚡ performance/         # Tests de performance
├── 🔧 functional/          # Tests fonctionnels
├── 🔗 integration/         # Tests d'intégration (futur)
└── 📚 docs/               # Documentation de test
```

## 🎯 Types de Tests

### 🧠 Tests de Mémoire (`testing/memory/`)
- **Scripts** : Tests de fuites mémoire automatisés
- **Résultats** : Fichiers CSV avec métriques PSS
- **Exemple** : `automated-incremental-test.bat`

### ⚡ Tests de Performance (`testing/performance/`)
- **Scripts JS** : Benchmarks et diagnostics
- **Scripts Shell** : Optimisations avancées
- **Exemple** : `performance-test.js`

### 🔧 Tests Fonctionnels (`testing/functional/`)
- **Tests unitaires** : Fonctionnalités spécifiques
- **Tests API** : Endpoints backend
- **Exemple** : `test-algolia-dissociation.js`

### 🔗 Tests d'Intégration (`testing/integration/`)
- **Tests E2E** : Scénarios complets
- **Tests workflow** : Parcours utilisateur
- **À venir** : Tests Cypress/Detox

## 🚀 Scripts de Lancement

### Depuis la Racine
```bash
# Tests mémoire (menu interactif)
run-memory-tests.bat

# Tests de performance
run-performance-tests.bat

# Tests fonctionnels
run-functional-tests.bat
```

### Direct
```bash
# Test mémoire spécifique
cd testing/memory/scripts
automated-incremental-test.bat

# Test de performance
cd testing/performance
node performance-test.js

# Test fonctionnel
cd testing/functional
node test-algolia-dissociation.js
```

## 📊 Résultats

### Localisation
- **Mémoire** : `testing/memory/results/*.csv`
- **Performance** : Sortie console + logs
- **Fonctionnels** : Sortie console + rapports

### Formats
- **CSV** : Métriques quantitatives
- **JSON** : Données structurées
- **TXT** : Logs détaillés

## 🔧 Configuration

### Variables d'Environnement
```bash
# Package Android
PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug

# Backend URL
BACKEND_URL=http://your-backend-url
```

### Pré-requis
- **ADB** installé (tests mémoire)
- **Node.js** (tests JS)
- **Bash** (scripts shell, optionnel)

## 📝 Ajouter un Nouveau Test

### Test Fonctionnel
1. Créer `testing/functional/test-your-feature.js`
2. Suivre le pattern des tests existants
3. Ajouter au menu de `run-functional-tests.bat`

### Test de Performance
1. Créer `testing/performance/perf-your-feature.js`
2. Inclure les métriques de benchmark
3. Documenter dans `testing/docs/`

### Test de Mémoire
1. Utiliser les scripts existants dans `testing/memory/scripts/`
2. Créer un nouveau script si logique différente
3. Sauvegarder dans `testing/memory/results/`

## 🎯 Bonnes Pratiques

### Nommage
- **Mémoire** : `*-memory-test.*`
- **Performance** : `*-perf-test.*` ou `perf-*.*`
- **Fonctionnel** : `test-*.*`
- **Résultats** : `*_results_YYYYMMDD.*`

### Structure de Test
```javascript
// Exemple de test fonctionnel
async function testFeature() {
    console.log('=== Test de [Fonctionnalité] ===');
    
    try {
        // Setup
        // Test
        // Assertions
        console.log('✅ SUCCESS: Test réussi');
    } catch (error) {
        console.log('❌ FAILURE:', error.message);
    }
}
```

### Documentation
- Documenter chaque test dans `testing/docs/`
- Inclure les pré-requis et la configuration
- Expliquer les métriques et seuils

## 🔄 Migration

Si vous avez des anciens fichiers de test :
```bash
# Organiser automatiquement
organize-all-tests.bat
```

## 🎉 Avantages

✅ **Structure claire** - Chaque type de test à sa place  
✅ **Scripts centralisés** - Lancement unifié  
✅ **Résultats séparés** - Pas de pollution  
✅ **Évolutif** - Facile d'ajouter de nouveaux tests  
✅ **Maintenable** - Organisation professionnelle
