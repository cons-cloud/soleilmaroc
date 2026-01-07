// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { validatePassword } from '../utils/validation';
import { isAdminEmail } from '../config/admins';
import type { Profile } from '../types/auth';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string, 
    password: string, 
    userData: Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>
  ) => Promise<{ 
    data: any; 
    error: Error | null;
    redirectTo: string | null;
  }>;
  signIn: (email: string, password: string) => Promise<{ role: 'admin' | 'partner' | 'client' }>;
  signInWithGoogle: () => Promise<{ role: 'client' }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isAdmin: boolean;
}

const SIGNUP_DELAY_MS = 5000;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Erreur lors du chargement du profil');
      return null;
    }
  };

  const handleAuthStateChange = async (_event: string, newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession?.user) {
      try {
        const profile = await loadProfile(newSession.user.id);
        setProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Erreur lors du chargement du profil');
      }
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      await handleAuthStateChange('INITIAL_SESSION', currentSession);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, SIGNUP_DELAY_MS));
      
      if (!email || !password || !userData.first_name || !userData.last_name) {
        throw new Error('Tous les champs obligatoires doivent être remplis');
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Cette adresse email est déjà utilisée');
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: `${userData.first_name} ${userData.last_name}`.trim(),
            phone: userData.phone || ''
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('Aucun utilisateur créé');

      const profileData: Profile = {
        id: data.user.id,
        email: email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '',
        role: userData.role || 'client',
        is_verified: false,
        country: userData.country || 'Maroc',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        address: userData.address,
        city: userData.city,
        company_name: userData.company_name,
        partner_type: userData.partner_type,
        // Ajoutez d'autres champs nécessaires
      };

      const { error: profileError, data: createdProfile } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Erreur création profil:', profileError);
        throw new Error('Erreur lors de la création du profil. Contactez le support.');
      }

      // Charger le profil créé
      const finalProfile = createdProfile || profileData;
      
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setProfile(finalProfile);
      } else {
        // Même sans session immédiate (si email confirmation requise), on charge le profil
        setUser(data.user);
        setProfile(finalProfile);
      }

      return { 
        data, 
        error: null,
        redirectTo: '/dashboard'
      };

    } catch (error: any) {
      console.error('Erreur inscription:', error);
      const errorMessage = error.message.includes('rate limit') 
        ? 'Trop de tentatives. Réessayez plus tard.' 
        : error.message || 'Erreur lors de l\'inscription';
      
      setError(errorMessage);
      toast.error(errorMessage);
      return { 
        data: null, 
        error: new Error(errorMessage),
        redirectTo: null
      };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Aucun utilisateur trouvé');

      // Vérifier le rôle dans la table profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        if (isAdminEmail(data.user.email)) {
          // Créer un profil admin minimal si pas trouvé
          const adminProfile = {
            id: data.user.id,
            email: data.user.email || '',
            role: 'admin' as const,
            first_name: 'Admin',
            last_name: 'User',
            is_verified: true,
            country: 'Maroc',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone: '',
            address: '',
            city: '',
            company_name: '',
            partner_type: '',
          };

          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(adminProfile, { onConflict: 'id' });

          if (upsertError) {
            console.error('Erreur lors de la création du profil admin:', upsertError);
            throw new Error('Erreur lors de la mise à jour du profil administrateur');
          }

          setProfile(adminProfile);
          setUser(data.user);
          setSession(data.session);

          return { role: 'admin' as const };
        }
        throw new Error(profileError.message || 'Profil utilisateur non trouvé');
      }

      // Mettre à jour les champs manquants si nécessaire
      const updates: Partial<Profile> = {};
      if (!profile.country) updates.country = 'Maroc';
      if (!profile.updated_at) updates.updated_at = new Date().toISOString();

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);
      }

      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      setUser(data.user);
      setSession(data.session);

      // Déterminer le rôle
      if (updatedProfile.role === 'admin') {
        return { role: 'admin' as const };
      } else if (updatedProfile.role === 'partenaire' || updatedProfile.role === 'partner') {
        return { role: 'partner' as const };
      }
      return { role: 'client' as const };

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de la connexion';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (profile && profile.role !== 'client') {
          await supabase.auth.signOut();
          throw new Error('La connexion avec Google est réservée aux comptes clients');
        }
        
        return { role: 'client' as const };
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard/client`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      return { role: 'client' as const };
      
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw new Error('Erreur lors de la connexion avec Google');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setSession(null);
      
      localStorage.removeItem('supabase.auth.token');
      
      console.log('Déconnexion réussie');
      
      return Promise.resolve();
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la déconnexion';
      return Promise.reject(new Error(errorMessage));
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      // Recharger le profil mis à jour
      await loadProfile(user.id);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    isAdmin: user ? isAdminEmail(user.email) : false,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;