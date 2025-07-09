#!/bin/bash

# Script de test rapide pour valider la configuration du chatbot
# Utilisation: ./test-chatbot-quick.sh

echo "🤖 ===== TEST RAPIDE CHATBOT IA ====="
echo ""

# Variables de configuration
BACKEND_URL_DEV="http://localhost:3000"
BACKEND_URL_ANDROID="http://10.0.2.2:3000"
TEST_ROADTRIP_ID="test123"

echo "📋 Test de configuration..."
echo ""

# Test 1: Vérifier si le serveur répond
echo "🌐 Test 1: Connexion serveur local..."
if curl -s --connect-timeout 5 "$BACKEND_URL_DEV/api/ping" > /dev/null; then
    echo "✅ Serveur local accessible sur $BACKEND_URL_DEV"
    BACKEND_URL=$BACKEND_URL_DEV
else
    echo "❌ Serveur local non accessible sur $BACKEND_URL_DEV"
    echo "🔄 Test avec l'URL Android..."
    
    if curl -s --connect-timeout 5 "$BACKEND_URL_ANDROID/api/ping" > /dev/null; then
        echo "✅ Serveur accessible sur $BACKEND_URL_ANDROID"
        BACKEND_URL=$BACKEND_URL_ANDROID
    else
        echo "❌ Serveur non accessible"
        echo "⚠️  Assurez-vous que le serveur backend est démarré"
        exit 1
    fi
fi

echo ""

# Test 2: Vérifier l'endpoint roadtrip
echo "🗺️ Test 2: Endpoint roadtrip..."
ROADTRIP_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/roadtrip_response.json "$BACKEND_URL/api/roadtrips/$TEST_ROADTRIP_ID")

if [ "$ROADTRIP_RESPONSE" = "200" ]; then
    echo "✅ Endpoint roadtrip accessible"
elif [ "$ROADTRIP_RESPONSE" = "404" ]; then
    echo "⚠️  Endpoint roadtrip retourne 404 (normal si pas de roadtrip de test)"
else
    echo "❌ Endpoint roadtrip erreur: $ROADTRIP_RESPONSE"
fi

echo ""

# Test 3: Vérifier l'endpoint chat
echo "🤖 Test 3: Endpoint chat..."
CHAT_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/chat_response.json \
    -X POST "$BACKEND_URL/api/roadtrips/$TEST_ROADTRIP_ID/chat/query" \
    -H "Content-Type: application/json" \
    -d '{"query": "Test de connexion", "conversationId": "test"}')

echo "📋 Réponse chat: HTTP $CHAT_RESPONSE"

if [ "$CHAT_RESPONSE" = "200" ]; then
    echo "✅ Endpoint chat fonctionne"
    echo "📄 Contenu de la réponse:"
    cat /tmp/chat_response.json | jq . 2>/dev/null || cat /tmp/chat_response.json
elif [ "$CHAT_RESPONSE" = "404" ]; then
    echo "❌ Endpoint chat non trouvé (404)"
    echo "📄 Vérifiez que les routes chatbot sont configurées"
elif [ "$CHAT_RESPONSE" = "500" ]; then
    echo "❌ Erreur serveur (500)"
    echo "📄 Contenu de l'erreur:"
    cat /tmp/chat_response.json
else
    echo "❌ Erreur inattendue: $CHAT_RESPONSE"
    echo "📄 Contenu:"
    cat /tmp/chat_response.json
fi

echo ""

# Test 4: Vérifier les fichiers de configuration
echo "📁 Test 4: Fichiers de configuration..."

if [ -f "src/config.js" ]; then
    echo "✅ src/config.js trouvé"
    if grep -q "BACKEND_URL" src/config.js; then
        echo "✅ BACKEND_URL configuré"
    else
        echo "❌ BACKEND_URL manquant dans config.js"
    fi
else
    echo "❌ src/config.js manquant"
fi

if [ -f ".env" ]; then
    echo "✅ .env trouvé"
else
    echo "⚠️  .env non trouvé (optionnel)"
fi

echo ""

# Test 5: Recommandations
echo "💡 Recommandations:"
echo ""

if [ "$BACKEND_URL" = "$BACKEND_URL_ANDROID" ]; then
    echo "📱 Pour Android Emulator, utilisez:"
    echo "   BACKEND_URL_DEV=http://10.0.2.2:3000"
fi

echo "🔧 Pour iOS Simulator, utilisez:"
echo "   BACKEND_URL_DEV=http://localhost:3000"

echo ""
echo "📱 Pour appareil physique, utilisez l'IP de votre machine:"
echo "   BACKEND_URL_DEV=http://192.168.1.XXX:3000"

echo ""
echo "🧪 Pour tester dans l'app:"
echo "1. Ouvrez le chatbot"
echo "2. Cliquez sur l'icône ⚙️ (paramètres)"
echo "3. Lancez le test de connexion"

echo ""

# Nettoyage
rm -f /tmp/roadtrip_response.json /tmp/chat_response.json

# Résumé final
echo "🎯 ===== RÉSUMÉ ====="
echo ""
if [ "$CHAT_RESPONSE" = "200" ]; then
    echo "🎉 Configuration du chatbot OK !"
    echo "🚀 Vous pouvez utiliser le chatbot dans l'app"
else
    echo "⚠️  Configuration du chatbot à vérifier"
    echo "📖 Consultez docs/troubleshooting/CHATBOT_CONNECTION_ERROR.md"
fi

echo ""
echo "🤖 ===== FIN DU TEST ====="
