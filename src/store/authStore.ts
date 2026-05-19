import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { getToken, removeToken, setToken } from '@/utils/token';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        setToken(token);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        removeToken();
        set({ user: null, isAuthenticated: false });
      },
      hydrate: () => {
        const token = getToken();
        const user = useAuthStore.getState().user;
        set({ isAuthenticated: !!(token && user) });
      },
    }),
    { name: 'feedbackiq-auth', partialize: (s) => ({ user: s.user }) }
  )
);
