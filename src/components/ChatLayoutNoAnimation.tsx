import React from 'react';
import { View, StyleSheet } from 'react-native';
import FloatingChatButtonNoAnimation from './FloatingChatButtonNoAnimation';
import { useChatContext } from '../context/ChatContext';

interface ChatLayoutProps {
  children: React.ReactNode;
  showChatButton?: boolean;
}

const ChatLayoutNoAnimation: React.FC<ChatLayoutProps> = ({ children, showChatButton = true }) => {
  const { currentRoadtripId, token } = useChatContext();

  return (
    <View style={styles.container}>
      {children}
      {showChatButton && (
        <FloatingChatButtonNoAnimation
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

export default ChatLayoutNoAnimation;
