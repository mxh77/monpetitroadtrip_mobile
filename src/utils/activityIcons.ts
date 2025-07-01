// Utilitaires pour les icônes d'activités

// Fonction pour obtenir l'icône FontAwesome du type d'activité (pour les marqueurs et composants)
export const getActivityTypeIcon = (activityType?: string): string => {
  switch (activityType) {
    case 'Randonnée':
      return 'hiking';
    case 'Courses':
      return 'shopping-cart';
    case 'Visite':
      return 'landmark';
    case 'Transport':
      return 'bus';
    case 'Restaurant':
      return 'utensils';
    case 'Autre':
      return 'map-marker-alt';
    default:
      return 'star';
  }
};

// Fonction pour obtenir l'icône emoji du type d'activité (pour les titres et l'affichage)
export const getActivityTypeEmoji = (activityType?: string): string => {
  switch (activityType) {
    case 'Randonnée':
      return '🥾';
    case 'Courses':
      return '🛒';
    case 'Visite':
      return '🏛️';
    case 'Transport':
      return '🚐';
    case 'Restaurant':
      return '🍽️';
    case 'Autre':
      return '📍';
    default:
      return '🎯';
  }
};

// Fonction pour obtenir la couleur associée au type d'activité
export const getActivityTypeColor = (activityType?: string): string => {
  switch (activityType) {
    case 'Randonnée':
      return '#228B22'; // ForestGreen
    case 'Courses':
      return '#FF6347'; // Tomato
    case 'Visite':
      return '#4169E1'; // RoyalBlue
    case 'Transport':
      return '#FFA500'; // Orange
    case 'Restaurant':
      return '#DC143C'; // Crimson
    case 'Autre':
      return '#696969'; // DimGray
    default:
      return '#FF5722'; // Orange par défaut
  }
};
