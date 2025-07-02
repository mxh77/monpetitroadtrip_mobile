@echo off
chcp 65001 >nul
REM Script de test rapide corrige sans labels dynamiques

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set RESULTS_FILE=..\results\quick_test_%date:~-4,4%%date:~-10,2%%date:~-7,2%.csv

echo ====================================================================
echo                        TEST RAPIDE CORRIGe
echo ====================================================================
echo.
echo Test rapide des fonctionnalites critiques (5-10 minutes)
echo.

REM Verifications
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

REM Creer header CSV
if not exist "%RESULTS_FILE%" (
    echo Date,Time,TestID,Description,PSS_Before_KB,PSS_After_KB,Diff_KB,Diff_MB,Status,Notes > %RESULTS_FILE%
)

echo === TEST 1/4: RoadTrips vers RoadTrip ===
call :simple_memory_test "QT1" "RoadTrips vers RoadTrip" "Placez-vous sur la liste des roadtrips" "Entrez dans un roadtrip"

echo === TEST 2/4: Navigation onglets ===
call :simple_memory_test "QT2" "Navigation onglets" "Onglet Liste des etapes" "Onglet Planning"

echo === TEST 3/4: RoadTrip vers Step ===
call :simple_memory_test "QT3" "RoadTrip vers Step" "Liste des etapes" "Detail d'une etape"

echo === TEST 4/4: Navigation Step ===
call :simple_memory_test "QT4" "Navigation Step multi-onglets" "Onglet Infos" "Autres onglets (Hebergements/Activites)"

echo.
echo ===== ReSULTATS RAPIDES =====
if exist "%RESULTS_FILE%" (
    type "%RESULTS_FILE%"
) else (
    echo Aucun resultat genere
)

echo.
echo Test rapide termine!
pause
goto :eof

REM Fonction de test memoire simplifiee
:simple_memory_test
set qt_id=%~1
set qt_desc=%~2
set qt_before=%~3
set qt_after=%~4

echo.
echo [%time%] Test: %qt_desc%

REM Redemarrage propre
echo Redemarrage app...
adb shell am force-stop %PACKAGE_NAME% 2>nul
timeout /t 2 >nul
adb shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1 >nul 2>&1
timeout /t 3 >nul

echo etape 1: %qt_before%
echo Appuyez sur ENTREE quand vous y etes...
pause >nul

REM Mesure AVANT avec etiquette fixe
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set qt_before_pss=%%a
    goto qt_before_ok
)
:qt_before_ok

if "%qt_before_pss%"=="0" (
    echo ERREUR: Mesure AVANT impossible
    set qt_before_pss=0
    set qt_after_pss=0
    set qt_diff=0
    set qt_mb=0
    set qt_status=ERROR
    goto qt_save
)

echo   MeMOIRE AVANT: %qt_before_pss% KB

echo etape 2: %qt_after%
echo Appuyez sur ENTREE quand c'est fait...
pause >nul

REM Stabilisation
timeout /t 3 >nul

REM Mesure APReS avec etiquette fixe
for /f "tokens=3" %%a in ('adb shell dumpsys meminfo %PACKAGE_NAME% ^| findstr "TOTAL PSS:"') do (
    set qt_after_pss=%%a
    goto qt_after_ok
)
:qt_after_ok

if "%qt_after_pss%"=="0" (
    echo ERREUR: Mesure APReS impossible
    set qt_after_pss=0
    set qt_diff=0
    set qt_mb=0
    set qt_status=ERROR
    goto qt_save
)

echo   MeMOIRE APReS: %qt_after_pss% KB

REM Calculs
set /a qt_diff=%qt_after_pss% - %qt_before_pss%
set /a qt_mb=%qt_diff% / 1024

REM Status
set qt_status=EXCELLENT
if %qt_diff% gtr 5120 set qt_status=BON
if %qt_diff% gtr 10240 set qt_status=MODeRe
if %qt_diff% gtr 20480 set qt_status=CRITIQUE

echo   DIFFeRENCE: %qt_diff% KB (%qt_mb% MB) - %qt_status%

:qt_save
echo %date%,%time%,%qt_id%,"%qt_desc%",%qt_before_pss%,%qt_after_pss%,%qt_diff%,%qt_mb%,%qt_status%,Test rapide >> %RESULTS_FILE%
goto :eof
