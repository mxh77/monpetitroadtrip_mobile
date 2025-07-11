import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour les activités avec support offline-first
 * Compatible avec vos endpoints: /api/roadtrips/{roadtripId}/steps/{stepId}/activities
 */
class ActivityRepository extends BaseOfflineRepository {
  constructor() {
    super('activities', '/api/roadtrips');
  }

  /**
   * Obtenir toutes les activités d'une étape
   */
  async getActivitiesByStep(roadtripId, stepId, token, options = {}) {
    return await this.get(`/${roadtripId}/steps/${stepId}/activities`, {
      token,
      useCache: true,
      cacheTTL: 3 * 60,
      ...options
    });
  }

  /**
   * Créer une activité
   */
  async createActivity(roadtripId, stepId, activityData, token, options = {}) {
    return await this.create(activityData, {
      token,
      endpoint: `/${roadtripId}/steps/${stepId}/activities`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Créer une activité via langage naturel
   */
  async createActivityWithNaturalLanguage(roadtripId, stepId, prompt, token, options = {}) {
    const nlData = { prompt };
    
    return await this.create(nlData, {
      token,
      endpoint: `/${roadtripId}/steps/${stepId}/activities/natural-language`,
      optimisticUpdate: false, // L'IA prend du temps
      ...options
    });
  }

  /**
   * Mettre à jour une activité
   */
  async updateActivity(activityId, updates, token, options = {}) {
    // Utiliser l'endpoint direct pour les activités
    const activityRepo = new BaseOfflineRepository('activity', '/api/activities');
    return await activityRepo.update(activityId, updates, {
      token,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Supprimer une activité
   */
  async deleteActivity(activityId, token, options = {}) {
    const activityRepo = new BaseOfflineRepository('activity', '/api/activities');
    return await activityRepo.delete(activityId, {
      token,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Mettre à jour les dates d'une activité (planning)
   */
  async updateActivityDates(activityId, dates, token, options = {}) {
    const activityRepo = new BaseOfflineRepository('activity', '/api/activities');
    return await activityRepo.update(activityId, dates, {
      token,
      method: 'PATCH',
      endpoint: `/${activityId}/dates`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Rechercher des randonnées Algolia pour une activité
   */
  async searchAlgoliaForActivity(activityId, token, options = {}) {
    const activityRepo = new BaseOfflineRepository('activity', '/api/activities');
    return await activityRepo.get(`/${activityId}/search/algolia`, {
      token,
      useCache: true,
      cacheTTL: 10 * 60, // 10 minutes pour les recherches
      params: { hitsPerPage: 10 },
      ...options
    });
  }

  /**
   * Associer un résultat Algolia à une activité
   */
  async linkAlgoliaToActivity(activityId, algoliaData, token, options = {}) {
    const activityRepo = new BaseOfflineRepository('activity', '/api/activities');
    return await activityRepo.create(algoliaData, {
      token,
      endpoint: `/${activityId}/link/algolia`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Mettre à jour l'ID Algolia d'une activité
   */
  async updateActivityAlgoliaId(activityId, algoliaId, token, options = {}) {
    const activityRepo = new BaseOfflineRepository('activity', '/api/activities');
    return await activityRepo.update(activityId, { algoliaId }, {
      token,
      method: 'PATCH',
      endpoint: `/${activityId}/algolia`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Recherche générale dans Algolia
   */
  async searchAlgolia(query, indexName = 'randonnees', token, options = {}) {
    const searchRepo = new BaseOfflineRepository('algolia', '/api/activities');
    return await searchRepo.create({
      query,
      indexName,
      hitsPerPage: options.hitsPerPage || 20
    }, {
      token,
      endpoint: '/search/algolia',
      optimisticUpdate: false,
      ...options
    });
  }
}

const activityRepository = new ActivityRepository();
export default activityRepository;
