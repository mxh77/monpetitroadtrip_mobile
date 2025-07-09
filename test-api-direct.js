#!/usr/bin/env node

// Test direct de l'API notifications
const https = require('https');
const http = require('http');
const { URL } = require('url');
const config = require('./src/config');

const ROADTRIP_ID = '67ac491396003c7411aea948'; // Remplacez par votre ID de roadtrip

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };
        
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

async function testAPI() {
    console.log('🧪 Test direct de l\'API notifications');
    console.log('Backend URL:', config.BACKEND_URL);
    console.log('Roadtrip ID:', ROADTRIP_ID);
    
    try {
        // Test avec includeRead=false (comme le fait l'app)
        console.log('\n📡 Test avec includeRead=false...');
        const url1 = `${config.BACKEND_URL}/api/roadtrips/${ROADTRIP_ID}/notifications?limit=50&includeRead=false`;
        console.log('URL:', url1);
        
        const result1 = await makeRequest(url1);
        console.log('Status:', result1.status);
        console.log('Réponse:', JSON.stringify(result1.data, null, 2));
        
        // Test avec includeRead=true pour voir toutes les notifications
        console.log('\n📡 Test avec includeRead=true...');
        const url2 = `${config.BACKEND_URL}/api/roadtrips/${ROADTRIP_ID}/notifications?limit=50&includeRead=true`;
        console.log('URL:', url2);
        
        const result2 = await makeRequest(url2);
        console.log('Status:', result2.status);
        console.log('Réponse:', JSON.stringify(result2.data, null, 2));
        
        // Comparaison
        console.log('\n📊 Comparaison:');
        const data1 = result1.data.success ? result1.data.data : result1.data;
        const data2 = result2.data.success ? result2.data.data : result2.data;
        
        console.log(`includeRead=false: ${Array.isArray(data1) ? data1.length : 'non-array'} notifications`);
        console.log(`includeRead=true: ${Array.isArray(data2) ? data2.length : 'non-array'} notifications`);
        
        if (Array.isArray(data1)) {
            console.log('Non lues:', data1.map(n => `${n._id} - ${n.title} - read:${n.read || 'undefined'}`));
        }
        
        if (Array.isArray(data2)) {
            console.log('Toutes:', data2.map(n => `${n._id} - ${n.title} - read:${n.read || 'undefined'}`));
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testAPI();
