@echo off
chcp 65001 >nul
REM Script ameliore de test de fuites memoire pour Windows
REM Version avec meilleure extraction des donnees PSS

set PACKAGE_NAME=com.maxime.heron.monpetitroadtrip.debug
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_FILE=memory_test_%TIMESTAMP%.log
set TEMP_FILE=temp_meminfo_%TIMESTAMP%.txt

echo ===== TEST DE FUITE MEMOIRE AMELIORE =====
echo Application: %PACKAGE_NAME%
echo Fichier log: %LOG_FILE%
echo.

REM Verification application
echo Verification de l'application...
adb shell pidof %PACKAGE_NAME% >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Application non detectee
    echo 1. Verifiez que l'app est lancee
    echo 2. Verifiez la connection ADB: adb devices
    echo 3. Verifiez le nom du package
    pause
    exit /b 1
)
echo OK: Application detectee
echo.

REM Fonction pour extraire PSS
:extract_pss
set PSS_VALUE=0
adb shell dumpsys meminfo %PACKAGE_NAME% > %TEMP_FILE% 2>&1
for /f "tokens=3" %%a in ('findstr /C:"TOTAL PSS:" %TEMP_FILE%') do (
    set PSS_VALUE=%%a
    goto pss_found
)
:pss_found
if exist %TEMP_FILE% del %TEMP_FILE%
goto :eof

echo INSTRUCTIONS:
echo 1. Placez-vous sur l'ecran RoadTripsScreen
echo 2. Appuyez sur ENTREE pour la mesure AVANT
pause

REM Mesure AVANT
echo [%time%] Mesure AVANT navigation...
call :extract_pss
set BEFORE_PSS=%PSS_VALUE%
set /a BEFORE_MB=%BEFORE_PSS% / 1024

echo --- MESURE AVANT --- >> %LOG_FILE%
echo PSS: %BEFORE_PSS% KB >> %LOG_FILE%
echo MB: %BEFORE_MB% MB >> %LOG_FILE%
echo Timestamp: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

echo    AVANT: %BEFORE_PSS% KB (%BEFORE_MB% MB)
echo.

echo INSTRUCTIONS:
echo 3. Naviguez vers un RoadTripScreen
echo 4. Attendez le chargement complet
echo 5. Appuyez sur ENTREE pour la mesure APRES
pause

REM Mesure APRES
echo [%time%] Mesure APRES navigation...
call :extract_pss
set AFTER_PSS=%PSS_VALUE%
set /a AFTER_MB=%AFTER_PSS% / 1024

echo --- MESURE APRES --- >> %LOG_FILE%
echo PSS: %AFTER_PSS% KB >> %LOG_FILE%
echo MB: %AFTER_MB% MB >> %LOG_FILE%
echo Timestamp: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

echo    APRES: %AFTER_PSS% KB (%AFTER_MB% MB)
echo.

REM Calculs
set /a DIFF_PSS=%AFTER_PSS% - %BEFORE_PSS%
set /a DIFF_MB=%DIFF_PSS% / 1024

echo --- RESULTATS --- >> %LOG_FILE%
echo Difference PSS: %DIFF_PSS% KB >> %LOG_FILE%
echo Difference MB: %DIFF_MB% MB >> %LOG_FILE%
echo. >> %LOG_FILE%

echo ===== RESULTATS =====
echo Avant:      %BEFORE_PSS% KB (%BEFORE_MB% MB)
echo Apres:      %AFTER_PSS% KB (%AFTER_MB% MB)
echo Difference: %DIFF_PSS% KB (%DIFF_MB% MB)
echo.

REM Evaluation
if %DIFF_PSS% gtr 102400 (
    echo STATUS: CRITIQUE - Fuite majeure (+100MB^)
    echo Action: Correction immediate requise
) else if %DIFF_PSS% gtr 51200 (
    echo STATUS: IMPORTANT - Fuite significative (+50MB^)
    echo Action: Correction recommandee
) else if %DIFF_PSS% gtr 10240 (
    echo STATUS: MODERE - Augmentation notable (+10MB^)
    echo Action: Surveillance necessaire
) else if %DIFF_PSS% gtr 5120 (
    echo STATUS: LEGER - Petite augmentation (+5MB^)
    echo Action: Normal, mais a surveiller
) else if %DIFF_PSS% lss 0 (
    echo STATUS: EXCELLENT - Memoire liberee
    echo Action: Aucune
) else (
    echo STATUS: NORMAL - Augmentation minime
    echo Action: Aucune
)

echo.
echo ===== COMMANDES UTILES =====
echo Monitoring continu:
echo   adb logcat ^| findstr "Memory\|GC\|OOM"
echo.
echo Details memoire:
echo   adb shell dumpsys meminfo %PACKAGE_NAME%
echo.
echo Log sauvegarde: %LOG_FILE%
echo.
pause
