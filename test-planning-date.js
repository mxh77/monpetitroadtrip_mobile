// Test unitaire pour vérifier la logique de date du planning
import { parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Simuler des steps de test
const mockSteps = [
  {
    id: '1',
    arrivalDateTime: '2025-07-03T14:00:00Z',
    name: 'Lyon'
  },
  {
    id: '2', 
    arrivalDateTime: '2025-07-01T10:00:00Z',
    name: 'Paris'
  },
  {
    id: '3',
    arrivalDateTime: '2025-07-05T08:00:00Z', 
    name: 'Marseille'
  }
];

// Test de la logique de tri et sélection de première date
function testFirstDayLogic() {
  console.log('=== Test de la logique de première date ===');
  
  // Trier les steps comme dans le composant
  const sortedSteps = [...mockSteps].sort((a, b) => 
    new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime()
  );
  
  console.log('Steps triés:');
  sortedSteps.forEach(step => {
    const date = parseISO(step.arrivalDateTime);
    console.log(`- ${step.name}: ${format(date, 'dd/MM/yyyy HH:mm', { locale: fr })}`);
  });
  
  // Sélectionner la première date
  if (sortedSteps.length > 0) {
    const firstStepDate = parseISO(sortedSteps[0].arrivalDateTime);
    console.log('\n🎯 Date sélectionnée pour le planning:', format(firstStepDate, 'EEEE d MMMM yyyy', { locale: fr }));
  }
}

testFirstDayLogic();
