import React from "react";

interface Props {
  className?: string;
  type: 'hotel' | 'apartment' | 'villa' | 'car' | 'tour';
}

/**
 * Placeholder léger pour PropertiesManagement.
 * Remplace le contenu par ton UI/CRUD réel plus tard.
 */
const PropertiesManagement: React.FC<Props> = ({ className, type }) => {
  const typeLabels = {
    hotel: 'Hôtels',
    apartment: 'Appartements',
    villa: 'Villas',
    car: 'Voitures de location',
    tour: 'Circuits touristiques'
  };

  return (
    <div className={className ?? ""}>
      <h2 className="text-xl font-semibold mb-2">Gestion des {typeLabels[type] || 'propriétés'}</h2>
      <p className="text-sm text-gray-600">
        Gestion des {typeLabels[type].toLowerCase()} - liste, création et édition.
      </p>
      {/* Add your property management UI here */}
    </div>
  );
};

export default PropertiesManagement;