#!/usr/bin/env node

/**
 * Script de test pour vérifier la connectivité avec l'API backend
 * Usage: node test-backend-connection.js
 */

const config = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://192.168.1.2:3000'
};

async function testBackendConnection() {
  console.log('🔍 Test de connectivité avec le backend...');
  console.log(`📡 URL: ${config.BACKEND_URL}`);
  
  try {
    // Test 1: Connectivité de base
    console.log('\n1️⃣ Test de connectivité de base...');
    const response = await fetch(`${config.BACKEND_URL}/`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
    
    // Test 2: Endpoint spécifique (si vous avez un roadtrip de test)
    console.log('\n2️⃣ Test endpoint API natural language...');
    const testPayload = {
      prompt: "Test de connectivité - Visite du Louvre demain à 10h",
    };
    
    const apiResponse = await fetch(`${config.BACKEND_URL}/api/roadtrips/test/steps/natural-language`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    
    console.log(`📊 Status API: ${apiResponse.status}`);
    
    if (apiResponse.headers.get('content-type')?.includes('application/json')) {
      const data = await apiResponse.json();
      console.log(`📄 Réponse: ${JSON.stringify(data, null, 2)}`);
    } else {
      const text = await apiResponse.text();
      console.log(`📄 Réponse (non-JSON): ${text.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.error('❌ Erreur de connectivité:', error.message);
    console.log('\n🔧 Vérifications suggérées:');
    console.log('   • Le serveur backend est-il démarré ?');
    console.log('   • L\'URL est-elle correcte ?');
    console.log('   • Y a-t-il un firewall qui bloque la connexion ?');
    console.log('   • Le serveur écoute-t-il sur le bon port ?');
  }
}

// Vérifier si fetch est disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch n\'est pas disponible. Installez node-fetch ou utilisez Node.js 18+');
  process.exit(1);
}

testBackendConnection();
