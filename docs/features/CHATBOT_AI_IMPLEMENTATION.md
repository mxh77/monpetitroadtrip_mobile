# 🤖 Chatbot IA - Documentation d'implémentation

## 📋 Vue d'ensemble

Le chatbot IA a été implémenté avec succès dans l'application MonPetitRoadTrip. Il permet aux utilisateurs d'interagir avec leurs roadtrips via des commandes en langage naturel.

## 🏗️ Architecture

### Composants principaux

1. **`ChatBot.tsx`** - Interface principale du chatbot
2. **`FloatingChatButton.tsx`** - Bouton flottant visible sur toutes les pages
3. **`ChatLayout.tsx`** - Layout wrapper qui intègre le bouton flottant
4. **`ChatContext.tsx`** - Context global pour gérer l'état du chatbot
5. **`useChatBot.ts`** - Hook personnalisé pour utiliser le chatbot

### Utilitaires

- **`auth.ts`** - Gestion de l'authentification JWT (à adapter selon votre système)

## 🚀 Fonctionnalités

### Interface utilisateur

- **Bouton flottant** : Visible sur toutes les pages avec roadtrip actif
- **Animation de pulsation** : Attire l'attention de l'utilisateur
- **Modal plein écran** : Interface de chat moderne et intuitive
- **Messages typés** : Différents styles pour utilisateur, assistant, système et erreurs
- **Polling automatique** : Suivi des jobs asynchrones en temps réel

### Fonctionnalités techniques

- **Gestion des conversations** : Historique persistent
- **Jobs asynchrones** : Traitement en arrière-plan avec suivi de progression
- **Gestion d'erreurs** : Affichage des erreurs de manière conviviale
- **Authentification flexible** : Supporte JWT Bearer Token ET mode anonyme
- **Persistance** : Sauvegarde des conversations

## 🔧 Intégration

### Écrans intégrés

Le chatbot est actuellement intégré dans :
- ✅ **RoadTripScreen** - Écran principal avec onglets
- ✅ **StepScreen** - Écran de détail d'une étape

### Comment intégrer dans un nouvel écran

1. **Importer les composants nécessaires** :
```tsx
import ChatLayout from '../components/ChatLayout';
import { useChatBot } from '../hooks/useChatBot';
```

2. **Utiliser le hook dans le composant** :
```tsx
const { isChatAvailable } = useChatBot(roadtripId);
```

3. **Wrapper le contenu avec ChatLayout** :
```tsx
return (
  <ChatLayout showChatButton={isChatAvailable}>
    {/* Votre contenu existant */}
  </ChatLayout>
);
```

## 🎯 Commandes supportées

Le chatbot supporte les commandes suivantes (selon la documentation backend) :

### Gestion des étapes
- "Ajoute une étape à Paris du 15 au 17 juillet"
- "Supprime l'étape de Lyon"
- "Modifie l'étape de Paris pour finir le 18 juillet"
- "Montre-moi les étapes du roadtrip"

### Gestion des hébergements
- "Ajoute un hébergement Hôtel Ibis à Paris"
- "Supprime l'hébergement Hôtel de la Paix"
- "Ajoute un logement Airbnb à Marseille du 20 au 22 juillet"

### Gestion des activités
- "Ajoute une activité visite du Louvre à Paris le 16 juillet à 14h"
- "Supprime l'activité Tour Eiffel"
- "Ajoute une visite du Château de Versailles"

### Gestion des tâches
- "Ajoute une tâche réserver les billets de train"
- "Marque la tâche réservation comme terminée"
- "Supprime la tâche réserver restaurant"

### Informations et aide
- "Aide"
- "Que peux-tu faire ?"
- "Montre-moi le résumé du roadtrip"
- "Quelles sont les prochaines étapes ?"

## 🔄 Flux d'utilisation

1. **Utilisateur clique sur le bouton flottant** 🎯
2. **Modal du chatbot s'ouvre** 📱
3. **Utilisateur tape sa demande** ✍️
4. **Envoi vers l'API backend** 🚀
5. **Réponse immédiate affichée** 💬
6. **Job asynchrone traité** ⚙️
7. **Résultat final affiché** ✅

## 📡 API Routes utilisées

- `POST /api/roadtrips/{id}/chat/query` - Envoi de requête
- `GET /api/roadtrips/{id}/chat/jobs/{jobId}/status` - Statut du job
- `GET /api/roadtrips/{id}/chat/conversations` - Historique des conversations

## 🎨 Personnalisation

### Couleurs et style

Les couleurs peuvent être modifiées dans les fichiers de style :
- **Couleur primaire** : `#007BFF` (bleu)
- **Couleur succès** : `#4caf50` (vert)
- **Couleur erreur** : `#f44336` (rouge)

### Configuration

Les paramètres peuvent être ajustés dans `ChatBot.tsx` :
- **Polling interval** : 2000ms (2 secondes)
- **Limite de caractères** : 500 caractères
- **Timeout** : Configurable selon les besoins

## 🔐 Authentification

### Configuration actuelle

Le système d'authentification est configuré pour être flexible :
- **Mode avec token** : Utilise `Authorization: Bearer {token}`
- **Mode anonyme** : Fonctionne sans token pour les tests

### Adaptation nécessaire

Pour adapter à votre système d'authentification, modifiez `src/utils/auth.ts` :

```typescript
export const getJwtToken = async (): Promise<string | null> => {
  // Remplacez par votre implémentation
  return await AsyncStorage.getItem('jwt');
};
```

## 📱 Compatibilité

- ✅ **React Native** : Compatible avec React Native
- ✅ **Expo** : Compatible avec Expo
- ✅ **iOS** : Testé et fonctionnel
- ✅ **Android** : Testé et fonctionnel

## 🚨 Gestion des erreurs

### Types d'erreurs gérées

1. **Erreurs réseau** : Affichage d'un message d'erreur générique
2. **Erreurs d'authentification** : Redirection vers la connexion
3. **Erreurs de traitement** : Affichage du message d'erreur du backend
4. **Timeouts** : Gestion des timeouts de requête

### Logs et debugging

Les logs sont disponibles dans la console pour le debugging :
- **Envoi de message** : `console.log('Message envoyé:', message)`
- **Réception de réponse** : `console.log('Réponse reçue:', response)`
- **Erreurs** : `console.error('Erreur:', error)`

## 🔧 Maintenance

### Points d'attention

1. **Gestion de la mémoire** : Le polling est automatiquement arrêté
2. **Persistance** : Les conversations sont sauvegardées
3. **Performance** : Composants optimisés avec React.memo si nécessaire

### Mise à jour

Pour ajouter de nouvelles fonctionnalités :
1. Modifier `ChatBot.tsx` pour l'interface
2. Adapter `useChatBot.ts` pour la logique
3. Mettre à jour la documentation

## 📊 Métriques et analyse

### Données collectées

- **Fréquence d'utilisation** : Nombre de messages par session
- **Commandes populaires** : Types de requêtes les plus utilisées
- **Temps de réponse** : Performance des jobs asynchrones

### Optimisations possibles

1. **Cache des réponses** : Mettre en cache les réponses fréquentes
2. **Prédictions** : Suggestions de commandes basées sur l'usage
3. **Compression** : Optimiser la taille des messages

## 🎉 Prochaines étapes

### Améliorations prévues

1. **Commandes vocales** : Intégration de la reconnaissance vocale
2. **Suggestions automatiques** : Propositions de commandes contextuelles
3. **Thèmes personnalisés** : Personnalisation de l'interface
4. **Multi-langue** : Support de plusieurs langues

### Intégration étendue

- **Tous les écrans** : Étendre le chatbot à tous les écrans de l'app
- **Notifications** : Alertes pour les réponses importantes
- **Widgets** : Raccourcis pour les commandes fréquentes

## 📞 Support

Pour toute question ou problème :
1. Consulter les logs dans la console
2. Vérifier la configuration de l'authentification
3. Tester avec des commandes simples
4. Contacter l'équipe de développement

---

🚀 **Le chatbot IA est maintenant opérationnel !** 🤖
