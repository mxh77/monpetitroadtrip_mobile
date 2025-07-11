import BaseOfflineRepository from './BaseOfflineRepository';

/**
 * Repository pour le chatbot avec support offline-first
 */
class ChatRepository extends BaseOfflineRepository {
  constructor() {
    super('chat', '/api/roadtrips');
  }

  /**
   * Envoyer une requête au chatbot
   */
  async sendChatQuery(roadtripId, query, conversationId = null, token, options = {}) {
    const chatData = {
      query,
      conversationId: conversationId || `conv_${Date.now()}`
    };

    // Le chat doit être en temps réel, pas d'optimisme
    return await this.create(chatData, {
      token,
      endpoint: `/${roadtripId}/chat/query`,
      optimisticUpdate: false,
      ...options
    });
  }

  /**
   * Obtenir toutes les conversations d'un roadtrip
   */
  async getConversations(roadtripId, token, options = {}) {
    return await this.get(`/${roadtripId}/chat/conversations`, {
      token,
      useCache: true,
      cacheTTL: 1 * 60, // 1 minute pour les conversations
      ...options
    });
  }

  /**
   * Obtenir une conversation spécifique
   */
  async getConversation(roadtripId, conversationId, token, options = {}) {
    return await this.get(`/${roadtripId}/chat/conversations/${conversationId}`, {
      token,
      useCache: true,
      cacheTTL: 30, // 30 secondes pour une conversation active
      ...options
    });
  }

  /**
   * Sauvegarder une conversation localement (mode offline)
   */
  async saveChatMessageLocally(roadtripId, conversationId, message) {
    // Utiliser le cache pour stocker les messages offline
    const cacheKey = `chat_${roadtripId}_${conversationId}`;
    
    try {
      // Récupérer la conversation existante
      let conversation = await sqliteDatabase.getCachedData(cacheKey) || {
        id: conversationId,
        roadtripId,
        messages: []
      };

      // Ajouter le nouveau message
      conversation.messages.push({
        ...message,
        id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        isLocal: true
      });

      // Sauvegarder
      await sqliteDatabase.setCachedData(cacheKey, conversation, 24 * 60 * 60); // 24h

      return conversation;
    } catch (error) {
      console.error('❌ Erreur sauvegarde chat local:', error);
      throw error;
    }
  }

  /**
   * Obtenir les messages offline d'une conversation
   */
  async getLocalChatMessages(roadtripId, conversationId) {
    const cacheKey = `chat_${roadtripId}_${conversationId}`;
    
    try {
      const conversation = await sqliteDatabase.getCachedData(cacheKey);
      return conversation ? conversation.messages : [];
    } catch (error) {
      console.error('❌ Erreur récupération chat local:', error);
      return [];
    }
  }

  /**
   * Synchroniser les messages locaux avec le serveur
   */
  async syncLocalMessages(roadtripId, conversationId, token) {
    try {
      const localMessages = await this.getLocalChatMessages(roadtripId, conversationId);
      const userMessages = localMessages.filter(msg => msg.role === 'user' && msg.isLocal);

      for (const message of userMessages) {
        try {
          await this.sendChatQuery(roadtripId, message.content, conversationId, token);
          console.log('✅ Message local synchronisé:', message.content.substring(0, 50));
        } catch (error) {
          console.error('❌ Erreur sync message:', error);
          // Conserver le message pour retry plus tard
        }
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation chat:', error);
    }
  }
}

const chatRepository = new ChatRepository();
export default chatRepository;
