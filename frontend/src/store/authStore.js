import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        // Also clear persisted storage directly
        localStorage.removeItem('auth-storage');
      },

      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.accessToken;
      },

      isTokenExpired: () => {
        const token = get().accessToken;
        if (!token) return true;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          // exp is in seconds, Date.now() is in milliseconds
          return payload.exp * 1000 < Date.now();
        } catch {
          return true;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
