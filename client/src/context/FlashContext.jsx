import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FlashContext = createContext(null);

export function FlashProvider({ children }) {
  const [flash, setFlash] = useState(null); // { type: 'success' | 'error', message: string }

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => {
      setFlash(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [flash]);

  const showSuccess = useCallback((message) => {
    setFlash({ type: 'success', message });
  }, []);

  const showError = useCallback((message) => {
    setFlash({ type: 'error', message });
  }, []);

  const clearFlash = useCallback(() => {
    setFlash(null);
  }, []);

  return (
    <FlashContext.Provider value={{ flash, showSuccess, showError, clearFlash }}>
      {children}
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const context = useContext(FlashContext);
  if (!context) {
    throw new Error('useFlash must be used within a FlashProvider');
  }
  return context;
}
