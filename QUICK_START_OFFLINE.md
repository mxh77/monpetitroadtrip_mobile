# 🚀 Démarrage Rapide - Système Offline

## Étapes d'initialisation

### 1. Installation des dépendances
```bash
npm install
```

### 2. Vérification
```bash
node test-offline-system.js
```

### 3. Intégration dans App.tsx
Copiez le contenu de `src/examples/AppOfflineExample.tsx` dans votre App.tsx principal.

### 4. Test en mode développement
```bash
npm start
```

## Premier test

1. **Mode connecté :** L'app fonctionne normalement
2. **Mode déconnecté :** 
   - Désactivez le WiFi/données
   - L'app doit continuer à fonctionner
   - Barre de statut orange doit apparaître
3. **Reconnexion :** 
   - Réactivez la connexion
   - Synchronisation automatique

## Migration progressive

Commencez par migrer un composant simple :

```tsx
import { useListData } from './src/hooks/useOffline';

const MyComponent = ({ token }) => {
  const { data, isLoading, refresh } = useListData(
    'roadtrip', 
    'getAllRoadtrips', 
    [token]
  );
  
  return (
    <View>
      {isLoading ? <Text>Chargement...</Text> : 
        data.map(item => <Text key={item._id}>{item.title}</Text>)
      }
    </View>
  );
};
```

## Support

- Voir `OFFLINE_SYSTEM_README.md` pour la documentation complète
- Voir `MIGRATION_GUIDE.md` pour les détails de migration
- Exemples dans `src/examples/`
