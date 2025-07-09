import { AppState } from 'react-native';

class PollingStrategy {
    constructor() {
        this.intervals = new Map(); // Map<roadtripId, intervalId>
        this.frequencies = new Map(); // Map<roadtripId, frequency>
        this.callbacks = new Map(); // Map<roadtripId, callback>
        this.isAppActive = AppState.currentState === 'active';
        
        this.setupAppStateListener();
    }

    /**
     * Démarrer le polling pour un roadtrip
     */
    start(roadtripId, callback, options = {}) {
        const {
            frequency = 3000,      // 3 secondes par défaut
            backgroundFrequency = 30000,  // 30 secondes en arrière-plan
            retryDelay = 5000,     // 5 secondes en cas d'erreur
            maxRetries = 3
        } = options;

        this.stop(roadtripId); // Arrêter l'existant

        // Stocker le callback pour pouvoir le relancer
        this.callbacks.set(roadtripId, callback);

        let retryCount = 0;
        let currentFrequency = frequency;

        const poll = async () => {
            try {
                await callback();
                retryCount = 0; // Reset retry count on success
                
                // Ajuster la fréquence selon l'état de l'app
                currentFrequency = this.isAppActive ? frequency : backgroundFrequency;
                
            } catch (error) {
                console.error(`Erreur polling roadtrip ${roadtripId}:`, error);
                
                // Vérifier si c'est une erreur réseau
                const isNetworkError = error.message?.includes('fetch') || 
                                     error.message?.includes('Network') ||
                                     error.name === 'TypeError';
                
                if (isNetworkError) {
                    console.log('Erreur réseau détectée - retry avec délai augmenté');
                    currentFrequency = retryDelay * 2; // Délai plus long pour les erreurs réseau
                } else {
                    retryCount++;
                    
                    if (retryCount >= maxRetries) {
                        console.warn(`Max retries atteint pour roadtrip ${roadtripId}, arrêt du polling`);
                        this.stop(roadtripId);
                        return;
                    }
                    
                    currentFrequency = retryDelay;
                }
            }
            
            // Programmer le prochain polling
            const intervalId = setTimeout(poll, currentFrequency);
            this.intervals.set(roadtripId, intervalId);
        };

        // Démarrer immédiatement
        poll();
        this.frequencies.set(roadtripId, frequency);
    }

    /**
     * Arrêter le polling pour un roadtrip
     */
    stop(roadtripId) {
        const intervalId = this.intervals.get(roadtripId);
        if (intervalId) {
            clearTimeout(intervalId);
            this.intervals.delete(roadtripId);
            this.frequencies.delete(roadtripId);
            this.callbacks.delete(roadtripId);
        }
    }

    /**
     * Arrêter tous les pollings
     */
    stopAll() {
        this.intervals.forEach((intervalId, roadtripId) => {
            clearTimeout(intervalId);
        });
        this.intervals.clear();
        this.frequencies.clear();
        this.callbacks.clear();
    }

    /**
     * Redémarrer le polling avec une fréquence accélérée temporairement
     */
    boost(roadtripId, boostDuration = 30000) {
        const originalFrequency = this.frequencies.get(roadtripId);
        const callback = this.callbacks.get(roadtripId);
        
        if (!originalFrequency || !callback) return;

        // Arrêter et redémarrer avec une fréquence plus élevée
        this.start(roadtripId, callback, { frequency: 1000 });
        
        // Revenir à la fréquence normale après le boost
        setTimeout(() => {
            this.start(roadtripId, callback, { frequency: originalFrequency });
        }, boostDuration);
    }

    /**
     * Écouter les changements d'état de l'app
     */
    setupAppStateListener() {
        AppState.addEventListener('change', (nextAppState) => {
            this.isAppActive = nextAppState === 'active';
            console.log(`App state: ${nextAppState}`);
            
            // Les intervalles se réajusteront automatiquement au prochain cycle
        });
    }

    /**
     * Nettoyer les listeners
     */
    destroy() {
        this.stopAll();
    }
}

export default PollingStrategy;
