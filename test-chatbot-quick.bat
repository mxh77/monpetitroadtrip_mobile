@echo off
:: Script de test rapide pour valider la configuration du chatbot
:: Utilisation: test-chatbot-quick.bat

echo 🤖 ===== TEST RAPIDE CHATBOT IA =====
echo.

:: Variables de configuration
set BACKEND_URL_DEV=http://localhost:3000
set BACKEND_URL_ANDROID=http://10.0.2.2:3000
set TEST_ROADTRIP_ID=test123

echo 📋 Test de configuration...
echo.

:: Test 1: Vérifier si le serveur répond
echo 🌐 Test 1: Connexion serveur local...
curl -s --connect-timeout 5 "%BACKEND_URL_DEV%/api/ping" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Serveur local accessible sur %BACKEND_URL_DEV%
    set BACKEND_URL=%BACKEND_URL_DEV%
) else (
    echo ❌ Serveur local non accessible sur %BACKEND_URL_DEV%
    echo 🔄 Test avec l'URL Android...
    
    curl -s --connect-timeout 5 "%BACKEND_URL_ANDROID%/api/ping" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo ✅ Serveur accessible sur %BACKEND_URL_ANDROID%
        set BACKEND_URL=%BACKEND_URL_ANDROID%
    ) else (
        echo ❌ Serveur non accessible
        echo ⚠️  Assurez-vous que le serveur backend est démarré
        pause
        exit /b 1
    )
)

echo.

:: Test 2: Vérifier l'endpoint roadtrip
echo 🗺️ Test 2: Endpoint roadtrip...
curl -s -w "%%{http_code}" -o "%TEMP%\roadtrip_response.json" "%BACKEND_URL%/api/roadtrips/%TEST_ROADTRIP_ID%" > "%TEMP%\roadtrip_status.txt"
set /p ROADTRIP_RESPONSE=<"%TEMP%\roadtrip_status.txt"

if "%ROADTRIP_RESPONSE%"=="200" (
    echo ✅ Endpoint roadtrip accessible
) else if "%ROADTRIP_RESPONSE%"=="404" (
    echo ⚠️  Endpoint roadtrip retourne 404 ^(normal si pas de roadtrip de test^)
) else (
    echo ❌ Endpoint roadtrip erreur: %ROADTRIP_RESPONSE%
)

echo.

:: Test 3: Vérifier l'endpoint chat
echo 🤖 Test 3: Endpoint chat...
curl -s -w "%%{http_code}" -o "%TEMP%\chat_response.json" ^
    -X POST "%BACKEND_URL%/api/roadtrips/%TEST_ROADTRIP_ID%/chat/query" ^
    -H "Content-Type: application/json" ^
    -d "{\"query\": \"Test de connexion\", \"conversationId\": \"test\"}" > "%TEMP%\chat_status.txt"

set /p CHAT_RESPONSE=<"%TEMP%\chat_status.txt"
echo 📋 Réponse chat: HTTP %CHAT_RESPONSE%

if "%CHAT_RESPONSE%"=="200" (
    echo ✅ Endpoint chat fonctionne
    echo 📄 Contenu de la réponse:
    type "%TEMP%\chat_response.json"
) else if "%CHAT_RESPONSE%"=="404" (
    echo ❌ Endpoint chat non trouvé ^(404^)
    echo 📄 Vérifiez que les routes chatbot sont configurées
) else if "%CHAT_RESPONSE%"=="500" (
    echo ❌ Erreur serveur ^(500^)
    echo 📄 Contenu de l'erreur:
    type "%TEMP%\chat_response.json"
) else (
    echo ❌ Erreur inattendue: %CHAT_RESPONSE%
    echo 📄 Contenu:
    type "%TEMP%\chat_response.json"
)

echo.

:: Test 4: Vérifier les fichiers de configuration
echo 📁 Test 4: Fichiers de configuration...

if exist "src\config.js" (
    echo ✅ src\config.js trouvé
    findstr /C:"BACKEND_URL" "src\config.js" >nul
    if %ERRORLEVEL% equ 0 (
        echo ✅ BACKEND_URL configuré
    ) else (
        echo ❌ BACKEND_URL manquant dans config.js
    )
) else (
    echo ❌ src\config.js manquant
)

if exist ".env" (
    echo ✅ .env trouvé
) else (
    echo ⚠️  .env non trouvé ^(optionnel^)
)

echo.

:: Test 5: Recommandations
echo 💡 Recommandations:
echo.

if "%BACKEND_URL%"=="%BACKEND_URL_ANDROID%" (
    echo 📱 Pour Android Emulator, utilisez:
    echo    BACKEND_URL_DEV=http://10.0.2.2:3000
)

echo 🔧 Pour iOS Simulator, utilisez:
echo    BACKEND_URL_DEV=http://localhost:3000

echo.
echo 📱 Pour appareil physique, utilisez l'IP de votre machine:
echo    BACKEND_URL_DEV=http://192.168.1.XXX:3000

echo.
echo 🧪 Pour tester dans l'app:
echo 1. Ouvrez le chatbot
echo 2. Cliquez sur l'icône ⚙️ ^(paramètres^)
echo 3. Lancez le test de connexion

echo.

:: Nettoyage
del "%TEMP%\roadtrip_response.json" >nul 2>&1
del "%TEMP%\chat_response.json" >nul 2>&1
del "%TEMP%\roadtrip_status.txt" >nul 2>&1
del "%TEMP%\chat_status.txt" >nul 2>&1

:: Résumé final
echo 🎯 ===== RÉSUMÉ =====
echo.
if "%CHAT_RESPONSE%"=="200" (
    echo 🎉 Configuration du chatbot OK !
    echo 🚀 Vous pouvez utiliser le chatbot dans l'app
) else (
    echo ⚠️  Configuration du chatbot à vérifier
    echo 📖 Consultez docs\troubleshooting\CHATBOT_CONNECTION_ERROR.md
)

echo.
echo 🤖 ===== FIN DU TEST =====
echo.
pause
