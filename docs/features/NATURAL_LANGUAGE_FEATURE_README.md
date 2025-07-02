# Fonctionnalité : Ajout d'Étapes via Langage Naturel

## 🚀 Présentation

Cette nouvelle fonctionnalité permet aux utilisateurs d'ajouter des étapes à leur roadtrip en utilisant des descriptions en langage naturel, alimentée par l'intelligence artificielle OpenAI.

## 📱 Interface Utilisateur

### Bouton d'Ajout d'Étape Amélioré

Le bouton "+" dans l'écran principal du roadtrip propose maintenant **deux options** :

1. **Ajout classique** - Formulaire détaillé traditionnel
2. **Ajout via IA** - Description en langage naturel

### Écran d'Ajout via IA

L'écran `AddStepNaturalLanguageScreen` offre :

- **Zone de texte libre** pour décrire l'étape en langage naturel
- **Gestion de la géolocalisation** avec demande de permission
- **Exemples prédéfinis** pour guider l'utilisateur
- **Interface intuitive** avec icônes et descriptions claires

## 🔧 Fonctionnalités Techniques

### Géolocalisation
- Demande automatique des permissions de géolocalisation
- Support Android et iOS
- Fallback gracieux si la géolocalisation n'est pas disponible
- Utilisation de l'API native `navigator.geolocation`

### API Backend
- Endpoint : `POST /api/roadtrips/{idRoadtrip}/steps/natural-language`
- Headers requis : `Content-Type: application/json`
- Body : `{ "prompt": "...", "userLatitude": 48.8566, "userLongitude": 2.3522 }`

### Exemples de Prompts Supportés

```
"Visite du Louvre demain à 10h et repartir à 16h"
"Pause déjeuner dans le coin dans 1 heure"
"Nuit à l'hôtel Ritz, Paris, arrivée ce soir 19h"
"Arrêt rapide station-service A6 dans 2 heures"
"Randonnée au Mont-Blanc, départ 8h du refuge"
```

## 📂 Structure des Fichiers

### Nouveaux Fichiers
- `src/screens/AddStepNaturalLanguageScreen.tsx` - Écran principal de la fonctionnalité
- `NATURAL_LANGUAGE_FEATURE_README.md` - Cette documentation

### Fichiers Modifiés
- `src/screens/RoadTripScreen.tsx` - Ajout du modal de choix et gestion des boutons
- `App.tsx` - Ajout de la navigation vers le nouvel écran
- `types.ts` - Ajout du type `AddStepNaturalLanguage` dans `RootStackParamList`

## 🎨 Design et UX

### Modal de Choix
- Design moderne avec overlay semi-transparent
- Boutons avec icônes descriptives
- Descriptions claires pour chaque option
- Animation fade pour une transition fluide

### Écran d'Ajout IA
- Interface claire et intuitive
- Indicateur de statut de géolocalisation
- Exemples interactifs (tap pour utiliser)
- Gestion des états de chargement
- Validation des entrées utilisateur

## 🔐 Permissions

### Android
- `ACCESS_FINE_LOCATION` - Pour la géolocalisation précise

### iOS
- Permission automatique via `navigator.geolocation`
- Fallback gracieux si refusée

## 🧪 Test et Débogage

### Variables d'Environnement Requises
```env
BACKEND_URL=https://your-backend-url.com
```

### Test Local
1. Démarrer le serveur : `npm start`
2. Naviguer vers un roadtrip
3. Taper sur le bouton "+"
4. Choisir "Ajout via IA"
5. Tester avec différents prompts

### Debugging
- Logs dans la console pour les erreurs de géolocalisation
- Gestion des erreurs API avec messages utilisateur
- Fallback si l'API IA n'est pas disponible

## 🚦 Gestion d'Erreurs

### Erreurs Communes
1. **Pas de connexion réseau** - Message d'erreur explicite
2. **Géolocalisation refusée** - Fonctionne sans géolocalisation
3. **Prompt vide** - Validation avant envoi
4. **Erreur API** - Message d'erreur du serveur affiché

### Fallbacks
- Fonctionnement sans géolocalisation
- Retour au mode classique en cas d'échec
- Messages d'erreur informatifs

## 📈 Améliorations Futures

- Support multilingue
- Sauvegarde automatique des brouillons
- Suggestions intelligentes basées sur l'historique
- Mode hors ligne avec synchronisation
- Intégration avec le calendrier

## 💡 Utilisation

1. **Ouvrir un roadtrip** existant
2. **Taper sur le bouton "+"** en bas à droite
3. **Choisir "Ajout via IA"**
4. **Autoriser la géolocalisation** (optionnel)
5. **Décrire l'étape** en langage naturel
6. **Taper "Créer l'étape"**
7. **Confirmer la création** et voir l'étape ajoutée

Cette fonctionnalité révolutionne l'expérience utilisateur en permettant une création d'étapes rapide et intuitive grâce à l'intelligence artificielle !
