import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CompressionInfoProps {
  visible?: boolean;
}

const CompressionInfo: React.FC<CompressionInfoProps> = ({ visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Icon name="info" size={16} color="#666" style={styles.icon} />
      <Text style={styles.text}>
        Les images {'>'}4MB seront automatiquement compressées
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
});

export default CompressionInfo;
