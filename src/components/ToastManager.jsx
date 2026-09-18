import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast.jsx';

export default function ToastManager() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Listen for toast events from anywhere in the app
  useEffect(() => {
    const handleToastEvent = (event) => {
      if (event.detail && event.detail.message) {
        addToast(event.detail.message, event.detail.type || 'info');
      }
    };

    window.addEventListener('show-toast', handleToastEvent);

    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
    };
  }, [addToast]);

  return (
    <div className="toast-manager">
      <AnimatePresence initial={false}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          >
            <p className="toast-message">{toast.message}</p>
          </Toast>
        ))}
      </AnimatePresence>
    </div>
  );
}