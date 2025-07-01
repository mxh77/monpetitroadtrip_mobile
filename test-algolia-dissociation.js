/**
 * Script de test pour vérifier la dissociation Algolia
 * 
 * Ce script teste si la dissociation d'une randonnée Algolia fonctionne correctement
 * en vérifiant que le champ algoliaId est bien persisté côté backend
 */

const config = require('./src/config');

async function testAlgoliaDissociation() {
    console.log('=== Test de dissociation Algolia ===');
    
    // Remplacez par un vrai token JWT et un ID d'activité valide
    const token = 'YOUR_JWT_TOKEN_HERE';
    const activityId = 'YOUR_ACTIVITY_ID_HERE';
    
    console.log('1. Test de récupération de l\'activité...');
    try {
        const response = await fetch(`${config.BACKEND_URL}/activities/${activityId}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('Erreur lors de la récupération:', response.status, response.statusText);
            return;
        }
        
        const activity = await response.json();
        console.log('Activité récupérée:', {
            _id: activity._id,
            name: activity.name,
            algoliaId: activity.algoliaId
        });
        
        console.log('2. Test de mise à jour avec algoliaId vide...');
        
        // Simuler une dissociation en mettant algoliaId à vide
        const updatedActivity = {
            ...activity,
            algoliaId: '' // Dissociation
        };
        
        const formData = new FormData();
        formData.append('data', JSON.stringify(updatedActivity));
        
        const updateResponse = await fetch(`${config.BACKEND_URL}/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!updateResponse.ok) {
            console.error('Erreur lors de la mise à jour:', updateResponse.status, updateResponse.statusText);
            return;
        }
        
        const updatedResult = await updateResponse.json();
        console.log('Mise à jour réussie:', updatedResult);
        
        console.log('3. Vérification de la persistance...');
        
        // Récupérer à nouveau l'activité pour vérifier la persistance
        const verifyResponse = await fetch(`${config.BACKEND_URL}/activities/${activityId}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!verifyResponse.ok) {
            console.error('Erreur lors de la vérification:', verifyResponse.status, verifyResponse.statusText);
            return;
        }
        
        const verifiedActivity = await verifyResponse.json();
        console.log('Activité après mise à jour:', {
            _id: verifiedActivity._id,
            name: verifiedActivity.name,
            algoliaId: verifiedActivity.algoliaId
        });
        
        if (verifiedActivity.algoliaId === '' || verifiedActivity.algoliaId === null || verifiedActivity.algoliaId === undefined) {
            console.log('✅ SUCCESS: La dissociation a été persistée correctement');
        } else {
            console.log('❌ FAILURE: La dissociation n\'a pas été persistée. algoliaId =', verifiedActivity.algoliaId);
        }
        
    } catch (error) {
        console.error('Erreur lors du test:', error);
    }
}

// Pour exécuter le test, décommentez la ligne suivante et remplacez les valeurs
// testAlgoliaDissociation();

console.log('Pour exécuter ce test:');
console.log('1. Remplacez YOUR_JWT_TOKEN_HERE par un token JWT valide');
console.log('2. Remplacez YOUR_ACTIVITY_ID_HERE par l\'ID d\'une activité existante');
console.log('3. Décommentez la ligne testAlgoliaDissociation();');
console.log('4. Exécutez: node test-algolia-dissociation.js');
