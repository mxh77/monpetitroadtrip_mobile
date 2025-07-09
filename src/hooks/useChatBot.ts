import { useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';

export const useChatBot = (roadtripId?: string, token?: string) => {
  const { setCurrentRoadtripId, setToken, currentRoadtripId } = useChatContext();

  useEffect(() => {
    if (roadtripId) {
      setCurrentRoadtripId(roadtripId);
    }
  }, [roadtripId, setCurrentRoadtripId]);

  useEffect(() => {
    if (token) {
      setToken(token);
    }
  }, [token, setToken]);

  return {
    currentRoadtripId,
    isChatAvailable: !!roadtripId,
  };
};

export default useChatBot;
