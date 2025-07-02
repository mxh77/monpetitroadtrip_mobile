# 🔧 Dépannage - Liste suggestions GooglePlaces en arrière-plan

## 🐛 Problème persistant

**Symptôme :** La liste des suggestions GooglePlacesAutocomplete reste en arrière-plan malgré les z-index élevés.

**Cause possible :** 
- Conflit avec FlatList ou autres composants de React Native
- Limitation de plateforme spécifique (Android/iOS)
- Overflow masqué par des conteneurs parents

## ✅ Solutions tentées

### 1. **Z-index maximal appliqué**
```tsx
// Tous les éléments ont maintenant des z-index très élevés
container: { zIndex: 999999 }
addressContainer: { zIndex: 999999 }
listView: { zIndex: 999999 }
clearButton: { zIndex: 1000000 }
```

### 2. **Overflow visible forcé**
```tsx
// Tous les conteneurs ont overflow: 'visible'
fieldCard: { overflow: 'visible' }
cardContent: { overflow: 'visible' }
addressContainer: { overflow: 'visible' }
```

### 3. **Elevation maximisée (Android)**
```tsx
listView: {
  elevation: 999, // Maximum pour Android
  shadowOpacity: 0.5, // Ombre plus forte
  borderWidth: 1, // Bordure pour visibilité
}
```

### 4. **FlatList optimisé**
```tsx
// Ajout de nestedScrollEnabled
<FlatList nestedScrollEnabled={true} />
```

## 🔄 Solution alternative recommandée

Si le problème persiste, voici une solution de contournement plus robuste :

### **Option 1: Modal pour les suggestions**

```tsx
// Dans le state
const [showSuggestions, setShowSuggestions] = useState(false);
const [suggestions, setSuggestions] = useState([]);

// Dans le GooglePlacesAutocomplete
<GooglePlacesAutocomplete
  listViewDisplayed={false} // Désactiver la liste par défaut
  onPress={(data) => {
    setAddressInput(data.description);
    setShowSuggestions(false);
  }}
  textInputProps={{
    onFocus: () => setShowSuggestions(true),
    onBlur: () => setTimeout(() => setShowSuggestions(false), 200),
  }}
/>

// Modal séparée pour les suggestions
{showSuggestions && (
  <Modal transparent visible={showSuggestions}>
    <TouchableOpacity 
      style={styles.modalOverlay} 
      onPress={() => setShowSuggestions(false)}
    >
      <View style={styles.suggestionsContainer}>
        {/* Liste des suggestions ici */}
      </View>
    </TouchableOpacity>
  </Modal>
)}
```

### **Option 2: Remplacement par ScrollView**

```tsx
// Remplacer FlatList par ScrollView pour cette section spécifique
const renderAddressSection = () => (
  <View style={{ zIndex: 999999 }}>
    <Card style={[styles.fieldCard, { zIndex: 999999 }]}>
      {/* GooglePlacesAutocomplete ici */}
    </Card>
  </View>
);

return (
  <ScrollView nestedScrollEnabled={true}>
    {/* Autres sections */}
    {renderAddressSection()}
    {/* Suite */}
  </ScrollView>
);
```

### **Option 3: Position fixed alternative**

```tsx
// Dans les styles
addressSuggestionsContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999999,
  pointerEvents: 'box-none', // Permet les clics à travers
},

// Dans le render
{showSuggestions && (
  <View style={styles.addressSuggestionsContainer}>
    <View style={styles.suggestionsBox}>
      {/* Suggestions ici */}
    </View>
  </View>
)}
```

## 🧪 Tests à effectuer

### **Diagnostic du problème**
1. **Vérifier l'inspection** : Utiliser les outils de debug React Native
2. **Tester sur émulateur** : iOS vs Android
3. **Tester sur device physique** : Comportement peut différer
4. **Console logging** : Vérifier si les événements onPress sont appelés

### **Tests de validation**
```javascript
// Ajouter dans onPress des suggestions
onPress={(data, details) => {
  console.log('SUGGESTION CLICKED:', data.description);
  setAddressInput(data.description);
}}

// Ajouter dans le textInput
textInputProps={{
  onFocus: () => console.log('INPUT FOCUSED'),
  onChangeText: (text) => {
    console.log('INPUT CHANGED:', text);
    setAddressInput(text);
  }
}}
```

## 📱 Solution temporaire immédiate

En attendant une solution définitive, voici un workaround simple :

```tsx
// Augmenter l'espace en bas de la carte adresse
addressContainer: {
  // ...styles existants...
  marginBottom: 250, // Espace pour voir les suggestions
}
```

## 🎯 Prochaines étapes

1. **Tester les modifications actuelles** sur device/émulateur
2. **Si problème persiste** → Implémenter l'Option 1 (Modal)
3. **Alternative** → Revenir à ScrollView temporairement
4. **Long terme** → Envisager un composant custom d'autocomplete

Le problème de z-index avec GooglePlacesAutocomplete est connu dans la communauté React Native. Les solutions ci-dessus devraient résoudre le problème.
