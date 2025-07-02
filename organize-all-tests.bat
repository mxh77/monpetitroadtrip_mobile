@echo off
chcp 65001 >nul
REM Script pour organiser tous les fichiers de test dans le dossier testing

echo ===== ORGANISATION COMPLETE DES FICHIERS DE TEST =====
echo.

REM Créer la structure complète des dossiers de test
echo Creation de la structure des dossiers...
if not exist "testing\memory\scripts" mkdir testing\memory\scripts
if not exist "testing\memory\results" mkdir testing\memory\results
if not exist "testing\functional" mkdir testing\functional
if not exist "testing\integration" mkdir testing\integration
if not exist "testing\performance" mkdir testing\performance
if not exist "testing\docs" mkdir testing\docs

echo.
echo === DEPLACEMENT DES SCRIPTS DE TEST JAVASCRIPT ===

REM Tests fonctionnels
echo Deplacement des tests fonctionnels...
if exist "test-algolia-dissociation.js" (
    move "test-algolia-dissociation.js" "testing\functional\"
    echo   test-algolia-dissociation.js -> testing\functional\
)

REM Tests de performance
echo Deplacement des tests de performance...
if exist "performance-test.js" (
    move "performance-test.js" "testing\performance\"
    echo   performance-test.js -> testing\performance\
)

if exist "performance-diagnosis.js" (
    move "performance-diagnosis.js" "testing\performance\"
    echo   performance-diagnosis.js -> testing\performance\
)

REM Scripts de test existants
if exist "performance-check.sh" (
    move "performance-check.sh" "testing\performance\"
    echo   performance-check.sh -> testing\performance\
)

if exist "advanced-optimization.sh" (
    move "advanced-optimization.sh" "testing\performance\"
    echo   advanced-optimization.sh -> testing\performance\
)

echo.
echo === DEPLACEMENT DES SCRIPTS DE TEST MEMOIRE ===

REM Scripts de test mémoire
echo Deplacement des scripts de test memoire...
if exist "memory-leak-test.bat" (
    move "memory-leak-test.bat" "testing\memory\scripts\"
    echo   memory-leak-test.bat -> testing\memory\scripts\
)

if exist "memory-leak-test-improved.bat" (
    move "memory-leak-test-improved.bat" "testing\memory\scripts\"
    echo   memory-leak-test-improved.bat -> testing\memory\scripts\
)

if exist "memory-leak-test.sh" (
    move "memory-leak-test.sh" "testing\memory\scripts\"
    echo   memory-leak-test.sh -> testing\memory\scripts\
)

if exist "incremental-memory-test.bat" (
    move "incremental-memory-test.bat" "testing\memory\scripts\"
    echo   incremental-memory-test.bat -> testing\memory\scripts\
)

if exist "comparative-memory-test.bat" (
    move "comparative-memory-test.bat" "testing\memory\scripts\"
    echo   comparative-memory-test.bat -> testing\memory\scripts\
)

if exist "automated-incremental-test.bat" (
    move "automated-incremental-test.bat" "testing\memory\scripts\"
    echo   automated-incremental-test.bat -> testing\memory\scripts\
)

if exist "fully-automated-test.bat" (
    move "fully-automated-test.bat" "testing\memory\scripts\"
    echo   fully-automated-test.bat -> testing\memory\scripts\
)

echo.
echo === DEPLACEMENT DES RESULTATS DE TEST ===

REM Résultats de test
echo Deplacement des resultats de test...
if exist "optimization_results_*.csv" (
    move "optimization_results_*.csv" "testing\memory\results\" 2>nul
    echo   optimization_results_*.csv -> testing\memory\results\
)

if exist "automated_optimization_results_*.csv" (
    move "automated_optimization_results_*.csv" "testing\memory\results\" 2>nul
    echo   automated_optimization_results_*.csv -> testing\memory\results\
)

if exist "fully_automated_test_*.csv" (
    move "fully_automated_test_*.csv" "testing\memory\results\" 2>nul
    echo   fully_automated_test_*.csv -> testing\memory\results\
)

if exist "logcat_filtered.txt" (
    move "logcat_filtered.txt" "testing\memory\results\"
    echo   logcat_filtered.txt -> testing\memory\results\
)

if exist "logcat.txt" (
    move "logcat.txt" "testing\memory\results\"
    echo   logcat.txt -> testing\memory\results\
)

echo.
echo === DEPLACEMENT DES DOCUMENTATIONS DE TEST ===

REM Documentations de test
echo Deplacement des documentations de test...
if exist "TEST_*.md" (
    for %%f in (TEST_*.md) do (
        move "%%f" "testing\docs\"
        echo   %%f -> testing\docs\
    )
)

if exist "DIAGNOSTIC_*.md" (
    for %%f in (DIAGNOSTIC_*.md) do (
        move "%%f" "testing\docs\"
        echo   %%f -> testing\docs\
    )
)

if exist "ETAPE*_*.md" (
    for %%f in (ETAPE*_*.md) do (
        move "%%f" "testing\docs\"
        echo   %%f -> testing\docs\
    )
)

if exist "STEP*_*.md" (
    for %%f in (STEP*_*.md) do (
        move "%%f" "testing\docs\"
        echo   %%f -> testing\docs\
    )
)

echo.
echo === MISE A JOUR DES CHEMINS DANS LES SCRIPTS ===

REM Mettre à jour les chemins dans les scripts déplacés
echo Mise a jour des chemins dans les scripts...

REM Correction des chemins dans les scripts de test mémoire
if exist "testing\memory\scripts\automated-incremental-test.bat" (
    powershell -Command "(Get-Content 'testing\memory\scripts\automated-incremental-test.bat') -replace 'automated_optimization_results_', '..\results\automated_optimization_results_' | Set-Content 'testing\memory\scripts\automated-incremental-test.bat'"
    echo   automated-incremental-test.bat chemins mis a jour
)

if exist "testing\memory\scripts\fully-automated-test.bat" (
    powershell -Command "(Get-Content 'testing\memory\scripts\fully-automated-test.bat') -replace 'fully_automated_test_', '..\results\fully_automated_test_' | Set-Content 'testing\memory\scripts\fully-automated-test.bat'"
    echo   fully-automated-test.bat chemins mis a jour
)

if exist "testing\memory\scripts\incremental-memory-test.bat" (
    powershell -Command "(Get-Content 'testing\memory\scripts\incremental-memory-test.bat') -replace 'optimization_results_', '..\results\optimization_results_' | Set-Content 'testing\memory\scripts\incremental-memory-test.bat'"
    echo   incremental-memory-test.bat chemins mis a jour
)

if exist "testing\memory\scripts\comparative-memory-test.bat" (
    powershell -Command "(Get-Content 'testing\memory\scripts\comparative-memory-test.bat') -replace 'comparative_results_', '..\results\comparative_results_' | Set-Content 'testing\memory\scripts\comparative-memory-test.bat'"
    echo   comparative-memory-test.bat chemins mis a jour
)

echo.
echo === CREATION DES SCRIPTS DE LANCEMENT ===

REM Créer les scripts de lancement depuis la racine
echo Creation des scripts de lancement...

REM Script principal de test mémoire
(
echo @echo off
echo REM Lanceur principal pour les tests memoire
echo echo ===== TESTS MEMOIRE - MENU PRINCIPAL =====
echo echo.
echo echo 1. Test interactif ^(recommande^)
echo echo 2. Test automatique complet
echo echo 3. Test comparatif
echo echo 4. Afficher les resultats
echo echo 5. Quitter
echo echo.
echo set /p choice="Choisissez une option (1-5): "
echo.
echo if "%%choice%%"=="1" (
echo     cd testing\memory\scripts
echo     automated-incremental-test.bat
echo     cd ..\..\..
echo )
echo if "%%choice%%"=="2" (
echo     cd testing\memory\scripts
echo     fully-automated-test.bat
echo     cd ..\..\..
echo )
echo if "%%choice%%"=="3" (
echo     cd testing\memory\scripts
echo     comparative-memory-test.bat
echo     cd ..\..\..
echo )
echo if "%%choice%%"=="4" (
echo     echo Ouverture du dossier des resultats...
echo     explorer testing\memory\results
echo )
echo if "%%choice%%"=="5" exit /b 0
echo.
echo echo Choix invalide
echo pause
) > "run-memory-tests.bat"

REM Script pour les tests de performance
(
echo @echo off
echo REM Lanceur pour les tests de performance
echo echo ===== TESTS DE PERFORMANCE =====
echo echo.
echo echo 1. Test de performance JavaScript
echo echo 2. Diagnostic de performance
echo echo 3. Optimisation avancee
echo echo 4. Quitter
echo echo.
echo set /p choice="Choisissez une option (1-4): "
echo.
echo if "%%choice%%"=="1" (
echo     cd testing\performance
echo     node performance-test.js
echo     cd ..\..
echo )
echo if "%%choice%%"=="2" (
echo     cd testing\performance
echo     node performance-diagnosis.js
echo     cd ..\..
echo )
echo if "%%choice%%"=="3" (
echo     cd testing\performance
echo     bash advanced-optimization.sh
echo     cd ..\..
echo )
echo if "%%choice%%"=="4" exit /b 0
echo.
echo echo Choix invalide
echo pause
) > "run-performance-tests.bat"

REM Script pour les tests fonctionnels
(
echo @echo off
echo REM Lanceur pour les tests fonctionnels
echo echo ===== TESTS FONCTIONNELS =====
echo echo.
echo echo 1. Test dissociation Algolia
echo echo 2. Ajouter un nouveau test
echo echo 3. Quitter
echo echo.
echo set /p choice="Choisissez une option (1-3): "
echo.
echo if "%%choice%%"=="1" (
echo     cd testing\functional
echo     node test-algolia-dissociation.js
echo     cd ..\..
echo )
echo if "%%choice%%"=="2" (
echo     echo Creez votre test dans testing\functional\
echo     explorer testing\functional
echo )
echo if "%%choice%%"=="3" exit /b 0
echo.
echo echo Choix invalide
echo pause
) > "run-functional-tests.bat"

echo   run-memory-tests.bat cree
echo   run-performance-tests.bat cree
echo   run-functional-tests.bat cree

echo.
echo ===== ORGANISATION TERMINEE =====
echo.
echo Nouvelle structure de test:
echo.
echo   testing/
echo   ├── memory/
echo   │   ├── scripts/      - Scripts de test memoire (.bat, .sh)
echo   │   └── results/      - Resultats automatiques (.csv, .txt)
echo   ├── performance/      - Tests de performance (.js, .sh)
echo   ├── functional/       - Tests fonctionnels (.js)
echo   ├── integration/      - Tests d'integration (futur)
echo   └── docs/             - Documentation de test (.md)
echo.
echo Scripts de lancement (depuis la racine):
echo   run-memory-tests.bat      - Tests memoire
echo   run-performance-tests.bat - Tests performance  
echo   run-functional-tests.bat  - Tests fonctionnels
echo.
echo Tous les fichiers ont ete organises et les chemins mis a jour !
pause
