import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Local Offline PIN lock support
  const [savedPin, setSavedPin] = useState(() => localStorage.getItem('amanot_pin') || null);
  const [isLocked, setIsLocked] = useState(() => Boolean(localStorage.getItem('amanot_pin')));
  const [guestMode, setGuestMode] = useState(() => localStorage.getItem('amanot_guest_mode') === 'true');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // In offline / standalone mode, check if we have a cached local user profile
      const localOwner = localStorage.getItem('amanot_local_owner');
      if (localOwner) {
        setUser(JSON.parse(localOwner));
      }
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        localStorage.setItem('amanot_local_owner', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || 'Owner',
        }));
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        localStorage.setItem('amanot_local_owner', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || 'Owner',
        }));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth Operations
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      // Standalone local offline login
      const localUser = {
        id: 'local-owner',
        email,
        fullName: email.split('@')[0],
      };
      setUser(localUser);
      localStorage.setItem('amanot_local_owner', JSON.stringify(localUser));
      return { success: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, fullName) => {
    if (!isSupabaseConfigured || !supabase) {
      const localUser = {
        id: 'local-owner',
        email,
        fullName: fullName || email.split('@')[0],
      };
      setUser(localUser);
      localStorage.setItem('amanot_local_owner', JSON.stringify(localUser));
      return { success: true };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem('amanot_local_owner');
    localStorage.removeItem('amanot_guest_mode');
    setGuestMode(false);
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured yet.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  // PIN Operations
  const setPin = (newPin) => {
    localStorage.setItem('amanot_pin', newPin);
    setSavedPin(newPin);
  };

  const removePin = () => {
    localStorage.removeItem('amanot_pin');
    setSavedPin(null);
    setIsLocked(false);
  };

  const unlockWithPin = (enteredPin) => {
    if (enteredPin === savedPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const enableGuestMode = () => {
    setGuestMode(true);
    localStorage.setItem('amanot_guest_mode', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isLocked,
        savedPin,
        guestMode,
        signIn,
        signUp,
        signOut,
        resetPassword,
        setPin,
        removePin,
        unlockWithPin,
        enableGuestMode,
        isAuthenticated: Boolean(user) || guestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
