import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour les steps (étapes) avec support offline-first
 * Compatible avec vos endpoints: /api/roadtrips/{id}/steps et /api/steps/{id}
 */
class StepRepository extends BaseOfflineRepository {
  constructor() {
    super('steps', '/api/roadtrips');
  }

  /**
   * Obtenir toutes les étapes d'un roadtrip
   */
  async getStepsByRoadtrip(roadtripId, token, options = {}) {
    return await this.get(`/${roadtripId}/steps`, {
      token,
      useCache: true,
      cacheTTL: 3 * 60, // 3 minutes
      ...options
    });
  }

  /**
   * Obtenir une étape spécifique
   */
  async getStep(stepId, token, options = {}) {
    // Utiliser l'endpoint direct pour une étape
    const stepRepo = new BaseOfflineRepository('step', '/api/steps');
    return await stepRepo.get(`/${stepId}`, {
      token,
      useCache: true,
      cacheTTL: 5 * 60,
      ...options
    });
  }

  /**
   * Créer une étape via langage naturel
   */
  async createStepWithNaturalLanguage(roadtripId, prompt, token, options = {}) {
    const nlData = { prompt };
    
    return await this.create(nlData, {
      token,
      endpoint: `/${roadtripId}/steps/natural-language`,
      optimisticUpdate: false, // L'IA prend du temps
      ...options
    });
  }

  /**
   * Créer une étape standard
   */
  async createStep(roadtripId, stepData, token, options = {}) {
    return await this.create(stepData, {
      token,
      endpoint: `/${roadtripId}/steps`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Mettre à jour une étape
   */
  async updateStep(stepId, updates, token, options = {}) {
    // Utiliser l'endpoint direct pour mettre à jour
    const stepRepo = new BaseOfflineRepository('step', '/api/steps');
    return await stepRepo.update(stepId, updates, {
      token,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Supprimer une étape
   */
  async deleteStep(stepId, token, options = {}) {
    const stepRepo = new BaseOfflineRepository('step', '/api/steps');
    return await stepRepo.delete(stepId, {
      token,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Mettre à jour les dates d'une étape (utilisé par le planning)
   */
  async updateStepDates(stepId, dates, token, options = {}) {
    // Endpoint spécial pour les dates comme utilisé dans AdvancedPlanning
    const stepRepo = new BaseOfflineRepository('step', '/api/steps');
    return await stepRepo.update(stepId, dates, {
      token,
      method: 'PATCH',
      endpoint: `/${stepId}/dates`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Réorganiser les étapes d'un roadtrip
   */
  async reorderSteps(roadtripId, stepsOrder, token, options = {}) {
    return await this.update(roadtripId, { stepsOrder }, {
      token,
      endpoint: `/${roadtripId}/steps/reorder`,
      method: 'PATCH',
      optimisticUpdate: true,
      ...options
    });
  }
}

const stepRepository = new StepRepository();
export default stepRepository;
