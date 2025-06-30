# Test de l'API Activité Langage Naturel

## Instructions de test

1. **Démarrer le serveur backend** si ce n'est pas déjà fait :
   ```bash
   npm start
   ```

2. **Lancer l'application mobile** :
   ```bash
   npm run android
   ```

3. **Naviguer vers une étape de type "Stage"**

4. **Aller dans l'onglet "Activités"**

5. **Taper sur le bouton triangulaire "+" en haut à droite**

6. **Vérifier que le modal s'affiche** avec les deux options :
   - Ajout classique
   - Ajout via IA

7. **Choisir "Ajout via IA"**

8. **Vérifier l'écran AddActivityNaturalLanguageScreen** :
   - ✅ Titre "Ajouter une activité via IA"
   - ✅ Zone de texte pour la description
   - ✅ Section géolocalisation (désactivée)
   - ✅ Exemples d'activités
   - ✅ Boutons "Annuler" et "Créer l'activité"

9. **Tester avec un exemple** :
   - Taper sur un des exemples pour le sélectionner
   - Vérifier que le texte s'affiche dans la zone de saisie

10. **Tester la création d'activité** :
    - Saisir : "Course à pied dans le parc demain matin à 8h pendant 45 minutes"
    - Taper "Créer l'activité"
    - Vérifier l'appel API vers `/roadtrips/{id}/steps/{id}/activities/natural-language`

## Statut attendu

✅ Modal de choix s'affiche  
✅ Navigation vers l'écran IA  
✅ Interface de saisie fonctionne  
✅ Exemples sont cliquables  
✅ Envoi vers l'API backend  
✅ Affichage du résultat  
✅ Retour à la liste des activités

## Endpoints testés

```bash
POST /api/roadtrips/{roadtripId}/steps/{stepId}/activities/natural-language
Content-Type: application/json

{
  "prompt": "Course à pied dans le parc demain matin à 8h pendant 45 minutes",
  "userLatitude": 48.8566, // optionnel
  "userLongitude": 2.3522  // optionnel
}
```

## Réponse attendue

```json
{
  "activity": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Course à pied dans le parc",
    "type": "Randonnée",
    "address": "Parc du Luxembourg, Paris, France",
    "startDateTime": "2025-07-01T06:00:00.000Z",
    "endDateTime": "2025-07-01T06:45:00.000Z",
    "duration": 45,
    "typeDuration": "M",
    "price": 0,
    "currency": "EUR",
    "latitude": 48.8466,
    "longitude": 2.3376,
    "notes": "Prévoir des chaussures de sport",
    "stepId": "507f1f77bcf86cd799439010",
    "userId": "507f1f77bcf86cd799439009"
  },
  "extractedData": {
    "name": "Course à pied dans le parc",
    "type": "Randonnée",
    "duration": 45,
    "typeDuration": "M",
    "useUserLocation": true,
    "useStepLocation": false
  }
}
```
