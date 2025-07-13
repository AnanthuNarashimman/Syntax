import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../Components/CustomAlert';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    isVisible: false,
    message: '',
    type: 'info',
    duration: 5000
  });

  const showAlert = useCallback((message, type = 'info', duration = 5000) => {
    setAlert({
      isVisible: true,
      message,
      type,
      duration
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const showSuccess = useCallback((message, duration = 5000) => {
    showAlert(message, 'success', duration);
  }, [showAlert]);

  const showError = useCallback((message, duration = 5000) => {
    showAlert(message, 'error', duration);
  }, [showAlert]);

  const showWarning = useCallback((message, duration = 5000) => {
    showAlert(message, 'warning', duration);
  }, [showAlert]);

  const value = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    hideAlert,
    alert
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <CustomAlert
        type={alert.type}
        message={alert.message}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        duration={alert.duration}
      />
    </AlertContext.Provider>
  );
}; 