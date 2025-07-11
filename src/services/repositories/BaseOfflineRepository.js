import config from '../../config';
import syncService from '../sync/SyncService';
import sqliteDatabase from '../database/SqliteDatabase';
import connectivityService from '../network/ConnectivityService';

/**
 * Repository de base pour toutes les entités avec support offline-first
 * Compatible avec votre API Laravel existante
 */
class BaseOfflineRepository {
  constructor(entityType, baseEndpoint) {
    this.entityType = entityType;
    this.baseEndpoint = baseEndpoint.startsWith('/') ? baseEndpoint : `/${baseEndpoint}`;
    this.baseURL = config.BACKEND_URL;
    this.cacheTTL = 5 * 60; // 5 minutes par défaut
  }

  /**
   * Construire l'URL complète pour un endpoint
   */
  buildURL(endpoint = '') {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${this.baseEndpoint}${cleanEndpoint}`;
  }

  /**
   * Obtenir les headers par défaut avec authentification
   */
  getHeaders(token = null, isMultipart = false) {
    const headers = {};
    
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Générer une clé de cache unique
   */
  getCacheKey(method, endpoint, params = {}) {
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    
    return `${this.entityType}_${method}_${endpoint}_${JSON.stringify(sortedParams)}`;
  }

  /**
   * GET - Récupérer des données avec cache et fallback offline
   */
  async get(endpoint = '', options = {}) {
    const {
      token = null,
      useCache = true,
      cacheTTL = this.cacheTTL,
      params = {},
      forceRefresh = false
    } = options;

    const url = this.buildURL(endpoint);
    const cacheKey = this.getCacheKey('GET', endpoint, params);

    // 1. Essayer le cache d'abord si pas de refresh forcé
    if (useCache && !forceRefresh) {
      const cachedData = await sqliteDatabase.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`📦 Cache hit pour ${this.entityType}: ${endpoint}`);
        return cachedData;
      }
    }

    // 2. Essayer le réseau si connecté
    if (connectivityService.isConnected) {
      try {
        const queryString = new URLSearchParams(params).toString();
        const finalURL = queryString ? `${url}?${queryString}` : url;
        
        const response = await fetch(finalURL, {
          method: 'GET',
          headers: this.getHeaders(token)
        });

        if (response.ok) {
          const data = await response.json();
          
          // Extraire les données selon le format de votre API
          const extractedData = this.extractResponseData(data);
          
          // Mettre en cache
          if (useCache) {
            await sqliteDatabase.setCachedData(cacheKey, extractedData, cacheTTL);
          }
          
          console.log(`🌐 Données fraîches pour ${this.entityType}: ${endpoint}`);
          return extractedData;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur réseau ${this.entityType}:`, error);
        
        // Fallback sur le cache même expiré
        if (useCache) {
          const staleData = await sqliteDatabase.getCachedData(cacheKey);
          if (staleData) {
            console.log(`📦 Utilisation cache expiré pour ${this.entityType}: ${endpoint}`);
            return staleData;
          }
        }
        
        throw error;
      }
    } else {
      // 3. Mode offline - utiliser le cache uniquement
      if (useCache) {
        const cachedData = await sqliteDatabase.getCachedData(cacheKey);
        if (cachedData) {
          console.log(`📱 Mode offline - cache pour ${this.entityType}: ${endpoint}`);
          return cachedData;
        }
      }
      
      throw new Error(`Aucune donnée disponible offline pour ${this.entityType}`);
    }
  }

  /**
   * POST - Créer une nouvelle entité avec queue offline
   */
  async create(data, options = {}) {
    const {
      token = null,
      endpoint = '',
      optimisticUpdate = true,
      isMultipart = false
    } = options;

    const url = this.buildURL(endpoint);
    const localId = this.generateLocalId();

    // 1. Réponse optimiste immédiate
    if (optimisticUpdate) {
      const optimisticData = {
        ...data,
        _id: localId,
        _isLocal: true,
        _isPending: true,
        createdAt: new Date().toISOString()
      };

      console.log(`⚡ Création optimiste ${this.entityType}:`, localId);
      
      // Invalider le cache pour forcer le refresh
      await this.invalidateCache();
      
      // Programmer la synchronisation
      const operationId = await syncService.addOperation({
        type: 'CREATE',
        entityType: this.entityType,
        localId,
        data: isMultipart ? data : data,
        endpoint: url,
        method: 'POST',
        headers: this.getHeaders(token, isMultipart)
      });

      return { data: optimisticData, operationId };
    }

    // 2. Mode synchrone (si connecté)
    if (connectivityService.isConnected) {
      return await this.executeCreate(url, data, token, isMultipart);
    } else {
      throw new Error('Création synchrone impossible sans connexion');
    }
  }

  /**
   * PUT/PATCH - Mettre à jour une entité
   */
  async update(id, data, options = {}) {
    const {
      token = null,
      endpoint = `/${id}`,
      method = 'PUT',
      optimisticUpdate = true,
      isMultipart = false
    } = options;

    const url = this.buildURL(endpoint);

    // 1. Mise à jour optimiste
    if (optimisticUpdate) {
      console.log(`⚡ Mise à jour optimiste ${this.entityType}:`, id);
      
      await this.invalidateCache();
      
      const operationId = await syncService.addOperation({
        type: 'UPDATE',
        entityType: this.entityType,
        entityId: id,
        data,
        endpoint: url,
        method,
        headers: this.getHeaders(token, isMultipart)
      });

      return { data: { ...data, _id: id, _isPending: true }, operationId };
    }

    // 2. Mode synchrone
    if (connectivityService.isConnected) {
      return await this.executeUpdate(url, data, token, method, isMultipart);
    } else {
      throw new Error('Mise à jour synchrone impossible sans connexion');
    }
  }

  /**
   * DELETE - Supprimer une entité
   */
  async delete(id, options = {}) {
    const {
      token = null,
      endpoint = `/${id}`,
      optimisticUpdate = true
    } = options;

    const url = this.buildURL(endpoint);

    // 1. Suppression optimiste
    if (optimisticUpdate) {
      console.log(`⚡ Suppression optimiste ${this.entityType}:`, id);
      
      await this.invalidateCache();
      
      const operationId = await syncService.addOperation({
        type: 'DELETE',
        entityType: this.entityType,
        entityId: id,
        data: {},
        endpoint: url,
        method: 'DELETE',
        headers: this.getHeaders(token)
      });

      return { success: true, operationId };
    }

    // 2. Mode synchrone
    if (connectivityService.isConnected) {
      return await this.executeDelete(url, token);
    } else {
      throw new Error('Suppression synchrone impossible sans connexion');
    }
  }

  /**
   * Exécution directe d'une création (mode synchrone)
   */
  async executeCreate(url, data, token, isMultipart = false) {
    const body = isMultipart ? data : JSON.stringify(data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(token, isMultipart),
      body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    await this.invalidateCache();
    
    return this.extractResponseData(result);
  }

  /**
   * Exécution directe d'une mise à jour (mode synchrone)
   */
  async executeUpdate(url, data, token, method = 'PUT', isMultipart = false) {
    const body = isMultipart ? data : JSON.stringify(data);
    
    const response = await fetch(url, {
      method,
      headers: this.getHeaders(token, isMultipart),
      body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    await this.invalidateCache();
    
    return this.extractResponseData(result);
  }

  /**
   * Exécution directe d'une suppression (mode synchrone)
   */
  async executeDelete(url, token) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(token)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    await this.invalidateCache();
    
    return { success: true };
  }

  /**
   * Extraire les données de la réponse API selon votre format
   */
  extractResponseData(response) {
    // Format standard de votre API Laravel
    if (response.success && response.data) {
      return response.data;
    }
    
    // Fallback
    return response;
  }

  /**
   * Générer un ID local temporaire
   */
  generateLocalId() {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Invalider le cache pour ce type d'entité
   */
  async invalidateCache() {
    // TODO: Implémenter l'invalidation sélective du cache
    console.log(`🧹 Cache invalidé pour ${this.entityType}`);
  }

  /**
   * Vérifier le statut de synchronisation
   */
  async getSyncStatus() {
    return await syncService.getStatus();
  }

  /**
   * Forcer la synchronisation
   */
  async forceSync() {
    return await syncService.forceSync();
  }
}

export default BaseOfflineRepository;
