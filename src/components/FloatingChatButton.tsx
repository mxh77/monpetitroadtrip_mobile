import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ChatBot from './ChatBot';

interface FloatingChatButtonProps {
  roadtripId?: string;
  token?: string;
  visible?: boolean;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  roadtripId,
  token,
  visible = true,
}) => {
  const [chatVisible, setChatVisible] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));

  React.useEffect(() => {
    // Animation de pulsation pour attirer l'attention
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseAnimation]);

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
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: pulseAnimation }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={openChat}
          activeOpacity={0.8}
        >
          <Icon name="smart-toy" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

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

export default FloatingChatButton;
