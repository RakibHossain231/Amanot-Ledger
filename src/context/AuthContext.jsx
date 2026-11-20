import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    return sessionStorage.getItem('amanot_recovery_mode') === 'true';
  });

  // Local Offline PIN lock support
  const [savedPin, setSavedPin] = useState(() => localStorage.getItem('amanot_pin') || null);
  const [isLocked, setIsLocked] = useState(() => Boolean(localStorage.getItem('amanot_pin')));
  const [guestMode, setGuestMode] = useState(() => localStorage.getItem('amanot_guest_mode') === 'true');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        localStorage.setItem('amanot_local_owner', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || 'Owner',
        }));
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        sessionStorage.setItem('amanot_recovery_mode', 'true');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth Operations
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
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
      // In offline mode without Supabase, we transition to OTP screen
      return { requiresVerification: true, email };
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
    return { ...data, requiresVerification: true, email };
  };

  const verifyEmailOtp = async ({ email, token }) => {
    if (!isSupabaseConfigured || !supabase) {
      const localUser = {
        id: 'local-owner',
        email,
        fullName: email.split('@')[0],
      };
      setUser(localUser);
      localStorage.setItem('amanot_local_owner', JSON.stringify(localUser));
      return { success: true };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'signup',
    });
    if (error) throw error;
    if (data?.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return data;
  };

  const resendOtp = async (email) => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
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

  const sendPasswordResetOtp = async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured yet.');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
    return data;
  };

  const verifyPasswordResetOtp = async ({ email, token }) => {
    if (!isSupabaseConfigured || !supabase) {
      setIsPasswordRecovery(true);
      sessionStorage.setItem('amanot_recovery_mode', 'true');
      return { success: true };
    }
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'recovery',
    });
    if (error) throw error;
    setIsPasswordRecovery(true);
    sessionStorage.setItem('amanot_recovery_mode', 'true');
    if (data?.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return data;
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured || !supabase) {
      setIsPasswordRecovery(false);
      sessionStorage.removeItem('amanot_recovery_mode');
      return { success: true };
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    setIsPasswordRecovery(false);
    sessionStorage.removeItem('amanot_recovery_mode');
    return data;
  };

  const cancelPasswordRecovery = () => {
    setIsPasswordRecovery(false);
    sessionStorage.removeItem('amanot_recovery_mode');
  };

  const resetPassword = sendPasswordResetOtp;

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
        verifyEmailOtp,
        resendOtp,
        signOut,
        resetPassword,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        updatePassword,
        setPin,
        removePin,
        unlockWithPin,
        enableGuestMode,
        isPasswordRecovery,
        cancelPasswordRecovery,
        isAuthenticated: Boolean(user) || guestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
