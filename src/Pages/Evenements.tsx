import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiClock } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';



import { useEvenements } from '../hooks/useEvenements';

const Evenements = () => {
  const { events, loading: isLoading } = useEvenements();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    try {
      setIsSubscribing(true);
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: email,
          subscribed_at: new Date().toISOString(),
          source: 'evenements_page'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Cet email est déjà inscrit');
        } else {
          throw error;
        }
      } else {
        toast.success('Merci de votre inscription !');
        setEmail('');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-yellow-100 bg-gradient-to-b from-yellow-100 to-yellow-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-cover bg-center" style={{ backgroundImage: 'url(./assets/events/mrkc.jpg)' }}>
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Événements au Maroc</h1>
            <p className="text-xl md:text-2xl">Découvrez les événements les plus captivants à travers le royaume</p>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Événements à Venir</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vivez des expériences uniques à travers les festivals, concerts et événements culturels du Maroc
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <motion.div
              key={event.id}
              className="bg-yellow-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {event.category}
                  </span>
                  <span className="text-sm text-gray-500">{event.event_date || event.date}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <FiMapPin className="mr-2" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <FiClock className="mr-2" />
                  <span>{event.event_time || event.time}</span>
                </div>
                {/* Appel à l'action : en savoir plus → page Contact */}
                <div className="pt-2">
                  <a
                    href="/contact"
                    className="w-full inline-flex items-center justify-center bg-primary text-black py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    En savoir plus
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="px-15 py-5 bg-black/30 text-primary font-medium rounded-lg hover:bg-yellow-50 transition-colors mx-auto mt-10">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ne manquez aucun événement</h3>
            <p className="text-black/90 mb-8 max-w-2xl mx-auto">
              Inscrivez-vous à notre newsletter pour recevoir les dernières actualités sur les événements à venir au Maroc.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col md:flex-row gap-5 max-w-xl mx-auto">
              <input 
                type="email" 
                placeholder="Votre adresse email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-6 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button 
                type="submit"
                disabled={isSubscribing}
                className="bg-white text-primary px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubscribing ? 'Inscription...' : 'S\'abonner'}
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Evenements;