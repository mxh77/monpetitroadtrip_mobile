// Test du restyling du RoadTripScreen
// Ce script teste les nouvelles fonctionnalités de style et d'icônes

const { getActivityTypeIcon, getActivityTypeEmoji, getActivityTypeColor } = require('./src/utils/activityIcons');

// Données de test simulant des étapes avec différents types d'activités
const testSteps = [
  {
    id: '1',
    name: 'Randonnée au Mont Blanc',
    type: 'Stage',
    activities: [
      { type: 'Randonnée', active: true, name: 'Ascension' },
      { type: 'Restaurant', active: true, name: 'Refuge' }
    ],
    accommodations: [
      { active: true, name: 'Camping' }
    ]
  },
  {
    id: '2',
    name: 'Transport vers Paris',
    type: 'Transport',
    activities: [],
    accommodations: []
  },
  {
    id: '3',
    name: 'Visite du Louvre',
    type: 'Stage',
    activities: [
      { type: 'Visite', active: true, name: 'Musée du Louvre' },
      { type: 'Courses', active: false, name: 'Souvenir shop' }
    ],
    accommodations: [
      { active: true, name: 'Hôtel Paris' },
      { active: true, name: 'Airbnb backup' }
    ]
  },
  {
    id: '4',
    name: 'Étape mixte',
    type: 'Stage',
    activities: [
      { type: 'Restaurant', active: true, name: 'Dîner gastronomique' },
      { type: 'Autre', active: false, name: 'Activité mystère' }
    ],
    accommodations: []
  }
];

// Reproduction des fonctions utilitaires du RoadTripScreen
function getStepMainActivityType(step) {
  if (step.type === 'Transport') return 'Transport';
  
  if (step.activities && step.activities.length > 0) {
    const activeActivity = step.activities.find(activity => activity.active !== false);
    if (activeActivity && activeActivity.type) {
      return activeActivity.type;
    }
  }
  
  return 'Visite';
}

function getStepActiveCounts(step) {
  const activeAccommodations = step.accommodations ? 
    step.accommodations.filter(acc => acc.active !== false).length : 0;
  const activeActivities = step.activities ? 
    step.activities.filter(act => act.active !== false).length : 0;
  
  return { accommodations: activeAccommodations, activities: activeActivities };
}

function getStepIcon(step) {
  if (step.type === 'Transport') return 'truck';
  
  const mainActivityType = getStepMainActivityType(step);
  return getActivityTypeIcon(mainActivityType);
}

function getStepColor(step) {
  if (step.type === 'Transport') return '#FF9800';
  
  const mainActivityType = getStepMainActivityType(step);
  return getActivityTypeColor(mainActivityType);
}

// Tests
console.log('🎨 TEST DU RESTYLING ROADTRIPSCREEN');
console.log('=====================================\n');

testSteps.forEach((step, index) => {
  console.log(`📍 ÉTAPE ${index + 1}: ${step.name}`);
  console.log(`   Type: ${step.type}`);
  
  const mainActivityType = getStepMainActivityType(step);
  const stepIcon = getStepIcon(step);
  const stepColor = getStepColor(step);
  const activeCounts = getStepActiveCounts(step);
  
  console.log(`   Type d'activité principal: ${mainActivityType}`);
  console.log(`   Emoji: ${getActivityTypeEmoji(mainActivityType)}`);
  console.log(`   Icône FontAwesome: ${stepIcon}`);
  console.log(`   Couleur thématique: ${stepColor}`);
  console.log(`   Hébergements actifs: ${activeCounts.accommodations}`);
  console.log(`   Activités actives: ${activeCounts.activities}`);
  
  // Simulation des badges
  let badges = [];
  if (activeCounts.accommodations > 0) badges.push(`🏠 ${activeCounts.accommodations}`);
  if (activeCounts.activities > 0) badges.push(`🎯 ${activeCounts.activities}`);
  
  console.log(`   Badges: ${badges.length > 0 ? badges.join(' ') : 'Aucun'}`);
  console.log('');
});

// Test des styles et couleurs
console.log('🎨 TEST DES COULEURS ET STYLES');
console.log('===============================\n');

const allActivityTypes = ['Randonnée', 'Courses', 'Visite', 'Transport', 'Restaurant', 'Autre'];

allActivityTypes.forEach(type => {
  console.log(`${getActivityTypeEmoji(type)} ${type}:`);
  console.log(`   Icône: ${getActivityTypeIcon(type)}`);
  console.log(`   Couleur: ${getActivityTypeColor(type)}`);
  console.log('');
});

// Vérification de la cohérence des styles
console.log('✅ VÉRIFICATIONS DE COHÉRENCE');
console.log('==============================\n');

let allGood = true;

// Vérifier que chaque type a une icône, emoji et couleur
allActivityTypes.forEach(type => {
  const icon = getActivityTypeIcon(type);
  const emoji = getActivityTypeEmoji(type);
  const color = getActivityTypeColor(type);
  
  if (!icon || !emoji || !color) {
    console.log(`❌ ${type}: Manque des éléments (icône: ${icon}, emoji: ${emoji}, couleur: ${color})`);
    allGood = false;
  }
});

// Vérifier que toutes les couleurs sont des codes hex valides
allActivityTypes.forEach(type => {
  const color = getActivityTypeColor(type);
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    console.log(`❌ ${type}: Couleur invalide: ${color}`);
    allGood = false;
  }
});

if (allGood) {
  console.log('✅ Tous les types d\'activités ont des icônes, emojis et couleurs valides');
  console.log('✅ Toutes les couleurs sont des codes hex valides');
  console.log('✅ Le restyling semble cohérent et complet');
} else {
  console.log('❌ Des problèmes de cohérence ont été détectés');
}

console.log('\n🎉 Test terminé !');
