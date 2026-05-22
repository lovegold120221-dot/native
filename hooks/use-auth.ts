import { create } from 'zustand';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggingIn: boolean;
  needsAuth: boolean;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  init: () => () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoggingIn: false,
  needsAuth: true,
  init: () => {
    const unsubscribe = initAuth(
      (user, token) => {
        set({ user, token, needsAuth: false });
        if (user) {
          supabase.from('profiles').upsert({
            id: user.uid,
            email: user.email,
            display_name: user.displayName,
            photo_url: user.photoURL,
            last_sign_in: new Date().toISOString(),
          }, { onConflict: 'id' }).then(({ error }) => {
            if (error) console.warn(error);
          });
        }
      },
      () => {
        set({ user: null, token: null, needsAuth: true });
      }
    );
    return unsubscribe;
  },
  handleLogin: async () => {
    set({ isLoggingIn: true });
    try {
      const result = await googleSignIn();
      if (result) {
        set({ token: result.accessToken, user: result.user, needsAuth: false });
        supabase.from('profiles').upsert({
          id: result.user.uid,
          email: result.user.email,
          display_name: result.user.displayName,
          photo_url: result.user.photoURL,
          last_sign_in: new Date().toISOString(),
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.warn(error);
        });
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  handleLogout: async () => {
    await logout();
    set({ user: null, token: null, needsAuth: true });
  }
}));
