@echo off
chcp 65001 >nul
echo Correction des caracteres speciaux dans tous les scripts batch...
echo.

REM Correction automatique des accents et caracteres speciaux
for %%f in (*.bat) do (
    echo Correction de %%f...
    
    REM Creer un fichier temporaire
    set "temp_file=%%f.tmp"
    
    REM Remplacer les caracteres problematiques
    powershell -Command "(Get-Content '%%f' -Encoding UTF8) -replace 'e', 'e' -replace 'e', 'e' -replace 'e', 'e' -replace 'a', 'a' -replace 'u', 'u' -replace 'c', 'c' -replace 'i', 'i' -replace 'o', 'o' -replace 'a', 'a' -replace 'e', 'E' -replace 'e', 'E' -replace 'a', 'A' -replace 'c', 'C' -replace '-', '-' -replace '-', '-' -replace '-', '-' -replace '-', '-' -replace 'ATTENTION:', 'ATTENTION:' -replace 'OK:', 'OK:' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace '', '' -replace 'Fichier:', 'Fichier:' | Set-Content '!temp_file!' -Encoding UTF8"
    
    REM Remplacer le fichier original
    move "!temp_file!" "%%f" >nul 2>&1
)

echo.
echo Correction terminee!
echo Les scripts ne devraient plus avoir d'erreurs de caracteres speciaux.
pause
