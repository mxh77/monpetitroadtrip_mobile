import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useChatContext } from '../context/ChatContext';

interface QuickChatButtonProps {
  roadtripId: string;
  style?: any;
  size?: number;
  color?: string;
}

/**
 * Bouton rapide pour ouvrir le chatbot
 * Alternative au bouton flottant pour les écrans qui ont déjà des boutons
 */
const QuickChatButton: React.FC<QuickChatButtonProps> = ({
  roadtripId,
  style,
  size = 24,
  color = '#007BFF'
}) => {
  const { setCurrentRoadtripId, setIsChatVisible } = useChatContext();

  const handlePress = () => {
    setCurrentRoadtripId(roadtripId);
    setIsChatVisible(true);
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Icon name="smart-toy" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuickChatButton;
