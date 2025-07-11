import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour les hébergements avec support offline-first
 */
class AccommodationRepository extends BaseOfflineRepository {
  constructor() {
    super('accommodations', '/api/roadtrips');
  }

  /**
   * Créer un hébergement
   */
  async createAccommodation(roadtripId, stepId, accommodationData, token, options = {}) {
    return await this.create(accommodationData, {
      token,
      endpoint: `/${roadtripId}/steps/${stepId}/accommodations`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Mettre à jour un hébergement
   */
  async updateAccommodation(accommodationId, updates, token, options = {}) {
    const accommodationRepo = new BaseOfflineRepository('accommodation', '/api/accommodations');
    return await accommodationRepo.update(accommodationId, updates, {
      token,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Supprimer un hébergement
   */
  async deleteAccommodation(accommodationId, token, options = {}) {
    const accommodationRepo = new BaseOfflineRepository('accommodation', '/api/accommodations');
    return await accommodationRepo.delete(accommodationId, {
      token,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Mettre à jour les dates d'un hébergement (planning)
   */
  async updateAccommodationDates(accommodationId, dates, token, options = {}) {
    const accommodationRepo = new BaseOfflineRepository('accommodation', '/api/accommodations');
    return await accommodationRepo.update(accommodationId, dates, {
      token,
      method: 'PUT', // Comme dans votre code AdvancedPlanning
      optimisticUpdate: true,
      ...options
    });
  }
}

const accommodationRepository = new AccommodationRepository();
export default accommodationRepository;
