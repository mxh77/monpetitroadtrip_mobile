# Association d'une Activité à une Randonnée Algolia - Implémentation Simple

## 🎯 Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs d'associer une activité à une fiche de randonnée provenant de la base de données Algolia (AllTrails). L'implémentation est basée sur l'exemple fourni et utilise une approche simple et directe.

## 📱 Interface utilisateur

### Section d'association Algolia
La section d'association apparaît à la fin du formulaire d'activité avec le titre "Randonnée associée (Algolia)".

#### États d'affichage

**1. Aucune randonnée associée :**
```
┌─────────────────────────────────────┐
│ Randonnée associée (Algolia)       │
│ ┌─────────────────────────────────┐ │
│ │ [Suggestions automatiques]      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**2. Suggestions disponibles :**
```
┌─────────────────────────────────────┐
│ Randonnée associée (Algolia)       │
│ ┌─────────────────────────────────┐ │
│ │ Tour du Mont Blanc              │ │
│ │ Distance : 170 km               │ │
│ │ Note : 4.5 (2832 avis)          │ │
│ │ Lieu : france/chamonix/...      │ │
│ │ [Voir sur AllTrails] [Associer] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**3. Randonnée associée :**
```
┌─────────────────────────────────────┐
│ Randonnée associée (Algolia)       │
│ Randonnée liée : Tour du Mont Blanc │
│ [Voir sur AllTrails] [Dissocier]   │
└─────────────────────────────────────┘
```

## 🔧 Fonctionnalités techniques

### États React
```javascript
const [algoliaSuggestions, setAlgoliaSuggestions] = useState([]);
const [algoliaSearch, setAlgoliaSearch] = useState('');
const [algoliaSearchResults, setAlgoliaSearchResults] = useState([]);
const [algoliaLoading, setAlgoliaLoading] = useState(false);
const [algoliaError, setAlgoliaError] = useState('');
const [algoliaTrail, setAlgoliaTrail] = useState(null);
```

### Fonctions principales

#### `fetchAlgoliaSuggestions()`
- Récupère des suggestions automatiques basées sur l'activité
- Utilise l'endpoint : `GET /api/activities/${activityId}/search/algolia?hitsPerPage=5`
- Gère les états de chargement et d'erreur

#### `linkAlgolia(item)`
- Associe une randonnée sélectionnée à l'activité
- Utilise l'endpoint : `POST /api/activities/${activityId}/link/algolia`
- Met à jour le `formState.algoliaId`
- Nettoie les suggestions après association

#### `unlinkAlgolia()`
- Supprime l'association entre l'activité et la randonnée
- Vide le champ `algoliaId` dans le formState

#### `getAlgoliaId()`
- Helper pour récupérer l'ID Algolia depuis le formState
- Retourne `formState.algoliaId || ''`

### Chargement automatique des détails
```javascript
useEffect(() => {
    const fetchAlgoliaTrail = async () => {
        const algoliaId = getAlgoliaId();
        if (!algoliaId) {
            setAlgoliaTrail(null);
            return;
        }
        // Recherche par objectID pour récupérer les détails
        const res = await fetch('/api/activities/search/algolia', {
            method: 'POST',
            body: JSON.stringify({ 
                query: '', 
                indexName: 'alltrails_primary_fr-FR', 
                hitsPerPage: 1, 
                filters: `objectID:${algoliaId}` 
            })
        });
        // ...traitement de la réponse
    };
    fetchAlgoliaTrail();
}, [formState]);
```

## 📡 Intégration API

### Endpoints utilisés

1. **Suggestions automatiques**
   - `GET /api/activities/${activityId}/search/algolia?hitsPerPage=5`
   - Retourne des suggestions basées sur l'activité courante

2. **Association**
   - `POST /api/activities/${activityId}/link/algolia`
   - Body : `{ objectID, name, slug, updateActivityName: false }`

3. **Recherche manuelle**
   - `POST /api/activities/search/algolia`
   - Body : `{ query, indexName: 'alltrails_primary_fr-FR', hitsPerPage, filters }`

### Structure des données Algolia
```javascript
{
    objectID: 'trail-10003291',
    name: 'Tour du Mont Blanc',
    slug: 'france/chamonix/tour-du-mont-blanc',
    distanceKm: 170,
    rating: 4.5,
    numReviews: 2832,
    url: 'https://www.alltrails.com/fr/...',
    // ... autres propriétés
}
```

## 🎨 Interface et UX

### Flux utilisateur
1. **Ouverture du formulaire** d'activité
2. **Scroll vers le bas** pour voir la section Algolia
3. **Clic sur "Suggestions automatiques"** pour charger les suggestions
4. **Sélection d'une randonnée** dans la liste des suggestions
5. **Association automatique** et mise à jour de l'interface
6. **Option de dissociation** disponible une fois associée

### Gestion des liens AllTrails
```javascript
const buildAllTrailsUrl = (trail) => {
    if (trail?.url) return trail.url;
    if (trail?.slug) return `https://www.alltrails.com/fr/${trail.slug}`;
    if (trail?.objectID?.startsWith('trail-')) {
        return `https://www.alltrails.com/fr/trail/${trail.objectID.replace('trail-', '')}`;
    }
    return null;
};
```

## 🔒 Authentification

### Token JWT requis
```javascript
const getJwtToken = async () => {
    // À implémenter selon votre système d'authentification
    // Exemple : récupération depuis AsyncStorage, Context, etc.
    return '';
};
```

**Headers d'API :**
```javascript
headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
}
```

## 📋 Données persistées

### FormState mis à jour
```javascript
// Lors de l'association
updateFormState({ algoliaId: item.objectID });

// Lors de la dissociation
updateFormState({ algoliaId: '' });
```

### Persistance backend
- L'association est sauvegardée automatiquement via l'API
- Le champ `algoliaId` est stocké dans l'activité
- Synchronisation entre frontend et backend assurée

## 🐛 Gestion des erreurs

### Types d'erreurs gérées
- **Erreur réseau** : Affichage d'un message d'erreur en rouge
- **API indisponible** : Gestion gracieuse avec messages informatifs
- **Token expiré** : À implémenter selon votre système d'auth
- **Aucune suggestion** : Interface vide mais fonctionnelle

### Logs et debugging
```javascript
console.log('algoliaId:', formState.algoliaId);
console.error('Erreur lors de la récupération des suggestions');
console.error('Erreur lors de la liaison');
```

## ✅ Checklist d'intégration

- [x] États React pour Algolia configurés
- [x] Fonctions d'API (fetch, link, unlink) implémentées
- [x] Interface utilisateur avec suggestions et association
- [x] Gestion des liens vers AllTrails
- [x] Persistance dans le formState
- [x] Gestion des erreurs de base
- [x] Chargement automatique des détails de randonnée
- [ ] Implémentation de la fonction `getJwtToken()`
- [ ] Tests utilisateur avec vraies données
- [ ] Gestion avancée des erreurs d'authentification

## 🚀 Utilisation

### Pour tester la fonctionnalité :

1. **Ouvrir une activité** dans l'app
2. **Scroll jusqu'à la section Algolia** en bas du formulaire
3. **Cliquer sur "Suggestions automatiques"**
4. **Sélectionner une randonnée** dans les suggestions
5. **Vérifier l'association** et tester le lien AllTrails
6. **Tester la dissociation** avec le bouton "Dissocier"

### Configuration requise :
- Backend avec endpoints Algolia fonctionnels
- Système d'authentification JWT
- Connexion Internet pour les appels API
- Index Algolia 'alltrails_primary_fr-FR' accessible

La fonctionnalité est maintenant prête pour les tests et peut être affinée selon les retours utilisateur !
