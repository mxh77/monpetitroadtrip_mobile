@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls
REM Script de test complet des fuites memoires sur tous les parcours de navigation

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set RESULTS_FILE=..\results\comprehensive_navigation_test_%date:~-4,4%%date:~-10,2%%date:~-7,2%.csv

echo ====================================================================
echo           TEST COMPLET DES FUITES MEMOIRES - NAVIGATION
echo ====================================================================
echo.
echo Ce script teste les fuites memoires sur tous les parcours critiques
echo de navigation de votre application MonPetitRoadTrip.
echo.

REM Verifier si le telephone est connecte
adb devices | findstr "device" >nul
if errorlevel 1 (
    echo ERREUR: Aucun appareil Android detecte
    echo Connectez votre telephone et activez le debogage USB
    pause
    exit /b 1
)

REM Verifier si l'app est installee
adb shell pm list packages | findstr "%PACKAGE_NAME%" >nul
if errorlevel 1 (
    echo ERREUR: Application non trouvee
    echo Assurez-vous que l'app est installee: %PACKAGE_NAME%
    pause
    exit /b 1
)

REM Creer le header CSV si necessaire
if not exist "%RESULTS_FILE%" (
    echo Date,Time,TestStep,Description,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status,Notes > %RESULTS_FILE%
)

REM Fonction pour afficher le menu principal
:show_main_menu
cls >nul 2>&1
echo ====================================================================
echo                        MENU PRINCIPAL
echo ====================================================================
echo.
echo TESTS INDIVIDUELS:
echo  1.  RoadTripsScreen - RoadTripScreen (Liste vers Detail)
echo  2.  RoadTripScreen - Navigation Onglets (Liste - Planning)
echo  3.  RoadTripScreen - StepScreen (Etape Detail)
echo  4.  StepScreen - Navigation Onglets (Infos/Hebergements/Activites)
echo  5.  Planning - edition (EditActivity/EditAccommodation)
echo  6.  Hebergements - EditAccommodationScreen
echo  7.  Activites - EditActivityScreen
echo  8.  Creation d'elements (Steps/Activities/Accommodations)
echo  9.  SettingsScreen et ecrans Utilitaires
echo  10. Image Loading (Thumbnails et Photos)
echo.
echo TESTS GROUPeS:
echo  11. Test Navigation Basique (1-4)
echo  12. Test edition Complete (5-8)
echo  13. Test Complet Automatique (Tous les tests)
echo.
echo ReSULTATS:
echo  14. Afficher les resultats precedents
echo  15. Generer un rapport d'analyse
echo.
echo  16. Quitter
echo.
set /p choice="Selectionnez un test (1-16): "

if "%choice%"=="1" goto test_roadtrips_to_roadtrip
if "%choice%"=="2" goto test_roadtrip_tabs
if "%choice%"=="3" goto test_roadtrip_to_step
if "%choice%"=="4" goto test_step_tabs
if "%choice%"=="5" goto test_planning_editing
if "%choice%"=="6" goto test_accommodations_editing
if "%choice%"=="7" goto test_activities_editing
if "%choice%"=="8" goto test_creation_flows
if "%choice%"=="9" goto test_settings_screens
if "%choice%"=="10" goto test_image_loading
if "%choice%"=="11" goto test_basic_navigation
if "%choice%"=="12" goto test_complete_editing
if "%choice%"=="13" goto test_complete_automated
if "%choice%"=="14" goto show_results
if "%choice%"=="15" goto generate_report
if "%choice%"=="16" exit /b 0

echo Choix invalide, veuillez reessayer...
timeout /t 2 >nul
goto show_main_menu

REM ====================================================================
REM                        TESTS INDIVIDUELS
REM ====================================================================

:test_roadtrips_to_roadtrip
cls
echo ====================================================================
echo       TEST 1: Navigation RoadTripsScreen - RoadTripScreen
echo ====================================================================
call :perform_navigation_test "T1_RoadTrips_to_RoadTrip" "RoadTripsScreen vers RoadTripScreen" ^
    "Placez-vous sur l'ecran liste des roadtrips" ^
    "Cliquez sur un roadtrip pour voir ses details"
goto show_main_menu

:test_roadtrip_tabs
cls
echo ====================================================================
echo     TEST 2: Navigation Onglets RoadTripScreen (Liste - Planning)
echo ====================================================================
call :perform_navigation_test "T2_RoadTrip_Tabs" "Navigation entre onglets RoadTripScreen" ^
    "Placez-vous sur l'onglet 'Liste des etapes'" ^
    "Naviguez vers l'onglet 'Planning'"
goto show_main_menu

:test_roadtrip_to_step
cls
echo ====================================================================
echo         TEST 3: Navigation RoadTripScreen - StepScreen
echo ====================================================================
call :perform_navigation_test "T3_RoadTrip_to_Step" "RoadTripScreen vers StepScreen" ^
    "Placez-vous sur la liste des etapes d'un roadtrip" ^
    "Cliquez sur une etape pour voir ses details"
goto show_main_menu

:test_step_tabs
cls
echo ====================================================================
echo      TEST 4: Navigation Onglets StepScreen (Multi-onglets)
echo ====================================================================
call :perform_navigation_test "T4_Step_Tabs" "Navigation entre onglets StepScreen" ^
    "Placez-vous sur l'onglet 'Infos' d'une etape" ^
    "Naviguez vers les onglets Hebergements puis Activites"
goto show_main_menu

:test_planning_editing
cls
echo ====================================================================
echo    TEST 5: Navigation Planning - edition (Smart Navigation)
echo ====================================================================
call :perform_navigation_test "T5_Planning_Edit" "Planning vers EditActivity/EditAccommodation" ^
    "Placez-vous sur l'onglet Planning d'un roadtrip" ^
    "Cliquez sur un evenement pour l'editer, puis sauvegardez"
goto show_main_menu

:test_accommodations_editing
cls
echo ====================================================================
echo      TEST 6: Navigation Hebergements - EditAccommodation
echo ====================================================================
call :perform_navigation_test "T6_Accommodations_Edit" "Hebergements vers EditAccommodation" ^
    "Placez-vous sur l'onglet Hebergements d'une etape" ^
    "Cliquez sur un hebergement pour l'editer"
goto show_main_menu

:test_activities_editing
cls
echo ====================================================================
echo        TEST 7: Navigation Activites - EditActivity
echo ====================================================================
call :perform_navigation_test "T7_Activities_Edit" "Activites vers EditActivity" ^
    "Placez-vous sur l'onglet Activites d'une etape" ^
    "Cliquez sur une activite pour l'editer"
goto show_main_menu

:test_creation_flows
cls
echo ====================================================================
echo    TEST 8: Flux de Creation (Steps/Activities/Accommodations)
echo ====================================================================
call :perform_navigation_test "T8_Creation_Flow" "Flux de creation d'elements" ^
    "Placez-vous sur un ecran permettant la creation" ^
    "Creez un nouvel element (etape, activite ou hebergement)"
goto show_main_menu

:test_settings_screens
cls
echo ====================================================================
echo        TEST 9: SettingsScreen et ecrans Utilitaires
echo ====================================================================
call :perform_navigation_test "T9_Settings_Utils" "SettingsScreen et ecrans utilitaires" ^
    "Placez-vous sur l'ecran principal" ^
    "Naviguez vers Settings puis d'autres ecrans utilitaires"
goto show_main_menu

:test_image_loading
cls
echo ====================================================================
echo      TEST 10: Test de Chargement d'Images (Memory Impact)
echo ====================================================================
call :perform_navigation_test "T10_Image_Loading" "Chargement intensif d'images" ^
    "Placez-vous sur un ecran avec peu d'images" ^
    "Naviguez vers des ecrans avec de nombreuses images (thumbnails)"
goto show_main_menu

REM ====================================================================
REM                        TESTS GROUPeS
REM ====================================================================

:test_basic_navigation
cls
echo ====================================================================
echo                   TEST NAVIGATION BASIQUE (T1-T4)
echo ====================================================================
echo Ce test va executer automatiquement les tests 1 a 4
echo.
echo Appuyez sur ENTREE pour commencer...
pause >nul

echo === TEST 1/4: RoadTripsScreen - RoadTripScreen ===
call :perform_navigation_test "T1_RoadTrips_to_RoadTrip" "RoadTripsScreen vers RoadTripScreen" ^
    "Placez-vous sur l'ecran liste des roadtrips" ^
    "Cliquez sur un roadtrip pour voir ses details"

echo === TEST 2/4: Navigation Onglets RoadTripScreen ===
call :perform_navigation_test "T2_RoadTrip_Tabs" "Navigation entre onglets RoadTripScreen" ^
    "Placez-vous sur l'onglet 'Liste des etapes'" ^
    "Naviguez vers l'onglet 'Planning'"

echo === TEST 3/4: RoadTripScreen - StepScreen ===
call :perform_navigation_test "T3_RoadTrip_to_Step" "RoadTripScreen vers StepScreen" ^
    "Placez-vous sur la liste des etapes d'un roadtrip" ^
    "Cliquez sur une etape pour voir ses details"

echo === TEST 4/4: Navigation Onglets StepScreen ===
call :perform_navigation_test "T4_Step_Tabs" "Navigation entre onglets StepScreen" ^
    "Placez-vous sur l'onglet 'Infos' d'une etape" ^
    "Naviguez vers les onglets Hebergements puis Activites"

echo.
echo ===== TEST NAVIGATION BASIQUE TERMINe =====
call :show_summary
pause
goto show_main_menu

:test_complete_editing
cls
echo ====================================================================
echo                   TEST eDITION COMPLeTE (T5-T8)
echo ====================================================================
echo Ce test va executer automatiquement les tests 5 a 8
echo.
echo Appuyez sur ENTREE pour commencer...
pause >nul

echo === TEST 5/8: Planning - edition ===
call :perform_navigation_test "T5_Planning_Edit" "Planning vers EditActivity/EditAccommodation" ^
    "Placez-vous sur l'onglet Planning d'un roadtrip" ^
    "Cliquez sur un evenement pour l'editer, puis sauvegardez"

echo === TEST 6/8: Hebergements - edition ===
call :perform_navigation_test "T6_Accommodations_Edit" "Hebergements vers EditAccommodation" ^
    "Placez-vous sur l'onglet Hebergements d'une etape" ^
    "Cliquez sur un hebergement pour l'editer"

echo === TEST 7/8: Activites - edition ===
call :perform_navigation_test "T7_Activities_Edit" "Activites vers EditActivity" ^
    "Placez-vous sur l'onglet Activites d'une etape" ^
    "Cliquez sur une activite pour l'editer"

echo === TEST 8/8: Flux de Creation ===
call :perform_navigation_test "T8_Creation_Flow" "Flux de creation d'elements" ^
    "Placez-vous sur un ecran permettant la creation" ^
    "Creez un nouvel element (etape, activite ou hebergement)"

echo.
echo ===== TEST eDITION COMPLeTE TERMINe =====
call :show_summary
pause
goto show_main_menu

:test_complete_automated
cls
echo ====================================================================
echo                     TEST COMPLET AUTOMATIQUE
echo ====================================================================
echo Ce test va executer TOUS les tests (T1-T10) automatiquement
echo.
echo ATTENTION:  ATTENTION: Ce test peut prendre 30-45 minutes
echo Assurez-vous d'avoir le temps necessaire avant de commencer
echo.
echo Appuyez sur ENTREE pour commencer ou CTRL+C pour annuler...
pause >nul

REM Tests Navigation Basique
echo.
echo ===== PHASE 1/3: NAVIGATION BASIQUE =====
call :test_basic_navigation_silent

REM Tests edition
echo.
echo ===== PHASE 2/3: eDITION ET CReATION =====
call :test_complete_editing_silent

REM Tests Specialises
echo.
echo ===== PHASE 3/3: TESTS SPeCIALISeS =====

echo === TEST 9/10: SettingsScreen et Utilitaires ===
call :perform_navigation_test "T9_Settings_Utils" "SettingsScreen et ecrans utilitaires" ^
    "Placez-vous sur l'ecran principal" ^
    "Naviguez vers Settings puis d'autres ecrans utilitaires"

echo === TEST 10/10: Chargement d'Images ===
call :perform_navigation_test "T10_Image_Loading" "Chargement intensif d'images" ^
    "Placez-vous sur un ecran avec peu d'images" ^
    "Naviguez vers des ecrans avec de nombreuses images (thumbnails)"

echo.
echo ===== TEST COMPLET AUTOMATIQUE TERMINe =====
call :show_summary
call :generate_analysis_report
pause
goto show_main_menu

REM ====================================================================
REM                        FONCTIONS UTILITAIRES
REM ====================================================================

REM Fonction principale pour effectuer un test de navigation
:perform_navigation_test
set test_id=%~1
set test_description=%~2
set instruction_before=%~3
set instruction_after=%~4
set before_pss=0
set after_pss=0

echo.
echo [%time%] === DeBUT DU TEST: %test_description% ===

REM Forcer l'arret et redemarrage de l'app pour un etat propre
echo Redemarrage de l'application...
adb shell am force-stop %PACKAGE_NAME% 2>nul
timeout /t 3 >nul
adb shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1 >nul 2>&1
timeout /t 5 >nul

echo.
echo eTAPE 1: %instruction_before%
echo Appuyez sur ENTREE quand vous y etes...
pause >nul

REM Forcer le GC avant la mesure
echo Nettoyage memoire initial...
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
    echo Test: %test_description%
    echo Verifiez que l'app est ouverte
    set status=ERROR
    set diff_pss=0
    set diff_mb=0
    goto save_result
)

echo    MeMOIRE AVANT: %before_pss% KB

echo.
echo eTAPE 2: %instruction_after%
echo Attendez que toutes les animations soient terminees
echo Appuyez sur ENTREE quand c'est fait...
pause >nul

REM Attendre stabilisation
echo Attente de stabilisation (5 secondes)...
timeout /t 5 >nul

REM Forcer GC apres navigation
echo Nettoyage memoire post-navigation...
adb shell am broadcast -a com.android.internal.intent.action.REQUEST_SHUTDOWN >nul 2>&1
timeout /t 2 >nul

REM Mesure APReS navigation
echo Mesure memoire APReS navigation...
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set after_pss=%%a
    goto after_found
)
:after_found

if "%after_pss%"=="0" (
    echo ERREUR: Impossible de mesurer la memoire APReS
    echo Test: %test_description%
    set status=ERROR
    set diff_pss=0
    set diff_mb=0
    goto save_result
)

echo    MeMOIRE APReS: %after_pss% KB

REM Calculs
set /a diff_pss=%after_pss% - %before_pss%
set /a diff_mb=%diff_pss% / 1024

REM Determination du status selon les seuils
set status=EXCELLENT
set notes=Consommation optimale
if %diff_pss% gtr 5120 (
    set status=BON
    set notes=Consommation acceptable
)
if %diff_pss% gtr 10240 (
    set status=MODeRe
    set notes=Consommation elevee - Surveillance recommandee
)
if %diff_pss% gtr 20480 (
    set status=CRITIQUE
    set notes=Fuite memoire possible - Investigation requise
)
if %diff_pss% gtr 51200 (
    set status=ALERTE
    set notes=Fuite memoire majeure - Action immediate requise
)

echo    DIFFeRENCE: %diff_pss% KB (%diff_mb% MB) - STATUS: %status%
echo    ANALYSE: %notes%

:save_result
REM Sauvegarde dans CSV
echo %date%,%time%,%test_id%,"%test_description%",%before_pss%,%after_pss%,%diff_pss%,%diff_mb%,%status%,"%notes%" >> %RESULTS_FILE%

echo [%time%] === FIN DU TEST: %test_description% ===
echo.
goto :eof

REM Versions silencieuses pour les tests groupes
:test_basic_navigation_silent
call :perform_navigation_test "T1_RoadTrips_to_RoadTrip" "RoadTripsScreen vers RoadTripScreen" ^
    "Placez-vous sur l'ecran liste des roadtrips" ^
    "Cliquez sur un roadtrip pour voir ses details"
call :perform_navigation_test "T2_RoadTrip_Tabs" "Navigation entre onglets RoadTripScreen" ^
    "Placez-vous sur l'onglet 'Liste des etapes'" ^
    "Naviguez vers l'onglet 'Planning'"
call :perform_navigation_test "T3_RoadTrip_to_Step" "RoadTripScreen vers StepScreen" ^
    "Placez-vous sur la liste des etapes d'un roadtrip" ^
    "Cliquez sur une etape pour voir ses details"
call :perform_navigation_test "T4_Step_Tabs" "Navigation entre onglets StepScreen" ^
    "Placez-vous sur l'onglet 'Infos' d'une etape" ^
    "Naviguez vers les onglets Hebergements puis Activites"
goto :eof

:test_complete_editing_silent
call :perform_navigation_test "T5_Planning_Edit" "Planning vers EditActivity/EditAccommodation" ^
    "Placez-vous sur l'onglet Planning d'un roadtrip" ^
    "Cliquez sur un evenement pour l'editer, puis sauvegardez"
call :perform_navigation_test "T6_Accommodations_Edit" "Hebergements vers EditAccommodation" ^
    "Placez-vous sur l'onglet Hebergements d'une etape" ^
    "Cliquez sur un hebergement pour l'editer"
call :perform_navigation_test "T7_Activities_Edit" "Activites vers EditActivity" ^
    "Placez-vous sur l'onglet Activites d'une etape" ^
    "Cliquez sur une activite pour l'editer"
call :perform_navigation_test "T8_Creation_Flow" "Flux de creation d'elements" ^
    "Placez-vous sur un ecran permettant la creation" ^
    "Creez un nouvel element (etape, activite ou hebergement)"
goto :eof

REM Afficher les resultats
:show_results
echo.
echo ====================================================================
echo                          ReSULTATS PReCeDENTS
echo ====================================================================
if exist "%RESULTS_FILE%" (
    type "%RESULTS_FILE%"
) else (
    echo Aucun resultat trouve. Executez d'abord un test.
)
echo.
pause
goto show_main_menu

REM Generer un rapport d'analyse
:generate_report
cls
echo ====================================================================
echo                      GeNeRATION DE RAPPORT
echo ====================================================================
if not exist "%RESULTS_FILE%" (
    echo Aucun resultat disponible pour generer un rapport.
    pause
    goto show_main_menu
)

set REPORT_FILE=..\results\analysis_report_%date:~-4,4%%date:~-10,2%%date:~-7,2%.txt

echo Generation du rapport d'analyse...
echo ================================================================== > %REPORT_FILE%
echo                    RAPPORT D'ANALYSE MeMOIRE >> %REPORT_FILE%
echo                 MonPetitRoadTrip - Navigation Test >> %REPORT_FILE%
echo ================================================================== >> %REPORT_FILE%
echo. >> %REPORT_FILE%
echo Date de generation: %date% %time% >> %REPORT_FILE%
echo Fichier de donnees: %RESULTS_FILE% >> %REPORT_FILE%
echo. >> %REPORT_FILE%

echo === ReSUMe DES TESTS === >> %REPORT_FILE%
findstr /c:"EXCELLENT" %RESULTS_FILE% > temp_excellent.txt 2>nul
findstr /c:"BON" %RESULTS_FILE% > temp_bon.txt 2>nul
findstr /c:"MODeRe" %RESULTS_FILE% > temp_modere.txt 2>nul
findstr /c:"CRITIQUE" %RESULTS_FILE% > temp_critique.txt 2>nul
findstr /c:"ALERTE" %RESULTS_FILE% > temp_alerte.txt 2>nul

for /f %%i in ('type temp_excellent.txt 2^>nul ^| find /c /v ""') do set excellent_count=%%i
for /f %%i in ('type temp_bon.txt 2^>nul ^| find /c /v ""') do set bon_count=%%i
for /f %%i in ('type temp_modere.txt 2^>nul ^| find /c /v ""') do set modere_count=%%i
for /f %%i in ('type temp_critique.txt 2^>nul ^| find /c /v ""') do set critique_count=%%i
for /f %%i in ('type temp_alerte.txt 2^>nul ^| find /c /v ""') do set alerte_count=%%i

echo Tests EXCELLENT: %excellent_count% >> %REPORT_FILE%
echo Tests BON: %bon_count% >> %REPORT_FILE%
echo Tests MODeRe: %modere_count% >> %REPORT_FILE%
echo Tests CRITIQUE: %critique_count% >> %REPORT_FILE%
echo Tests ALERTE: %alerte_count% >> %REPORT_FILE%
echo. >> %REPORT_FILE%

if %critique_count% gtr 0 (
    echo ATTENTION:  ATTENTION: %critique_count% test(s) en statut CRITIQUE detecte(s) >> %REPORT_FILE%
)
if %alerte_count% gtr 0 (
    echo 🚨 ALERTE: %alerte_count% test(s) en statut ALERTE detecte(s) >> %REPORT_FILE%
)

echo. >> %REPORT_FILE%
echo === DONNeES COMPLeTES === >> %REPORT_FILE%
type %RESULTS_FILE% >> %REPORT_FILE%

del temp_*.txt 2>nul

echo.
echo Rapport genere: %REPORT_FILE%
echo.
pause
goto show_main_menu

REM Afficher le resume final
:show_summary
echo.
echo ====================================================================
echo                           ReSUMe FINAL
echo ====================================================================
if exist "%RESULTS_FILE%" (
    echo Fichier de resultats: %RESULTS_FILE%
    echo.
    echo === DERNIERS ReSULTATS ===
    REM Afficher les 10 dernieres lignes du fichier
    powershell -command "Get-Content '%RESULTS_FILE%' | Select-Object -Last 10"
    echo.
    echo === RECOMMANDATIONS ===
    echo - EXCELLENT/BON: Performances optimales
    echo - MODeRe: Surveillance recommandee, optimisations possibles  
    echo - CRITIQUE: Investigation requise, fuites memoire probables
    echo - ALERTE: Action immediate requise, fuites memoire majeures
) else (
    echo Aucun resultat disponible
)
goto :eof

:generate_analysis_report
echo.
echo Generation automatique du rapport d'analyse...
call :generate_report
goto :eof

REM Fonction pour nettoyer a la fin
:cleanup
echo Nettoyage en cours...
adb shell am force-stop %PACKAGE_NAME% 2>nul
echo Nettoyage termine.
goto :eof

REM Gestion de la sortie propre
:exit_script
call :cleanup
echo.
echo Script termine.
exit /b 0
