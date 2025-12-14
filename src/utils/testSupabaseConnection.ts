import { supabase } from '../lib/supabase';

export async function testSupabaseConnection() {
  try {
    console.log("Test de connexion à Supabase...");
    
    // Tester une requête simple
    const { data, error } = await supabase
      .from('your_table_name')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error("Erreur de connexion à Supabase :", error.message);
    } else {
      console.log("Connexion Supabase réussie, données reçues :", data);
    }
  } catch (error) {
    console.error("Erreur inattendue lors du test de connexion:", error);
  }
}

// Exécuter le test si ce fichier est exécuté directement
if (import.meta.main) {
  testSupabaseConnection();
}
