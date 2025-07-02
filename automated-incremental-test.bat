@echo off
chcp 65001 >nul
REM Script de test automatise pour les optimisations memoire incrementales

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set RESULTS_FILE=automated_optimization_results_%date:~-4,4%%date:~-10,2%%date:~-7,2%.csv

echo ===== TEST AUTOMATISE DES OPTIMISATIONS INCREMENTALES =====
echo.

REM Vérifier si le téléphone est connecté
adb devices | findstr "device" >nul
if errorlevel 1 (
    echo ERREUR: Aucun appareil Android detecte
    echo Connectez votre telephone et activez le debogage USB
    pause
    exit /b 1
)

REM Vérifier si l'app est installée
adb shell pm list packages | findstr "%PACKAGE_NAME%" >nul
if errorlevel 1 (
    echo ERREUR: Application non trouvee
    echo Assurez-vous que l'app est installee: %PACKAGE_NAME%
    pause
    exit /b 1
)

REM Fonction pour afficher le menu
:show_menu
cls
echo ===== SELECTION DE LA PHASE DE TEST =====
echo.
echo 1. Baseline (code actuel sans optimisations)
echo 2. Images Optimized (optimisations d'images uniquement)
echo 3. FlatList Optimized (optimisations FlatList uniquement)  
echo 4. States Optimized (optimisations d'etats uniquement)
echo 5. All Optimized (toutes les optimisations)
echo 6. Test Complet Automatique (toutes les phases)
echo 7. Afficher les resultats precedents
echo 8. Quitter
echo.
set /p choice="Choisissez une option (1-8): "

if "%choice%"=="1" (
    set phase=Baseline
    goto single_test
)
if "%choice%"=="2" (
    set phase=Images_Optimized
    goto single_test
)
if "%choice%"=="3" (
    set phase=FlatList_Optimized
    goto single_test
)
if "%choice%"=="4" (
    set phase=States_Optimized
    goto single_test
)
if "%choice%"=="5" (
    set phase=All_Optimized
    goto single_test
)
if "%choice%"=="6" goto full_automated_test
if "%choice%"=="7" goto show_results
if "%choice%"=="8" exit /b 0

echo Choix invalide, veuillez reessayer...
timeout /t 2 >nul
goto show_menu

REM Test d'une seule phase
:single_test
echo.
echo ===== TEST DE LA PHASE: %phase% =====
call :perform_memory_test "%phase%"
echo.
echo Test termine pour la phase: %phase%
echo Resultats ajoutes a: %RESULTS_FILE%
echo.
pause
goto show_menu

REM Test complet automatique
:full_automated_test
cls
echo ===== TEST COMPLET AUTOMATIQUE =====
echo.
echo Ce test va executer toutes les phases automatiquement.
echo Vous devrez naviguer manuellement entre les ecrans selon les instructions.
echo.
echo Appuyez sur ENTREE pour commencer...
pause >nul

REM Créer le header CSV si nécessaire
if not exist "%RESULTS_FILE%" (
    echo Date,Time,Phase,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status > %RESULTS_FILE%
)

echo.
echo === PHASE 1/5: BASELINE ===
call :perform_memory_test "Baseline"

echo.
echo === PHASE 2/5: IMAGES OPTIMIZED ===
echo INSTRUCTIONS: Implementez les optimisations d'images dans RoadTripScreen.tsx:
echo - Reduire maxCachedImages a 5
echo - Ajouter le GC force pour les images
echo - Ajouter le tracking des images chargees
echo.
echo Quand c'est fait, appuyez sur ENTREE pour continuer...
pause >nul
call :perform_memory_test "Images_Optimized"

echo.
echo === PHASE 3/5: FLATLIST OPTIMIZED ===
echo INSTRUCTIONS: Ajoutez les optimisations FlatList dans RoadTripScreen.tsx:
echo - initialNumToRender=5, maxToRenderPerBatch=3, windowSize=3
echo - scrollEventThrottle=100, onEndReachedThreshold=0.1
echo.
echo Quand c'est fait, appuyez sur ENTREE pour continuer...
pause >nul
call :perform_memory_test "FlatList_Optimized"

echo.
echo === PHASE 4/5: STATES OPTIMIZED ===
echo INSTRUCTIONS: Ajoutez les optimisations d'etats dans RoadTripScreen.tsx:
echo - useCallback pour les fonctions
echo - useMemo pour les calculs couteux
echo - Nettoyage des listeners dans useEffect
echo.
echo Quand c'est fait, appuyez sur ENTREE pour continuer...
pause >nul
call :perform_memory_test "States_Optimized"

echo.
echo === PHASE 5/5: ALL OPTIMIZED ===
echo INSTRUCTIONS: Assurez-vous que TOUTES les optimisations sont actives
echo.
echo Quand c'est fait, appuyez sur ENTREE pour continuer...
pause >nul
call :perform_memory_test "All_Optimized"

echo.
echo ===== TEST COMPLET TERMINE =====
call :show_summary
pause
goto show_menu

REM Fonction pour effectuer un test mémoire
:perform_memory_test
set test_phase=%~1
set before_pss=0
set after_pss=0

echo.
echo [%time%] Test de la phase: %test_phase%

REM Vérifier l'état de l'app
echo Verification de l'app...
adb shell am force-stop %PACKAGE_NAME% 2>nul
timeout /t 2 >nul
adb shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1 >nul 2>&1
timeout /t 5 >nul

echo.
echo ETAPE 1: Placez-vous sur l'ecran RoadTripsScreen (liste des roadtrips)
echo Appuyez sur ENTREE quand vous y etes...
pause >nul

REM Forcer le GC avant la mesure
echo Nettoyage memoire...
adb shell am broadcast -a com.android.internal.intent.action.REQUEST_SHUTDOWN >nul 2>&1
timeout /t 2 >nul

REM Mesure AVANT navigation
echo Mesure memoire AVANT navigation...
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set before_pss=%%a
    goto before_found
)
:before_found

if "%before_pss%"=="0" (
    echo ERREUR: Impossible de mesurer la memoire AVANT
    echo Verifiez que l'app est ouverte
    pause
    goto :eof
)

echo    MEMOIRE AVANT: %before_pss% KB

echo.
echo ETAPE 2: Naviguez vers un RoadTripScreen (cliquez sur un roadtrip)
echo Attendez que l'ecran soit completement charge
echo Appuyez sur ENTREE quand c'est fait...
pause >nul

REM Attendre le chargement complet
echo Attente du chargement complet...
timeout /t 3 >nul

REM Mesure APRES navigation
echo Mesure memoire APRES navigation...
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set after_pss=%%a
    goto after_found
)
:after_found

if "%after_pss%"=="0" (
    echo ERREUR: Impossible de mesurer la memoire APRES
    pause
    goto :eof
)

echo    MEMOIRE APRES: %after_pss% KB

REM Calculs
set /a diff_pss=%after_pss% - %before_pss%
set /a diff_mb=%diff_pss% / 1024

REM Détermination du status
set status=EXCELLENT
if %diff_pss% gtr 10240 set status=BON
if %diff_pss% gtr 20480 set status=MODERE
if %diff_pss% gtr 51200 set status=CRITIQUE

echo    DIFFERENCE: %diff_pss% KB (%diff_mb% MB) - STATUS: %status%

REM Sauvegarde dans CSV
if not exist "%RESULTS_FILE%" (
    echo Date,Time,Phase,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status > %RESULTS_FILE%
)
echo %date%,%time%,%test_phase%,%before_pss%,%after_pss%,%diff_pss%,%diff_mb%,%status% >> %RESULTS_FILE%

echo Test de la phase %test_phase% termine
goto :eof

REM Afficher les résultats
:show_results
echo.
echo ===== RESULTATS PRECEDENTS =====
if exist "%RESULTS_FILE%" (
    type "%RESULTS_FILE%"
) else (
    echo Aucun resultat trouve. Executez d'abord un test.
)
echo.
pause
goto show_menu

REM Afficher le résumé final
:show_summary
echo.
echo ===== RESUME DES RESULTATS =====
if exist "%RESULTS_FILE%" (
    echo Fichier de resultats: %RESULTS_FILE%
    echo.
    type "%RESULTS_FILE%"
    echo.
    echo ===== ANALYSE =====
    echo Les resultats montrent l'evolution de la consommation memoire:
    echo - Baseline: Consommation de reference
    echo - Images_Optimized: Impact des optimisations d'images
    echo - FlatList_Optimized: Impact des optimisations de liste
    echo - States_Optimized: Impact des optimisations d'etats
    echo - All_Optimized: Impact cumule de toutes les optimisations
) else (
    echo Aucun resultat disponible
)
goto :eof
