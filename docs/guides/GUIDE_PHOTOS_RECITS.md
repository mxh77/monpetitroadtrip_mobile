# 📸 Photos dans les Récits IA - Guide Utilisateur

## 🎯 Qu'est-ce que c'est ?

La nouvelle fonctionnalité **"Photos dans les récits"** vous permet de contrôler comment l'intelligence artificielle génère vos récits de voyage :

- **✅ ACTIVÉ** : L'IA utilise GPT-4o Vision pour analyser vos photos et créer des récits enrichis
- **❌ DÉSACTIVÉ** : L'IA utilise GPT-4o-mini pour des récits textuels rapides et économiques

## 🔧 Comment l'utiliser ?

### Accéder aux paramètres
1. Ouvrez votre roadtrip
2. Accédez aux **Paramètres** (icône engrenage)
3. Trouvez la section **"Récits avec IA"**

### Activer/Désactiver
- **Toggle Switch** : Activez ou désactivez d'un simple clic
- **Feedback visuel** : Les couleurs et icônes changent selon votre choix
- **Sauvegarde automatique** : Vos préférences sont enregistrées immédiatement

## 📊 Comparaison des modes

| Caractéristique | Mode ACTIVÉ (avec photos) | Mode DÉSACTIVÉ (sans photos) |
|-----------------|---------------------------|------------------------------|
| **Modèle IA** | GPT-4o Vision | GPT-4o-mini |
| **Analyse photos** | ✅ Oui | ❌ Non |
| **Qualité récit** | 🌟 Très enrichi | ⭐ Standard |
| **Vitesse** | 🐌 Plus lent | ⚡ Rapide |
| **Coût** | 💰 Plus élevé | 💲 Économique |

## 💡 Quand utiliser chaque mode ?

### Mode ACTIVÉ (recommandé pour) :
- 📷 Vous avez des photos magnifiques à valoriser
- 🎨 Vous voulez des récits très détaillés et visuels
- 📖 Vous créez un carnet de voyage mémorable
- 💰 Le budget n'est pas une contrainte

### Mode DÉSACTIVÉ (recommandé pour) :
- ⚡ Vous voulez des récits rapides
- 💰 Vous souhaitez économiser sur les coûts IA
- 📝 Vous préférez des récits textuels simples
- 🚀 Vous générez beaucoup de récits

## 🔄 Impact immédiat

**Changement en temps réel** : Dès que vous modifiez ce paramètre, toutes les nouvelles générations de récits utilisent le nouveau mode.

**Récits existants** : Non affectés, ils conservent leur contenu original.

## 🛡️ Rétrocompatibilité

- **Nouveaux utilisateurs** : Mode activé par défaut
- **Utilisateurs existants** : Mode activé par défaut (aucun changement)
- **Migration** : Aucune action requise

## 💰 Gestion des coûts

### Mode avec photos (GPT-4o Vision)
- Coût plus élevé par récit
- Temps de traitement plus long
- Qualité exceptionnelle

### Mode sans photos (GPT-4o-mini)
- Coût réduit significativement
- Génération très rapide
- Qualité satisfaisante

## 🔧 Paramètres techniques

```javascript
// Structure du paramètre
{
  "enablePhotosInStories": true/false
}

// Valeur par défaut
enablePhotosInStories: true

// API Endpoint
PUT /api/settings
{
  "systemPrompt": "...",
  "algoliaSearchRadius": 50000,
  "dragSnapInterval": 15,
  "enablePhotosInStories": false
}
```

## ❓ FAQ

**Q: Puis-je changer d'avis après avoir généré des récits ?**
R: Oui, le changement affecte uniquement les nouveaux récits.

**Q: Que se passe-t-il si je n'ai pas de photos ?**
R: Même en mode activé, l'IA utilisera le mode standard s'il n'y a pas de photos.

**Q: Le paramètre affecte-t-il d'autres fonctionnalités ?**
R: Non, il ne concerne que la génération de récits d'étapes.

**Q: Puis-je voir la différence de coût ?**
R: Les indicateurs visuels dans l'interface vous informent des implications de chaque mode.

## 🎉 Avantages

✅ **Contrôle total** sur les fonctionnalités IA  
✅ **Transparence** sur les coûts et performances  
✅ **Flexibilité** selon vos besoins du moment  
✅ **Simplicité** d'utilisation avec feedback visuel  
✅ **Économies** possibles en mode désactivé  

---

*Cette fonctionnalité fait partie de notre engagement à vous donner le contrôle total sur votre expérience de création de récits de voyage.*
