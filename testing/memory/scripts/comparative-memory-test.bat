@echo off
chcp 65001 >nul
REM Script de test comparatif AVANT/APRES optimisations
REM Utilise le MEME roadtrip pour les deux tests

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_FILE=comparative_test_%TIMESTAMP%.log

echo ===== TEST COMPARATIF AVANT/APRES OPTIMISATIONS =====
echo.
echo IMPORTANT: Ce test doit utiliser le MEME roadtrip
echo pour les deux mesures afin d'etre representatif.
echo.

REM Vérification application
echo Verification de l'application...
adb shell pidof %PACKAGE_NAME% >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Application non detectee
    pause
    exit /b 1
)
echo OK: Application detectee
echo.

REM Fonction pour extraire PSS
:extract_pss
set PSS_VALUE=0
set TEMP_FILE=temp_meminfo_%RANDOM%.txt
adb shell dumpsys meminfo %PACKAGE_NAME% > %TEMP_FILE% 2>&1
for /f "tokens=3" %%a in ('findstr /C:"TOTAL PSS:" %TEMP_FILE%') do (
    set PSS_VALUE=%%a
    goto pss_found
)
:pss_found
if exist %TEMP_FILE% del %TEMP_FILE%
goto :eof

echo ===== INSTRUCTIONS IMPORTANTES =====
echo.
echo 1. Notez quel roadtrip vous allez tester
echo 2. Comptez le nombre d'etapes qu'il contient
echo 3. Utilisez EXACTEMENT le meme roadtrip pour les deux tests
echo.
echo Quel roadtrip allez-vous tester ?
set /p ROADTRIP_NAME="Nom du roadtrip: "
echo.
echo Combien d'etapes contient-il ?
set /p STEP_COUNT="Nombre d'etapes: "
echo.

echo --- TEST COMPARATIF --- >> %LOG_FILE%
echo Roadtrip teste: %ROADTRIP_NAME% >> %LOG_FILE%
echo Nombre d'etapes: %STEP_COUNT% >> %LOG_FILE%
echo Date: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

echo ===== PHASE 1: CODE ACTUEL (AVEC OPTIMISATIONS) =====
echo.
echo 1. Placez-vous sur l'ecran RoadTripsScreen
echo 2. Appuyez sur ENTREE pour mesurer AVANT navigation
pause

call :extract_pss
set CURRENT_BEFORE=%PSS_VALUE%
set /a CURRENT_BEFORE_MB=%CURRENT_BEFORE% / 1024
echo    AVANT (code actuel): %CURRENT_BEFORE% KB (%CURRENT_BEFORE_MB% MB)

echo.
echo 3. Naviguez vers le roadtrip: %ROADTRIP_NAME%
echo 4. Attendez le chargement COMPLET
echo 5. Appuyez sur ENTREE pour mesurer APRES navigation
pause

call :extract_pss
set CURRENT_AFTER=%PSS_VALUE%
set /a CURRENT_AFTER_MB=%CURRENT_AFTER% / 1024
echo    APRES (code actuel): %CURRENT_AFTER% KB (%CURRENT_AFTER_MB% MB)

set /a CURRENT_DIFF=%CURRENT_AFTER% - %CURRENT_BEFORE%
set /a CURRENT_DIFF_MB=%CURRENT_DIFF% / 1024

echo --- RESULTATS CODE ACTUEL --- >> %LOG_FILE%
echo Avant: %CURRENT_BEFORE% KB (%CURRENT_BEFORE_MB% MB) >> %LOG_FILE%
echo Apres: %CURRENT_AFTER% KB (%CURRENT_AFTER_MB% MB) >> %LOG_FILE%
echo Fuite: %CURRENT_DIFF% KB (%CURRENT_DIFF_MB% MB) >> %LOG_FILE%
echo. >> %LOG_FILE%

echo.
echo ===== RESULTATS PHASE 1 =====
echo Roadtrip: %ROADTRIP_NAME% (%STEP_COUNT% etapes)
echo Avant:    %CURRENT_BEFORE% KB (%CURRENT_BEFORE_MB% MB)
echo Apres:    %CURRENT_AFTER% KB (%CURRENT_AFTER_MB% MB)
echo Fuite:    %CURRENT_DIFF% KB (%CURRENT_DIFF_MB% MB)
echo.

echo ===== PHASE 2: COMPARAISON AVEC ANCIEN CODE =====
echo.
echo Pour comparer avec l'ancien code (sans optimisations):
echo.
echo OPTION A: Vous avez une version Git precedente ?
echo   - Revertez vers l'ancien code
echo   - Relancez ce script
echo.
echo OPTION B: Vous avez vos anciennes mesures ?
echo   - Entrez les valeurs manuellement
echo.
set /p COMPARISON_CHOICE="Choisissez A ou B (ou N pour ignorer): "

if /i "%COMPARISON_CHOICE%"=="B" (
    echo.
    echo Entrez vos anciennes mesures pour le MEME roadtrip:
    set /p OLD_BEFORE="PSS AVANT ancien code (KB): "
    set /p OLD_AFTER="PSS APRES ancien code (KB): "
    
    set /a OLD_DIFF=!OLD_AFTER! - !OLD_BEFORE!
    set /a OLD_DIFF_MB=!OLD_DIFF! / 1024
    set /a IMPROVEMENT=!OLD_DIFF! - %CURRENT_DIFF%
    set /a IMPROVEMENT_MB=!IMPROVEMENT! / 1024
    
    echo --- COMPARAISON AVEC ANCIEN CODE --- >> %LOG_FILE%
    echo Ancien - Avant: !OLD_BEFORE! KB >> %LOG_FILE%
    echo Ancien - Apres: !OLD_AFTER! KB >> %LOG_FILE%
    echo Ancien - Fuite: !OLD_DIFF! KB (!OLD_DIFF_MB! MB) >> %LOG_FILE%
    echo Nouveau - Fuite: %CURRENT_DIFF% KB (%CURRENT_DIFF_MB% MB) >> %LOG_FILE%
    echo Amelioration: !IMPROVEMENT! KB (!IMPROVEMENT_MB! MB) >> %LOG_FILE%
    echo. >> %LOG_FILE%
    
    echo.
    echo ===== COMPARAISON FINALE =====
    echo Roadtrip teste: %ROADTRIP_NAME% ^(%STEP_COUNT% etapes^)
    echo.
    echo ANCIEN CODE:
    echo   Fuite: !OLD_DIFF! KB ^(!OLD_DIFF_MB! MB^)
    echo.
    echo NOUVEAU CODE:
    echo   Fuite: %CURRENT_DIFF% KB ^(%CURRENT_DIFF_MB! MB^)
    echo.
    echo AMELIORATION:
    echo   Reduction: !IMPROVEMENT! KB ^(!IMPROVEMENT_MB! MB^)
    
    set /a PERCENT=!IMPROVEMENT! * 100 / !OLD_DIFF!
    echo   Pourcentage: !PERCENT!%%
    
    if !IMPROVEMENT! gtr 0 (
        echo   Status: AMELIORATION CONFIRMEE
    ) else (
        echo   Status: PAS D'AMELIORATION
    )
)

echo.
echo Log complet sauvegarde: %LOG_FILE%
echo.
echo ===== RECOMMANDATIONS =====
echo 1. Testez toujours le MEME roadtrip pour comparer
echo 2. Notez le nombre d'etapes et d'images
echo 3. Attendez le chargement complet avant de mesurer
echo 4. Repetez le test 2-3 fois pour confirmer
echo.
pause
