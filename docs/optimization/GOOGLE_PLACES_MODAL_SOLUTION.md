# Solution Modal pour les Suggestions Google Places

## Problème Résolu

Les suggestions de l'autocomplete Google Places étaient affichées sous les autres éléments de l'interface, malgré l'ajout de z-index et elevation élevés. Le problème venait du fait que les FlatList et les composants natifs React Native ne respectent pas toujours les z-index dans certains contextes.

## Solution Implémentée

### 1. Remplacement du GooglePlacesAutocomplete

Nous avons remplacé le composant `react-native-google-places-autocomplete` par une solution custom qui utilise :
- Un `TextInput` standard de React Native Paper
- Un `Modal` pour afficher les suggestions (toujours au premier plan)
- L'API Google Places Autocomplete directement

### 2. Composants Clés

#### TextInput Custom
```tsx
<TextInput
  ref={addressInputRef}
  value={addressInput}
  onChangeText={(text) => {
    setAddressInput(text);
    setFormState((prevState) => ({ ...prevState, address: text }));
    fetchSuggestions(text);
  }}
  onFocus={() => {
    measureAddressInput();
    if (addressInput.length >= 2) {
      fetchSuggestions(addressInput);
    }
  }}
  onBlur={() => {
    setTimeout(() => setShowSuggestions(false), 300);
  }}
  // ... autres props
/>
```

#### Modal de Suggestions
```tsx
<Modal
  transparent={true}
  visible={showSuggestions}
  onRequestClose={() => setShowSuggestions(false)}
>
  <TouchableOpacity 
    style={styles.suggestionsModalOverlay}
    activeOpacity={1}
    onPress={() => setShowSuggestions(false)}
  >
    <View style={[styles.suggestionsContainer, positionStyles]}>
      <ScrollView style={styles.suggestionsList}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={suggestion.place_id || index}
            onPress={() => handleSuggestionSelect(suggestion)}
          >
            {/* Contenu de la suggestion */}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </TouchableOpacity>
</Modal>
```

### 3. Fonctions Principales

#### fetchSuggestions
- Appelle l'API Google Places Autocomplete
- Gère le debouncing (minimum 2 caractères)
- Met à jour l'état des suggestions
- Déclenche la mesure de position

#### measureAddressInput
- Mesure la position du champ d'adresse
- Calcule la position optimale pour le Modal
- Met à jour `suggestionPosition`

#### handleSuggestionSelect
- Synchronise `addressInput` et `formState.address`
- Ferme le Modal de suggestions
- Vide la liste des suggestions

### 4. États Gérés

```tsx
const [addressInput, setAddressInput] = useState(step.address || '');
const [showSuggestions, setShowSuggestions] = useState(false);
const [suggestions, setSuggestions] = useState([]);
const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0, width: 0 });
const addressInputRef = useRef(null);
```

### 5. Synchronisation d'État

La solution garantit la synchronisation entre :
- `addressInput` : État local pour l'affichage du TextInput
- `formState.address` : État du formulaire pour la sauvegarde
- Actions synchronisées :
  - Saisie manuelle
  - Sélection de suggestion
  - Effacement du champ

### 6. Gestion des Événements

#### onFocus
- Mesure la position du champ
- Relance les suggestions si le texte existe

#### onBlur
- Délai de 300ms pour permettre le clic sur les suggestions
- Ferme le Modal après le délai

#### onChangeText
- Met à jour les deux états simultanément
- Déclenche la recherche de suggestions

### 7. Styles du Modal

```tsx
suggestionsModalOverlay: {
  flex: 1,
},
suggestionsContainer: {
  position: 'absolute',
  backgroundColor: 'white',
  borderRadius: 12,
  marginHorizontal: 16,
  elevation: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  maxHeight: 250,
  borderWidth: 1,
  borderColor: '#E0E0E0',
},
// ... autres styles
```

## Avantages de cette Solution

1. **Affichage Garanti** : Le Modal s'affiche toujours au premier plan
2. **Positionnement Précis** : Le Modal se positionne exactement sous le champ d'adresse
3. **UX Améliorée** : Délais optimisés pour permettre les interactions
4. **Synchronisation** : États parfaitement synchronisés
5. **Performance** : Contrôle total sur les appels API
6. **Design Moderne** : Styles cohérents avec le reste de l'application

## Test de la Solution

1. Taper dans le champ d'adresse (minimum 2 caractères)
2. Vérifier que les suggestions apparaissent dans un Modal au premier plan
3. Sélectionner une suggestion et vérifier la synchronisation
4. Tester le bouton d'effacement
5. Vérifier le comportement lors du scroll de la page

Cette solution résout définitivement le problème de z-index des suggestions Google Places.
