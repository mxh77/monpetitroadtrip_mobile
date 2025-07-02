@echo off
chcp 65001 >nul
REM Script specialise pour les tests de performance sur les images et le contenu multimedia

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set RESULTS_FILE=..\results\image_performance_test_%date:~-4,4%%date:~-10,2%%date:~-7,2%.csv

echo ====================================================================
echo         TEST SPECIALISE - PERFORMANCE IMAGES ET CONTENU
echo ====================================================================
echo.
echo Ce script teste specifiquement les fuites memoires liees au 
echo chargement d'images, thumbnails et contenu multimedia.
echo.

REM Verifications preliminaires
adb devices | findstr "device" >nul
if errorlevel 1 (
    echo ERREUR: Aucun appareil Android detecte
    pause
    exit /b 1
)

adb shell pm list packages | findstr "%PACKAGE_NAME%" >nul
if errorlevel 1 (
    echo ERREUR: Application non trouvee
    pause
    exit /b 1
)

REM Creer le header CSV
if not exist "%RESULTS_FILE%" (
    echo Date,Time,TestType,TestCase,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status,ImageCount,Notes > %RESULTS_FILE%
)

:show_image_menu
cls
echo ====================================================================
echo                    MENU TESTS IMAGES ET CONTENU
echo ====================================================================
echo.
echo TESTS INDIVIDUELS:
echo  1. Chargement Thumbnails RoadTrips (Grille de cartes)
echo  2. Chargement Thumbnails Steps (Liste detaillee)
echo  3. Navigation Rapide avec Images (Stress Test)
echo  4. Zoom/Dezoom Photos (Memory Release)
echo  5. Edition avec Selection Photos Multiples
echo  6. Upload/Compression Images
echo  7. Cache Images - Test de Persistance
echo  8. Rotation d'Ecran avec Images
echo.
echo TESTS GROUPES:
echo  9. Test Images Basique (1-4)
echo  10. Test Images Avance (5-8)
echo  11. Test Complet Images (Tous)
echo.
echo UTILITAIRES:
echo  12. Vider Cache Images
echo  13. Mesure Memoire Courante
echo  14. Afficher Resultats
echo  15. Retour Menu Principal
echo.
set /p choice="Selectionnez un test (1-15): "

if "%choice%"=="1" goto test_roadtrips_thumbnails
if "%choice%"=="2" goto test_steps_thumbnails
if "%choice%"=="3" goto test_rapid_navigation
if "%choice%"=="4" goto test_photo_zoom
if "%choice%"=="5" goto test_multi_photo_edit
if "%choice%"=="6" goto test_upload_compression
if "%choice%"=="7" goto test_image_cache
if "%choice%"=="8" goto test_rotation_images
if "%choice%"=="9" goto test_basic_images
if "%choice%"=="10" goto test_advanced_images
if "%choice%"=="11" goto test_complete_images
if "%choice%"=="12" goto clear_image_cache
if "%choice%"=="13" goto measure_current_memory
if "%choice%"=="14" goto show_image_results
if "%choice%"=="15" goto :eof

echo Choix invalide...
timeout /t 2 >nul
goto show_image_menu

REM ====================================================================
REM                     TESTS SPECIALISES IMAGES
REM ====================================================================

:test_roadtrips_thumbnails
cls
echo ====================================================================
echo           TEST 1: Chargement Thumbnails RoadTrips
echo ====================================================================
call :perform_image_test "IMG1_RoadTrips_Thumbnails" "Chargement grille thumbnails RoadTrips" ^
    "Placez-vous sur un ecran avec peu d'elements visuels" ^
    "Naviguez vers la liste des RoadTrips (grille avec thumbnails)" ^
    "Comptez approximativement le nombre de thumbnails visibles"
goto show_image_menu

:test_steps_thumbnails
cls
echo ====================================================================
echo            TEST 2: Chargement Thumbnails Steps
echo ====================================================================
call :perform_image_test "IMG2_Steps_Thumbnails" "Chargement thumbnails etapes detaillees" ^
    "Placez-vous sur la liste des roadtrips" ^
    "Entrez dans un roadtrip avec de nombreuses etapes ayant des images" ^
    "Estimez le nombre de thumbnails d'etapes chargees"
goto show_image_menu

:test_rapid_navigation
cls
echo ====================================================================
echo      TEST 3: Navigation Rapide avec Images (Stress Test)
echo ====================================================================
call :perform_image_test "IMG3_Rapid_Navigation" "Navigation rapide - stress test images" ^
    "Placez-vous sur un ecran simple" ^
    "Naviguez rapidement entre plusieurs ecrans avec images (5-10 allers-retours)" ^
    "Nombre approximatif d'images vues lors de la navigation"
goto show_image_menu

:test_photo_zoom
cls
echo ====================================================================
echo         TEST 4: Zoom/Dezoom Photos (Memory Release)
echo ====================================================================
call :perform_image_test "IMG4_Photo_Zoom" "Zoom/Dezoom sur photos haute resolution" ^
    "Ouvrez une photo ou thumbnail en petit format" ^
    "Effectuez plusieurs zoom/dezoom sur l'image, puis fermez" ^
    "Une seule image haute resolution"
goto show_image_menu

:test_multi_photo_edit
cls
echo ====================================================================
echo       TEST 5: Edition avec Selection Photos Multiples
echo ====================================================================
call :perform_image_test "IMG5_Multi_Photo_Edit" "Edition avec selection multiple de photos" ^
    "Entrez dans un mode d'edition (activite/hebergement)" ^
    "Selectionnez et ajoutez plusieurs photos, puis sauvegardez" ^
    "Nombre de photos selectionnees/ajoutees"
goto show_image_menu

:test_upload_compression
cls
echo ====================================================================
echo            TEST 6: Upload/Compression Images
echo ====================================================================
call :perform_image_test "IMG6_Upload_Compression" "Upload et compression d'images" ^
    "Preparez-vous a selectionner une photo depuis la galerie" ^
    "Selectionnez une photo, attendez la compression/upload" ^
    "Une image haute resolution compressee"
goto show_image_menu

:test_image_cache
cls
echo ====================================================================
echo         TEST 7: Cache Images - Test de Persistance
echo ====================================================================
call :perform_image_test "IMG7_Image_Cache" "Test persistance cache images" ^
    "Visitez des ecrans avec images puis quittez l'app" ^
    "Rouvrez l'app et revisitez les memes ecrans (cache hit/miss)" ^
    "Images en cache rechargees"
goto show_image_menu

:test_rotation_images
cls
echo ====================================================================
echo          TEST 8: Rotation d'Ecran avec Images
echo ====================================================================
call :perform_image_test "IMG8_Rotation_Images" "Rotation ecran avec images affichees" ^
    "Affichez un ecran avec plusieurs images" ^
    "Effectuez plusieurs rotations d'ecran (portrait - paysage)" ^
    "Images recreees lors des rotations"
goto show_image_menu

REM ====================================================================
REM                     TESTS GROUPES IMAGES
REM ====================================================================

:test_basic_images
cls
echo ====================================================================
echo                   TEST IMAGES BASIQUE (1-4)
echo ====================================================================
echo Execution des tests de base pour les images...
echo.

call :perform_image_test "IMG1_RoadTrips_Thumbnails" "Chargement grille thumbnails RoadTrips" ^
    "Placez-vous sur un ecran avec peu d'elements visuels" ^
    "Naviguez vers la liste des RoadTrips (grille avec thumbnails)" ^
    "Comptez approximativement le nombre de thumbnails visibles"

call :perform_image_test "IMG2_Steps_Thumbnails" "Chargement thumbnails etapes detaillees" ^
    "Placez-vous sur la liste des roadtrips" ^
    "Entrez dans un roadtrip avec de nombreuses etapes ayant des images" ^
    "Estimez le nombre de thumbnails d'etapes chargees"

call :perform_image_test "IMG3_Rapid_Navigation" "Navigation rapide - stress test images" ^
    "Placez-vous sur un ecran simple" ^
    "Naviguez rapidement entre plusieurs ecrans avec images (5-10 allers-retours)" ^
    "Nombre approximatif d'images vues lors de la navigation"

call :perform_image_test "IMG4_Photo_Zoom" "Zoom/Dezoom sur photos haute resolution" ^
    "Ouvrez une photo ou thumbnail en petit format" ^
    "Effectuez plusieurs zoom/dezoom sur l'image, puis fermez" ^
    "Une seule image haute resolution"

echo ===== TEST IMAGES BASIQUE TERMINE =====
pause
goto show_image_menu

:test_advanced_images
cls
echo ====================================================================
echo                   TEST IMAGES AVANCE (5-8)
echo ====================================================================
echo Execution des tests avances pour les images...
echo.

call :perform_image_test "IMG5_Multi_Photo_Edit" "Edition avec selection multiple de photos" ^
    "Entrez dans un mode d'edition (activite/hebergement)" ^
    "Selectionnez et ajoutez plusieurs photos, puis sauvegardez" ^
    "Nombre de photos selectionnees/ajoutees"

call :perform_image_test "IMG6_Upload_Compression" "Upload et compression d'images" ^
    "Preparez-vous a selectionner une photo depuis la galerie" ^
    "Selectionnez une photo, attendez la compression/upload" ^
    "Une image haute resolution compressee"

call :perform_image_test "IMG7_Image_Cache" "Test persistance cache images" ^
    "Visitez des ecrans avec images puis quittez l'app" ^
    "Rouvrez l'app et revisitez les memes ecrans (cache hit/miss)" ^
    "Images en cache rechargees"

call :perform_image_test "IMG8_Rotation_Images" "Rotation ecran avec images affichees" ^
    "Affichez un ecran avec plusieurs images" ^
    "Effectuez plusieurs rotations d'ecran (portrait - paysage)" ^
    "Images recreees lors des rotations"

echo ===== TEST IMAGES AVANCE TERMINE =====
pause
goto show_image_menu

:test_complete_images
cls
echo ====================================================================
echo                 TEST COMPLET IMAGES (1-8)
echo ====================================================================
echo Execution de TOUS les tests images...
echo.
echo ATTENTION: Ce test peut prendre 20-30 minutes
pause

call :test_basic_images_silent
call :test_advanced_images_silent

echo.
echo ===== TEST COMPLET IMAGES TERMINE =====
call :show_image_summary
pause
goto show_image_menu

REM ====================================================================
REM                     FONCTIONS UTILITAIRES IMAGES
REM ====================================================================

REM Fonction principale pour les tests d'images
:perform_image_test
set test_id=%~1
set test_description=%~2
set instruction_before=%~3
set instruction_after=%~4
set instruction_count=%~5
set before_pss=0
set after_pss=0

echo.
echo [%time%] === DEBUT TEST IMAGE: %test_description% ===

REM Redemarrage propre
echo Redemarrage de l'application...
adb shell am force-stop %PACKAGE_NAME% 2>nul
timeout /t 3 >nul
adb shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1 >nul 2>&1
timeout /t 5 >nul

echo.
echo ETAPE 1: %instruction_before%
echo Appuyez sur ENTREE quand vous y etes...
pause >nul

REM GC initial + mesures plus agressives pour les images
echo Nettoyage memoire agressif (images)...
adb shell am broadcast -a com.android.internal.intent.action.REQUEST_SHUTDOWN >nul 2>&1
timeout /t 3 >nul
REM Forcer le GC multiple fois pour les images
adb shell "echo 3 > /proc/sys/vm/drop_caches" 2>nul
timeout /t 2 >nul

REM Mesure AVANT
echo Mesure memoire AVANT chargement images...
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set before_pss=%%a
    goto img_before_found
)
:img_before_found

if "%before_pss%"=="0" (
    echo ERREUR: Mesure memoire AVANT impossible
    set status=ERROR
    set image_count=0
    goto save_image_result
)

echo    MEMOIRE AVANT: %before_pss% KB

echo.
echo ETAPE 2: %instruction_after%
echo %instruction_count%
echo Attendez que toutes les images soient chargees
echo Appuyez sur ENTREE quand c'est termine...
pause >nul

echo Combien d'images approximativement ont ete chargees/affichees ?
set /p image_count="Nombre d'images: "
if "%image_count%"=="" set image_count=0

REM Stabilisation plus longue pour les images
echo Attente de stabilisation (7 secondes)...
timeout /t 7 >nul

REM Mesure APRES
echo Mesure memoire APRES chargement images...
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set after_pss=%%a
    goto img_after_found
)
:img_after_found

if "%after_pss%"=="0" (
    echo ERREUR: Mesure memoire APRES impossible
    set status=ERROR
    goto save_image_result
)

echo    MEMOIRE APRES: %after_pss% KB

REM Calculs
set /a diff_pss=%after_pss% - %before_pss%
set /a diff_mb=%diff_pss% / 1024

REM Seuils specifiques pour les images (plus permissifs)
set status=EXCELLENT
set notes=Gestion memoire images optimale
if %diff_pss% gtr 8192 (
    set status=BON
    set notes=Consommation images acceptable
)
if %diff_pss% gtr 15360 (
    set status=MODERE
    set notes=Consommation images elevee - Verifier cache
)
if %diff_pss% gtr 30720 (
    set status=CRITIQUE
    set notes=Fuite memoire images probable - Optimisation requise
)
if %diff_pss% gtr 61440 (
    set status=ALERTE
    set notes=Fuite memoire images majeure - Action immediate
)

echo    DIFFERENCE: %diff_pss% KB (%diff_mb% MB) - STATUS: %status%
echo    IMAGES CHARGEES: %image_count%
echo    ANALYSE: %notes%

:save_image_result
echo %date%,%time%,IMAGE,%test_id%,%before_pss%,%after_pss%,%diff_pss%,%diff_mb%,%status%,%image_count%,"%notes%" >> %RESULTS_FILE%

echo [%time%] === FIN TEST IMAGE: %test_description% ===
goto :eof

REM Versions silencieuses pour tests groupes
:test_basic_images_silent
call :perform_image_test "IMG1_RoadTrips_Thumbnails" "Chargement grille thumbnails RoadTrips" ^
    "Placez-vous sur un ecran avec peu d'elements visuels" ^
    "Naviguez vers la liste des RoadTrips (grille avec thumbnails)" ^
    "Comptez approximativement le nombre de thumbnails visibles"
call :perform_image_test "IMG2_Steps_Thumbnails" "Chargement thumbnails etapes detaillees" ^
    "Placez-vous sur la liste des roadtrips" ^
    "Entrez dans un roadtrip avec de nombreuses etapes ayant des images" ^
    "Estimez le nombre de thumbnails d'etapes chargees"
call :perform_image_test "IMG3_Rapid_Navigation" "Navigation rapide - stress test images" ^
    "Placez-vous sur un ecran simple" ^
    "Naviguez rapidement entre plusieurs ecrans avec images (5-10 allers-retours)" ^
    "Nombre approximatif d'images vues lors de la navigation"
call :perform_image_test "IMG4_Photo_Zoom" "Zoom/Dezoom sur photos haute resolution" ^
    "Ouvrez une photo ou thumbnail en petit format" ^
    "Effectuez plusieurs zoom/dezoom sur l'image, puis fermez" ^
    "Une seule image haute resolution"
goto :eof

:test_advanced_images_silent
call :perform_image_test "IMG5_Multi_Photo_Edit" "Edition avec selection multiple de photos" ^
    "Entrez dans un mode d'edition (activite/hebergement)" ^
    "Selectionnez et ajoutez plusieurs photos, puis sauvegardez" ^
    "Nombre de photos selectionnees/ajoutees"
call :perform_image_test "IMG6_Upload_Compression" "Upload et compression d'images" ^
    "Preparez-vous a selectionner une photo depuis la galerie" ^
    "Selectionnez une photo, attendez la compression/upload" ^
    "Une image haute resolution compressee"
call :perform_image_test "IMG7_Image_Cache" "Test persistance cache images" ^
    "Visitez des ecrans avec images puis quittez l'app" ^
    "Rouvrez l'app et revisitez les memes ecrans (cache hit/miss)" ^
    "Images en cache rechargees"
call :perform_image_test "IMG8_Rotation_Images" "Rotation ecran avec images affichees" ^
    "Affichez un ecran avec plusieurs images" ^
    "Effectuez plusieurs rotations d'ecran (portrait - paysage)" ^
    "Images recreees lors des rotations"
goto :eof

:clear_image_cache
echo Vidage du cache images...
adb shell am force-stop %PACKAGE_NAME%
adb shell "pm clear %PACKAGE_NAME%" 2>nul
echo Cache vide. Relancez l'application manuellement.
pause
goto show_image_menu

:measure_current_memory
echo Mesure memoire courante...
echo Assurez-vous que l'app est ouverte.
pause
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set current_pss=%%a
    goto current_found
)
:current_found
echo.
echo MEMOIRE COURANTE: %current_pss% KB
echo.
pause
goto show_image_menu

:show_image_results
echo.
echo ====================================================================
echo                     RESULTATS TESTS IMAGES
echo ====================================================================
if exist "%RESULTS_FILE%" (
    type "%RESULTS_FILE%"
) else (
    echo Aucun resultat d'image trouve.
)
echo.
pause
goto show_image_menu

:show_image_summary
echo.
echo ====================================================================
echo                      RESUME TESTS IMAGES
echo ====================================================================
if exist "%RESULTS_FILE%" (
    echo Fichier: %RESULTS_FILE%
    echo.
    powershell -command "Get-Content '%RESULTS_FILE%' | Where-Object { $_ -match 'IMAGE' } | Select-Object -Last 10"
    echo.
    echo === ANALYSE SPECIALISEE IMAGES ===
    echo - Les images consomment generalement plus de memoire
    echo - Seuils adaptes: EXCELLENT moins de 8MB, BON moins de 15MB, MODERE moins de 30MB
    echo - Surveillez les fuites lors de navigation rapide avec images
    echo - Le cache images doit se liberer automatiquement
) else (
    echo Aucun resultat disponible
)
goto :eof
