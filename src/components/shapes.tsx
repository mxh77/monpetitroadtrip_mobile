import React from 'react';
import { View, StyleSheet } from 'react-native';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Composant TriangleCorner
export const TriangleCorner = ({ style }) => {
  return <View style={[styles.triangleCorner, style]} />;
};

// Composant TriangleCornerTopRight
export const TriangleCornerTopRight = ({ style }) => {
  return (
    <View style={style}>
      <TriangleCorner style={styles.triangleCornerTopRight} />
      <View style={styles.triangleTopRightButtonTextContainer}>
        <Fontawesome5 name="plus" size={20} color="white" />
      </View>
    </View>
  );
};

// Composant TriangleCornerTopLeft
export const TriangleCornerTopLeft = ({ style }) => {
  return (
    <View style={style}>
      <TriangleCorner style={styles.TriangleCornerTopLeft} />
      <View style={styles.triangleTopLeftButtonTextContainer}>
        <Ionicons name="sparkles" size={24} color="gold" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  triangleCorner: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: 50,
    borderTopWidth: 50,
    borderRightColor: 'transparent',
    borderTopColor: 'green', // Changez la couleur selon vos besoins
  },
  TriangleCornerTopLeft: {
    transform: [{ rotate: '0deg' }],
  },
  triangleCornerTopRight: {
    transform: [{ rotate: '90deg' }],
  },
  triangleTopRightButtonTextContainer: {
    position: 'absolute',
    top: -10,
    left: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  triangleTopLeftButtonTextContainer: {
    position: 'absolute',
    top: -10,
    left: -10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
});