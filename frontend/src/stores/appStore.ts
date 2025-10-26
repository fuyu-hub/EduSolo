/**
 * Store principal da aplicação
 * Gerencia estado global como loading, erros, notificações, etc.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

interface AppState {
  // Estado
  isLoading: boolean;
  loadingMessage: string;
  notifications: Notification[];
  sidebarCollapsed: boolean;
  
  // Ações
  setLoading: (isLoading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    // Estado inicial
    isLoading: false,
    loadingMessage: '',
    notifications: [],
    sidebarCollapsed: false,

    // Ações
    setLoading: (isLoading, message = '') => {
      set((state) => {
        state.isLoading = isLoading;
        state.loadingMessage = message;
      });
    },

    addNotification: (notification) => {
      set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
          timestamp: Date.now(),
        };

        state.notifications.push(newNotification);

        // Auto-remover após duração especificada
        if (notification.duration) {
          setTimeout(() => {
            set((state) => {
              state.notifications = state.notifications.filter(
                (n) => n.id !== newNotification.id
              );
            });
          }, notification.duration);
        }
      });
    },

    removeNotification: (id) => {
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== id);
      });
    },

    clearNotifications: () => {
      set((state) => {
        state.notifications = [];
      });
    },

    toggleSidebar: () => {
      set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      });
    },

    setSidebarCollapsed: (collapsed) => {
      set((state) => {
        state.sidebarCollapsed = collapsed;
      });
    },
  }))
);

