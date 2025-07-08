# Guide de dépannage pour les icônes FontAwesome5 dans l'application

## Problèmes courants

### Icônes manquantes ou remplacées par un point d'interrogation

Si les icônes apparaissent comme des points d'interrogation ou ne s'affichent pas correctement, voici les solutions possibles :

1. **Vérifier les noms d'icônes**
   - Assurez-vous que les noms d'icônes utilisés sont valides pour FontAwesome5
   - Référence : [Cheatsheet FontAwesome5](https://fontawesome.com/v5/cheatsheet)

2. **Utilisation correcte avec react-native-paper**
   - Pour les composants comme `Chip` de react-native-paper, utilisez toujours la fonction de rendu :
   ```jsx
   <Chip
     icon={({size, color}) => (
       <Icon 
         name="icon-name"
         size={size || 16} 
         color={color} 
       />
     )}
   >
     Label
   </Chip>
   ```

3. **Ne pas utiliser loadFont()**
   - `Icon.loadFont()` n'est pas une fonction valide dans react-native-vector-icons/FontAwesome5
   - N'essayez pas de précharger les polices manuellement

4. **Icônes gratuites vs Pro**
   - Certaines icônes ne sont disponibles que dans la version Pro de FontAwesome5
   - Utilisez uniquement les icônes gratuites ou assurez-vous d'avoir configuré correctement la version Pro

## Icônes alternatives pour les problèmes courants

Si certaines icônes ne fonctionnent pas, voici des alternatives validées :

| Cas d'utilisation | Icône qui peut ne pas fonctionner | Alternative validée |
|-------------------|-----------------------------------|---------------------|
| Préparation       | clipboard-list                    | clipboard-check     |
| Documents         | id-card                           | file-alt            |
| Activités         | map-marked-alt                    | map-marker-alt      |
| Finances          | euro-sign                         | dollar-sign         |

## Débuggage

Pour déboguer les problèmes d'icônes :

1. Vérifiez le nom exact de l'icône sur la page de référence FontAwesome5
2. Essayez d'abord avec des icônes simples et communes (check, times, star, etc.)
3. Inspectez les erreurs console liées aux icônes
