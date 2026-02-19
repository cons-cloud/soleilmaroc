import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erreur: Variables d\'environnement Supabase manquantes');
  throw new Error('Veuillez configurer les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
}

// Configuration du stockage local personnalisé pour gérer les sessions
export const localStorageAdapter = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Erreur lors de la lecture du stockage local:', error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Erreur lors de l\'écriture dans le stockage local:', error);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Erreur lors de la suppression du stockage local:', error);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: localStorageAdapter,
    storageKey: 'marocsoleil-supabase-token',
    debug: import.meta.env.DEV,
  },
  global: {
    headers: {
      'x-application-name': 'MarocSoleil',
    },
  },
});

// Gestion des erreurs d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Changement d\'état d\'authentification:', event);
  
  if (event === 'SIGNED_OUT') {
    // Nettoyer le stockage local lors de la déconnexion
    localStorage.removeItem('marocsoleil-supabase-token');
    console.log('Utilisateur déconnecté');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Session rafraîchie avec succès');
  } else if (event === 'SIGNED_IN' && session) {
    console.log('Utilisateur connecté:', session.user?.email);
  } else if (event === 'USER_UPDATED') {
    console.log('Utilisateur mis à jour');
  }
});

// Fonction utilitaire pour vérifier si l'utilisateur est admin
export const isUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('Aucun utilisateur connecté ou erreur de récupération:', userError);
      return false;
    }
    
    const { data: userData, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erreur lors de la vérification du rôle admin:', error);
      return false;
    }

    return userData?.role === 'admin';
  } catch (error) {
    console.error('Erreur inattendue dans isUserAdmin:', error);
    return false;
  }
};

// Fonction pour forcer le rafraîchissement de la session
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
      // En cas d'erreur, tenter une déconnexion propre
      if (error.message.includes('Invalid Refresh Token')) {
        console.log('Token de rafraîchissement invalide, déconnexion...');
        await supabase.auth.signOut();
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur inattendue dans refreshSession:', error);
    throw error;
  }
};

// Fonction pour gérer la déconnexion avec nettoyage
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Nettoyage supplémentaire si nécessaire
    localStorage.removeItem('marocsoleil-supabase-token');
    
    // Recharger la page pour un nettoyage complet
    window.location.href = '/';
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw error;
  }
};
