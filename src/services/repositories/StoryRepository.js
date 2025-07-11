import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour les stories avec support offline-first
 */
class StoryRepository extends BaseOfflineRepository {
  constructor() {
    super('stories', '/api/steps');
  }

  /**
   * Obtenir l'histoire d'une étape
   */
  async getStepStory(stepId, token, options = {}) {
    return await this.get(`/${stepId}/story`, {
      token,
      useCache: true,
      cacheTTL: 10 * 60, // 10 minutes pour les stories
      ...options
    });
  }

  /**
   * Obtenir l'histoire d'une étape avec photos
   */
  async getStepStoryWithPhotos(stepId, token, options = {}) {
    return await this.get(`/${stepId}/story/with-photos`, {
      token,
      useCache: true,
      cacheTTL: 5 * 60, // 5 minutes avec photos
      ...options
    });
  }

  /**
   * Mettre à jour l'histoire d'une étape
   */
  async updateStepStory(stepId, storyData, token, options = {}) {
    return await this.update(stepId, storyData, {
      token,
      endpoint: `/${stepId}/story`,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Ajouter une photo à l'histoire
   */
  async addPhotoToStory(stepId, photoData, token, options = {}) {
    return await this.create(photoData, {
      token,
      endpoint: `/${stepId}/story/photos`,
      isMultipart: true,
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Supprimer une photo de l'histoire
   */
  async removePhotoFromStory(stepId, photoId, token, options = {}) {
    return await this.delete(photoId, {
      token,
      endpoint: `/${stepId}/story/photos/${photoId}`,
      optimisticUpdate: true,
      ...options
    });
  }
}

const storyRepository = new StoryRepository();
export default storyRepository;
