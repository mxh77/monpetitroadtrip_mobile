import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Timetable from '../components/timetable/src/index';
import { openInGoogleMaps } from '../utils/utils';

const Planning = ({ step, handleEventChange }) => {
    const events = [
        ...(step.type === 'Stage' ? step.accommodations.map(accommodation => ({
            id: accommodation._id,
            title: accommodation.name,
            startTime: new Date(accommodation.arrivalDateTime),
            endTime: new Date(accommodation.departureDateTime),
            location: accommodation.address,
            color: 'green',
            type: 'accommodation',
        })) : []),
        ...(step.type === 'Stage' ? step.activities.map(activity => ({
            id: activity._id,
            title: activity.name,
            startTime: new Date(activity.startDateTime),
            endTime: new Date(activity.endDateTime),
            location: activity.address,
            color: 'orange',
            type: 'activity',
        })) : []),
        ...(step.type === 'Stop' ? [{
            id: step._id,
            title: step.name,
            startTime: new Date(step.arrivalDateTime),
            endTime: new Date(step.departureDateTime),
            location: step.address,
            color: 'blue',
            type: 'stop',
        }] : [])
    ];

    console.log("Events", events);

    if (events.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <Text>Aucun événement disponible.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Timetable
                events={events}
                mode="day"
                startHour={0}
                endHour={24}
                defaultScrollHour={10}
                currentDate={events[0].startTime}
                onEventChange={handleEventChange}
                ratioWidthEventsMax={0.9}
                isDraggable={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        padding: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Planning;