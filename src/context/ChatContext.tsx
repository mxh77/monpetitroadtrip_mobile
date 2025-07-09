import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getJwtToken } from '../utils/auth';

interface ChatContextType {
  currentRoadtripId: string | null;
  setCurrentRoadtripId: (id: string | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  isChatVisible: boolean;
  setIsChatVisible: (visible: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [currentRoadtripId, setCurrentRoadtripId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);

  // Charger le token au démarrage
  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await getJwtToken();
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du token:', error);
      }
    };

    loadToken();
  }, []);

  const value: ChatContextType = {
    currentRoadtripId,
    setCurrentRoadtripId,
    token,
    setToken,
    isChatVisible,
    setIsChatVisible,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
