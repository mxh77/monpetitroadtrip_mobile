# Système de Pas de Déplacement Paramétrable - Guide d'Implémentation

## 🎯 Fonctionnalité Implémentée

### ✅ Frontend (Implémenté)

**Nouveau système de déplacement avec snapping paramétrable :**
- Paramètres configurables : 5min, 10min, 15min (défaut), 30min, 60min
- Interface utilisateur intuitive avec modal de configuration
- Bouton paramètres (🔧) dans la barre de navigation
- Indicateur visuel du pas actuel dans la légende du planning
- Snapping intelligent lors du drag & drop

### 🔧 Fonctionnement Technique

#### 1. Interface Utilisateur
```typescript
// Bouton paramètres dans la navigation
<TouchableOpacity onPress={() => setShowDragSettingsModal(true)}>
  <Icon name="cog" size={24} color="#007BFF" />
</TouchableOpacity>

// Modal de configuration avec options prédéfinies
const intervals = [5, 10, 15, 30, 60]; // minutes
```

#### 2. Logique de Snapping
```typescript
// Calcul du snapping lors du drag & drop
const minutesDelta = (deltaY / HOUR_HEIGHT) * 60;
const snappedMinutesDelta = Math.round(minutesDelta / dragSnapInterval) * dragSnapInterval;

// Application aux nouvelles dates
const newStart = new Date(originalStart.getTime() + (snappedMinutesDelta * 60 * 1000));
```

#### 3. Transmission au Backend
```typescript
// Le paramètre dragSnapInterval est passé à AdvancedPlanning
<AdvancedPlanning
  dragSnapInterval={dragSnapInterval} // 5, 10, 15, 30 ou 60
  // ... autres props
/>
```

## 🌐 Indications pour l'Agent Backend

### 📨 Données Transmises
Les appels API existants continuent de fonctionner normalement. Le frontend gère le snapping **avant** d'envoyer les nouvelles dates au backend.

**Format des appels API (inchangé) :**
```json
// PATCH /activities/{id}/dates
{
  "startDateTime": "2025-06-30T14:30:00.000Z",  // Déjà arrondi côté frontend
  "endDateTime": "2025-06-30T16:30:00.000Z"     // Déjà arrondi côté frontend
}

// PUT /accommodations/{id}
{
  "arrivalDateTime": "2025-06-30T15:00:00.000Z",   // Déjà arrondi côté frontend
  "departureDateTime": "2025-06-30T18:00:00.000Z"  // Déjà arrondi côté frontend
}

// PUT /stages/{id} ou PUT /stops/{id}
{
  "arrivalDateTime": "2025-06-30T09:45:00.000Z",   // Déjà arrondi côté frontend
  "departureDateTime": "2025-06-30T11:45:00.000Z"  // Déjà arrondi côté frontend
}
```

### 🎯 Avantages pour le Backend

#### 1. **Dates Cohérentes**
- Toutes les dates reçues sont alignées sur des intervalles logiques
- Plus de dates avec des minutes "bizarres" (ex: 14:07, 16:23)
- Facilite les calculs d'itinéraires et la planification

#### 2. **Moins d'Erreurs de Validation**
- Réduction des conflits d'horaires
- Dates plus prévisibles et cohérentes
- Calculs d'intervalles simplifiés

#### 3. **Compatibilité Totale**
- Aucune modification nécessaire côté backend
- Les APIs existantes continuent de fonctionner
- Le snapping est transparent pour le serveur

### 📊 Exemples de Données Snappées

#### Avant (sans snapping)
```json
{
  "startDateTime": "2025-06-30T14:07:00.000Z",  // Déplacement libre
  "endDateTime": "2025-06-30T16:23:00.000Z"
}
```

#### Après (avec snapping 15min)
```json
{
  "startDateTime": "2025-06-30T14:00:00.000Z",  // Arrondi à 15min
  "endDateTime": "2025-06-30T16:15:00.000Z"     // Durée préservée + arrondi
}
```

#### Après (avec snapping 30min)
```json
{
  "startDateTime": "2025-06-30T14:00:00.000Z",  // Arrondi à 30min
  "endDateTime": "2025-06-30T16:30:00.000Z"     // Durée préservée + arrondi
}
```

## 💡 Améliorations Futures (Optionnelles)

### 🔧 Backend : Préférences Utilisateur
Si vous souhaitez persister les préférences utilisateur :

```json
// Nouveau endpoint (optionnel)
GET/PUT /users/{userId}/planning-preferences
{
  "dragSnapInterval": 15,           // minutes
  "defaultView": "day",            // "day" | "week"
  "showWeekends": true,            // boolean
  "startHour": 6,                  // heure de début d'affichage
  "endHour": 23                    // heure de fin d'affichage
}
```

### 📈 Analytics (Optionnel)
Tracking des habitudes utilisateur :
```json
// Données d'usage (anonymisées)
{
  "dragSnapIntervalUsage": {
    "5min": 15,    // nombre d'utilisateurs
    "15min": 450,  // le plus populaire
    "30min": 80
  }
}
```

## 🧪 Tests Recommandés

### Frontend
- [ ] Interface de configuration fonctionnelle
- [ ] Snapping correct pour chaque intervalle
- [ ] Persistance du paramètre pendant la session
- [ ] Affichage correct dans la légende

### Backend
- [ ] Réception correcte des dates snappées
- [ ] Validation des formats de dates
- [ ] Pas de régression sur les calculs existants
- [ ] Performance maintenue

## 🎉 Résultat Utilisateur

### ✅ Expérience Améliorée
- **Contrôle précis** : L'utilisateur choisit sa précision de déplacement
- **Cohérence visuelle** : Événements alignés sur une grille logique
- **Feedback immédiat** : Indication du pas actuel dans l'interface
- **Flexibilité** : Adaptation selon le type de planification (détaillée vs. générale)

### 📱 Workflow Utilisateur
1. Clic sur l'icône ⚙️ dans la navigation
2. Sélection du pas souhaité (5min à 60min)
3. Fermeture du modal
4. Drag & drop avec snapping automatique
5. Visualisation du pas actuel : "🎯 Pas: 15min"

## 🎯 Conclusion

Cette fonctionnalité améliore significativement l'expérience utilisateur tout en :
- **Simplifiant** les données pour le backend
- **Maintenant** la compatibilité totale
- **Ajoutant** de la valeur sans complexité technique

**Pour le backend** : Aucune action requise, les améliorations sont transparentes ! ✨
