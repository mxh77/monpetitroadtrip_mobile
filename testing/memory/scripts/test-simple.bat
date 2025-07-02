@echo off
cls
echo ====================================================================
echo                    TEST SCRIPT SIMPLE
echo ====================================================================
echo.
echo Ce script teste l'affichage correct sans echo des commandes
echo.
echo MENU DE TEST:
echo  1. Option 1
echo  2. Option 2  
echo  3. Quitter
echo.
set /p choice="Choisissez une option (1-3): "

if "%choice%"=="1" (
    echo Vous avez choisi l'option 1
    pause
    goto :eof
)
if "%choice%"=="2" (
    echo Vous avez choisi l'option 2
    pause
    goto :eof
)
if "%choice%"=="3" (
    echo Au revoir!
    goto :eof
)

echo Choix invalide
pause
