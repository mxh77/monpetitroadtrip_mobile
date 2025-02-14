import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import DayView from './DayView';
import WeekView from './WeekView';
import type { TimetableProps } from './types';

const Timetable: React.FC<TimetableProps> = ({
  events,
  mode = 'day',
  startHour = 8,
  endHour = 18,
  defaultScrollHour = 8,
  slotDuration = 15,
  currentDate = new Date(),
  onEventPress,
  onEventChange,
  ratioWidthEventsMax = 1, // Valeur par défaut de 1 (100%)
  isDraggable = true, // Ajouter la prop isDraggable avec une valeur par défaut
}) => {
  const [currentDateState, setCurrentDateState] = useState(currentDate);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>(mode);

  const goToPreviousDay = () => {
    setCurrentDateState(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setCurrentDateState(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const goToPreviousWeek = () => {
    setCurrentDateState(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentDateState(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.navigationRow}>
        <Button title="Jour" onPress={() => setViewMode('day')} />
        <Button title="Semaine" onPress={() => setViewMode('week')} />
        <Button title="Précédent" onPress={viewMode === 'day' ? goToPreviousDay : goToPreviousWeek} />
        <Text style={styles.header}>{formatDate(currentDateState)}</Text>
        <Button title="Suivant" onPress={viewMode === 'day' ? goToNextDay : goToNextWeek} />
      </View>
      <View style={styles.content}>
        {viewMode === 'day' ? (
          <DayView
            key={currentDateState.toISOString()}  // Utiliser la date comme clé 
            events={events}
            startHour={startHour}
            endHour={endHour}
            slotDuration={slotDuration}
            defaultScrollHour={defaultScrollHour}
            currentDate={currentDateState}
            onEventPress={onEventPress}
            onEventChange={onEventChange}
            ratioWidthEventsMax={ratioWidthEventsMax}
            isDraggable={isDraggable} // Passer la prop isDraggable
          />
        ) : (
          <WeekView
            key={currentDateState.toISOString()}  // Utiliser la date comme clé 
            events={events}
            startHour={startHour}
            endHour={endHour}
            slotDuration={slotDuration}
            defaultScrollHour={defaultScrollHour}
            currentDate={currentDateState}
            onEventPress={onEventPress}
            onEventChange={onEventChange}
            //ratioWidthEventsMax={ratioWidthEventsMax}
            ratioWidthEventsMax={1}
            isDraggable={isDraggable} // Passer la prop isDraggable
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1
  }
});

export default Timetable;