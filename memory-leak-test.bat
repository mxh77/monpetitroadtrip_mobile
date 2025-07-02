@echo off
chcp 65001 >nul
REM Script de test de fuites memoire pour Windows
REM Ce script automatise les mesures de memoire avant/apres navigation

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set LOG_FILE=memory_test_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log

echo ===== TEST DE FUITE MEMOIRE =====
echo Application: %PACKAGE_NAME%
echo Log file: %LOG_FILE%
echo.

REM Fonction pour mesurer la mémoire
echo Verification de l'application...
adb shell pidof %PACKAGE_NAME% >nul 2>&1
if errorlevel 1 (
    echo ERREUR: L'application n'est pas lancee. Demarrez l'app et relancez ce script.
    pause
    exit /b 1
)

echo Application detectee
echo.

echo INSTRUCTIONS:
echo 1. Assurez-vous d'etre sur l'ecran d'accueil ^(RoadTripsScreen^)
echo 2. Appuyez sur ENTREE pour mesurer la memoire AVANT navigation
pause

REM Mesure AVANT
echo Mesure memoire: AVANT navigation
echo --- AVANT navigation --- >> %LOG_FILE%
adb shell dumpsys meminfo %PACKAGE_NAME% | findstr "TOTAL PSS" >> %LOG_FILE%
adb shell dumpsys meminfo %PACKAGE_NAME% | findstr "TOTAL RSS" >> %LOG_FILE%
echo Timestamp: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

REM Affichage des résultats AVANT - Version corrigée pour l'extraction
echo Extraction des donnees PSS...
for /f "tokens=2 delims= " %%i in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set BEFORE_PSS=%%i
    goto found_before
)
:found_before
echo    PSS Total AVANT: %BEFORE_PSS% KB
set /a BEFORE_MB=%BEFORE_PSS% / 1024
echo    Soit environ: %BEFORE_MB% MB
echo.

echo Maintenant:
echo 3. Naviguez vers un RoadTripScreen ^(cliquez sur un roadtrip^)
echo 4. Laissez l'ecran se charger completement
echo 5. Appuyez sur ENTREE pour mesurer la memoire APRES navigation
pause

REM Mesure APRES
echo Mesure memoire: APRES navigation
echo --- APRES navigation --- >> %LOG_FILE%
adb shell dumpsys meminfo %PACKAGE_NAME% | findstr "TOTAL PSS" >> %LOG_FILE%
adb shell dumpsys meminfo %PACKAGE_NAME% | findstr "TOTAL RSS" >> %LOG_FILE%
echo Timestamp: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

REM Affichage des résultats APRES - Version corrigée
echo Extraction des donnees PSS...
for /f "tokens=2 delims= " %%i in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set AFTER_PSS=%%i
    goto found_after
)
:found_after
echo    PSS Total APRES: %AFTER_PSS% KB
set /a AFTER_MB=%AFTER_PSS% / 1024
echo    Soit environ: %AFTER_MB% MB
echo.

REM Calcul de la différence - Version sécurisée
echo Calcul de la difference...
if "%BEFORE_PSS%"=="" set BEFORE_PSS=0
if "%AFTER_PSS%"=="" set AFTER_PSS=0

set /a DIFF_PSS=%AFTER_PSS% - %BEFORE_PSS%
set /a DIFF_MB=%DIFF_PSS% / 1024

echo ===== ANALYSE DE LA DIFFERENCE =====
echo    Avant: %BEFORE_PSS% KB ^(%BEFORE_MB% MB^)
echo    Apres: %AFTER_PSS% KB ^(%AFTER_MB% MB^)
echo    Difference: %DIFF_PSS% KB ^(%DIFF_MB% MB^)
echo.

REM Alertes basées sur les seuils - Version ASCII
if %DIFF_PSS% gtr 102400 (
    echo ALERTE CRITIQUE: Fuite memoire majeure detectee ^(+100MB^)
) else if %DIFF_PSS% gtr 51200 (
    echo ALERTE: Fuite memoire importante detectee ^(+50MB^)
) else if %DIFF_PSS% gtr 10240 (
    echo ATTENTION: Fuite memoire moderee detectee ^(+10MB^)
) else if %DIFF_PSS% lss 0 (
    echo OK: Memoire liberee correctement
) else (
    echo INFO: Legere augmentation memoire ^(normal^)
)

echo.
echo Log detaille sauvegarde dans: %LOG_FILE%
echo.
echo ===== RECOMMANDATIONS =====
echo - Si fuite ^> 50MB: Verifiez les listeners non nettoyes, les images non liberees
echo - Si fuite ^> 10MB: Verifiez les useState/useEffect, les closures
echo - Utilisez React DevTools Profiler pour analyser les re-renders
echo - Testez avec plusieurs navigations pour confirmer la tendance
echo.
echo Test termine !
echo Appuyez sur une touche pour fermer...
pause >nul
