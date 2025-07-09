import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import config from '../config';

interface ConnectionTestProps {
  roadtripId: string;
}

const ConnectionTest: React.FC<ConnectionTestProps> = ({ roadtripId }) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testBackendConnection = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearResults();
    
    addResult('🔄 Démarrage des tests de connexion...');
    
    // Test 1: Configuration
    addResult(`📋 Configuration Backend URL: ${config.BACKEND_URL}`);
    addResult(`📋 RoadTrip ID: ${roadtripId}`);
    
    // Test 2: Ping simple
    try {
      addResult('🌐 Test de ping simple...');
      const pingResponse = await fetch(`${config.BACKEND_URL}/api/ping`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (pingResponse.ok) {
        addResult('✅ Ping réussi - Serveur accessible');
      } else {
        addResult(`❌ Ping échoué - Status: ${pingResponse.status}`);
      }
    } catch (error) {
      addResult(`❌ Ping échoué - Erreur: ${error.message}`);
    }
    
    // Test 3: Test de l'endpoint roadtrip
    try {
      addResult('🗺️ Test endpoint roadtrip...');
      const roadtripResponse = await fetch(`${config.BACKEND_URL}/api/roadtrips/${roadtripId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (roadtripResponse.ok) {
        addResult('✅ Endpoint roadtrip accessible');
      } else {
        addResult(`❌ Endpoint roadtrip échoué - Status: ${roadtripResponse.status}`);
        const errorText = await roadtripResponse.text();
        addResult(`❌ Contenu: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      addResult(`❌ Endpoint roadtrip échoué - Erreur: ${error.message}`);
    }
    
    // Test 4: Test de l'endpoint chat
    try {
      addResult('🤖 Test endpoint chat...');
      const chatResponse = await fetch(`${config.BACKEND_URL}/api/roadtrips/${roadtripId}/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Test de connexion',
          conversationId: 'test_connection',
        }),
      });
      
      const contentType = chatResponse.headers.get('content-type');
      addResult(`📋 Content-Type: ${contentType}`);
      
      if (chatResponse.ok) {
        try {
          const result = await chatResponse.json();
          addResult('✅ Endpoint chat accessible et retourne du JSON');
          addResult(`📋 Réponse: ${JSON.stringify(result, null, 2)}`);
        } catch (parseError) {
          addResult('❌ Endpoint chat accessible mais ne retourne pas de JSON valide');
          const responseText = await chatResponse.text();
          addResult(`❌ Contenu: ${responseText.substring(0, 200)}...`);
        }
      } else {
        addResult(`❌ Endpoint chat échoué - Status: ${chatResponse.status}`);
        const errorText = await chatResponse.text();
        addResult(`❌ Contenu: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      addResult(`❌ Endpoint chat échoué - Erreur: ${error.message}`);
    }
    
    // Test 5: Test des conversations
    try {
      addResult('📝 Test endpoint conversations...');
      const conversationResponse = await fetch(`${config.BACKEND_URL}/api/roadtrips/${roadtripId}/chat/conversations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (conversationResponse.ok) {
        const conversations = await conversationResponse.json();
        addResult('✅ Endpoint conversations accessible');
        addResult(`📋 Nombre de conversations: ${conversations.conversations?.length || 0}`);
      } else {
        addResult(`❌ Endpoint conversations échoué - Status: ${conversationResponse.status}`);
      }
    } catch (error) {
      addResult(`❌ Endpoint conversations échoué - Erreur: ${error.message}`);
    }
    
    addResult('🎯 Tests terminés');
    setIsRunning(false);
  };

  const showAlert = () => {
    Alert.alert(
      'Test de connexion',
      'Ce test vérifie la connexion avec le backend du chatbot.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Test de connexion Backend</Text>
        <TouchableOpacity onPress={showAlert}>
          <Icon name="help" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={testBackendConnection}
          disabled={isRunning}
        >
          <Icon name="play-arrow" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {isRunning ? 'Test en cours...' : 'Lancer le test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Icon name="clear" size={20} color="#666" />
          <Text style={styles.clearButtonText}>Effacer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buttons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 8,
  },
  results: {
    flex: 1,
    padding: 16,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default ConnectionTest;
