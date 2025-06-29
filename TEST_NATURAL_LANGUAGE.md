# Test de l'API Langage Naturel

## Configuration

1. Assurez-vous que votre serveur backend est démarré
2. Vérifiez que la variable d'environnement `OPENAI_API_KEY` est configurée
3. Modifiez l'URL du backend dans `src/config.js` si nécessaire

## Test de la fonctionnalité

### 1. Interface utilisateur

1. Démarrez l'application : `npm start`
2. Naviguez vers un roadtrip existant
3. Tapez sur le bouton "+" en bas à droite
4. Sélectionnez "Ajout via IA"

### 2. Test avec géolocalisation

Autorisez la géolocalisation et testez avec ces prompts :
- "Pause déjeuner dans le coin dans 1 heure"
- "Arrêt toilettes maintenant"
- "Station-service la plus proche"

### 3. Test sans géolocalisation

Testez avec des adresses spécifiques :
- "Visite du Louvre demain à 10h et repartir à 16h"
- "Nuit à l'hôtel Ritz, Paris, arrivée ce soir 19h"
- "Château de Versailles samedi de 9h à 17h"

### 4. Test d'erreur

- Prompt vide → Doit afficher une erreur de validation
- Serveur arrêté → Doit afficher une erreur réseau
- Prompt invalide → Doit afficher l'erreur du serveur

## Debugging

### Logs console
- Vérifiez les logs dans la console React Native
- Vérifiez les logs du serveur backend

### Variables d'environnement
Vérifiez que ces variables sont définies :
```
BACKEND_URL=http://your-backend-url
OPENAI_API_KEY=your-openai-key
```

### Permissions
- Android : Vérifiez que les permissions de géolocalisation sont accordées
- iOS : Vérifiez dans les paramètres de l'app

## Résolution de problèmes courants

### Géolocalisation ne fonctionne pas
- Vérifiez que expo-location est installé
- Redémarrez l'application après installation
- Testez sur un appareil physique (l'émulateur peut avoir des problèmes)

### API backend non accessible
- Vérifiez que le serveur est démarré
- Vérifiez l'URL dans la configuration
- Testez l'API avec Postman ou curl

### Erreur OpenAI
- Vérifiez que la clé API est valide
- Vérifiez que vous avez des crédits OpenAI
- Vérifiez les logs du serveur pour plus de détails

## Exemple de requête API

```bash
curl -X POST http://localhost:3000/api/roadtrips/YOUR_ROADTRIP_ID/steps/natural-language \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Visite du Louvre demain à 10h",
    "userLatitude": 48.8566,
    "userLongitude": 2.3522
  }'
```

## Statut attendu

✅ Modal de choix s'affiche  
✅ Navigation vers l'écran IA  
✅ Interface de saisie fonctionne  
✅ Géolocalisation optionnelle  
✅ Envoi vers l'API backend  
✅ Affichage du résultat  
✅ Retour à la liste des étapes  
