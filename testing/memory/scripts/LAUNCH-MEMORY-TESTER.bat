@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title MonPetitRoadTrip - Memory Tester
cls

echo ====================================================================
echo              LANCEMENT DU TESTEUR MEMOIRE PRINCIPAL
echo ====================================================================
echo.
echo Initialisation...
echo.

REM Verifier que nous sommes dans le bon repertoire
if not exist "master-memory-tester.bat" (
    echo ERREUR: Script principal non trouve dans ce repertoire
    echo Assurez-vous d'etre dans le dossier scripts
    pause
    exit /b 1
)

echo Lancement du menu principal...
echo.
pause

REM Lancer le script principal
call master-memory-tester.bat

echo.
echo Session terminee.
pause
