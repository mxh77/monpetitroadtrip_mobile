import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  pendingPlanningNavigation: boolean;
  setPendingPlanningNavigation: (pending: boolean) => void;
  clearPendingNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [pendingPlanningNavigation, setPendingPlanningNavigation] = useState(false);

  const clearPendingNavigation = () => {
    setPendingPlanningNavigation(false);
  };

  return (
    <NavigationContext.Provider
      value={{
        pendingPlanningNavigation,
        setPendingPlanningNavigation,
        clearPendingNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
