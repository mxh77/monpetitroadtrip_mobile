# 🎯 Fonctionnalité : Ajout d'Activités via Langage Naturel

## 🚀 Présentation

Cette nouvelle fonctionnalité permet aux utilisateurs d'ajouter des activités à leurs étapes de roadtrip en utilisant des descriptions en langage naturel, alimentée par l'intelligence artificielle OpenAI.

## 📱 Interface Utilisateur

### Bouton d'Ajout d'Activité Amélioré

Le bouton triangulaire "+" dans l'onglet `Activités` propose maintenant **deux options** :

1. **Ajout classique** - Formulaire détaillé traditionnel
2. **Ajout via IA** - Description en langage naturel

### Écran d'Ajout via IA

L'écran `AddActivityNaturalLanguageScreen` offre :

- **Zone de texte libre** pour décrire l'activité en langage naturel
- **Gestion de la géolocalisation** (préparé pour une future implémentation)
- **Exemples prédéfinis** pour guider l'utilisateur
- **Interface intuitive** avec icônes et descriptions claires

## 🔧 Fonctionnalités Techniques

### API Backend
- Endpoint : `POST /api/roadtrips/{idRoadtrip}/steps/{idStep}/activities/natural-language`
- Headers requis : `Content-Type: application/json`
- Body : `{ "prompt": "...", "userLatitude": 48.8566, "userLongitude": 2.3522 }`

### Exemples de Prompts Supportés

```
"Course à pied dans le parc dans 1 heure pendant 45 minutes"
"Visite guidée du Louvre demain de 10h à 12h avec réservation"
"Déjeuner au restaurant Le Procope demain à 12h30"
"Shopping aux Champs-Élysées cet après-midi"
"Spa et détente dans le coin en fin de journée"
```

## 📂 Structure des Fichiers

### Nouveaux Fichiers
- `src/screens/AddActivityNaturalLanguageScreen.tsx` - Écran principal de la fonctionnalité
- `ACTIVITY_NATURAL_LANGUAGE_FEATURE_README.md` - Cette documentation

### Fichiers Modifiés
- `src/components/Activities.tsx` - Ajout du modal de choix et gestion des boutons
- `App.tsx` - Ajout de la navigation vers le nouvel écran
- `types.ts` - Ajout du type `AddActivityNaturalLanguage` dans `RootStackParamList`

## 🎨 Design et UX

### Modal de Choix
- Design moderne avec overlay semi-transparent
- Boutons avec icônes descriptives (edit pour classique, magic pour IA)
- Descriptions claires pour chaque option
- Animation fade pour une transition fluide

### Écran d'Ajout IA
- Interface claire et intuitive
- Indicateur de statut de géolocalisation (préparé pour l'avenir)
- Exemples interactifs (tap pour utiliser)
- Gestion des états de chargement
- Validation des entrées utilisateur

## 🔐 Permissions

### Android
- `ACCESS_FINE_LOCATION` - Pour la géolocalisation précise (préparé pour l'avenir)

### iOS
- Permission automatique via `navigator.geolocation` (préparé pour l'avenir)
- Fallback gracieux si refusée

## 🧪 Test et Débogage

### Variables d'Environnement Requises
```env
BACKEND_URL=https://your-backend-url.com
```

### Test Local
1. Démarrer le serveur : `npm start`
2. Naviguer vers une étape de type "Stage"
3. Aller dans l'onglet "Activités"
4. Taper sur le bouton triangulaire "+"
5. Choisir "Ajout via IA"
6. Tester avec différents prompts

### Debugging
- Logs dans la console pour les erreurs de communication
- Gestion des erreurs API avec messages utilisateur
- Fallback si l'API IA n'est pas disponible
- Bouton de test de connectivité serveur

## 🚦 Gestion d'Erreurs

### Erreurs Communes
1. **Pas de connexion réseau** - Message d'erreur explicite
2. **Prompt vide** - Validation avant envoi
3. **Erreur API** - Message d'erreur du serveur affiché
4. **Serveur non accessible** - Message avec conseils de dépannage

### Fallbacks
- Retour au mode classique en cas d'échec de l'IA
- Messages d'erreur informatifs
- Test de connectivité intégré

## 📈 Améliorations Futures

- Support de la géolocalisation utilisateur
- Support multilingue
- Sauvegarde automatique des brouillons
- Suggestions intelligentes basées sur l'historique
- Mode hors ligne avec synchronisation
- Intégration avec des APIs tierces (restaurants, musées)

## 💡 Utilisation

1. **Ouvrir une étape** de type "Stage" existante
2. **Aller dans l'onglet "Activités"**
3. **Taper sur le bouton triangulaire "+"** en haut à droite
4. **Choisir "Ajout via IA"**
5. **Décrire l'activité** en langage naturel
6. **Taper "Créer l'activité"**
7. **Confirmer la création** et voir l'activité ajoutée

## 🔄 Intégration avec l'Écosystème

Cette fonctionnalité s'intègre parfaitement avec :
- Interface utilisateur existante (choix modal lors de l'ajout)
- Système d'étapes et d'activités
- Géocodage Google Maps (via le backend)
- Gestion des dates et heures
- Interface de modification d'activités existante

## 🎯 API Backend Utilisée

L'API backend analyse automatiquement le prompt et extrait :
- **Nom de l'activité** : titre ou description principale
- **Adresse** : lieu, adresse ou point de repère (utilise l'adresse de l'étape par défaut)
- **Dates et heures** : début et fin (avec contexte temporel actuel)
- **Type d'activité** : "Randonnée", "Courses", "Visite", ou "Autre"
- **Durée** : durée de l'activité avec unité (M/H/J)
- **Prix et devise** : tarif en USD, CAD ou EUR
- **Notes** : informations complémentaires
- **Géolocalisation** : utilise l'adresse de l'utilisateur ou de l'étape si aucune adresse spécifique n'est mentionnée

Cette fonctionnalité révolutionne l'expérience utilisateur en permettant une création d'activités rapide et intuitive grâce à l'intelligence artificielle !
