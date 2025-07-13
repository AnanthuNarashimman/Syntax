import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import '../Styles/ComponentStyles/CustomAlert.css';

const CustomAlert = ({ 
  type = 'info', 
  message, 
  isVisible, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  const getAlertClass = () => {
    switch (type) {
      case 'success':
        return 'custom-alert success';
      case 'error':
        return 'custom-alert error';
      case 'warning':
        return 'custom-alert warning';
      default:
        return 'custom-alert info';
    }
  };

  return (
    <div className={getAlertClass()}>
      <div className="alert-content">
        <div className="alert-icon">
          {getIcon()}
        </div>
        <div className="alert-message">
          {message}
        </div>
        <button className="alert-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default CustomAlert;
