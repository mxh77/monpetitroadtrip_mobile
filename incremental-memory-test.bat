@echo off
chcp 65001 >nul
REM Script de test incrementiel des optimisations memoire

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set RESULTS_FILE=optimization_results_%date:~-4,4%%date:~-10,2%%date:~-7,2%.csv

echo ===== TEST INCREMENTIEL DES OPTIMISATIONS =====
echo.

REM Créer le header CSV
echo Date,Time,Phase,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status > %RESULTS_FILE%

REM Fonction pour mesurer et enregistrer
:measure_and_log
set phase=%1
set before_pss=0
set after_pss=0

echo [%time%] Phase: %phase%
echo Placez-vous sur RoadTripsScreen et appuyez sur ENTREE...
pause >nul

REM Mesure AVANT
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set before_pss=%%a
    goto before_found
)
:before_found

echo    AVANT: %before_pss% KB
echo Naviguez vers RoadTripScreen et appuyez sur ENTREE...
pause >nul

REM Mesure APRES
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set after_pss=%%a
    goto after_found
)
:after_found

echo    APRES: %after_pss% KB

REM Calculs
set /a diff_pss=%after_pss% - %before_pss%
set /a diff_mb=%diff_pss% / 1024

REM Status
set status=NORMAL
if %diff_pss% gtr 51200 set status=CRITIQUE
if %diff_pss% gtr 20480 set status=IMPORTANT
if %diff_pss% gtr 10240 set status=MODERE

echo    DIFF: %diff_pss% KB (%diff_mb% MB) - %status%

REM Log CSV
echo %date%,%time%,%phase%,%before_pss%,%after_pss%,%diff_pss%,%diff_mb%,%status% >> %RESULTS_FILE%

echo Retournez sur RoadTripsScreen pour le test suivant...
pause
echo.
goto :eof

echo PLAN DE TEST:
echo 1. Baseline (code actuel)
echo 2. Optimisation Images
echo 3. Optimisation FlatList  
echo 4. Optimisation Etats
echo 5. Toutes optimisations
echo.

call :measure_and_log "Baseline"
echo === BASELINE TERMINE ===
echo Implementez maintenant les optimisations images...
pause

call :measure_and_log "Images_Optimized"
echo === IMAGES TERMINE ===
echo Implementez maintenant les optimisations FlatList...
pause

call :measure_and_log "FlatList_Optimized"
echo === FLATLIST TERMINE ===
echo Implementez maintenant les optimisations d'etats...
pause

call :measure_and_log "States_Optimized"
echo === ETATS TERMINE ===

call :measure_and_log "All_Optimized"
echo === TOUS TERMINE ===

echo.
echo ===== RESULTATS FINAUX =====
echo Resultats sauvegardes dans: %RESULTS_FILE%
echo.
echo Ouvrez le fichier CSV pour voir l'evolution:
type %RESULTS_FILE%
echo.
pause
