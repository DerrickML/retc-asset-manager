"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

// Toast types
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

// Toast component
export function Toast({
  id,
  type = TOAST_TYPES.INFO,
  title,
  message,
  duration = 5000,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.(id);
    }, 300); // Wait for animation to complete
  };

  const getToastStyles = () => {
    const baseStyles =
      "relative flex items-start p-4 rounded-lg shadow-lg border transition-all duration-300 transform";

    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case TOAST_TYPES.ERROR:
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case TOAST_TYPES.WARNING:
        return `${baseStyles} bg-orange-50 border-orange-200 text-orange-800`;
      case TOAST_TYPES.INFO:
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  const getIcon = () => {
    const iconClass = "h-5 w-5 flex-shrink-0";

    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case TOAST_TYPES.ERROR:
        return <AlertCircle className={`${iconClass} text-red-600`} />;
      case TOAST_TYPES.WARNING:
        return <AlertTriangle className={`${iconClass} text-orange-600`} />;
      case TOAST_TYPES.INFO:
        return <Info className={`${iconClass} text-blue-600`} />;
      default:
        return <Info className={`${iconClass} text-gray-600`} />;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`${getToastStyles()} ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="ml-3 flex-1">
        {title && <h3 className="text-sm font-semibold mb-1">{title}</h3>}
        <p className="text-sm">{message}</p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleClose}
          className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Toast container component
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onRemove} />
      ))}
    </div>
  );
}

// Toast hook for easy usage
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      type: TOAST_TYPES.INFO,
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.SUCCESS,
      message,
      ...options,
    });
  };

  const error = (message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.ERROR,
      message,
      duration: 7000, // Longer duration for errors
      ...options,
    });
  };

  const warning = (message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.WARNING,
      message,
      ...options,
    });
  };

  const info = (message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.INFO,
      message,
      ...options,
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
