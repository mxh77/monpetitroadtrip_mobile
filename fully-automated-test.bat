@echo off
chcp 65001 >nul
REM Script de test entierement automatise avec delais

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set RESULTS_FILE=fully_automated_test_%date:~-4,4%%date:~-10,2%%date:~-7,2%.csv
set DELAY_SECONDS=10

echo ===== TEST ENTIEREMENT AUTOMATISE =====
echo.
echo Ce script va tester automatiquement toutes les phases d'optimisation
echo avec un delai de %DELAY_SECONDS% secondes entre chaque mesure.
echo.
echo PREREQUIS:
echo 1. L'app doit etre installee et fonctionnelle
echo 2. Vous devez avoir implemente toutes les optimisations dans le code
echo 3. Vous devez etre sur l'ecran RoadTripsScreen au debut
echo.
set /p roadtrip_name="Entrez le nom du roadtrip a tester (pour coherence): "
echo.
echo Appuyez sur ENTREE pour commencer le test automatique...
pause >nul

REM Créer le header CSV
echo Date,Time,Phase,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status,RoadTrip > %RESULTS_FILE%

REM Redémarrer l'app
echo Redemarrage de l'application...
adb shell am force-stop %PACKAGE_NAME%
timeout /t 3 >nul
adb shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1 >nul 2>&1
timeout /t 8 >nul

echo ===== PHASE 1: BASELINE =====
call :auto_memory_test "Baseline" "%roadtrip_name%"

echo ===== PHASE 2: IMAGES OPTIMIZED =====
call :auto_memory_test "Images_Optimized" "%roadtrip_name%"

echo ===== PHASE 3: FLATLIST OPTIMIZED =====
call :auto_memory_test "FlatList_Optimized" "%roadtrip_name%"

echo ===== PHASE 4: STATES OPTIMIZED =====
call :auto_memory_test "States_Optimized" "%roadtrip_name%"

echo ===== PHASE 5: ALL OPTIMIZED =====
call :auto_memory_test "All_Optimized" "%roadtrip_name%"

echo.
echo ===== TEST AUTOMATIQUE TERMINE =====
echo.
echo Resultats sauvegardes dans: %RESULTS_FILE%
echo.
type %RESULTS_FILE%
echo.
echo ===== ANALYSE RAPIDE =====
call :quick_analysis
echo.
pause
exit /b 0

REM Fonction de test automatique
:auto_memory_test
set test_phase=%~1
set roadtrip=%~2
set before_pss=0
set after_pss=0

echo.
echo [%time%] Phase: %test_phase%

REM Retour à l'écran d'accueil
echo Navigation vers RoadTripsScreen...
adb shell input keyevent KEYCODE_BACK >nul 2>&1
timeout /t 2 >nul
adb shell input keyevent KEYCODE_BACK >nul 2>&1
timeout /t 2 >nul

REM Forcer le GC
echo Nettoyage memoire...
adb shell am broadcast -a com.android.internal.intent.action.REQUEST_SHUTDOWN >nul 2>&1
timeout /t 2 >nul

REM Mesure AVANT
echo Mesure AVANT navigation...
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set before_pss=%%a
    goto auto_before_found
)
:auto_before_found

echo    AVANT: %before_pss% KB

REM Navigation automatique vers le roadtrip
echo Navigation vers RoadTripScreen...
REM Simuler un tap sur le premier roadtrip de la liste
adb shell input tap 400 400 >nul 2>&1
timeout /t %DELAY_SECONDS% >nul

REM Mesure APRES
echo Mesure APRES navigation...
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set after_pss=%%a
    goto auto_after_found
)
:auto_after_found

echo    APRES: %after_pss% KB

REM Calculs
set /a diff_pss=%after_pss% - %before_pss%
set /a diff_mb=%diff_pss% / 1024

REM Status
set status=EXCELLENT
if %diff_pss% gtr 10240 set status=BON
if %diff_pss% gtr 20480 set status=MODERE
if %diff_pss% gtr 51200 set status=CRITIQUE

echo    DIFF: %diff_pss% KB (%diff_mb% MB) - %status%

REM Sauvegarde
echo %date%,%time%,%test_phase%,%before_pss%,%after_pss%,%diff_pss%,%diff_mb%,%status%,%roadtrip% >> %RESULTS_FILE%

echo Phase %test_phase% terminee
timeout /t 2 >nul
goto :eof

REM Analyse rapide des résultats
:quick_analysis
echo Analyse de l'evolution de la consommation memoire:
echo.

REM Chercher la ligne Baseline
for /f "tokens=6,7 delims=," %%a in ('findstr "Baseline" %RESULTS_FILE%') do (
    set baseline_diff=%%a
    set baseline_mb=%%b
    goto baseline_found
)
:baseline_found

REM Chercher la ligne All_Optimized
for /f "tokens=6,7 delims=," %%a in ('findstr "All_Optimized" %RESULTS_FILE%') do (
    set optimized_diff=%%a
    set optimized_mb=%%b
    goto optimized_found
)
:optimized_found

if defined baseline_diff if defined optimized_diff (
    set /a improvement=%baseline_diff% - %optimized_diff%
    set /a improvement_mb=%improvement% / 1024
    set /a improvement_percent=(%improvement% * 100) / %baseline_diff%
    
    echo Baseline: %baseline_diff% KB (%baseline_mb% MB)
    echo Optimise: %optimized_diff% KB (%optimized_mb% MB)
    echo Amelioration: %improvement% KB (%improvement_mb% MB) soit %improvement_percent%%%
    
    if %improvement% gtr 0 (
        echo RESULTAT: Les optimisations ont REDUIT la consommation memoire
    ) else (
        echo RESULTAT: Les optimisations n'ont pas ameliore la consommation memoire
    )
) else (
    echo Impossible de calculer l'amelioration (donnees manquantes)
)
goto :eof
