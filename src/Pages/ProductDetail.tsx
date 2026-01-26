import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type PartnerProduct = {
  id: string;
  product_type: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  city?: string | null;
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Cette page sert de "pont" : si un jour on route vers /product/:id,
        // on redirige vers la page détail existante (hotels/villas/...).
        const { data, error } = await supabase
          .from('partner_products')
          .select('id, product_type, title, name, description, city')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast.error('Produit introuvable');
          navigate('/');
          return;
        }

        const product = data as PartnerProduct;
        const basePath =
          product.product_type === 'hotel'
            ? '/hotels'
            : product.product_type === 'appartement'
            ? '/appartements'
            : product.product_type === 'villa'
            ? '/villas'
            : product.product_type === 'voiture'
            ? '/voitures'
            : product.product_type === 'circuit'
            ? '/tourisme'
            : null;

        if (!basePath) {
          toast.error('Type de produit non supporté');
          navigate('/');
          return;
        }

        navigate(`${basePath}/${product.id}`, { replace: true });
      } catch (e: any) {
        console.error('[ProductDetail] load error', e);
        toast.error(e?.message || 'Erreur lors du chargement');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-gray-600">{loading ? 'Chargement...' : 'Redirection...'}</div>
    </div>
  );
};

export default ProductDetail;