# 📁 Structure du Projet - Mon Petit Road Trip Mobile

## 🗂️ Organisation des Fichiers

Le projet a été restructuré pour une meilleure organisation. Voici la nouvelle structure :

```
monpetitroadtrip_mobile/
├── 📁 src/                          # Code source principal
├── 📁 testing/                      # Tests et outils de test
│   ├── 📁 memory/                   # Tests de mémoire
│   │   ├── 📁 scripts/              # Scripts de test (.bat, .sh)
│   │   └── 📁 results/              # Résultats des tests (.csv, logs)
│   ├── 📄 performance-*.js          # Scripts de performance
│   └── 📄 TEST_*.md                 # Documentation de tests
├── 📁 docs/                         # Documentation
│   ├── 📁 guides/                   # Guides d'utilisation
│   ├── 📁 features/                 # Documentation des fonctionnalités
│   ├── 📁 optimization/             # Documentation d'optimisation
│   └── 📄 README.md                 # Ce fichier
├── 📄 package.json                  # Dépendances du projet
├── 📄 App.tsx                       # Point d'entrée de l'app
└── 📄 reorganize-files.bat          # Script de réorganisation
```

## 🔧 Tests de Mémoire

### Scripts Disponibles (`testing/memory/scripts/`)
- **`automated-incremental-test.bat`** - Test interactif avec menu (Recommandé)
- **`fully-automated-test.bat`** - Test entièrement automatisé
- **`memory-leak-test.bat`** - Test de base des fuites mémoire
- **`memory-leak-test-improved.bat`** - Version améliorée du test de base
- **`comparative-memory-test.bat`** - Test comparatif sur même roadtrip

### Usage Rapide
```bash
# Test interactif avec menu
cd testing/memory/scripts
automated-incremental-test.bat

# Test entièrement automatisé
cd testing/memory/scripts
fully-automated-test.bat
```

### Résultats (`testing/memory/results/`)
- Fichiers CSV avec horodatage automatique
- Logs des tests de mémoire
- Graphiques de performance (si générés)

## 📚 Documentation

### Guides (`docs/guides/`)
- **`AUTOMATED_MEMORY_TEST_GUIDE.md`** - Guide complet des tests mémoire
- **`MEMORY_LEAK_TEST_GUIDE.md`** - Méthodologie de test des fuites
- **`ADVANCED_MEMORY_OPTIMIZATIONS.md`** - Optimisations avancées
- **`DEPLOYMENT_GUIDE.md`** - Guide de déploiement
- **`IMPLEMENTATION_GUIDE.md`** - Guide d'implémentation

### Fonctionnalités (`docs/features/`)
- **`ACTIVITY_*.md`** - Documentation des activités
- **`NATURAL_LANGUAGE_FEATURE_README.md`** - Fonctionnalité IA
- **`ALGOLIA_*.md`** - Intégration Algolia
- **`STORY_FEATURE_README.md`** - Fonctionnalité récits

### Optimisations (`docs/optimization/`)
- **`PERFORMANCE_*.md`** - Analyses de performance
- **`PLANNING_*.md`** - Optimisations du planning
- **`BACKEND_*.md`** - Optimisations backend
- **`UI_*.md`** - Améliorations interface

## 🚀 Démarrage Rapide

### 1. Installation
```bash
npm install
```

### 2. Lancement
```bash
npm start
```

### 3. Test de Mémoire
```bash
cd testing/memory/scripts
automated-incremental-test.bat
```

## 🎯 Objectifs des Optimisations

### Mémoire
- ✅ Réduction de 88% des fuites mémoire (78 MB → 9 MB)
- ✅ Monitoring en temps réel
- ✅ Tests automatisés
- ✅ Optimisations FlatList, images, états

### Performance
- ✅ Amélioration du temps de rendu
- ✅ Optimisation des listes
- ✅ Cache intelligent des images
- ✅ Garbage collection optimisé

### Fonctionnalités
- ✅ Ajout d'étapes via IA (langage naturel)
- ✅ Planning avancé avec drag & drop
- ✅ Système de récits avec photos
- ✅ Recherche Algolia intégrée

## 📊 Métriques de Succès

### Avant Optimisations
- Fuite mémoire : 78 MB par navigation
- Temps de rendu : > 2 secondes
- Crashes fréquents sur les listes longues

### Après Optimisations
- Fuite mémoire : 9 MB par navigation (-88%)
- Temps de rendu : < 1 seconde
- Stabilité améliorée

## 🛠️ Scripts Utiles

### Réorganisation
```bash
# Réorganiser les fichiers (si nécessaire)
reorganize-files.bat
```

### Tests
```bash
# Test mémoire complet
cd testing/memory/scripts && automated-incremental-test.bat

# Test performance
cd testing && node performance-test.js
```

### Nettoyage
```bash
# Nettoyer les résultats de tests
del testing\memory\results\*.csv
```

## 📞 Support

Pour toute question sur la structure ou les tests :
1. Consultez les guides dans `docs/guides/`
2. Vérifiez les résultats dans `testing/memory/results/`
3. Utilisez les scripts dans `testing/memory/scripts/`

## 🔄 Mise à Jour de la Structure

Si vous ajoutez de nouveaux fichiers de test ou documentation :
1. Placez-les dans le bon dossier selon leur type
2. Mettez à jour ce README si nécessaire
3. Utilisez `reorganize-files.bat` pour automatiser le rangement

---

**Dernière mise à jour :** Juillet 2025
**Version :** 1.0.0 (Structure organisée)
