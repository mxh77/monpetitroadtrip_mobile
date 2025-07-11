import React, { useState, useEffect } from 'react';
import { useRepository } from '../hooks/useOffline';

/**
 * Exemple de migration du composant AdvancedPlanning vers le système offline
 * Remplace les appels fetch directs par les repositories
 */
const AdvancedPlanningOfflineExample = ({ roadtripId, token }) => {
  const [events, setEvents] = useState([]);
  
  // Repositories nécessaires
  const { repository: stepRepo } = useRepository('step');
  const { repository: activityRepo } = useRepository('activity');
  const { repository: accommodationRepo } = useRepository('accommodation');

  // Fonction de mise à jour d'un événement (remplace votre logique existante)
  const handleEventChange = async (event, newStartDateTime, newEndDateTime) => {
    try {
      // 🚀 MISE À JOUR OPTIMISTE IMMÉDIATE (comme avant)
      const updatedEvents = events.map(e => 
        e.id === event.id 
          ? { ...e, start: newStartDateTime, end: newEndDateTime }
          : e
      );
      setEvents(updatedEvents);
      console.log(`✅ Mise à jour optimiste de ${event.title} effectuée localement`);

      // 🌐 SYNCHRONISATION EN ARRIÈRE-PLAN avec les repositories
      let result;
      
      if (event.type === 'activity') {
        // Remplace: fetch(`${config.BACKEND_URL}/activities/${event.id}/dates`, ...)
        result = await activityRepo.updateActivityDates(event.id, {
          startDateTime: newStartDateTime,
          endDateTime: newEndDateTime
        }, token);
        
      } else if (event.type === 'accommodation') {
        // Remplace: fetch(`${config.BACKEND_URL}/accommodations/${event.id}`, ...)
        result = await accommodationRepo.updateAccommodationDates(event.id, {
          arrivalDateTime: newStartDateTime,
          departureDateTime: newEndDateTime
        }, token);
        
      } else if (event.type === 'stop' || event.type === 'stage') {
        // Remplace: fetch(`${config.BACKEND_URL}/${apiPath}/${event.stepId}`, ...)
        result = await stepRepo.updateStepDates(event.stepId, {
          arrivalDateTime: newStartDateTime,
          departureDateTime: newEndDateTime
        }, token);
      }

      console.log(`🔄 Synchronisation ${event.type} ${event.id} - Status: ${result ? 'OK' : 'En attente'}`);
      
      // ✨ OPTIMISATION : Plus de refresh global ! L'état local est déjà à jour
      // et la synchronisation se fait en arrière-plan
      
    } catch (error) {
      console.error(`❌ Erreur synchronisation ${event.type}:`, error);
      
      // 🔄 ROLLBACK en cas d'erreur réseau critique
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        console.log('🔄 Rollback des modifications locales');
        // Restaurer l'état précédent
        setEvents(prevEvents => prevEvents.map(e => 
          e.id === event.id 
            ? { ...e, start: event.start, end: event.end }
            : e
        ));
      }
      
      // L'erreur est loggée mais n'impacte pas l'UX
      // La synchronisation sera retentée automatiquement
    }
  };

  // Chargement des événements avec cache
  useEffect(() => {
    const loadEvents = async () => {
      if (!stepRepo || !roadtripId) return;

      try {
        // Utiliser le cache en premier, puis synchroniser en arrière-plan
        const steps = await stepRepo.getStepsByRoadtrip(roadtripId, token, {
          useCache: true,
          forceRefresh: false // Utiliser le cache pour une UX rapide
        });

        // Transformer en événements pour le planning
        const planningEvents = transformStepsToEvents(steps);
        setEvents(planningEvents);

        // Synchronisation silencieuse en arrière-plan
        setTimeout(async () => {
          try {
            const freshSteps = await stepRepo.getStepsByRoadtrip(roadtripId, token, {
              forceRefresh: true
            });
            const freshEvents = transformStepsToEvents(freshSteps);
            setEvents(freshEvents);
          } catch (error) {
            // Erreur silencieuse - on garde les données cachées
            console.log('📦 Utilisation des données en cache');
          }
        }, 1000);

      } catch (error) {
        console.error('❌ Erreur chargement planning:', error);
      }
    };

    loadEvents();
  }, [stepRepo, roadtripId, token]);

  const transformStepsToEvents = (steps) => {
    // Votre logique existante de transformation
    return steps.flatMap(step => {
      const events = [];
      
      // Ajouter les activités
      if (step.activities) {
        events.push(...step.activities.map(activity => ({
          id: activity._id,
          title: activity.name,
          start: activity.startDateTime,
          end: activity.endDateTime,
          type: 'activity',
          stepId: step._id
        })));
      }
      
      // Ajouter les hébergements
      if (step.accommodations) {
        events.push(...step.accommodations.map(accommodation => ({
          id: accommodation._id,
          title: accommodation.name,
          start: accommodation.arrivalDateTime,
          end: accommodation.departureDateTime,
          type: 'accommodation',
          stepId: step._id
        })));
      }
      
      return events;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Votre composant de planning existant */}
      {/* Remplacer onEventChange par handleEventChange */}
      <YourPlanningComponent 
        events={events}
        onEventChange={handleEventChange}
      />
    </View>
  );
};

export default AdvancedPlanningOfflineExample;
