import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour l'authentification avec support offline-first
 */
class AuthRepository extends BaseOfflineRepository {
  constructor() {
    super('auth', '/api/auth');
  }

  /**
   * Connexion utilisateur
   */
  async login(credentials, options = {}) {
    // L'authentification doit être en temps réel
    return await this.create(credentials, {
      endpoint: '/login',
      optimisticUpdate: false,
      ...options
    });
  }

  /**
   * Inscription utilisateur
   */
  async register(userData, options = {}) {
    return await this.create(userData, {
      endpoint: '/register',
      optimisticUpdate: false,
      ...options
    });
  }

  /**
   * Vérifier le statut de l'utilisateur
   */
  async getAuthStatus(token, options = {}) {
    return await this.get('/status', {
      token,
      useCache: false, // Toujours vérifier le statut
      ...options
    });
  }

  /**
   * Rafraîchir le token (si implémenté)
   */
  async refreshToken(refreshToken, options = {}) {
    return await this.create({ refreshToken }, {
      endpoint: '/refresh',
      optimisticUpdate: false,
      ...options
    });
  }

  /**
   * Déconnexion
   */
  async logout(token, options = {}) {
    return await this.create({}, {
      token,
      endpoint: '/logout',
      optimisticUpdate: false,
      ...options
    });
  }
}

const authRepository = new AuthRepository();
export default authRepository;
