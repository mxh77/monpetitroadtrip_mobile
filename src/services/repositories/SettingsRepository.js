import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour les paramètres avec support offline-first
 */
class SettingsRepository extends BaseOfflineRepository {
  constructor() {
    super('settings', '/api/settings');
  }

  /**
   * Obtenir les paramètres utilisateur
   */
  async getSettings(token, options = {}) {
    return await this.get('', {
      token,
      useCache: true,
      cacheTTL: 15 * 60, // 15 minutes pour les settings
      ...options
    });
  }

  /**
   * Mettre à jour les paramètres
   */
  async updateSettings(settingsData, token, options = {}) {
    return await this.update('', settingsData, {
      token,
      method: 'PUT',
      optimisticUpdate: true,
      ...options
    });
  }

  /**
   * Réinitialiser les paramètres
   */
  async resetSettings(token, options = {}) {
    return await this.create({}, {
      token,
      endpoint: '/reset',
      optimisticUpdate: false,
      ...options
    });
  }
}

const settingsRepository = new SettingsRepository();
export default settingsRepository;
