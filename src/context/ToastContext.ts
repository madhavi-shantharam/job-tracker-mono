import { createContext, useContext } from 'react';
import type { ToastType } from '../components/Toast';

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export const useToastContext = () => useContext(ToastContext);