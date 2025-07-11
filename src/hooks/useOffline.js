import { useState, useEffect, useCallback } from 'react';
import offlineManager from '../services/OfflineManager';

/**
 * Hook pour utiliser un repository avec gestion de l'état
 */
export const useRepository = (repositoryType) => {
  const [repository, setRepository] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initRepository = async () => {
      try {
        await offlineManager.ensureInitialized();
        const repo = offlineManager.getRepository(repositoryType);
        setRepository(repo);
      } catch (err) {
        console.error(`❌ Erreur initialisation repository ${repositoryType}:`, err);
        setError(err);
      }
    };

    initRepository();
  }, [repositoryType]);

  const execute = useCallback(async (method, ...args) => {
    if (!repository) {
      throw new Error(`Repository ${repositoryType} non initialisé`);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await repository[method](...args);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [repository, repositoryType]);

  return {
    repository,
    execute,
    isLoading,
    error,
    isReady: !!repository
  };
};

/**
 * Hook pour le statut de synchronisation
 */
export const useSyncStatus = (updateInterval = 5000) => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let interval = null;

    const updateStatus = async () => {
      try {
        const globalStatus = await offlineManager.getGlobalStatus();
        if (mounted) {
          setStatus(globalStatus);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Erreur récupération statut sync:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Première mise à jour
    updateStatus();

    // Écouter les événements de sync
    const unsubscribe = offlineManager.addSyncStatusListener(() => {
      updateStatus();
    });

    // Polling périodique
    if (updateInterval > 0) {
      interval = setInterval(updateStatus, updateInterval);
    }

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [updateInterval]);

  const forceSync = useCallback(async () => {
    try {
      await offlineManager.forceGlobalSync();
    } catch (error) {
      console.error('❌ Erreur force sync:', error);
      throw error;
    }
  }, []);

  return {
    status,
    isLoading,
    forceSync,
    isConnected: status?.connectivity?.isConnected || false,
    pendingOperations: status?.pendingOperations || 0,
    isRunning: status?.isRunning || false
  };
};

/**
 * Hook pour les opérations CRUD avec gestion d'état optimiste
 */
export const useCrudOperations = (repositoryType, entityId = null) => {
  const { repository, execute, isLoading, error } = useRepository(repositoryType);
  const [data, setData] = useState(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const create = useCallback(async (entityData, token, options = {}) => {
    if (!repository) throw new Error('Repository non initialisé');

    // Mise à jour optimiste immédiate
    if (options.optimisticUpdate !== false) {
      const optimisticData = {
        ...entityData,
        _id: `temp_${Date.now()}`,
        _isOptimistic: true
      };
      setData(optimisticData);
      setIsOptimistic(true);
    }

    try {
      const result = await execute('create', entityData, token, options);
      setData(result.data);
      setIsOptimistic(false);
      return result;
    } catch (err) {
      // Rollback en cas d'erreur
      if (options.optimisticUpdate !== false) {
        setData(null);
        setIsOptimistic(false);
      }
      throw err;
    }
  }, [repository, execute]);

  const update = useCallback(async (id, updateData, token, options = {}) => {
    if (!repository) throw new Error('Repository non initialisé');

    // Mise à jour optimiste
    if (options.optimisticUpdate !== false && data) {
      const optimisticData = { ...data, ...updateData, _isOptimistic: true };
      setData(optimisticData);
      setIsOptimistic(true);
    }

    try {
      const result = await execute('update', id, updateData, token, options);
      setData(result.data);
      setIsOptimistic(false);
      return result;
    } catch (err) {
      // Rollback
      if (options.optimisticUpdate !== false) {
        // Restaurer les données originales (si possible)
        setIsOptimistic(false);
      }
      throw err;
    }
  }, [repository, execute, data]);

  const remove = useCallback(async (id, token, options = {}) => {
    if (!repository) throw new Error('Repository non initialisé');

    // Suppression optimiste
    if (options.optimisticUpdate !== false) {
      setData(null);
      setIsOptimistic(true);
    }

    try {
      const result = await execute('delete', id, token, options);
      setData(null);
      setIsOptimistic(false);
      return result;
    } catch (err) {
      // Rollback
      if (options.optimisticUpdate !== false) {
        // Restaurer si possible
        setIsOptimistic(false);
      }
      throw err;
    }
  }, [repository, execute]);

  const refresh = useCallback(async (token, options = {}) => {
    if (!repository || !entityId) return;

    try {
      const result = await execute('get', entityId, token, { 
        forceRefresh: true, 
        ...options 
      });
      setData(result);
      setIsOptimistic(false);
      return result;
    } catch (err) {
      console.error('❌ Erreur refresh:', err);
      throw err;
    }
  }, [repository, execute, entityId]);

  return {
    data,
    isLoading,
    error,
    isOptimistic,
    create,
    update,
    remove,
    refresh,
    isReady: !!repository
  };
};

/**
 * Hook pour les listes avec cache et refresh
 */
export const useListData = (repositoryType, listMethod, dependencies = []) => {
  const { repository, execute, isLoading, error } = useRepository(repositoryType);
  const [data, setData] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);

  const fetch = useCallback(async (...args) => {
    if (!repository) return;

    try {
      const result = await execute(listMethod, ...args);
      setData(Array.isArray(result) ? result : []);
      setLastFetch(new Date());
      return result;
    } catch (err) {
      console.error(`❌ Erreur fetch ${listMethod}:`, err);
      throw err;
    }
  }, [repository, execute, listMethod]);

  const refresh = useCallback(async (...args) => {
    if (!repository) return;

    try {
      // Forcer le refresh
      const argsWithRefresh = args.length > 0 
        ? [...args.slice(0, -1), { ...args[args.length - 1], forceRefresh: true }]
        : [{ forceRefresh: true }];
        
      const result = await execute(listMethod, ...argsWithRefresh);
      setData(Array.isArray(result) ? result : []);
      setLastFetch(new Date());
      return result;
    } catch (err) {
      console.error(`❌ Erreur refresh ${listMethod}:`, err);
      throw err;
    }
  }, [repository, execute, listMethod]);

  useEffect(() => {
    if (repository && dependencies.every(dep => dep !== null && dep !== undefined)) {
      fetch(...dependencies);
    }
  }, [repository, fetch, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    lastFetch,
    fetch,
    refresh,
    isReady: !!repository
  };
};

export default {
  useRepository,
  useSyncStatus,
  useCrudOperations,
  useListData
};
