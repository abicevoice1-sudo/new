import { useCallback } from 'react';

export const useToast = () => {
  const addToast = useCallback((message, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message, type }
    }));
  }, []);

  return { addToast };
};