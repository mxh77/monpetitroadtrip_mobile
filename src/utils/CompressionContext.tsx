import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CompressionContextType {
  isCompressing: boolean;
  compressionProgress: number;
  setCompressionState: (isCompressing: boolean, progress?: number) => void;
}

const CompressionContext = createContext<CompressionContextType | undefined>(undefined);

interface CompressionProviderProps {
  children: ReactNode;
}

export const CompressionProvider: React.FC<CompressionProviderProps> = ({ children }) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  const setCompressionState = (isCompressing: boolean, progress: number = 0) => {
    setIsCompressing(isCompressing);
    setCompressionProgress(progress);
  };

  return (
    <CompressionContext.Provider value={{
      isCompressing,
      compressionProgress,
      setCompressionState,
    }}>
      {children}
    </CompressionContext.Provider>
  );
};

export const useCompression = (): CompressionContextType => {
  const context = useContext(CompressionContext);
  if (context === undefined) {
    throw new Error('useCompression must be used within a CompressionProvider');
  }
  return context;
};
