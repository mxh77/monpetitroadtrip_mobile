import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour les tâches avec support offline-first
 */
class TaskRepository extends BaseOfflineRepository {
  constructor() {
    super('tasks', '/api/roadtrips');
  }

  /**
   * Obtenir toutes les tâches d'un roadtrip
   */
  async getTasksByRoadtrip(roadtripId, token, options = {}) {
    return await this.get(`/${roadtripId}/tasks`, {
      token,
      useCache: true,
      cacheTTL: 2 * 60, // 2 minutes
      ...options
    });
  }

  /**
   * Obtenir une tâche spécifique
   */
  async getTask(roadtripId, taskId, token, options = {}) {
    return await this.get(`/${roadtripId}/tasks/${taskId}`, {
      token,
      useCache: true,
      cacheTTL: 5 * 60,
      ...options
    });
  }

  /**
   * Basculer l'état de completion d'une tâche
   */
  async toggleTaskCompletion(roadtripId, taskId, token, options = {}) {
    return await this.update(taskId, {}, {
      token,
      endpoint: `/${roadtripId}/tasks/${taskId}/toggle-completion`,
      method: 'PATCH',
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Réorganiser les tâches
   */
  async reorderTasks(roadtripId, tasksOrder, token, options = {}) {
    return await this.update(roadtripId, { tasksOrder }, {
      token,
      endpoint: `/${roadtripId}/tasks/reorder`,
      method: 'PATCH',
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Générer les tâches par défaut
   */
  async generateDefaultTasks(roadtripId, token, options = {}) {
    return await this.create({}, {
      token,
      endpoint: `/${roadtripId}/tasks/generate-defaults`,
      optimisticUpdate: false, // Génération côté serveur
      ...options
    });
  }

  /**
   * Créer une nouvelle tâche
   */
  async createTask(roadtripId, taskData, token, options = {}) {
    return await this.create(taskData, {
      token,
      endpoint: `/${roadtripId}/tasks`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Mettre à jour une tâche
   */
  async updateTask(roadtripId, taskId, updates, token, options = {}) {
    return await this.update(taskId, updates, {
      token,
      endpoint: `/${roadtripId}/tasks/${taskId}`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Supprimer une tâche
   */
  async deleteTask(roadtripId, taskId, token, options = {}) {
    return await this.delete(taskId, {
      token,
      endpoint: `/${roadtripId}/tasks/${taskId}`,
      optimisticUpdate: true,
      ...options
    });
  }
}

const taskRepository = new TaskRepository();
export default taskRepository;
