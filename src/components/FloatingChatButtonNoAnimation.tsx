import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ChatBot from './ChatBot';

interface FloatingChatButtonProps {
  roadtripId?: string;
  token?: string;
  visible?: boolean;
}

const FloatingChatButtonNoAnimation: React.FC<FloatingChatButtonProps> = ({
  roadtripId,
  token,
  visible = true,
}) => {
  const [chatVisible, setChatVisible] = useState(false);

  // Animation de pulsation DÉSACTIVÉE pour tester les performances

  const openChat = () => {
    if (roadtripId) {
      setChatVisible(true);
    }
  };

  const closeChat = () => {
    setChatVisible(false);
  };

  if (!visible || !roadtripId) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.button}
          onPress={openChat}
          activeOpacity={0.8}
        >
          <Icon name="smart-toy" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ChatBot
        visible={chatVisible}
        onClose={closeChat}
        roadtripId={roadtripId}
        token={token}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default FloatingChatButtonNoAnimation;
