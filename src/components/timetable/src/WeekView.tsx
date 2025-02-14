import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const { width: DEVICE_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 60;
const HOUR_COLUMN_WIDTH = 60;
const DAYS_IN_WEEK = 7;
const MAX_WIDTH = DEVICE_WIDTH - HOUR_COLUMN_WIDTH - 20;
const MOVE_STEP = 15;
const BOTTOM_MARGIN = 100;
const DAY_COLUMN_WIDTH = MAX_WIDTH / DAYS_IN_WEEK;

const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface EventType {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color?: string;
}

const WeekView = ({ events, startHour, endHour, slotDuration, onEventPress, onEventChange, defaultScrollHour = 0, currentDate, ratioWidthEventsMax = 1, isDraggable = true }) => {
  const scrollViewRef = useRef(null);
  const EVENT_COLUMN_WIDTH = MAX_WIDTH * ratioWidthEventsMax / DAYS_IN_WEEK;

  const startOfWeek = dayjs(currentDate).startOf('week').add(1, 'day'); // Commence lundi
  const endOfWeek = startOfWeek.add(6, 'day'); // Fin de la semaine (dimanche)
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

  // Filtrer les événements pour chaque jour de la semaine
  const filteredEvents = events.map(event => ({
    ...event,
    startTime: dayjs.utc(event.startTime),
    endTime: dayjs.utc(event.endTime),
  })).filter(event =>
    (event.startTime.isSame(startOfWeek, 'week') || event.endTime.isSame(startOfWeek, 'week')) &&
    (event.startTime.isBefore(endOfWeek) && event.endTime.isAfter(startOfWeek))
  );

  const positionedEvents = filteredEvents.map(event => {
    const eventDate = event.startTime;
    const dayIndex = eventDate.day() - 1; // Lundi = 0, Dimanche = 6
    return {
      ...event,
      start: eventDate.hour() * 60 + eventDate.minute(),
      end: event.endTime.hour() * 60 + event.endTime.minute(),
      left: dayIndex * EVENT_COLUMN_WIDTH,
      top: ((eventDate.hour() - startHour) * 60 + eventDate.minute()) * HOUR_HEIGHT / 60,
      height: ((event.endTime.diff(event.startTime, 'minute')) / 60) * HOUR_HEIGHT,
    };
  });

  // Fonction pour gérer le début du glisser-déposer
  const handleGestureEvent = (event: any, eventData: EventType) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      // Début du drag-and-drop
    } else if (event.nativeEvent.state === State.END) {
      // Fin du drag-and-drop
      if (onEventChange) {
        const newStartTime = new Date(eventData.startTime);
        const newEndTime = new Date(eventData.endTime);
        const translationY = event.nativeEvent.translationY;
        const stepHeight = (MOVE_STEP / 60) * HOUR_HEIGHT;
        const steps = Math.round(translationY / stepHeight);
        newStartTime.setMinutes(newStartTime.getMinutes() + steps * MOVE_STEP);
        newEndTime.setMinutes(newEndTime.getMinutes() + steps * MOVE_STEP);
        onEventChange({ ...eventData, startTime: newStartTime, endTime: newEndTime });
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ width: HOUR_COLUMN_WIDTH }} />
        {daysOfWeek.map((day, index) => (
          <View key={index} style={[styles.dayColumn, { width: EVENT_COLUMN_WIDTH }]}>
            <Text style={styles.dayLabel}>{day.format('DD/MM')}</Text>
          </View>
        ))}
      </View>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={{ height: (endHour - startHour) * HOUR_HEIGHT + BOTTOM_MARGIN }}>
        <View style={styles.bodyRow}>
          <View style={{ width: HOUR_COLUMN_WIDTH }}>
            {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourLabel}>{`${hour}:00`}</Text>
              </View>
            ))}
          </View>
          <View style={{ width: MAX_WIDTH, height: (endHour - startHour) * HOUR_HEIGHT + BOTTOM_MARGIN }}>
            {/* Lignes verticales */}
            {Array.from({ length: DAYS_IN_WEEK }).map((_, index) => (
              <View key={index} style={[styles.verticalLine, { left: index * DAY_COLUMN_WIDTH }]} />
            ))}
            {positionedEvents.map(event => {
              const animatedTop = useSharedValue(event.top);

              const animatedStyle = useAnimatedStyle(() => {
                return {
                  top: withSpring(animatedTop.value),
                };
              });

              return (
                <PanGestureHandler
                  key={`${event.id}-${event.startTime.format('YYYY-MM-DD')}`}
                  onGestureEvent={(e) => {
                    if (!isDraggable) return; // Désactiver le drag-and-drop si isDraggable est false
                    const stepHeight = (MOVE_STEP / 60) * HOUR_HEIGHT;
                    const steps = Math.round(e.nativeEvent.translationY / stepHeight);
                    animatedTop.value = event.top + steps * stepHeight;
                  }}
                  onHandlerStateChange={(e) => {
                    if (!isDraggable) return; // Désactiver le drag-and-drop si isDraggable est false
                    handleGestureEvent(e, events.find(e => e.id === event.id)!);
                  }}
                >
                  <Animated.View
                    style={[
                      styles.eventBox,
                      animatedStyle,
                      {
                        height: event.height,
                        width: EVENT_COLUMN_WIDTH - 2,
                        left: event.left,
                        backgroundColor: event.color || '#007AFF',
                      },
                    ]}
                  >
                    <TouchableOpacity onPress={() => onEventPress?.(events.find(e => e.id === event.id)!)}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </PanGestureHandler>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  dayColumn: {
    alignItems: 'center',
    padding: 5,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bodyRow: {
    flexDirection: 'row',
    marginTop: 40, // Ajuster pour laisser de la place aux en-têtes fixes
  },
  hourRow: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
  },
  hourLabel: {
    fontSize: 12,
    color: '#333',
  },
  scrollView: {
    flex: 1,
    marginTop: 40, // Ajuster pour laisser de la place aux en-têtes fixes
  },
  eventBox: {
    position: 'absolute',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ccc', // Couleur de la ligne
  },
});

export default WeekView;