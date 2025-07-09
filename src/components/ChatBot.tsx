import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import config from '../config';
import ChatHelpModal from './ChatHelpModal';
import ConnectionTest from './ConnectionTest';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: string;
  jobId?: string;
}

interface ChatBotProps {
  visible: boolean;
  onClose: () => void;
  roadtripId: string;
  token?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ visible, onClose, roadtripId, token }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(`chat_${Date.now()}`);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && roadtripId) {
      loadChatHistory();
    }
  }, [visible, roadtripId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/chat/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversations.length > 0) {
          const lastConversation = data.conversations[0];
          setConversationId(lastConversation.conversationId);
          setMessages(lastConversation.messages.map((msg: any, index: number) => ({
            id: `${msg.timestamp}_${index}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            jobId: msg.jobId,
          })));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageId = `msg_${Date.now()}`;
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          query: currentInput,
          conversationId: conversationId,
        }),
      });

      // Vérifier le statut de la réponse
      if (!response.ok) {
        console.error('Erreur HTTP:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Contenu de l\'erreur:', errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Type de contenu incorrect:', contentType);
        const responseText = await response.text();
        console.error('Contenu de la réponse:', responseText);
        throw new Error('La réponse n\'est pas au format JSON');
      }

      const result = await response.json();

      if (result.success) {
        // Ajouter la réponse immédiate
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: result.message,
          timestamp: new Date().toISOString(),
          jobId: result.jobId,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Suivre le job si nécessaire
        if (result.jobId) {
          setCurrentJobId(result.jobId);
          pollJobStatus(result.jobId);
        }
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'error',
        content: 'Erreur lors du traitement de votre demande. Veuillez réessayer.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/roadtrips/${roadtripId}/chat/jobs/${jobId}/status`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          console.error('Erreur HTTP lors du polling:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Contenu de l\'erreur polling:', errorText);
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Type de contenu incorrect lors du polling:', contentType);
          const responseText = await response.text();
          console.error('Contenu de la réponse polling:', responseText);
          throw new Error('La réponse n\'est pas au format JSON');
        }

        const status = await response.json();
        
        if (status.status === 'completed') {
          const systemMessage: Message = {
            id: `system_${Date.now()}`,
            role: 'system',
            content: status.result.message,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, systemMessage]);
          setCurrentJobId(null);
        } else if (status.status === 'failed') {
          const errorMessage: Message = {
            id: `error_${Date.now()}`,
            role: 'error',
            content: `Erreur: ${status.errorMessage || 'Échec du traitement'}`,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, errorMessage]);
          setCurrentJobId(null);
        } else if (status.status === 'pending' || status.status === 'processing') {
          // Continuer à vérifier
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        setCurrentJobId(null);
      }
    };

    checkStatus();
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isError = message.role === 'error';
    const isSystem = message.role === 'system';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser && styles.userMessageContainer,
          isError && styles.errorMessageContainer,
          isSystem && styles.systemMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser && styles.userMessageBubble,
            isError && styles.errorMessageBubble,
            isSystem && styles.systemMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser && styles.userMessageText,
              isError && styles.errorMessageText,
              isSystem && styles.systemMessageText,
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isUser && styles.userMessageTime,
            ]}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  const clearConversation = () => {
    Alert.alert(
      'Effacer la conversation',
      'Êtes-vous sûr de vouloir effacer cette conversation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            setConversationId(`chat_${Date.now()}`);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#007BFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assistant IA</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setShowConnectionTest(true)} style={styles.testButton}>
              <Icon name="settings" size={24} color="#007BFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowHelpModal(true)} style={styles.helpButton}>
              <Icon name="help" size={24} color="#007BFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearConversation} style={styles.clearButton}>
              <Icon name="delete" size={24} color="#007BFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="smart-toy" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                Bonjour ! Je suis votre assistant IA pour ce roadtrip.
              </Text>
              <Text style={styles.emptySubtext}>
                Vous pouvez me demander d'ajouter des étapes, des activités, ou de vous aider avec votre planning.
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007BFF" />
              <Text style={styles.loadingText}>Traitement en cours...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Tapez votre message..."
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
          >
            <Icon name="send" size={24} color={isLoading ? '#ccc' : '#007BFF'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <ChatHelpModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
      
      <Modal
        visible={showConnectionTest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConnectionTest(false)}
      >
        <View style={styles.connectionTestContainer}>
          <View style={styles.connectionTestHeader}>
            <TouchableOpacity onPress={() => setShowConnectionTest(false)}>
              <Icon name="close" size={24} color="#007BFF" />
            </TouchableOpacity>
            <Text style={styles.connectionTestTitle}>Test de connexion</Text>
            <View style={styles.placeholder} />
          </View>
          <ConnectionTest roadtripId={roadtripId} />
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    padding: 8,
    marginRight: 8,
  },
  helpButton: {
    padding: 8,
    marginRight: 8,
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  errorMessageContainer: {
    alignItems: 'flex-start',
  },
  systemMessageContainer: {
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  userMessageBubble: {
    backgroundColor: '#007BFF',
    borderBottomRightRadius: 4,
  },
  errorMessageBubble: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  systemMessageBubble: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  errorMessageText: {
    color: '#d32f2f',
  },
  systemMessageText: {
    color: '#2e7d32',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  userMessageTime: {
    color: '#e3f2fd',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    marginLeft: 8,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  sendButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  connectionTestContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  connectionTestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  connectionTestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
});

export default ChatBot;
