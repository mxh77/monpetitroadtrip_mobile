# 🔧 Guide de dépannage - Erreur JSON Parse

## 🚨 Problème rencontré
```
ERROR  Erreur lors de l'envoi du message: [SyntaxError: JSON Parse error: Unexpected character: <]
```

## 🔍 Diagnostic

Cette erreur indique que le serveur renvoie une réponse HTML au lieu d'une réponse JSON. Le caractère `<` suggère une page HTML d'erreur (404, 500, etc.).

## 🛠️ Solution étape par étape

### 1. **Vérifier la configuration du backend**

Dans `src/config.js`, vérifiez que l'URL du backend est correcte :

```javascript
const BACKEND_URL = isDevelopment ? BACKEND_URL_DEV : BACKEND_URL_PROD;
```

**Vérifications :**
- ✅ L'URL se termine-t-elle par `/api` ?
- ✅ Le serveur est-il démarré ?
- ✅ L'URL est-elle accessible depuis votre appareil ?

### 2. **Utiliser le test de connexion intégré**

1. Ouvrez le chatbot dans l'app
2. Cliquez sur l'icône ⚙️ (paramètres) en haut à droite
3. Lancez le test de connexion
4. Analysez les résultats

### 3. **Vérifications réseau courantes**

#### Sur émulateur Android :
- Utilisez `10.0.2.2` au lieu de `localhost`
- Exemple : `http://10.0.2.2:3000/api`

#### Sur appareil physique :
- Utilisez l'IP de votre machine
- Exemple : `http://192.168.1.100:3000/api`

#### Sur iOS Simulator :
- `localhost` devrait fonctionner
- Exemple : `http://localhost:3000/api`

### 4. **Vérifier les endpoints backend**

Les endpoints suivants doivent être disponibles :

```
✅ GET  /api/ping (optionnel, pour test)
✅ GET  /api/roadtrips/{id}
✅ POST /api/roadtrips/{id}/chat/query
✅ GET  /api/roadtrips/{id}/chat/jobs/{jobId}/status
✅ GET  /api/roadtrips/{id}/chat/conversations
```

### 5. **Vérifier les logs du backend**

Consultez les logs de votre serveur backend pour voir :
- Si les requêtes arrivent
- S'il y a des erreurs 500
- Si les routes sont correctement configurées

## 🧪 Tests manuels

### Test 1 : Ping simple
```bash
curl -X GET http://localhost:3000/api/ping
```

### Test 2 : Endpoint roadtrip
```bash
curl -X GET http://localhost:3000/api/roadtrips/[VOTRE_ROADTRIP_ID]
```

### Test 3 : Endpoint chat
```bash
curl -X POST http://localhost:3000/api/roadtrips/[VOTRE_ROADTRIP_ID]/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Test", "conversationId": "test"}'
```

## 🔧 Solutions par environnement

### Environnement de développement
```javascript
// .env.development
BACKEND_URL_DEV=http://10.0.2.2:3000
```

### Environnement de production
```javascript
// .env.production
BACKEND_URL_PROD=https://votre-api.com
```

## 📝 Debug avancé

### Activer les logs détaillés

Dans `src/components/ChatBot.tsx`, ajoutez ces logs :

```javascript
console.log('🔍 Debug ChatBot:', {
  backendUrl: config.BACKEND_URL,
  roadtripId: roadtripId,
  fullUrl: `${config.BACKEND_URL}/api/roadtrips/${roadtripId}/chat/query`
});
```

### Vérifier les headers de réponse

```javascript
const response = await fetch(url, options);
console.log('📋 Response headers:', response.headers);
console.log('📋 Response status:', response.status);
console.log('📋 Response statusText:', response.statusText);
```

## 🎯 Checklist de vérification

### Backend
- [ ] Serveur démarré
- [ ] Routes chatbot configurées
- [ ] CORS activé pour votre app
- [ ] Logs backend consultés

### Frontend
- [ ] URL backend correcte
- [ ] RoadTrip ID valide
- [ ] Réseau accessible
- [ ] Test de connexion lancé

### Réseau
- [ ] Même réseau (dev local)
- [ ] Pare-feu désactivé
- [ ] Proxy configuré si nécessaire
- [ ] HTTPS en production

## 🆘 Si le problème persiste

1. **Contactez l'équipe backend** avec :
   - L'URL utilisée
   - Les logs d'erreur complets
   - Les résultats du test de connexion

2. **Vérifiez la documentation API** pour :
   - Les nouveaux endpoints
   - Les changements de format
   - Les nouvelles authentifications

3. **Testez avec un autre client** :
   - Postman
   - curl
   - Navigateur web

## 📚 Ressources utiles

- [Documentation API Chatbot](./CHATBOT_IMPLEMENTATION_SUMMARY.md)
- [Guide d'implémentation](./features/CHATBOT_AI_IMPLEMENTATION.md)
- [Test de connexion intégré](../src/components/ConnectionTest.tsx)

---

💡 **Astuce** : Le test de connexion intégré dans le chatbot peut diagnostiquer la plupart des problèmes automatiquement !
