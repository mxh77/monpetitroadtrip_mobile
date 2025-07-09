#!/bin/bash

# Script de test pour vérifier les endpoints de notifications
# Usage: ./test-notification-endpoints.sh [roadtripId]

BACKEND_URL="http://192.168.1.2:3000"
ROADTRIP_ID=${1:-"67ac491396003c7411aea948"}

echo "🔍 Test des endpoints de notifications"
echo "Backend URL: $BACKEND_URL"
echo "Roadtrip ID: $ROADTRIP_ID"
echo ""

# Test de connectivité générale
echo "1️⃣ Test de connectivité générale..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BACKEND_URL/" || echo "❌ Backend inaccessible"
echo ""

# Test endpoint notifications
echo "2️⃣ Test endpoint GET notifications..."
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BACKEND_URL/api/roadtrips/$ROADTRIP_ID/notifications")
HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')

echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "404" ]; then
    echo "❌ Endpoint non implémenté"
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Endpoint fonctionnel"
    echo "Response: $BODY"
else
    echo "⚠️ Status inattendu: $HTTP_STATUS"
    echo "Response: $BODY"
fi
echo ""

# Test endpoint marquer comme lu
echo "3️⃣ Test endpoint PATCH mark as read..."
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PATCH "$BACKEND_URL/api/roadtrips/$ROADTRIP_ID/notifications/test-id/read")
HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "404" ]; then
    echo "❌ Endpoint non implémenté"
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Endpoint fonctionnel"
else
    echo "⚠️ Status inattendu: $HTTP_STATUS"
fi
echo ""

# Test endpoint supprimer notification
echo "4️⃣ Test endpoint DELETE notification..."
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X DELETE "$BACKEND_URL/api/roadtrips/$ROADTRIP_ID/notifications/test-id")
HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "404" ]; then
    echo "❌ Endpoint non implémenté"
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Endpoint fonctionnel"
else
    echo "⚠️ Status inattendu: $HTTP_STATUS"
fi
echo ""

echo "📋 RÉSUMÉ DES ENDPOINTS À IMPLÉMENTER:"
echo ""
echo "GET    $BACKEND_URL/api/roadtrips/:roadtripId/notifications"
echo "PATCH  $BACKEND_URL/api/roadtrips/:roadtripId/notifications/:notificationId/read"  
echo "DELETE $BACKEND_URL/api/roadtrips/:roadtripId/notifications/:notificationId"
echo ""
echo "Format de réponse attendu pour GET:"
echo '{'
echo '  "success": true,'
echo '  "data": ['
echo '    {'
echo '      "_id": "notification_id",'
echo '      "title": "Titre de la notification",'
echo '      "message": "Message détaillé",'
echo '      "type": "chatbot_success|chatbot_error|system|reminder",'
echo '      "icon": "success|error|info|warning",'
echo '      "read": false,'
echo '      "roadtripId": "roadtrip_id",'
echo '      "userId": "user_id",'
echo '      "data": {},'
echo '      "createdAt": "2024-01-01T00:00:00.000Z",'
echo '      "readAt": null'
echo '    }'
echo '  ]'
echo '}'
