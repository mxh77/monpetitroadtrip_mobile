#!/bin/bash

# Script de test pour la navigation intelligente
# Ce script lance l'application et affiche les logs pertinents

echo "🚀 Démarrage du test de navigation intelligente..."
echo ""
echo "Pour tester le système :"
echo "1. Ouvrez l'application sur votre appareil/émulateur"
echo "2. Naviguez vers un roadtrip"
echo "3. Allez dans l'onglet Planning"
echo "4. Cliquez sur un événement (activité, hébergement, stop)"
echo "5. Quittez l'écran d'édition (bouton Étape en haut à gauche)"
echo "6. Vérifiez que vous revenez bien sur l'onglet Planning"
echo ""
echo "Recherchez ces logs dans la console :"
echo "- 🚀 navigateToEditScreen appelé"
echo "- ✅ Navigation vers EditActivity/EditAccommodation/EditStepInfo/EditStageInfo"
echo "- 🔄 Smart Navigation"
echo "- ✅ Retour au planning détecté - Navigation forcée vers l'onglet Planning"
echo ""
echo "Si vous voyez '❌ roadtripId non trouvé', vérifiez que le roadtripId est bien passé"
echo ""

# Lancer l'application en mode développement
npx expo start
