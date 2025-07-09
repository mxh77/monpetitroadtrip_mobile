# Guide d'Utilisation du Système de Notifications - MonPetitRoadtrip

## Vue d'ensemble

Le système de notifications de MonPetitRoadtrip permet aux utilisateurs de recevoir des mises à jour en temps réel sur leurs roadtrips. Il est accessible depuis n'importe quelle page d'un roadtrip via un bouton de notification persistant.

## Architecture Implémentée

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  NotificationManager (Service Principal)                   │
│  ├── NotificationAPI (Communication REST)                  │
│  ├── NotificationStore (État local)                        │
│  ├── NotificationContext (Provider React)                  │
│  ├── PollingStrategy (Gestion intelligente du polling)     │
│  └── Components (UI React Native)                          │
└─────────────────────────────────────────────────────────────┘
```

## Composants Créés

### Services

1. **NotificationAPI** (`src/services/NotificationAPI.js`)
   - Communication avec l'API REST du backend
   - Méthodes: `getNotifications`, `markAsRead`, `deleteNotification`

2. **NotificationManager** (`src/services/NotificationManager.js`)
   - Gestionnaire principal du système
   - Gère le polling intelligent et les notifications push

3. **PollingStrategy** (`src/services/PollingStrategy.js`)
   - Polling intelligent adaptatif
   - Gestion de l'état de l'app et de la connectivité réseau

4. **NotificationStore** (`src/stores/NotificationStore.js`)
   - Gestion de l'état local des notifications
   - Pattern Observer pour les mises à jour

### Context & Hooks

5. **NotificationContext** (`src/context/NotificationContext.tsx`)
   - Provider React pour l'injection de dépendances
   - Configuration globale du système

6. **useNotifications** (`src/hooks/useNotifications.js`)
   - Hook personnalisé pour l'utilisation dans les composants
   - API simple et réactive

### Composants UI

7. **NotificationButton** (`src/components/NotificationButton.js`)
   - Bouton d'accès aux notifications avec badge
   - Intégré dans les headers des écrans

8. **NotificationBadge** (`src/components/NotificationBadge.js`)
   - Badge de comptage des notifications non lues

9. **NotificationList** (`src/components/NotificationList.js`)
   - Liste scrollable avec pull-to-refresh

10. **NotificationItem** (`src/components/NotificationItem.js`)
    - Item individuel avec actions (marquer lu, supprimer)

### Écrans

11. **NotificationsScreen** (`src/screens/NotificationsScreen.tsx`)
    - Écran dédié pour la gestion complète des notifications

## Utilisation dans l'Application

### 1. Configuration Globale

Le système est configuré au niveau racine dans `App.tsx` :

```jsx
<NotificationProvider 
  pollingFrequency={3000}
  enablePushNotifications={true}
>
  {/* Reste de l'app */}
</NotificationProvider>
```

### 2. Intégration dans les Écrans

Les écrans de roadtrip intègrent automatiquement le bouton de notification :

```jsx
// RoadTripScreen.tsx
<NotificationButton 
  roadtripId={roadtripId}
  style={{ marginRight: 10 }}
/>
```

### 3. Utilisation du Hook

Dans n'importe quel composant :

```jsx
const { notifications, unreadCount, markAsRead } = useNotifications(roadtripId);
```

## Fonctionnalités

### Polling Intelligent

- **Fréquence adaptive** : 3s en premier plan, 30s en arrière-plan
- **Gestion hors ligne** : pause automatique sans connexion
- **Boost temporaire** : accélération après actions utilisateur
- **Retry avec backoff** : gestion robuste des erreurs

### Notifications Push

- **Mode développement** : Système utilise MockNotificationAPI avec données de test
- **Mode production** : API REST complète avec backend (à implémenter)
- **Permissions automatiques** : demande à l'initialisation (désactivé en mode développement)
- **Son et vibration** : configurable (à réactiver en production)

### Interface Utilisateur

- **Accès permanent** : bouton dans tous les headers de roadtrip
- **Badge de comptage** : nombre de notifications non lues
- **Modal rapide** : aperçu sans quitter l'écran
- **Écran dédié** : gestion complète des notifications

### Gestion d'État

- **Synchronisation temps réel** : via polling intelligent
- **Cache local** : évite les appels API redondants
- **Observer pattern** : mises à jour réactives des composants

## Configuration du Backend

### Endpoints Requis

L'API backend doit implémenter les endpoints suivants :

```
GET    /api/roadtrips/:roadtripId/notifications
PATCH  /api/roadtrips/:roadtripId/notifications/:notificationId/read
DELETE /api/roadtrips/:roadtripId/notifications/:notificationId
```

### Format des Notifications

```json
{
  "success": true,
  "data": [
    {
      "_id": "notification_id",
      "title": "Titre de la notification",
      "message": "Message détaillé",
      "type": "chatbot_success|chatbot_error|system|reminder",
      "icon": "success|error|info|warning",
      "read": false,
      "roadtripId": "roadtrip_id",
      "userId": "user_id",
      "data": {},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "readAt": null
    }
  ]
}
```

## Tests et Validation

### Script de Test

Un script de test est fourni pour valider l'installation :

```bash
./test-notifications-system.sh
```

Le script vérifie :
- Connectivité backend
- Endpoints API
- Structure des fichiers
- Dépendances npm
- Configuration App.tsx

### Tests Manuels

1. **Navigation** : Vérifier l'accès depuis tous les écrans de roadtrip
2. **Polling** : Observer les appels API dans les logs réseau
3. **États** : Tester hors ligne, arrière-plan, premier plan
4. **Actions** : Marquer lu, supprimer, actualiser

## Optimisations et Bonnes Pratiques

### Performance

- **Débounce** des actions utilisateur
- **Cache intelligent** avec TTL
- **Pagination** pour les grandes listes
- **Lazy loading** des composants

### UX

- **Feedback visuel** : indicateurs de chargement
- **Sons discrets** : notifications non intrusives
- **Marquage automatique** : lu après visualisation
- **Animations fluides** : transitions naturelles

### Robustesse

- **Gestion d'erreur** : retry automatique avec backoff
- **Mode dégradé** : fonctionnement sans notifications
- **Tests unitaires** : couverture des services critiques
- **Monitoring** : logs pour le debugging

## Maintenance et Evolution

### Points d'Extension

1. **Types de notifications** : ajout facile de nouveaux types
2. **Channels** : segmentation par catégorie
3. **Préférences utilisateur** : configuration des notifications
4. **Analytics** : métriques d'engagement

### Surveillance

- **Logs** : niveau debug pour le développement
- **Métriques** : taux de livraison, engagement
- **Alertes** : échecs répétés, haute latence

## Support et Dépannage

### Problèmes Courants

1. **Notifications non reçues**
   - Vérifier la connectivité réseau
   - Contrôler les logs du polling
   - Valider l'ID du roadtrip

2. **Permissions refusées**
   - Guider l'utilisateur vers les paramètres
   - Proposer un mode dégradé

3. **Performance dégradée**
   - Ajuster la fréquence de polling
   - Optimiser la taille des réponses API

### Logs de Debug

Activer les logs détaillés :

```javascript
// Dans NotificationManager
console.log('Debug notifications activé');
```

## Conformité et Sécurité

### Authentification

- **Tokens JWT** : authentification requise pour tous les endpoints
- **Expiration** : gestion automatique du renouvellement
- **Scope** : accès limité aux roadtrips de l'utilisateur

### Données Personnelles

- **RGPD** : notifications supprimées avec le compte
- **Chiffrement** : transit HTTPS obligatoire
- **Rétention** : durée de vie configurable

Ce système de notifications offre une expérience utilisateur moderne et robuste, avec un accès permanent depuis toutes les pages de roadtrip et une gestion intelligente des ressources.
