#!/usr/bin/env node

// Test direct de l'API notifications avec URL en dur
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Remplacez par votre URL de backend
const BACKEND_URL = 'http://localhost:3000'; // ou votre URL de production
const ROADTRIP_ID = '67ac491396003c7411aea948';

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        console.log('Making request to:', url);
        
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
        
        console.log('Request options:', options);
        
        const req = client.request(options, (res) => {
            console.log('Response status:', res.statusCode);
            console.log('Response headers:', res.headers);
            
            let data = '';
            res.on('data', chunk => {
                data += chunk;
                console.log('Received chunk, total length:', data.length);
            });
            
            res.on('end', () => {
                console.log('Response complete, data length:', data.length);
                console.log('Raw response:', data);
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    console.log('JSON parse error:', error.message);
                    resolve({ status: res.statusCode, data: data, error: 'JSON parse failed' });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            console.log('Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

async function testAPI() {
    console.log('🧪 Test direct de l\'API notifications');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Roadtrip ID:', ROADTRIP_ID);
    
    try {
        // Test simple d'abord
        console.log('\n📡 Test basic...');
        const url = `${BACKEND_URL}/api/roadtrips/${ROADTRIP_ID}/notifications`;
        console.log('URL:', url);
        
        const result = await makeRequest(url);
        console.log('\n📊 Résultat:');
        console.log('Status:', result.status);
        console.log('Data type:', typeof result.data);
        console.log('Is array:', Array.isArray(result.data));
        
        if (result.data && typeof result.data === 'object') {
            console.log('Data structure:', Object.keys(result.data));
            
            if (result.data.success && result.data.data) {
                const notifications = result.data.data;
                console.log('Notifications count:', notifications.length);
                
                if (Array.isArray(notifications)) {
                    notifications.forEach((n, i) => {
                        console.log(`${i+1}. ${n._id} - "${n.title}" - read: ${n.read} - created: ${n.createdAt}`);
                    });
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
    }
}

testAPI();
