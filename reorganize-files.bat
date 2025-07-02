@echo off
chcp 65001 >nul
REM Script pour reorganiser les fichiers de test et documentation

echo ===== REORGANISATION DES FICHIERS DE TEST ET DOCUMENTATION =====
echo.

REM Créer les dossiers de destination s'ils n'existent pas
if not exist "testing\memory\scripts" mkdir testing\memory\scripts
if not exist "testing\memory\results" mkdir testing\memory\results
if not exist "docs\guides" mkdir docs\guides
if not exist "docs\features" mkdir docs\features
if not exist "docs\optimization" mkdir docs\optimization

echo Deplacement des scripts de test memoire...
if exist "memory-leak-test.bat" move "memory-leak-test.bat" "testing\memory\scripts\"
if exist "memory-leak-test-improved.bat" move "memory-leak-test-improved.bat" "testing\memory\scripts\"
if exist "memory-leak-test.sh" move "memory-leak-test.sh" "testing\memory\scripts\"
if exist "incremental-memory-test.bat" move "incremental-memory-test.bat" "testing\memory\scripts\"
if exist "comparative-memory-test.bat" move "comparative-memory-test.bat" "testing\memory\scripts\"
if exist "automated-incremental-test.bat" move "automated-incremental-test.bat" "testing\memory\scripts\"
if exist "fully-automated-test.bat" move "fully-automated-test.bat" "testing\memory\scripts\"

echo Deplacement des scripts de performance...
if exist "performance-check.sh" move "performance-check.sh" "testing\"
if exist "performance-diagnosis.js" move "performance-diagnosis.js" "testing\"
if exist "performance-test.js" move "performance-test.js" "testing\"
if exist "advanced-optimization.sh" move "advanced-optimization.sh" "testing\"

echo Deplacement des resultats de test...
if exist "optimization_results_*.csv" move "optimization_results_*.csv" "testing\memory\results\"
if exist "automated_optimization_results_*.csv" move "automated_optimization_results_*.csv" "testing\memory\results\"
if exist "fully_automated_test_*.csv" move "fully_automated_test_*.csv" "testing\memory\results\"
if exist "logcat_filtered.txt" move "logcat_filtered.txt" "testing\memory\results\"
if exist "logcat.txt" move "logcat.txt" "testing\memory\results\"

echo Deplacement des guides...
if exist "MEMORY_LEAK_TEST_GUIDE.md" move "MEMORY_LEAK_TEST_GUIDE.md" "docs\guides\"
if exist "AUTOMATED_MEMORY_TEST_GUIDE.md" move "AUTOMATED_MEMORY_TEST_GUIDE.md" "docs\guides\"
if exist "ADVANCED_MEMORY_OPTIMIZATIONS.md" move "ADVANCED_MEMORY_OPTIMIZATIONS.md" "docs\guides\"
if exist "DEPLOYMENT_GUIDE.md" move "DEPLOYMENT_GUIDE.md" "docs\guides\"
if exist "GUIDE_PHOTOS_RECITS.md" move "GUIDE_PHOTOS_RECITS.md" "docs\guides\"
if exist "GUIDE_SIMPLE_PERFS.md" move "GUIDE_SIMPLE_PERFS.md" "docs\guides\"
if exist "GUIDE_TELEPHONE.md" move "GUIDE_TELEPHONE.md" "docs\guides\"
if exist "IMPLEMENTATION_GUIDE.md" move "IMPLEMENTATION_GUIDE.md" "docs\guides\"
if exist "MISSING_ADDRESSES_GUIDE.md" move "MISSING_ADDRESSES_GUIDE.md" "docs\guides\"
if exist "NAVIGATION_PLANNING_GUIDE.md" move "NAVIGATION_PLANNING_GUIDE.md" "docs\guides\"
if exist "PLANNING_OPTIMIZATION_GUIDE.md" move "PLANNING_OPTIMIZATION_GUIDE.md" "docs\guides\"
if exist "SMART_NAVIGATION_GUIDE.md" move "SMART_NAVIGATION_GUIDE.md" "docs\guides\"
if exist "SOLUTION_NAVIGATION_PLANNING.md" move "SOLUTION_NAVIGATION_PLANNING.md" "docs\guides\"

echo Deplacement des documentations de fonctionnalites...
if exist "ACTIVITY_ICONS_FEATURE_README.md" move "ACTIVITY_ICONS_FEATURE_README.md" "docs\features\"
if exist "ACTIVITY_NATURAL_LANGUAGE_FEATURE_README.md" move "ACTIVITY_NATURAL_LANGUAGE_FEATURE_README.md" "docs\features\"
if exist "ACTIVITY_TYPE_FEATURE_README.md" move "ACTIVITY_TYPE_FEATURE_README.md" "docs\features\"
if exist "NATURAL_LANGUAGE_FEATURE_README.md" move "NATURAL_LANGUAGE_FEATURE_README.md" "docs\features\"
if exist "STORY_FEATURE_README.md" move "STORY_FEATURE_README.md" "docs\features\"

echo Deplacement des documentations d'optimisation...
if exist "ADVANCED_PLANNING_README.md" move "ADVANCED_PLANNING_README.md" "docs\optimization\"
if exist "PERFORMANCE_ANALYSIS.md" move "PERFORMANCE_ANALYSIS.md" "docs\optimization\"
if exist "PERFORMANCE_SUMMARY.md" move "PERFORMANCE_SUMMARY.md" "docs\optimization\"
if exist "PLANNING_IMPROVEMENTS_SUMMARY.md" move "PLANNING_IMPROVEMENTS_SUMMARY.md" "docs\optimization\"
if exist "COMPRESSION_IMAGES_README.md" move "COMPRESSION_IMAGES_README.md" "docs\optimization\"
if exist "ETAPE*_*.md" move "ETAPE*_*.md" "docs\optimization\"
if exist "STEP*_*.md" move "STEP*_*.md" "docs\optimization\"

echo Deplacement des documentations Algolia...
if exist "ALGOLIA_*.md" move "ALGOLIA_*.md" "docs\features\"
if exist "API_ALGOLIA.md" move "API_ALGOLIA.md" "docs\features\"

echo Deplacement des documentations backend...
if exist "BACKEND_*.md" move "BACKEND_*.md" "docs\optimization\"
if exist "BACKEND_URLS_SUMMARY.md" move "BACKEND_URLS_SUMMARY.md" "docs\optimization\"

echo Deplacement des documentations UI...
if exist "EDIT_STEP_UI_IMPROVEMENTS.md" move "EDIT_STEP_UI_IMPROVEMENTS.md" "docs\optimization\"
if exist "ROADTRIPSCREEN_REDESIGN_PROPOSAL.md" move "ROADTRIPSCREEN_REDESIGN_PROPOSAL.md" "docs\optimization\"
if exist "STEPSCREEN_REDESIGN.md" move "STEPSCREEN_REDESIGN.md" "docs\optimization\"
if exist "SWIPE_SYSTEM_IMPROVEMENTS.md" move "SWIPE_SYSTEM_IMPROVEMENTS.md" "docs\optimization\"

echo Deplacement des documentations de corrections...
if exist "DRAG_SNAP_*.md" move "DRAG_SNAP_*.md" "docs\optimization\"
if exist "GOOGLE_PLACES_*.md" move "GOOGLE_PLACES_*.md" "docs\optimization\"
if exist "ORIGIN_DESTINATION_FIX.md" move "ORIGIN_DESTINATION_FIX.md" "docs\optimization\"

echo Deplacement des fichiers de test...
if exist "TEST_*.md" move "TEST_*.md" "testing\"
if exist "DIAGNOSTIC_*.md" move "DIAGNOSTIC_*.md" "testing\"

echo Deplacement des fichiers divers...
if exist "MISSION_ACCOMPLIE.md" move "MISSION_ACCOMPLIE.md" "docs\"
if exist "Regles Dates.txt" move "Regles Dates.txt" "docs\"

echo.
echo ===== REORGANISATION TERMINEE =====
echo.
echo Structure creee:
echo   testing/
echo     memory/
echo       scripts/     - Scripts de test memoire (bat, sh)
echo       results/     - Resultats des tests (csv, logs)
echo     *.md           - Fichiers de test et diagnostic
echo     *.js           - Scripts de performance
echo   docs/
echo     guides/        - Guides d'utilisation
echo     features/      - Documentation des fonctionnalites
echo     optimization/  - Documentation d'optimisation
echo     *.md           - Fichiers generaux
echo.
echo Verifiez la structure et les fichiers deplaces.
pause
