import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour les roadtrips avec support offline-first
 * Compatible avec vos endpoints: /api/roadtrips
 */
class RoadtripRepository extends BaseOfflineRepository {
  constructor() {
    super('roadtrips', '/api/roadtrips');
  }

  /**
   * Obtenir tous les roadtrips
   */
  async getAllRoadtrips(token, options = {}) {
    return await this.get('', {
      token,
      useCache: true,
      cacheTTL: 2 * 60, // 2 minutes pour les listes
      ...options
    });
  }

  /**
   * Obtenir un roadtrip spécifique
   */
  async getRoadtrip(roadtripId, token, options = {}) {
    return await this.get(`/${roadtripId}`, {
      token,
      useCache: true,
      cacheTTL: 5 * 60, // 5 minutes pour un roadtrip
      ...options
    });
  }

  /**
   * Créer un nouveau roadtrip
   */
  async createRoadtrip(roadtripData, token, options = {}) {
    const result = await this.create(roadtripData, {
      token,
      optimisticUpdate: true,
      ...options
    });

    return result;
  }

  /**
   * Mettre à jour un roadtrip
   */
  async updateRoadtrip(roadtripId, updates, token, options = {}) {
    return await this.update(roadtripId, updates, {
      token,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Supprimer un roadtrip
   */
  async deleteRoadtrip(roadtripId, token, options = {}) {
    return await this.delete(roadtripId, {
      token,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Créer un roadtrip avec IA
   */
  async createRoadtripWithAI(prompt, token, options = {}) {
    const aiData = { prompt };
    
    return await this.create(aiData, {
      token,
      endpoint: '/ai',
      optimisticUpdate: false, // L'IA prend du temps, pas d'optimisme ici
      ...options
    });
  }

  /**
   * Supprimer un fichier d'un roadtrip
   */
  async deleteRoadtripFile(roadtripId, fileId, token, options = {}) {
    return await this.delete(fileId, {
      token,
      endpoint: `/${roadtripId}/files/${fileId}`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Mettre à jour les temps de trajet (asynchrone)
   */
  async refreshTravelTimeAsync(roadtripId, token, options = {}) {
    const url = this.buildURL(`/${roadtripId}/travel-time/refresh/async`);
    
    if (connectivityService.isConnected) {
      try {
        const response = await fetch(url, {
          method: 'PATCH',
          headers: this.getHeaders(token)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return this.extractResponseData(result);
      } catch (error) {
        console.error('❌ Erreur refresh travel time:', error);
        throw error;
      }
    } else {
      // En mode offline, programmer pour plus tard
      await syncService.addOperation({
        type: 'UPDATE',
        entityType: 'travel-time',
        entityId: roadtripId,
        data: {},
        endpoint: url,
        method: 'PATCH',
        headers: this.getHeaders(token)
      });

      return { jobId: `offline_${Date.now()}`, status: 'queued' };
    }
  }

  /**
   * Vérifier le statut d'un job de temps de trajet
   */
  async getTravelTimeJobStatus(roadtripId, jobId, token, options = {}) {
    return await this.get(`/${roadtripId}/travel-time/jobs/${jobId}/status`, {
      token,
      useCache: false, // Toujours frais pour les statuts de jobs
      ...options
    });
  }

  /**
   * Obtenir tous les jobs de temps de trajet
   */
  async getTravelTimeJobs(roadtripId, token, options = {}) {
    return await this.get(`/${roadtripId}/travel-time/jobs`, {
      token,
      useCache: false,
      ...options
    });
  }
}

const roadtripRepository = new RoadtripRepository();
export default roadtripRepository;
