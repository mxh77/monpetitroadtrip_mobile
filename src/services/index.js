// Services principaux
export { default as OfflineManager } from './OfflineManager';
export { default as SyncService } from './sync/SyncService';
export { default as ConnectivityService } from './network/ConnectivityService';
export { default as SqliteDatabase } from './database/SqliteDatabase';

// Repositories
export { default as RoadtripRepository } from './repositories/RoadtripRepository';
export { default as StepRepository } from './repositories/StepRepository';
export { default as ActivityRepository } from './repositories/ActivityRepository';
export { default as AccommodationRepository } from './repositories/AccommodationRepository';
export { default as TaskRepository } from './repositories/TaskRepository';
export { default as ChatRepository } from './repositories/ChatRepository';
export { default as StoryRepository } from './repositories/StoryRepository';
export { default as AuthRepository } from './repositories/AuthRepository';
export { default as SettingsRepository } from './repositories/SettingsRepository';
export { default as BaseOfflineRepository } from './repositories/BaseOfflineRepository';

// Utilitaires pour faciliter l'usage
export const getRepository = (type) => {
  return OfflineManager.getRepository(type);
};

export const initializeOfflineServices = async () => {
  return await OfflineManager.initialize();
};

export const getOfflineStatus = async () => {
  return await OfflineManager.getGlobalStatus();
};

export const forceSync = async () => {
  return await OfflineManager.forceGlobalSync();
};

// Helper pour remplacer les appels fetch existants
export const offlineFetch = async (url, options = {}) => {
  console.warn('⚠️ offlineFetch utilisé - considérez utiliser les repositories spécifiques');
  
  // Pour compatibilité, utiliser le repository approprié
  // Cette fonction est un wrapper de transition
  
  const { method = 'GET', body, headers } = options;
  
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error('❌ Erreur fetch:', error);
    throw error;
  }
};
