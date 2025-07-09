import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ChatHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const ChatHelpModal: React.FC<ChatHelpModalProps> = ({ visible, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('etapes');

  const helpCategories = {
    etapes: {
      title: 'Gestion des étapes',
      icon: 'place',
      commands: [
        'Ajoute une étape à Paris du 15 au 17 juillet',
        'Supprime l\'étape de Lyon',
        'Modifie l\'étape de Paris pour finir le 18 juillet',
        'Montre-moi les étapes du roadtrip',
      ],
    },
    hebergements: {
      title: 'Hébergements',
      icon: 'hotel',
      commands: [
        'Ajoute un hébergement Hôtel Ibis à Paris',
        'Supprime l\'hébergement Hôtel de la Paix',
        'Ajoute un logement Airbnb à Marseille du 20 au 22 juillet',
      ],
    },
    activites: {
      title: 'Activités',
      icon: 'local-activity',
      commands: [
        'Ajoute une activité visite du Louvre à Paris le 16 juillet à 14h',
        'Supprime l\'activité Tour Eiffel',
        'Ajoute une visite du Château de Versailles',
      ],
    },
    taches: {
      title: 'Tâches',
      icon: 'task',
      commands: [
        'Ajoute une tâche réserver les billets de train',
        'Marque la tâche réservation comme terminée',
        'Supprime la tâche réserver restaurant',
      ],
    },
    info: {
      title: 'Informations',
      icon: 'info',
      commands: [
        'Aide',
        'Que peux-tu faire ?',
        'Montre-moi le résumé du roadtrip',
        'Quelles sont les prochaines étapes ?',
      ],
    },
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#007BFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guide du Chatbot IA</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(helpCategories).map(([key, category]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryButton,
                  activeCategory === key && styles.categoryButtonActive,
                ]}
                onPress={() => setActiveCategory(key)}
              >
                <Icon
                  name={category.icon}
                  size={20}
                  color={activeCategory === key ? '#fff' : '#007BFF'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === key && styles.categoryTextActive,
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Commands */}
        <ScrollView style={styles.commandsContainer}>
          <Text style={styles.sectionTitle}>
            Commandes pour {helpCategories[activeCategory].title}
          </Text>
          <Text style={styles.sectionSubtitle}>
            Tapez ces exemples ou des variantes similaires :
          </Text>

          {helpCategories[activeCategory].commands.map((command, index) => (
            <View key={index} style={styles.commandItem}>
              <Icon name="chat" size={16} color="#666" style={styles.commandIcon} />
              <Text style={styles.commandText}>"{command}"</Text>
            </View>
          ))}

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Conseils d'utilisation</Text>
            <Text style={styles.tipItem}>
              • Soyez précis dans vos demandes (dates, lieux, noms)
            </Text>
            <Text style={styles.tipItem}>
              • Utilisez un langage naturel, pas besoin de mots-clés
            </Text>
            <Text style={styles.tipItem}>
              • Le chatbot peut traiter plusieurs actions en une fois
            </Text>
            <Text style={styles.tipItem}>
              • Tapez "Aide" pour obtenir de l'assistance
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryButtonActive: {
    backgroundColor: '#007BFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#007BFF',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#fff',
  },
  commandsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commandIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  commandText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  tipsContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
});

export default ChatHelpModal;
