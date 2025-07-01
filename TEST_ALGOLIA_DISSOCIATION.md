# Guide de test pour la dissociation Algolia

## Étapes de test

### 1. Préparer le test
1. Ouvrir une activité qui a une randonnée Algolia associée
2. Aller dans l'onglet "Infos" de l'édition d'activité
3. Vérifier que la section "Randonnée associée (Algolia)" affiche bien la randonnée liée

### 2. Tester la dissociation
1. Cliquer sur le bouton "Dissocier"
2. **Vérifier dans les logs de la console :**
   - "Dissociation de la randonnée Algolia"
   - "État après dissociation: { ..., algoliaId: '' }"
   - "Mise à jour de l'état dans le parent avec : { algoliaId: '' }"

3. **Vérifier visuellement :**
   - La section "Randonnée associée" doit maintenant afficher les boutons de suggestion/recherche
   - La randonnée précédemment liée ne doit plus apparaître

### 3. Tester la persistance
1. Cliquer sur "Sauvegarder" (ou le bouton de sauvegarde de l'activité)
2. **Vérifier dans les logs de la console :**
   - "algoliaId dans formState: " (doit être vide)
   - "formState: { ..., algoliaId: '', ... }"

3. **Après sauvegarde :**
   - Fermer l'écran d'édition
   - Rouvrir la même activité en édition
   - Vérifier que la randonnée n'est toujours pas associée (pas de "Randonnée liée")

### 4. Vérification côté backend (optionnel)
Si vous avez accès aux logs backend ou à la base de données :
- Vérifier que le champ `algoliaId` de l'activité est bien vide/null dans la base

## Problèmes possibles

### Si la dissociation ne fonctionne pas localement
- Vérifier que `updateFormState` est bien appelé
- Vérifier les logs dans InfosActivityTab.tsx

### Si la dissociation ne persiste pas après sauvegarde
- Vérifier que `algoliaId` est bien dans le `formState` lors de la sauvegarde
- Vérifier les logs dans EditActivityScreen.tsx
- Vérifier que le backend traite correctement les champs vides/null

### Si la randonnée réapparaît après rechargement
- Problème côté backend : le champ n'est pas mis à jour ou est recréé
- Vérifier la logique backend pour la gestion des champs `algoliaId` vides

## Logs à surveiller

### Dans InfosActivityTab.tsx
```
Dissociation de la randonnée Algolia
État après dissociation: { ..., algoliaId: '' }
```

### Dans EditActivityScreen.tsx (parent)
```
Mise à jour de l'état dans le parent avec : { algoliaId: '' }
État mis à jour dans le parent : { ..., algoliaId: '', ... }
algoliaId dans formState: 
formState: { ..., algoliaId: '', ... }
```

## Code modifié

### InfosActivityTab.tsx
- Ajout de logs dans `unlinkAlgolia()`
- URLs Algolia corrigées (pas de préfixe `/api/`)

### EditActivityScreen.tsx  
- Ajout de log spécifique pour `algoliaId` lors de la sauvegarde
- Confirmation que `algoliaId` est bien dans le `formState`
