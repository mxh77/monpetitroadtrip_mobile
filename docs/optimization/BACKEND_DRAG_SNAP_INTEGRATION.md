# Intégration Backend - Paramètre dragSnapInterval

## Vue d'ensemble
Le paramètre `dragSnapInterval` a été ajouté au système de paramètres utilisateur existant pour gérer le pas de déplacement dans le planning du roadtrip. Ce paramètre doit être intégré dans l'API `/settings` existante.

## Modifications requises côté backend

### 1. Modèle de données (Settings)
Ajouter le champ `dragSnapInterval` au modèle/schéma des paramètres utilisateur :

```javascript
// Exemple de structure (à adapter selon votre ORM/base de données)
const settingsSchema = {
  userId: { type: String, required: true },
  systemPrompt: { type: String, default: '' },
  algoliaSearchRadius: { type: Number, default: 50000 },
  dragSnapInterval: { type: Number, default: 15 }, // NOUVEAU CHAMP
  // autres champs existants...
}
```

### 2. API GET /settings
L'endpoint existant doit maintenant retourner le champ `dragSnapInterval` :

```javascript
// Exemple de réponse GET /settings
{
  "systemPrompt": "Votre prompt personnalisé...",
  "algoliaSearchRadius": 50000,
  "dragSnapInterval": 15  // NOUVEAU CHAMP
}
```

### 3. API PUT /settings
L'endpoint existant doit accepter et sauvegarder le champ `dragSnapInterval` :

```javascript
// Exemple de payload PUT /settings
{
  "systemPrompt": "Votre prompt personnalisé...",
  "algoliaSearchRadius": 75000,
  "dragSnapInterval": 30  // NOUVEAU CHAMP
}
```

### 4. Validation
Ajouter la validation pour le champ `dragSnapInterval` :

```javascript
// Valeurs acceptées pour dragSnapInterval
const VALID_DRAG_SNAP_INTERVALS = [5, 10, 15, 30, 60];

// Validation
if (dragSnapInterval && !VALID_DRAG_SNAP_INTERVALS.includes(dragSnapInterval)) {
  throw new Error('dragSnapInterval doit être l\'une des valeurs: 5, 10, 15, 30, 60');
}
```

### 5. Valeur par défaut
- **Valeur par défaut** : `15` (minutes)
- **Type** : `number`
- **Valeurs possibles** : `[5, 10, 15, 30, 60]`

## Contexte fonctionnel

### Utilisation
Le paramètre `dragSnapInterval` définit la granularité du drag & drop dans le planning :
- **5 minutes** : Précision fine pour un planning détaillé
- **10 minutes** : Bon équilibre entre précision et facilité d'usage
- **15 minutes** : Valeur par défaut recommandée
- **30 minutes** : Planning rapide, moins de précision
- **60 minutes** : Vue d'ensemble, très rapide

### Impact sur l'UX
- L'utilisateur peut modifier ce paramètre dans **SettingsScreen**
- Le paramètre est aussi modifiable temporairement dans **RoadTripScreen** via un modal
- Les changements sont automatiquement sauvegardés et persistent entre les sessions
- Le planning s'adapte en temps réel au changement de paramètre

## Migration des données existantes

Si des utilisateurs existent déjà sans ce paramètre :

```javascript
// Script de migration (exemple)
db.settings.updateMany(
  { dragSnapInterval: { $exists: false } },
  { $set: { dragSnapInterval: 15 } }
);
```

## Test de l'intégration

### Scénarios à tester
1. **GET /settings** sans `dragSnapInterval` existant → doit retourner la valeur par défaut (15)
2. **PUT /settings** avec `dragSnapInterval: 30` → doit sauvegarder et retourner la nouvelle valeur
3. **PUT /settings** avec `dragSnapInterval: 99` → doit rejeter avec erreur de validation
4. **Utilisateur existant** → migration automatique vers valeur par défaut

### Exemple de test
```javascript
// Test GET
const response = await fetch('/settings');
const settings = await response.json();
expect(settings.dragSnapInterval).toBe(15); // valeur par défaut

// Test PUT
const putResponse = await fetch('/settings', {
  method: 'PUT',
  body: JSON.stringify({
    systemPrompt: 'Test',
    algoliaSearchRadius: 50000,
    dragSnapInterval: 30
  })
});
expect(putResponse.ok).toBe(true);
```

## Compatibilité

### Rétrocompatibilité
- Les clients qui n'envoient pas `dragSnapInterval` dans PUT /settings ne doivent pas perdre ce paramètre
- Les anciens clients qui ne gèrent pas `dragSnapInterval` ne doivent pas être affectés

### Versioning
Aucune nouvelle version d'API requise, extension compatible de l'endpoint existant.

## Résumé des modifications
1. ✅ Ajouter `dragSnapInterval: number` au modèle Settings
2. ✅ Modifier GET /settings pour retourner le champ
3. ✅ Modifier PUT /settings pour accepter et sauvegarder le champ  
4. ✅ Ajouter validation des valeurs [5, 10, 15, 30, 60]
5. ✅ Définir valeur par défaut à 15
6. ✅ Tester la rétrocompatibilité
7. ✅ Effectuer la migration des données existantes si nécessaire

---

**Contact** : En cas de questions sur l'implémentation côté frontend ou les spécifications, se référer aux fichiers :
- `src/screens/SettingsScreen.tsx` 
- `src/screens/RoadTripScreen.tsx`
- `src/components/AdvancedPlanning.tsx`
