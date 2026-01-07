// src/Pages/AddProperty.tsx
import PropertyForm from '../components/PropertyForm';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddProperty() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Utilisation directe de supabase.auth.getSession()
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('Erreur de session ou utilisateur non connecté:', error);
          navigate('/login');
          return;
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Ajouter une propriété</h1>
      <PropertyForm 
        type="hotel"
        onClose={() => navigate('/dashboard/partner')}
        onSuccess={() => navigate('/dashboard/partner')}
      />
    </div>
  );
}