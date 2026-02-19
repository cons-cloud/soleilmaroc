import { useState, useEffect } from 'react';
import { Session, User, Subscription } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface UserProfile {
  id: string;
  role: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authSubscription, setAuthSubscription] = useState<Subscription | null>(null);

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data as UserProfile);
        return data.role === 'admin';
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const loadUserProfile = async (userData: User) => {
    if (!userData) return;
    
    const adminStatus = await checkAdminStatus(userData.id);
    setIsAdmin(adminStatus);
  };

  useEffect(() => {
    // Vérifier la session actuelle
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadUserProfile(currentSession.user);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          await loadUserProfile(newSession.user);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    setAuthSubscription(subscription);

    // Nettoyage de l'abonnement
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    session,
    user,
    profile,
    isAdmin,
    loading,
    signIn,
    signOut,
  };
};

export default useAuth;
