@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls
REM Script principal pour tous les tests de performance memoire - MonPetitRoadTripho off
chcp 65001 >nul
REM Script principal pour tous les tests de performance memoire - MonPetitRoadTrip

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set BASE_DIR=%~dp0
set RESULTS_DIR=%BASE_DIR%..\results

echo ====================================================================
echo                    MONPETITROADTRIP MEMORY TESTER
echo                      Suite Complete de Tests Memoire
echo ====================================================================
echo.
echo Version: 2.0
echo Package: %PACKAGE_NAME%
echo Resultats: %RESULTS_DIR%
echo.

REM Creer le dossier de resultats s'il n'existe pas
if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"

REM Verifications systeme
call :check_system
if errorlevel 1 exit /b 1

:show_main_menu
cls >nul 2>&1
echo ====================================================================
echo                         MENU PRINCIPAL
echo ====================================================================
echo.
echo SUITES DE TESTS SPECIALISEES:
echo  1. Tests Navigation Complete (Tous parcours de navigation)
echo  2. Tests Images et Contenu Multimedia (Performance images)
echo  3. Tests Optimisations Incrementales (Baseline vs Optimise)
echo  4. Tests Stress et Performance (Limites de l'app)
echo.
echo TESTS RAPIDES:
echo  5. Test Rapide Navigation (10 min)
echo  6. Test Rapide Images (5 min)
echo  7. Test Diagnostic Memoire (Etat actuel)
echo.
echo UTILITAIRES:
echo  8. Voir Tous les Resultats
echo  9. Generer Rapport Global
echo  10. Nettoyer Cache et Redemarrer App
echo  11. Configuration et Parametres
echo.
echo  12. Quitter
echo.
set /p choice="Selectionnez une option (1-12): "

if "%choice%"=="1" goto launch_navigation_tests
if "%choice%"=="2" goto launch_image_tests  
if "%choice%"=="3" goto launch_incremental_tests
if "%choice%"=="4" goto launch_stress_tests
if "%choice%"=="5" goto quick_navigation_test
if "%choice%"=="6" goto quick_image_test
if "%choice%"=="7" goto diagnostic_test
if "%choice%"=="8" goto show_all_results
if "%choice%"=="9" goto generate_global_report
if "%choice%"=="10" goto clean_and_restart
if "%choice%"=="11" goto configuration
if "%choice%"=="12" exit /b 0

echo Choix invalide, veuillez reessayer...
timeout /t 2 >nul
goto show_main_menu

REM ====================================================================
REM                     LANCEMENT DES SUITES DE TESTS
REM ====================================================================

:launch_navigation_tests
cls
echo ====================================================================
echo                 LANCEMENT TESTS NAVIGATION COMPLETE
echo ====================================================================
echo.
echo Cette suite teste tous les parcours de navigation critiques:
echo - RoadTripsScreen - RoadTripScreen
echo - Navigation entre onglets (Liste/Planning)
echo - Acces aux details d'etapes (Step/Stage/Stop)
echo - Edition d'elements (Activities/Accommodations)
echo - Flux de creation
echo.
echo Duree estimee: 30-45 minutes
echo.
echo Appuyez sur ENTREE pour lancer ou CTRL+C pour annuler...
pause >nul

call "%BASE_DIR%comprehensive-navigation-test.bat"
echo.
echo Retour au menu principal...
pause
goto show_main_menu

:launch_image_tests
cls
echo ====================================================================
echo              LANCEMENT TESTS IMAGES ET CONTENU MULTIMEDIA
echo ====================================================================
echo.
echo Cette suite teste specifiquement:
echo - Chargement de thumbnails (grilles, listes)
echo - Navigation rapide avec images (stress test)
echo - Zoom/dezoom photos haute resolution
echo - Upload et compression d'images
echo - Persistance du cache images
echo.
echo Duree estimee: 20-30 minutes
echo.
echo Appuyez sur ENTREE pour lancer ou CTRL+C pour annuler...
pause >nul

call "%BASE_DIR%image-performance-test.bat"
echo.
echo Retour au menu principal...
pause
goto show_main_menu

:launch_incremental_tests
cls
echo ====================================================================
echo            LANCEMENT TESTS OPTIMISATIONS INCREMENTALES
echo ====================================================================
echo.
echo Cette suite teste l'impact des optimisations par phase:
echo - Baseline (code actuel)
echo - Images Optimized
echo - FlatList Optimized  
echo - States Optimized
echo - All Optimized
echo.
echo ATTENTION: Necessite des modifications de code entre chaque phase
echo Duree estimee: 45-60 minutes
echo.
echo Appuyez sur ENTREE pour lancer ou CTRL+C pour annuler...
pause >nul

call "%BASE_DIR%automated-incremental-test.bat"
echo.
echo Retour au menu principal...
pause
goto show_main_menu

:launch_stress_tests
cls
echo ====================================================================
echo                LANCEMENT TESTS STRESS ET PERFORMANCE  
echo ====================================================================
echo.
echo Tests avances pour identifier les limites:
echo - Navigation ultra-rapide (stress test)
echo - Chargement massif d'images
echo - Memoire sous contrainte
echo - Tests de regression
echo.
echo ATTENTION: Ces tests peuvent faire planter l'app temporairement
echo Duree estimee: 20-30 minutes
echo.
set /p confirm="Confirmer le lancement des tests stress ? (y/N): "
if /i not "%confirm%"=="y" goto show_main_menu

call :run_stress_tests
echo.
echo Retour au menu principal...
pause
goto show_main_menu

REM ====================================================================
REM                        TESTS RAPIDES
REM ====================================================================

:quick_navigation_test
cls
echo ====================================================================
echo                      TEST RAPIDE NAVIGATION
echo ====================================================================
echo.
echo Test rapide des parcours de navigation les plus critiques
echo Duree: ~10 minutes
echo.
echo Appuyez sur ENTREE pour continuer...
pause >nul

set QUICK_RESULTS="%RESULTS_DIR%\quick_navigation_%date:~-4,4%%date:~-10,2%%date:~-7,2%.csv"
echo Date,Time,TestStep,Description,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status,Notes > %QUICK_RESULTS%

echo === Test 1/4: RoadTrips - RoadTrip ===
call :quick_memory_test "QN1" "RoadTrips vers RoadTrip" "Liste roadtrips" "Detail roadtrip"

echo === Test 2/4: Liste - Planning ===  
call :quick_memory_test "QN2" "Navigation onglets" "Onglet Liste" "Onglet Planning"

echo === Test 3/4: RoadTrip - Step ===
call :quick_memory_test "QN3" "RoadTrip vers Step" "Liste etapes" "Detail etape"

echo === Test 4/4: Step multi-onglets ===
call :quick_memory_test "QN4" "Navigation Step" "Onglet Infos" "Autres onglets"

echo.
echo === RESULTATS RAPIDES ===
type %QUICK_RESULTS%
echo.
echo Test rapide termine!
pause
goto show_main_menu

:quick_image_test
cls
echo ====================================================================
echo                        TEST RAPIDE IMAGES
echo ====================================================================
echo.
echo Test rapide de performance sur les images
echo Duree: ~5 minutes
echo.
echo Appuyez sur ENTREE pour continuer...
pause >nul

set QUICK_IMG_RESULTS="%RESULTS_DIR%\quick_images_%date:~-4,4%%date:~-10,2%%date:~-7,2%.csv"
echo Date,Time,TestStep,Description,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status,ImageCount > %QUICK_IMG_RESULTS%

echo === Test 1/2: Thumbnails Grid ===
call :quick_image_memory_test "QI1" "Thumbnails RoadTrips" "Ecran simple" "Grille thumbnails"

echo === Test 2/2: Navigation Images ===
call :quick_image_memory_test "QI2" "Navigation avec images" "Ecran sans images" "Navigation multiple avec images"

echo.
echo === RESULTATS RAPIDES IMAGES ===
type %QUICK_IMG_RESULTS%
echo.
echo Test rapide images termine!
pause
goto show_main_menu

:diagnostic_test
cls
echo ====================================================================
echo                      TEST DIAGNOSTIC MEMOIRE
echo ====================================================================
echo.
echo Test pour diagnostiquer l'etat actuel de la memoire
echo.

echo Assurez-vous que l'app est ouverte et en cours d'utilisation
echo Appuyez sur ENTREE pour mesurer...
pause >nul

REM Obtenir info detaillee memoire
echo === DIAGNOSTIC MEMOIRE DETAILLE ===
echo.

echo Mesure PSS Total...
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set current_pss=%%a
    goto diagnostic_found
)
:diagnostic_found

echo PSS Total: %current_pss% KB

echo.
echo Info detaillee:
adb shell dumpsys meminfo %PACKAGE_NAME% | findstr /i "java heap native heap graphics"

echo.
echo === ANALYSE ===
set /a pss_mb=%current_pss% / 1024
echo Consommation: %pss_mb% MB
if %pss_mb% lss 50 echo Status: EXCELLENT - Consommation tres faible
if %pss_mb% geq 50 if %pss_mb% lss 100 echo Status: BON - Consommation normale
if %pss_mb% geq 100 if %pss_mb% lss 200 echo Status: MODERE - Surveillance recommandee
if %pss_mb% geq 200 echo Status: CRITIQUE - Investigation requise

echo.
pause
goto show_main_menu

REM ====================================================================
REM                        FONCTIONS UTILITAIRES
REM ====================================================================

:show_all_results
cls
echo ====================================================================
echo                      TOUS LES RESULTATS
echo ====================================================================
echo.
echo Fichiers de resultats disponibles:
echo.

if exist "%RESULTS_DIR%\*.csv" (
    for %%f in ("%RESULTS_DIR%\*.csv") do (
        echo Fichier: %%~nxf
        echo    Taille: %%~zf bytes
        echo    Modifie: %%~tf
        echo.
    )
    echo.
    set /p viewfile="Entrez le nom du fichier a voir (sans .csv) ou ENTER pour retour: "
    if not "!viewfile!"=="" (
        if exist "%RESULTS_DIR%\!viewfile!.csv" (
            echo.
            echo === CONTENU DE !viewfile!.csv ===
            type "%RESULTS_DIR%\!viewfile!.csv"
            echo.
        ) else (
            echo Fichier non trouve: !viewfile!.csv
        )
    )
) else (
    echo Aucun fichier de resultats trouve.
    echo Executez d'abord quelques tests.
)

echo.
pause
goto show_main_menu

:generate_global_report
cls
echo ====================================================================
echo                    GENERATION RAPPORT GLOBAL
echo ====================================================================
echo.

set GLOBAL_REPORT="%RESULTS_DIR%\global_report_%date:~-4,4%%date:~-10,2%%date:~-7,2%.html"

echo Generation d'un rapport HTML global...
echo.

echo ^<!DOCTYPE html^> > %GLOBAL_REPORT%
echo ^<html^>^<head^>^<title^>MonPetitRoadTrip - Rapport Memoire Global^</title^> >> %GLOBAL_REPORT%
echo ^<style^>body{font-family:Arial,sans-serif;margin:20px;}table{border-collapse:collapse;width:100%%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}^</style^> >> %GLOBAL_REPORT%
echo ^</head^>^<body^> >> %GLOBAL_REPORT%
echo ^<h1^>MonPetitRoadTrip - Rapport Memoire Global^</h1^> >> %GLOBAL_REPORT%
echo ^<p^>Genere le: %date% %time%^</p^> >> %GLOBAL_REPORT%

echo ^<h2^>Resume des Tests^</h2^> >> %GLOBAL_REPORT%
echo ^<table^>^<tr^>^<th^>Fichier^</th^>^<th^>Taille^</th^>^<th^>Date Modification^</th^>^</tr^> >> %GLOBAL_REPORT%

if exist "%RESULTS_DIR%\*.csv" (
    for %%f in ("%RESULTS_DIR%\*.csv") do (
        echo ^<tr^>^<td^>%%~nxf^</td^>^<td^>%%~zf bytes^</td^>^<td^>%%~tf^</td^>^</tr^> >> %GLOBAL_REPORT%
    )
)

echo ^</table^> >> %GLOBAL_REPORT%
echo ^</body^>^</html^> >> %GLOBAL_REPORT%

echo Rapport genere: %GLOBAL_REPORT%
echo.
set /p openreport="Ouvrir le rapport dans le navigateur ? (y/N): "
if /i "%openreport%"=="y" start %GLOBAL_REPORT%

pause
goto show_main_menu

:clean_and_restart
cls
echo ====================================================================
echo                     NETTOYAGE ET REDEMARRAGE
echo ====================================================================
echo.
echo Cette operation va:
echo - Forcer l'arret de l'application
echo - Vider le cache de l'application
echo - Redemarrer l'application
echo.
set /p confirm="Confirmer le nettoyage ? (y/N): "
if /i not "%confirm%"=="y" goto show_main_menu

echo Arret de l'application...
adb shell am force-stop %PACKAGE_NAME%

echo Vidage du cache...
adb shell pm clear %PACKAGE_NAME% 2>nul

echo Attente (5 secondes)...
timeout /t 5 >nul

echo Redemarrage de l'application...
adb shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1 >nul 2>&1

echo.
echo Nettoyage termine! L'application devrait redemarrer.
pause
goto show_main_menu

:configuration
cls
echo ====================================================================
echo                   CONFIGURATION ET PARAMETRES
echo ====================================================================
echo.
echo Package actuel: %PACKAGE_NAME%
echo Dossier resultats: %RESULTS_DIR%
echo.
echo Options de configuration:
echo 1. Changer le package de l'application
echo 2. Changer le dossier de resultats  
echo 3. Verifier la connexion ADB
echo 4. Retour menu principal
echo.
set /p configchoice="Choisir une option (1-4): "

if "%configchoice%"=="1" goto change_package
if "%configchoice%"=="2" goto change_results_dir
if "%configchoice%"=="3" goto check_adb_connection
if "%configchoice%"=="4" goto show_main_menu

goto configuration

:change_package
echo.
echo Package actuel: %PACKAGE_NAME%
set /p new_package="Nouveau package (ou ENTER pour garder): "
if not "%new_package%"=="" set PACKAGE_NAME=%new_package%
echo Package mis a jour: %PACKAGE_NAME%
pause
goto configuration

:change_results_dir
echo.
echo Dossier actuel: %RESULTS_DIR%
set /p new_dir="Nouveau dossier (ou ENTER pour garder): "
if not "%new_dir%"=="" set RESULTS_DIR=%new_dir%
echo Dossier mis a jour: %RESULTS_DIR%
if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"
pause
goto configuration

:check_adb_connection
echo.
echo === VERIFICATION CONNEXION ADB ===
adb devices
echo.
echo Si aucun device n'est liste, verifiez:
echo - USB debugging active sur le telephone
echo - Cable USB fonctionnel
echo - Autorisation accordee sur le telephone
pause
goto configuration

REM ====================================================================
REM                        FONCTIONS INTERNES
REM ====================================================================

:check_system
echo Verification du systeme...

REM Verifier ADB
adb version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: ADB non trouve ou non fonctionnel
    echo Installez Android SDK Platform Tools
    pause
    exit /b 1
)

REM Verifier connexion device
adb devices | findstr "device" >nul
if errorlevel 1 (
    echo ERREUR: Aucun appareil Android connecte
    echo - Connectez votre telephone via USB
    echo - Activez le debogage USB
    echo - Autorisez la connexion sur le telephone
    pause
    exit /b 1
)

REM Verifier app installee
adb shell pm list packages | findstr "%PACKAGE_NAME%" >nul
if errorlevel 1 (
    echo ERREUR: Application non installee: %PACKAGE_NAME%
    echo Installez l'application avant de continuer
    pause
    exit /b 1
)

echo Systeme verifie - Pret pour les tests
echo.
goto :eof

:quick_memory_test
set qt_id=%~1
set qt_desc=%~2
set qt_before=%~3
set qt_after=%~4

echo Test: %qt_desc%
echo Etape 1: %qt_before%
pause >nul

for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do set qt_before_pss=%%a

echo Etape 2: %qt_after%  
pause >nul
timeout /t 3 >nul

for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do set qt_after_pss=%%a

set /a qt_diff=%qt_after_pss% - %qt_before_pss%
set /a qt_mb=%qt_diff% / 1024

set qt_status=BON
if %qt_diff% gtr 20480 set qt_status=CRITIQUE

echo %date%,%time%,%qt_id%,"%qt_desc%",%qt_before_pss%,%qt_after_pss%,%qt_diff%,%qt_mb%,%qt_status%,Test rapide >> %QUICK_RESULTS%
echo Resultat: %qt_diff% KB (%qt_mb% MB) - %qt_status%
goto :eof

:quick_image_memory_test
set qi_id=%~1
set qi_desc=%~2
set qi_before=%~3
set qi_after=%~4

echo Test: %qi_desc%
echo Etape 1: %qi_before%
pause >nul

for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do set qi_before_pss=%%a

echo Etape 2: %qi_after%
set /p qi_count="Nb images approx: "
pause >nul
timeout /t 5 >nul

for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do set qi_after_pss=%%a

set /a qi_diff=%qi_after_pss% - %qi_before_pss%
set /a qi_mb=%qi_diff% / 1024

set qi_status=BON
if %qi_diff% gtr 30720 set qi_status=CRITIQUE

echo %date%,%time%,%qi_id%,"%qi_desc%",%qi_before_pss%,%qi_after_pss%,%qi_diff%,%qi_mb%,%qi_status%,%qi_count% >> %QUICK_IMG_RESULTS%
echo Resultat: %qi_diff% KB (%qi_mb% MB) - %qi_status%
goto :eof

:run_stress_tests
echo ====================================================================
echo                       TESTS STRESS AVANCES
echo ====================================================================
echo.
echo ATTENTION: Tests de stress - Peuvent temporairement destabiliser l'app
echo.

REM Stress test 1: Navigation ultra-rapide
echo === STRESS TEST 1: Navigation ultra-rapide ===
echo Instructions: Naviguez tres rapidement entre 10+ ecrans differents
echo sans attendre le chargement complet. Stress test navigation.
pause

call :quick_memory_test "STRESS1" "Navigation ultra-rapide" "Ecran stable" "Apres navigation rapide multiple"

REM Stress test 2: Images en masse
echo === STRESS TEST 2: Chargement images en masse ===
echo Instructions: Visitez rapidement plusieurs ecrans avec beaucoup d'images
echo Grilles de photos, listes avec thumbnails, etc.
pause

call :quick_image_memory_test "STRESS2" "Images en masse" "Ecran simple" "Apres chargement massif images"

echo.
echo Tests stress termines!
goto :eof
