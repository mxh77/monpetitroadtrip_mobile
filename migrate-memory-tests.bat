@echo off
chcp 65001 >nul
REM Script de migration pour les scripts de test memoire existants

echo ===== MIGRATION DES SCRIPTS DE TEST MEMOIRE =====
echo.

REM Creer les dossiers si necessaires
if not exist "testing\memory\scripts" mkdir testing\memory\scripts
if not exist "testing\memory\results" mkdir testing\memory\results

REM Copier les scripts existants vers le nouveau dossier
echo Copie des scripts de test memoire...

if exist "automated-incremental-test.bat" (
    copy "automated-incremental-test.bat" "testing\memory\scripts\automated-incremental-test.bat"
    echo   automated-incremental-test.bat copie
)

if exist "fully-automated-test.bat" (
    copy "fully-automated-test.bat" "testing\memory\scripts\fully-automated-test.bat"
    echo   fully-automated-test.bat copie
)

if exist "incremental-memory-test.bat" (
    copy "incremental-memory-test.bat" "testing\memory\scripts\incremental-memory-test.bat"
    echo   incremental-memory-test.bat copie
)

if exist "memory-leak-test.bat" (
    copy "memory-leak-test.bat" "testing\memory\scripts\memory-leak-test.bat"
    echo   memory-leak-test.bat copie
)

if exist "memory-leak-test-improved.bat" (
    copy "memory-leak-test-improved.bat" "testing\memory\scripts\memory-leak-test-improved.bat"
    echo   memory-leak-test-improved.bat copie
)

if exist "comparative-memory-test.bat" (
    copy "comparative-memory-test.bat" "testing\memory\scripts\comparative-memory-test.bat"
    echo   comparative-memory-test.bat copie
)

if exist "memory-leak-test.sh" (
    copy "memory-leak-test.sh" "testing\memory\scripts\memory-leak-test.sh"
    echo   memory-leak-test.sh copie
)

echo.
echo Mise a jour des chemins dans les scripts...

REM Mettre a jour le chemin des resultats dans automated-incremental-test.bat
if exist "testing\memory\scripts\automated-incremental-test.bat" (
    powershell -Command "(Get-Content 'testing\memory\scripts\automated-incremental-test.bat') -replace 'automated_optimization_results_', '..\results\automated_optimization_results_' | Set-Content 'testing\memory\scripts\automated-incremental-test.bat'"
    echo   automated-incremental-test.bat mis a jour
)

REM Mettre a jour le chemin des resultats dans fully-automated-test.bat
if exist "testing\memory\scripts\fully-automated-test.bat" (
    powershell -Command "(Get-Content 'testing\memory\scripts\fully-automated-test.bat') -replace 'fully_automated_test_', '..\results\fully_automated_test_' | Set-Content 'testing\memory\scripts\fully-automated-test.bat'"
    echo   fully-automated-test.bat mis a jour
)

REM Creer un script de lancement depuis la racine
echo.
echo Creation du script de lancement...

(
echo @echo off
echo REM Lanceur pour les tests memoire
echo cd testing\memory\scripts
echo automated-incremental-test.bat
echo cd ..\..\..
) > "run-memory-tests.bat"

echo   run-memory-tests.bat cree

echo.
echo ===== MIGRATION TERMINEE =====
echo.
echo Nouvelle structure:
echo   testing\memory\scripts\  - Scripts de test
echo   testing\memory\results\  - Resultats (automatique)
echo   run-memory-tests.bat     - Lanceur depuis la racine
echo.
echo Usage:
echo   run-memory-tests.bat     - Lancer le test interactif
echo   cd testing\memory\scripts ^&^& fully-automated-test.bat - Test automatique
echo.
pause
