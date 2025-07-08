import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TaskDetailScreenProps, RoadtripTask, TaskCategory, TaskPriority, TaskStatus } from '../../types';
import config from '../config';

const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({ route, navigation }) => {
  const { roadtripId, taskId, task: initialTask, refresh } = route.params;
  
  const [task, setTask] = useState<RoadtripTask | null>(initialTask || null);
  const [loading, setLoading] = useState(!initialTask);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!taskId); // Mode édition si nouvelle tâche
  
  // États pour l'édition
  const [editedTitle, setEditedTitle] = useState(task?.title || '');
  const [editedDescription, setEditedDescription] = useState(task?.description || '');
  const [editedCategory, setEditedCategory] = useState<TaskCategory>(task?.category || 'preparation');
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [editedStatus, setEditedStatus] = useState<TaskStatus>(task?.status || 'pending');
  const [editedAssignedTo, setEditedAssignedTo] = useState(task?.assignedTo || '');
  const [editedNotes, setEditedNotes] = useState(task?.notes || '');
  const [editedDueDate, setEditedDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Configuration des catégories, priorités et statuts
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

  const priorityConfig = {
    low: { color: '#28a745', label: 'Faible' },
    medium: { color: '#ffc107', label: 'Moyenne' },
    high: { color: '#fd7e14', label: 'Élevée' },
    urgent: { color: '#dc3545', label: 'Urgente' },
  };

  const statusConfig = {
    pending: { color: '#6c757d', label: 'En attente', icon: 'clock' },
    in_progress: { color: '#17a2b8', label: 'En cours', icon: 'play' },
    completed: { color: '#28a745', label: 'Terminée', icon: 'check' },
    cancelled: { color: '#dc3545', label: 'Annulée', icon: 'times' },
  };

  useEffect(() => {
    if (taskId && !task) {
      fetchTask();
    }
  }, [taskId, task]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 16 }}>
          {taskId && (
            <TouchableOpacity onPress={handleDelete} style={{ marginRight: 16 }}>
              <Icon name="trash" size={20} color="#dc3545" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={editing ? handleSave : () => setEditing(true)}>
            <Icon name={editing ? "save" : "edit"} size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [editing, taskId]);

  // Fonction pour récupérer le token JWT (cohérente avec le reste de l'app)
  const getJwtToken = async () => '';

  const fetchTask = async () => {
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setTask(data);
        setEditedTitle(data.title);
        setEditedDescription(data.description || '');
        setEditedCategory(data.category);
        setEditedPriority(data.priority);
        setEditedStatus(data.status);
        setEditedAssignedTo(data.assignedTo || '');
        setEditedNotes(data.notes || '');
        setEditedDueDate(data.dueDate ? new Date(data.dueDate) : undefined);
      } else {
        Alert.alert('Erreur', 'Impossible de charger la tâche');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la tâche:', error);
      Alert.alert('Erreur', 'Impossible de charger la tâche');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        category: editedCategory,
        priority: editedPriority,
        status: editedStatus,
        assignedTo: editedAssignedTo.trim(),
        notes: editedNotes.trim(),
        dueDate: editedDueDate?.toISOString(),
      };

      const url = taskId 
        ? `${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks/${taskId}`
        : `${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks`;
      
      const method = taskId ? 'PUT' : 'POST';
      const token = await getJwtToken();

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTask(updatedTask);
        setEditing(false);
        refresh();
        
        if (!taskId) {
          // Nouvelle tâche créée, naviguer vers la liste
          navigation.goBack();
        }
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la tâche',
      'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      const token = await getJwtToken();
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        refresh();
        navigation.goBack();
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Alert.alert('Erreur', 'Erreur lors de la suppression');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditedDueDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  const currentCategory = categoryConfig[editedCategory];
  const currentPriority = priorityConfig[editedPriority];
  const currentStatus = statusConfig[editedStatus];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* En-tête de la tâche */}
        <View style={styles.header}>
          <View style={[styles.categoryIcon, { backgroundColor: currentCategory.color }]}>
            <Icon name={currentCategory.icon} size={24} color="white" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.categoryLabel}>{currentCategory.label}</Text>
            <View style={styles.statusContainer}>
              <Icon name={currentStatus.icon} size={12} color={currentStatus.color} />
              <Text style={[styles.statusText, { color: currentStatus.color }]}>
                {currentStatus.label}
              </Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: currentPriority.color }]}>
            <Text style={styles.priorityText}>{currentPriority.label}</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={styles.section}>
          <Text style={styles.label}>Titre *</Text>
          {editing ? (
            <TextInput
              style={styles.titleInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Titre de la tâche"
              maxLength={200}
            />
          ) : (
            <Text style={styles.titleText}>{task?.title}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          {editing ? (
            <TextInput
              style={styles.textArea}
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Description de la tâche"
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          ) : (
            <Text style={styles.descriptionText}>
              {task?.description || 'Aucune description'}
            </Text>
          )}
        </View>

        {/* Catégorie */}
        {editing && (
          <View style={styles.section}>
            <Text style={styles.label}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {(Object.keys(categoryConfig) as TaskCategory[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.optionButton,
                    editedCategory === category && { backgroundColor: categoryConfig[category].color }
                  ]}
                  onPress={() => setEditedCategory(category)}
                >
                  <Icon 
                    name={categoryConfig[category].icon} 
                    size={16} 
                    color={editedCategory === category ? 'white' : categoryConfig[category].color} 
                  />
                  <Text style={[
                    styles.optionText,
                    editedCategory === category && styles.selectedOptionText
                  ]}>
                    {categoryConfig[category].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Priorité */}
        {editing && (
          <View style={styles.section}>
            <Text style={styles.label}>Priorité</Text>
            <View style={styles.priorityOptions}>
              {(Object.keys(priorityConfig) as TaskPriority[]).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    editedPriority === priority && { backgroundColor: priorityConfig[priority].color }
                  ]}
                  onPress={() => setEditedPriority(priority)}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    editedPriority === priority && styles.selectedOptionText
                  ]}>
                    {priorityConfig[priority].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Statut */}
        {editing && (
          <View style={styles.section}>
            <Text style={styles.label}>Statut</Text>
            <View style={styles.statusOptions}>
              {(Object.keys(statusConfig) as TaskStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    editedStatus === status && { backgroundColor: statusConfig[status].color }
                  ]}
                  onPress={() => setEditedStatus(status)}
                >
                  <Icon 
                    name={statusConfig[status].icon} 
                    size={12} 
                    color={editedStatus === status ? 'white' : statusConfig[status].color} 
                  />
                  <Text style={[
                    styles.statusOptionText,
                    editedStatus === status && styles.selectedOptionText
                  ]}>
                    {statusConfig[status].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Date d'échéance */}
        <View style={styles.section}>
          <Text style={styles.label}>Date d'échéance</Text>
          {editing ? (
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar" size={16} color="#007bff" />
              <Text style={styles.dateButtonText}>
                {editedDueDate ? editedDueDate.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
              </Text>
              {editedDueDate && (
                <TouchableOpacity onPress={() => setEditedDueDate(undefined)} style={styles.clearDateButton}>
                  <Icon name="times" size={12} color="#dc3545" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.dateText}>
              {task?.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : 'Aucune échéance'}
            </Text>
          )}
        </View>

        {/* Assigné à */}
        <View style={styles.section}>
          <Text style={styles.label}>Assigné à</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={editedAssignedTo}
              onChangeText={setEditedAssignedTo}
              placeholder="Nom de la personne"
              maxLength={100}
            />
          ) : (
            <Text style={styles.assignedText}>
              {task?.assignedTo || 'Non assigné'}
            </Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          {editing ? (
            <TextInput
              style={styles.textArea}
              value={editedNotes}
              onChangeText={setEditedNotes}
              placeholder="Notes additionnelles"
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
          ) : (
            <Text style={styles.notesText}>
              {task?.notes || 'Aucune note'}
            </Text>
          )}
        </View>

        {/* Informations de création/modification */}
        {task && (
          <View style={styles.metaSection}>
            <Text style={styles.metaText}>
              Créée le {new Date(task.createdAt).toLocaleDateString('fr-FR')}
            </Text>
            {task.updatedAt !== task.createdAt && (
              <Text style={styles.metaText}>
                Modifiée le {new Date(task.updatedAt).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        )}

        {/* Boutons d'action */}
        {editing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                if (taskId) {
                  setEditing(false);
                  // Restaurer les valeurs originales
                  if (task) {
                    setEditedTitle(task.title);
                    setEditedDescription(task.description || '');
                    setEditedCategory(task.category);
                    setEditedPriority(task.priority);
                    setEditedStatus(task.status);
                    setEditedAssignedTo(task.assignedTo || '');
                    setEditedNotes(task.notes || '');
                    setEditedDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
                  }
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Text style={styles.cancelButtonText}>
                {taskId ? 'Annuler' : 'Retour'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {taskId ? 'Sauvegarder' : 'Créer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* DatePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={editedDueDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </ScrollView>
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
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  assignedText: {
    fontSize: 16,
    color: '#333',
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  optionsScroll: {
    marginVertical: 8,
  },
  optionButton: {
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
  optionText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 6,
  },
  selectedOptionText: {
    color: 'white',
  },
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
  },
  statusOptionText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 6,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  clearDateButton: {
    padding: 4,
  },
  metaSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#6c757d',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default TaskDetailScreen;
