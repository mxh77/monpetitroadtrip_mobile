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
import { RoadtripTask, TaskCategory, TaskPriority, TaskStatus, TaskEditScreenProps } from '../../types';
import config from '../config';

const TaskEditScreen: React.FC<TaskEditScreenProps> = ({ route, navigation }) => {
  const { roadtripId, taskId, task, refresh } = route.params;
  
  const [saving, setSaving] = useState(false);
  
  // États pour l'édition
  const [editedTitle, setEditedTitle] = useState(task.title || '');
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedCategory, setEditedCategory] = useState<TaskCategory>(task.category || 'preparation');
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(task.priority || 'medium');
  const [editedStatus, setEditedStatus] = useState<TaskStatus>(task.status || 'pending');
  const [editedAssignedTo, setEditedAssignedTo] = useState(task.assignedTo || '');
  const [editedNotes, setEditedNotes] = useState(task.notes || '');
  const [editedDueDate, setEditedDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
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
    pending: { color: '#6c757d', label: 'En attente' },
    in_progress: { color: '#007bff', label: 'En cours' },
    completed: { color: '#28a745', label: 'Terminée' },
    cancelled: { color: '#dc3545', label: 'Annulée' },
  };

  const getJwtToken = async () => '';

  useEffect(() => {
    navigation.setOptions({
      title: 'Éditer la tâche',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : (
            <Text style={styles.headerButtonText}>Sauvegarder</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [saving, editedTitle, editedDescription, editedCategory, editedPriority, editedStatus, editedAssignedTo, editedNotes, editedDueDate]);

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      Alert.alert('Erreur', 'Le titre de la tâche est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const token = await getJwtToken();
      
      const updateData = {
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        category: editedCategory,
        priority: editedPriority,
        status: editedStatus,
        assignedTo: editedAssignedTo.trim(),
        notes: editedNotes.trim(),
        dueDate: editedDueDate ? editedDueDate.toISOString() : null,
      };

      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        refresh();
        navigation.goBack();
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditedDueDate(selectedDate);
    }
  };

  const removeDueDate = () => {
    setEditedDueDate(undefined);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Titre */}
        <View style={styles.section}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.textInput}
            value={editedTitle}
            onChangeText={setEditedTitle}
            placeholder="Titre de la tâche"
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={editedDescription}
            onChangeText={setEditedDescription}
            placeholder="Description détaillée"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Catégorie */}
        <View style={styles.section}>
          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.categoryGrid}>
            {(Object.keys(categoryConfig) as TaskCategory[]).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryGridOption,
                  editedCategory === category && styles.selectedCategoryGridOption
                ]}
                onPress={() => setEditedCategory(category)}
              >
                <Icon 
                  name={categoryConfig[category].icon} 
                  size={18} 
                  color={editedCategory === category ? 'white' : categoryConfig[category].color} 
                  style={styles.categoryGridIcon}
                />
                <Text style={[
                  styles.categoryGridText,
                  editedCategory === category && styles.selectedCategoryGridText
                ]}>
                  {categoryConfig[category].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priorité */}
        <View style={styles.section}>
          <Text style={styles.label}>Priorité</Text>
          <View style={styles.priorityContainer}>
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
                  editedPriority === priority && styles.selectedPriorityText
                ]}>
                  {priorityConfig[priority].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statut */}
        <View style={styles.section}>
          <Text style={styles.label}>Statut</Text>
          <View style={styles.statusContainer}>
            {(Object.keys(statusConfig) as TaskStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  editedStatus === status && { backgroundColor: statusConfig[status].color }
                ]}
                onPress={() => setEditedStatus(status)}
              >
                <Text style={[
                  styles.statusOptionText,
                  editedStatus === status && styles.selectedStatusText
                ]}>
                  {statusConfig[status].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date d'échéance */}
        <View style={styles.section}>
          <Text style={styles.label}>Date d'échéance</Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={16} color="#007bff" />
              <Text style={styles.dateButtonText}>
                {editedDueDate ? editedDueDate.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
              </Text>
            </TouchableOpacity>
            {editedDueDate && (
              <TouchableOpacity
                style={styles.removeDateButton}
                onPress={removeDueDate}
              >
                <Icon name="times" size={16} color="#dc3545" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Assigné à */}
        <View style={styles.section}>
          <Text style={styles.label}>Assigné à</Text>
          <TextInput
            style={styles.textInput}
            value={editedAssignedTo}
            onChangeText={setEditedAssignedTo}
            placeholder="Nom de la personne"
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={editedNotes}
            onChangeText={setEditedNotes}
            placeholder="Notes supplémentaires"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Date picker */}
        {showDatePicker && (
          <DateTimePicker
            value={editedDueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryGridOption: {
    width: '32%',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    minHeight: 70,
    justifyContent: 'center',
  },
  selectedCategoryGridOption: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryGridIcon: {
    marginBottom: 4,
  },
  categoryGridText: {
    fontSize: 10,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCategoryGridText: {
    color: 'white',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedPriorityText: {
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedStatusText: {
    color: 'white',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  removeDateButton: {
    marginLeft: 8,
    padding: 8,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
});

export default TaskEditScreen;
