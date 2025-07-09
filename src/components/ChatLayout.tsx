import React from 'react';
import { View, StyleSheet } from 'react-native';
import FloatingChatButton from './FloatingChatButton';
import { useChatContext } from '../context/ChatContext';

interface ChatLayoutProps {
  children: React.ReactNode;
  showChatButton?: boolean;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children, showChatButton = true }) => {
  const { currentRoadtripId, token } = useChatContext();

  return (
    <View style={styles.container}>
      {children}
      {showChatButton && (
        <FloatingChatButton
          roadtripId={currentRoadtripId || undefined}
          token={token || undefined}
          visible={!!currentRoadtripId}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

export default ChatLayout;
