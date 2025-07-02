#!/bin/bash

# 🧪 Script de test de fuites mémoire pour RoadTripScreen
# Ce script automatise les mesures de mémoire avant/après navigation

PACKAGE_NAME="com.maxime.heron.monpetitroadtrip.debug"
LOG_FILE="memory_test_$(date +%Y%m%d_%H%M%S).log"

echo "🧪 ===== TEST DE FUITE MÉMOIRE ====="
echo "Application: $PACKAGE_NAME"
echo "Log file: $LOG_FILE"
echo ""

# Fonction pour mesurer la mémoire
measure_memory() {
    local context="$1"
    echo "📊 Mesure mémoire: $context"
    echo "--- $context ---" >> "$LOG_FILE"
    
    # PSS (Proportional Set Size) - Le plus précis pour les fuites
    local pss_line=$(adb shell dumpsys meminfo "$PACKAGE_NAME" | grep "TOTAL PSS:")
    echo "$pss_line" >> "$LOG_FILE"
    
    # Extraction de la valeur PSS
    local pss_value=$(echo "$pss_line" | grep -o '[0-9]\+' | head -1)
    echo "   PSS Total: ${pss_value} KB ($(echo "scale=2; $pss_value/1024" | bc) MB)"
    
    # RSS (Resident Set Size)
    local rss_line=$(adb shell dumpsys meminfo "$PACKAGE_NAME" | grep "TOTAL RSS:")
    echo "$rss_line" >> "$LOG_FILE"
    
    # Détails mémoire native vs Dalvik
    echo "Détails par composant:" >> "$LOG_FILE"
    adb shell dumpsys meminfo "$PACKAGE_NAME" | grep -E "(Native Heap|Dalvik Heap|Stack|Graphics|Private Other)" >> "$LOG_FILE"
    
    echo "Timestamp: $(date)" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    
    # Retourner la valeur PSS pour les calculs
    echo "$pss_value"
}

# Fonction pour calculer la différence
calculate_diff() {
    local before=$1
    local after=$2
    local diff=$((after - before))
    local percentage=$(echo "scale=2; ($diff * 100) / $before" | bc)
    
    echo "📈 Analyse de la différence:"
    echo "   Avant: ${before} KB ($(echo "scale=2; $before/1024" | bc) MB)"
    echo "   Après: ${after} KB ($(echo "scale=2; $after/1024" | bc) MB)"
    echo "   Différence: ${diff} KB ($(echo "scale=2; $diff/1024" | bc) MB)"
    echo "   Pourcentage: ${percentage}%"
    
    # Alertes basées sur les seuils
    if [ $diff -gt 102400 ]; then  # Plus de 100MB
        echo "🚨 ALERTE CRITIQUE: Fuite mémoire majeure détectée (+100MB)"
    elif [ $diff -gt 51200 ]; then  # Plus de 50MB
        echo "⚠️  ALERTE: Fuite mémoire importante détectée (+50MB)"
    elif [ $diff -gt 10240 ]; then  # Plus de 10MB
        echo "⚠️  ATTENTION: Fuite mémoire modérée détectée (+10MB)"
    elif [ $diff -lt 0 ]; then
        echo "✅ Mémoire libérée correctement"
    else
        echo "ℹ️  Légère augmentation mémoire (normal)"
    fi
}

# Vérifier que l'app est lancée
echo "🔍 Vérification de l'application..."
if ! adb shell pidof "$PACKAGE_NAME" > /dev/null; then
    echo "❌ L'application n'est pas lancée. Démarrez l'app et relancez ce script."
    exit 1
fi

echo "✅ Application détectée"
echo ""

# Instructions pour l'utilisateur
echo "📋 INSTRUCTIONS:"
echo "1. Assurez-vous d'être sur l'écran d'accueil (RoadTripsScreen)"
echo "2. Appuyez sur ENTRÉE pour mesurer la mémoire AVANT navigation"
read -p "Prêt pour la mesure AVANT ? (Appuyez sur ENTRÉE)"

# Mesure AVANT
before_pss=$(measure_memory "AVANT navigation vers RoadTripScreen")

echo ""
echo "📋 Maintenant:"
echo "3. Naviguez vers un RoadTripScreen (cliquez sur un roadtrip)"
echo "4. Laissez l'écran se charger complètement"
echo "5. Appuyez sur ENTRÉE pour mesurer la mémoire APRÈS navigation"
read -p "Prêt pour la mesure APRÈS ? (Appuyez sur ENTRÉE)"

# Mesure APRÈS
after_pss=$(measure_memory "APRÈS navigation vers RoadTripScreen")

echo ""
echo "🧮 CALCUL DES RÉSULTATS"
calculate_diff "$before_pss" "$after_pss"

echo ""
echo "📄 Log détaillé sauvegardé dans: $LOG_FILE"
echo ""

# Recommandations basées sur les résultats
echo "🔧 RECOMMANDATIONS:"
echo "- Si fuite > 50MB: Vérifiez les listeners non nettoyés, les images non libérées"
echo "- Si fuite > 10MB: Vérifiez les useState/useEffect, les closures"
echo "- Utilisez React DevTools Profiler pour analyser les re-renders"
echo "- Testez avec plusieurs navigations pour confirmer la tendance"

echo ""
echo "🧪 Test terminé !"
