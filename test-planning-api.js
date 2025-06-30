// Script de test pour vérifier les APIs du planning
const config = require('./src/config');

console.log('Configuration backend:', config.BACKEND_URL);

// URLs testées par le planning
const testUrls = [
  '/activities/ID/dates (PATCH)',
  '/accommodations/ID (PUT)', 
  '/stages/ID (PUT)',
  '/stops/ID (PUT)'
];

console.log('\nURLs utilisées par le planning:');
testUrls.forEach(url => {
  console.log(`${config.BACKEND_URL}${url}`);
});

// Test de connectivité de base
async function testConnection() {
  try {
    console.log('\nTest de connectivité...');
    const response = await fetch(`${config.BACKEND_URL}/`);
    console.log('Status:', response.status);
    console.log('Connexion au backend:', response.ok ? 'OK' : 'ERREUR');
  } catch (error) {
    console.error('Erreur de connexion:', error.message);
  }
}

testConnection();
