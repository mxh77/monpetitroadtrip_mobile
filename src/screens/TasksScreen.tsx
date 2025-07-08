import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FAB, Card, Badge, Chip } from 'react-native-paper';
import { TasksScreenProps, RoadtripTask, TaskStats, TaskCategory, TaskPriority, TaskStatus } from '../../types';
import config from '../config';

interface TasksScreenTabProps {
  roadtripId: string;
  navigation: any;
}

const TasksScreen: React.FC<TasksScreenProps | TasksScreenTabProps> = (props) => {
  // Déterminer le roadtripId selon le type de props reçu
  const roadtripId = 'roadtripId' in props ? props.roadtripId : props.route.params.roadtripId;
  const navigation = props.navigation;
  
  const [tasks, setTasks] = useState<RoadtripTask[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    completionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('preparation');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('medium');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  // Catégories avec leurs icônes et couleurs
  const categoryConfig = {
    preparation: { icon: 'clipboard-list', color: '#6c757d', label: 'Préparation' },
    booking: { icon: 'calendar-check', color: '#007bff', label: 'Réservations' },
    packing: { icon: 'suitcase', color: '#28a745', label: 'Bagages' },
    documents: { icon: 'id-card', color: '#ffc107', label: 'Documents' },
    transport: { icon: 'car', color: '#fd7e14', label: 'Transport' },
    accommodation: { icon: 'bed', color: '#20c997', label: 'Hébergement' },
    activities: { icon: 'map-marked-alt', color: '#e83e8c', label: 'Activités' },
    health: { icon: 'heartbeat', color: '#dc3545', label: 'Santé' },
    finances: { icon: 'euro-sign', color: '#17a2b8', label: 'Finances' },
    communication: { icon: 'phone', color: '#6610f2', label: 'Communication' },
    other: { icon: 'ellipsis-h', color: '#6c757d', label: 'Autre' },
  };

  // Priorités avec leurs couleurs
  const priorityConfig = {
    low: { color: '#28a745', label: 'Faible' },
    medium: { color: '#ffc107', label: 'Moyenne' },
    high: { color: '#fd7e14', label: 'Élevée' },
    urgent: { color: '#dc3545', label: 'Urgente' },
  };

  // Fonction pour récupérer le token JWT (cohérente avec le reste de l'app)
  const getJwtToken = async () => '';

  const fetchTasks = useCallback(async () => {
    try {
      const token = await getJwtToken();
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setTasks(data.tasks || []);
        setStats(data.stats || {
          total: 0,
          pending: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          completionPercentage: 0,
        });
      } else {
        console.error('Erreur lors du chargement des tâches:', data.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roadtripId, filterStatus]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour la tâche');
      return;
    }

    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          category: selectedCategory,
          priority: selectedPriority,
        }),
      });

      if (response.ok) {
        setNewTaskTitle('');
        setShowAddModal(false);
        fetchTasks();
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Erreur lors de la création de la tâche');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la tâche:', error);
      Alert.alert('Erreur', 'Erreur lors de la création de la tâche');
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks/${taskId}/toggle-completion`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchTasks();
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour de la tâche');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      Alert.alert('Erreur', 'Erreur lors de la mise à jour de la tâche');
    }
  };

  const generateDefaultTasks = async () => {
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks/generate-defaults`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchTasks();
        Alert.alert('Succès', 'Tâches par défaut créées avec succès');
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Erreur lors de la génération des tâches');
      }
    } catch (error) {
      console.error('Erreur lors de la génération des tâches:', error);
      Alert.alert('Erreur', 'Erreur lors de la génération des tâches');
    }
  };

  const handleTaskPress = (task: RoadtripTask) => {
    navigation.navigate('TaskDetail', {
      roadtripId,
      taskId: task._id,
      task,
      refresh: fetchTasks,
    });
  };

  const renderTaskItem = ({ item }: { item: RoadtripTask }) => {
    const categoryInfo = categoryConfig[item.category];
    const priorityInfo = priorityConfig[item.priority];
    const isCompleted = item.status === 'completed';
    const isOverdue = item.isOverdue && !isCompleted;

    return (
      <Card style={[styles.taskCard, isCompleted && styles.completedTask]}>
        <TouchableOpacity onPress={() => handleTaskPress(item)}>
          <View style={styles.taskHeader}>
            <View style={styles.taskHeaderLeft}>
              <TouchableOpacity
                style={[styles.checkbox, isCompleted && styles.checkedBox]}
                onPress={() => toggleTaskCompletion(item._id)}
              >
                {isCompleted && <Icon name="check" size={12} color="white" />}
              </TouchableOpacity>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, isCompleted && styles.completedText]}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={[styles.taskDescription, isCompleted && styles.completedText]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.taskHeaderRight}>
              <Badge style={[styles.priorityBadge, { backgroundColor: priorityInfo.color }]} size={16}>
                {item.priority.charAt(0).toUpperCase()}
              </Badge>
            </View>
          </View>
          
          <View style={styles.taskFooter}>
            <Chip
              icon={categoryInfo.icon}
              style={[styles.categoryChip, { backgroundColor: categoryInfo.color + '20' }]}
              textStyle={{ color: categoryInfo.color, fontSize: 12 }}
            >
              {categoryInfo.label}
            </Chip>
            
            {item.dueDate && (
              <View style={[styles.dueDateContainer, isOverdue && styles.overdueContainer]}>
                <Icon 
                  name="clock" 
                  size={12} 
                  color={isOverdue ? '#dc3545' : '#6c757d'} 
                  style={styles.dueDateIcon} 
                />
                <Text style={[styles.dueDateText, isOverdue && styles.overdueText]}>
                  {new Date(item.dueDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
            
            {item.assignedTo && (
              <View style={styles.assignedContainer}>
                <Icon name="user" size={12} color="#6c757d" style={styles.assignedIcon} />
                <Text style={styles.assignedText}>{item.assignedTo}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête avec statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Progression</Text>
          <Text style={styles.progressText}>
            {stats.completed}/{stats.total} tâches terminées ({stats.completionPercentage}%)
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${stats.completionPercentage}%` }]} 
            />
          </View>
        </View>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filterStatus === status && styles.activeFilterChip
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterText,
              filterStatus === status && styles.activeFilterText
            ]}>
              {status === 'all' ? 'Toutes' :
               status === 'pending' ? 'En attente' :
               status === 'in_progress' ? 'En cours' :
               'Terminées'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des tâches */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTaskItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="tasks" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucune tâche</Text>
            <Text style={styles.emptySubtitle}>
              {tasks.length === 0 
                ? "Commencez par créer votre première tâche ou générez les tâches par défaut"
                : "Aucune tâche ne correspond à votre filtre"
              }
            </Text>
            {tasks.length === 0 && (
              <TouchableOpacity style={styles.generateButton} onPress={generateDefaultTasks}>
                <Text style={styles.generateButtonText}>Générer les tâches par défaut</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Bouton d'ajout */}
      <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={() => setShowAddModal(true)}
      />

      {/* Modal d'ajout rapide */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle tâche</Text>
            
            <TextInput
              style={styles.titleInput}
              placeholder="Titre de la tâche"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              maxLength={200}
            />

            <Text style={styles.labelText}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
              {(Object.keys(categoryConfig) as TaskCategory[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category && styles.selectedCategoryOption
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Icon 
                    name={categoryConfig[category].icon} 
                    size={16} 
                    color={selectedCategory === category ? 'white' : categoryConfig[category].color} 
                  />
                  <Text style={[
                    styles.categoryOptionText,
                    selectedCategory === category && styles.selectedCategoryOptionText
                  ]}>
                    {categoryConfig[category].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.labelText}>Priorité</Text>
            <View style={styles.priorityContainer}>
              {(Object.keys(priorityConfig) as TaskPriority[]).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    selectedPriority === priority && { backgroundColor: priorityConfig[priority].color }
                  ]}
                  onPress={() => setSelectedPriority(priority)}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    selectedPriority === priority && styles.selectedPriorityText
                  ]}>
                    {priorityConfig[priority].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateTask}
              >
                <Text style={styles.createButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  taskCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completedTask: {
    opacity: 0.7,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  taskHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskHeaderRight: {
    marginLeft: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007bff',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: '#007bff',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  priorityBadge: {
    backgroundColor: '#ffc107',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  overdueContainer: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueDateIcon: {
    marginRight: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#6c757d',
  },
  overdueText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignedIcon: {
    marginRight: 4,
  },
  assignedText: {
    fontSize: 12,
    color: '#6c757d',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007BFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    minWidth: 320,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryScrollView: {
    marginBottom: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedCategoryOption: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 6,
  },
  selectedCategoryOptionText: {
    color: 'white',
  },
  priorityContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedPriorityText: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6c757d',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default TasksScreen;
