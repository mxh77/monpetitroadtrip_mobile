// Configuration et utilitaires de performance pour l'application
export const PERFORMANCE_CONFIG = {
  // Intervalle de nettoyage mémoire (en millisecondes)
  MEMORY_CLEANUP_INTERVAL: 30000, // 30 secondes
  
  // Seuils de performance
  PERFORMANCE_THRESHOLDS: {
    SLOW_OPERATION: 100, // 100ms
    VERY_SLOW_OPERATION: 500, // 500ms
  },
  
  // Configuration des FlatList pour optimiser les performances
  FLATLIST_CONFIG: {
    initialNumToRender: 2,
    maxToRenderPerBatch: 1,
    updateCellsBatchingPeriod: 250,
    windowSize: 3,
    scrollEventThrottle: 64,
    onEndReachedThreshold: 0.1,
  },
};

// Fonction pour mesurer les performances d'une opération
export const trackPerformance = <T>(operationName: string, operation: () => T): T => {
  const startTime = performance.now();
  
  try {
    const result = operation();
    
    // Si c'est une Promise, mesurer le temps d'exécution de façon asynchrone
    if (result && typeof result === 'object' && 'then' in result) {
      (result as unknown as Promise<any>).then(
        (value) => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          logPerformance(operationName, duration);
          return value;
        },
        (error) => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          logPerformance(operationName, duration, error);
          throw error;
        }
      );
    } else {
      // Opération synchrone
      const endTime = performance.now();
      const duration = endTime - startTime;
      logPerformance(operationName, duration);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    logPerformance(operationName, duration, error);
    throw error;
  }
};

// Fonction pour logger les performances
const logPerformance = (operationName: string, duration: number, error?: any) => {
  const { SLOW_OPERATION, VERY_SLOW_OPERATION } = PERFORMANCE_CONFIG.PERFORMANCE_THRESHOLDS;
  
  let logLevel = 'log';
  let emoji = '⚡';
  
  if (duration > VERY_SLOW_OPERATION) {
    logLevel = 'warn';
    emoji = '🐌';
  } else if (duration > SLOW_OPERATION) {
    logLevel = 'warn';
    emoji = '⚠️';
  }
  
  const message = `${emoji} Performance [${operationName}]: ${duration.toFixed(2)}ms`;
  
  if (error) {
    console.error(`${message} (avec erreur)`, error);
  } else {
    console[logLevel](message);
  }
};

// Fonction de throttling pour limiter la fréquence d'exécution
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Fonction de debouncing pour retarder l'exécution
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Fonction pour mesurer l'utilisation mémoire (si disponible)
export const getMemoryUsage = (): { used: number; total: number } | null => {
  try {
    // @ts-ignore - Les métriques mémoire ne sont pas toujours disponibles
    if (global.performance && global.performance.memory) {
      // @ts-ignore
      const memory = global.performance.memory;
      return {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Fonction pour formater la taille mémoire
export const formatMemorySize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};
