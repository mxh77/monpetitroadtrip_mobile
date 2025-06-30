# Fonctionnalité: Types d'Activités

## Description
Cette fonctionnalité ajoute la possibilité de catégoriser les activités par type, permettant une meilleure organisation et visualisation des activités dans l'application.

## Types d'Activités Disponibles
- 🥾 **Randonnée** - Pour les activités de marche et trekking
- 🛒 **Courses** - Pour les achats et shopping
- 🏛️ **Visite** - Pour les visites touristiques et culturelles
- 📍 **Autre** - Pour tous les autres types d'activités

## Modifications Apportées

### 1. Backend Model (déjà fait)
```javascript
type: { 
  type: String, 
  enum: ['Randonnée', 'Courses', 'Visite', 'Autre'], 
  default: 'Randonnée' 
}
```

### 2. Types TypeScript (`types.ts`)
- Ajout du type `ActivityType`
- Mise à jour de l'interface `Activity` avec le champ `type`
- Export de la constante `ACTIVITY_TYPES`

### 3. Interface Utilisateur

#### Écran d'Édition d'Activité (`EditActivityScreen.tsx`)
- Ajout du champ `type` dans le `formState`
- Support de la sélection du type via dropdown

#### Composant d'Informations (`InfosActivityTab.tsx`)
- Ajout d'un dropdown pour sélectionner le type d'activité
- Intégration dans la section "Informations Générales"

#### Planning Avancé (`AdvancedPlanning.tsx`)
- Affichage des icônes de type d'activité dans les événements
- Support du champ `activityType` dans l'interface `PlanningEvent`

#### Liste des Activités (`Activities.tsx`)
- Affichage des icônes de type dans les titres des cartes
- Affichage du type d'activité comme information supplémentaire

## Interface Utilisateur

### Sélection du Type
Dans l'écran d'édition d'une activité, l'utilisateur peut sélectionner le type via un dropdown dans la section "Informations Générales", juste après le nom de l'activité.

### Affichage Visuel
- **Planning**: Les activités affichent l'icône correspondante au type dans le titre de l'événement
- **Liste des activités**: Chaque activité affiche son icône de type dans le titre de la carte et le type textuel comme information supplémentaire

## Migration des Données Existantes
Les activités existantes sans type défini utiliseront automatiquement la valeur par défaut "Randonnée" grâce à la configuration du backend.

## Test
Un script de test est disponible : `test-activity-type.js`

```bash
node test-activity-type.js
```

## Exemple d'Utilisation

### Création d'une nouvelle activité
1. Naviguer vers l'ajout/édition d'activité
2. Saisir le nom de l'activité
3. Sélectionner le type approprié dans le dropdown
4. Compléter les autres informations
5. Sauvegarder

### Visualisation dans le planning
Les activités apparaîtront avec leurs icônes correspondantes :
- 🥾 Randonnée au Mont Blanc
- 🛒 Courses au marché local
- 🏛️ Visite du Musée du Louvre
- 📍 Autre activité personnalisée

## Compatibilité
Cette fonctionnalité est rétrocompatible et n'affecte pas les activités existantes. Toutes les activités sans type défini utiliseront automatiquement "Randonnée" comme valeur par défaut.
