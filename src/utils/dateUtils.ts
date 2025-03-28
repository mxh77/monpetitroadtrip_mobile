export const formatDateTimeUTC2Digits = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
};

//Fonction permettant de restituer une date au format JJ/MM/AA
export const formatDateJJMMAA = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

export const formatTimeHHMM = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

//Fonction permettant de restituer un objet Date au format JJ/MM/AA - HH:MM
export const formatDateTimeJJMMAAHHMM = (dateString: string): string => {
  const date = new Date(dateString);
  return `${formatDateJJMMAA(dateString)} - ${formatTimeHHMM(dateString)}`;
};

export const newDateUTC = () => {
  console.log('newDateUTC');
  return new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
    new Date().getUTCHours(),
    new Date().getUTCMinutes(),
    new Date().getUTCSeconds(),
    new Date().getUTCMilliseconds()
  ));
};

export const getTimeFromDate = (date: Date) =>
  `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
//`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

//Fonction permettant de restituer la date (String) d'un objet DateTime sans tenir compte du fuseau horaire
export const getDateUTCFromDateTime = (date: Date) =>
  `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCFullYear()}`;

//Fonction permettant de restituer l'heure (String) d'un objet DateTime sans tenir compte du fuseau horaire
export const getTimeUTCFromDateTime = (date: Date) =>
  `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;


//FOnction permettant de créer un objet Date à partir d'une string au format JJ/MM/AAAA
export const createDateFromJJMMAA = (dateString: string): Date => {
  const dateParts = dateString.split('/');
  return new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
};

//FOnction permettant de créer un objet Date à partir d'une string au format HH:SS
export const createTimeFromHHMM = (timeString: string): Date => {
  const timeParts = timeString.split(':');
  return new Date(0, 0, 0, parseInt(timeParts[0]), parseInt(timeParts[1]));
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${minutes} minutes (${hours}h${remainingMinutes.toString().padStart(2, '0')})`;
};

export const getMinStartDateTime = (step) => {
  const dates = [];

  // Ajouter la date de début du step
  if (step.arrivalDateTime) {
    dates.push(new Date(step.arrivalDateTime));
  }

  // Ajouter les dates de début des accommodations
  if (step.accommodations && step.accommodations.length > 0) {
    step.accommodations.forEach(accommodation => {
      if (accommodation.arrivalDateTime) {
        dates.push(new Date(accommodation.arrivalDateTime));
      }
    });
  }

  // Ajouter les dates de début des activities
  if (step.activities && step.activities.length > 0) {
    step.activities.forEach(activity => {
      if (activity.startDateTime) {
        dates.push(new Date(activity.startDateTime));
      }
    });
  }

  // Trouver la date minimale
  if (dates.length > 0) {
    return new Date(Math.min(...dates));
  }

  return null;
};