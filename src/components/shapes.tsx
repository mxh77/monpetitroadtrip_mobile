import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Composant TriangleCorner
export const TriangleCorner = ({ style }) => {
  return <View style={[styles.triangleCorner, style]} />;
};

// Composant TriangleCornerTopRight
export const TriangleCornerTopRight = ({ style, icon = 'plus', iconLib = 'Fontawesome5', iconColor = 'white', iconSize = 20, onPress }) => {
  const IconComponent = iconLib === 'Ionicons' ? Ionicons : Fontawesome5;
  return (
    <View style={style}>
      <TouchableOpacity onPress={onPress} style={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
        <TriangleCorner style={styles.triangleCornerTopRight} />
        <View style={styles.triangleTopRightButtonTextContainer}>
          <IconComponent name={icon} size={iconSize} color={iconColor} />
        </View>
      </TouchableOpacity>
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