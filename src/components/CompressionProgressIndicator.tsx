import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, ProgressBar } from 'react-native-paper';
import { useCompression } from '../utils/CompressionContext';

const CompressionProgressIndicator: React.FC = () => {
  const { isCompressing, compressionProgress } = useCompression();

  if (!isCompressing) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isCompressing}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#007BFF" style={styles.spinner} />
          <Text style={styles.title}>Compression des images en cours...</Text>
          <ProgressBar
            progress={compressionProgress}
            color="#007BFF"
            style={styles.progressBar}
          />
          <Text style={styles.subtitle}>
            Les images {'>'}4MB sont automatiquement compressées
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 250,
    maxWidth: 300,
  },
  spinner: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  progressBar: {
    width: '100%',
    height: 8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CompressionProgressIndicator;
