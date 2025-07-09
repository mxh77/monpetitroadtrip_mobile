# 🔧 Guide de Résolution des Erreurs - Système de Notifications

## Erreurs Courantes et Solutions

### 1. ❌ Erreur NetInfo / Network Module

**Erreur**: `@react-native-community/netinfo: NativeModule.RNCNetInfo is null`

**Solution**:
```bash
# Désinstaller le package problématique
npm uninstall @react-native-community/netinfo

# Installer la version Expo compatible
npx expo install expo-network

# Redémarrer avec cache vidé
npx expo start --clear
```

**Explication**: Avec Expo, il faut utiliser `expo-network` au lieu de `@react-native-community/netinfo` pour éviter les problèmes de liaison native.

### 2. ❌ Erreur de Compilation TypeScript

**Erreur**: `Type '"Notifications"' does not satisfy the constraint 'keyof RootStackParamList'`

**Solution**: Vérifier que la route est ajoutée dans `types.ts` :
```typescript
export type RootStackParamList = {
  // ... autres routes
  Notifications: {
    roadtripId: string;
  };
};
```

### 3. ❌ Hook useNotifications non disponible

**Erreur**: `useNotifications must be used within a NotificationProvider`

**Solution**: S'assurer que le NotificationProvider entoure l'application dans `App.tsx` :
```jsx
<NotificationProvider>
  <NavigationContainer>
    {/* Votre app */}
  </NavigationContainer>
</NotificationProvider>
```

### 4. ❌ Notifications non reçues

**Causes possibles**:
- Backend non démarré
- Mauvais roadtripId
- Token d'authentification manquant ou expiré
- Endpoint API incorrect

**Diagnostic**:
```javascript
// Dans la console de debug
NotificationTestUtils.runNotificationTests();
```

**Solutions**:
- Vérifier l'URL backend dans `src/config.js`
- Contrôler les logs réseau dans les DevTools
- Valider l'authentification utilisateur

### 5. ❌ Polling trop fréquent / Performance

**Symptômes**:
- App qui rame
- Batterie qui se vide rapidement
- Trop d'appels API

**Solutions**:
```javascript
// Ajuster la fréquence dans NotificationProvider
<NotificationProvider 
  pollingFrequency={5000}        // 5s au lieu de 3s
  backgroundFrequency={60000}    // 1min au lieu de 30s
>
```

### 6. ❌ Permissions Notifications refusées

**Erreur**: Notifications push ne s'affichent pas

**Solution**:
```javascript
// Forcer la demande de permission
import * as Notifications from 'expo-notifications';

const askPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission requise', 'Activez les notifications dans les paramètres');
  }
};
```

### 7. ❌ Badge ne se met pas à jour

**Causes**:
- Hook `useNotifications` non utilisé correctement
- Problème de re-render React
- Store non synchronisé

**Solution**:
```javascript
// S'assurer d'utiliser le hook avec le bon roadtripId
const { unreadCount } = useNotifications(roadtripId);

// Forcer une synchronisation
const { forceSync } = useNotifications();
await forceSync(roadtripId);
```

### 8. ❌ Erreurs CORS / API

**Erreur**: `Access-Control-Allow-Origin`

**Solution Backend**:
```javascript
// Configurer CORS dans Express
app.use(cors({
  origin: ['http://localhost:19006', 'exp://localhost:19000'],
  credentials: true
}));
```

### 9. ❌ Mémoire / Performance

**Symptômes**:
- App qui plante après un moment
- Fuites mémoire

**Solutions**:
```javascript
// Nettoyer les listeners en sortant de l'écran
useEffect(() => {
  return () => {
    unwatchRoadtrip(roadtripId);
  };
}, []);

// Limiter le nombre de notifications en cache
const maxNotifications = 50;
```

### 10. ❌ Mode Debug / Production

**Différences**:
- URLs différentes (dev vs prod)
- Polling plus agressif en dev
- Logs activés en dev uniquement

**Configuration**:
```javascript
// src/config.js
const isDev = __DEV__;
const POLLING_FREQUENCY = isDev ? 2000 : 5000;
```

## 🔍 Outils de Diagnostic

### 1. Script de Test Automatisé
```bash
./test-notifications-system.sh
```

### 2. Utilitaires de Debug JavaScript
```javascript
// Console de debug
NotificationTestUtils.runNotificationTests();

// Simulateur temps réel
const simulator = new NotificationTestUtils.NotificationSimulator('roadtrip-id');
simulator.start(3000); // Notification toutes les 3s
```

### 3. Logs Détaillés
```javascript
// Activer dans NotificationManager
console.log('Debug notifications:', {
  roadtripId,
  notificationCount: notifications.length,
  unreadCount,
  isPollingActive: this.activeRoadtrips.has(roadtripId)
});
```

### 4. Vérification Réseau
```javascript
// Tester la connectivité backend
fetch(config.BACKEND_URL + '/api/health')
  .then(res => console.log('Backend OK:', res.status))
  .catch(err => console.error('Backend KO:', err));
```

## 📋 Checklist de Vérification

### ✅ Installation
- [ ] `expo-notifications` installé
- [ ] `expo-network` installé (pas `@react-native-community/netinfo`)
- [ ] `npx expo start --clear` exécuté

### ✅ Configuration
- [ ] NotificationProvider dans App.tsx
- [ ] Route Notifications dans types.ts
- [ ] Import NotificationsScreen dans App.tsx
- [ ] Config backend correcte

### ✅ Intégration
- [ ] NotificationButton dans headers
- [ ] useNotifications hook utilisé
- [ ] RoadtripId passé correctement
- [ ] Cleanup des listeners

### ✅ Backend
- [ ] Endpoints API implémentés
- [ ] CORS configuré
- [ ] Authentification validée
- [ ] Format JSON respecté

### ✅ Tests
- [ ] Script de test passé
- [ ] Navigation fonctionnelle
- [ ] Badge mis à jour
- [ ] Actions (lire/supprimer) OK
- [ ] Polling visible dans network

## 🚨 En Cas de Problème Persistant

1. **Nettoyer complètement** :
```bash
npm uninstall @react-native-community/netinfo
npx expo install expo-network
rm -rf node_modules
npm install
npx expo start --clear
```

2. **Version de fallback** :
Si les problèmes persistent, désactiver temporairement la détection réseau :
```javascript
// Dans PollingStrategy.js - version ultra-simple
const poll = async () => {
  try {
    await callback();
    setTimeout(poll, frequency);
  } catch (error) {
    console.error('Polling error:', error);
    setTimeout(poll, frequency * 2); // Retry avec délai doublé
  }
};
```

3. **Support communautaire** :
- Issues GitHub Expo : https://github.com/expo/expo
- Discord React Native : https://discord.gg/reactiflux
- Stack Overflow : tag `expo` + `react-native`

Ce guide couvre les principales erreurs rencontrées lors de l'implémentation du système de notifications. La plupart des problèmes proviennent de configurations incorrectes ou de dépendances incompatibles avec Expo.
