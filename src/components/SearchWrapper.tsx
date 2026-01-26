import React from 'react';
import SearchBar from './SearchBar';
import { useSearch } from '../hooks/useSearch';
import { useAuth } from '../contexts/AuthContext';

const SearchWrapper: React.FC<{
  table?: string;
  fields?: string[];
  onlyAvailable?: boolean;
  forPartner?: boolean;
}> = ({ table = 'partner_products', fields = ['title', 'name', 'description', 'city'], onlyAvailable = true, forPartner = false }) => {
  const { user } = useAuth();
  const partnerId = forPartner ? user?.id : undefined;
  const { query, setQuery, results, loading, error } = useSearch('', { table, fields, onlyAvailable, partnerId });

  return (
    <div>
      <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." />
      {loading && <div>Recherche...</div>}
      {error && <div className="text-red-600">Erreur de recherche</div>}
      {results && (
        <ul className="mt-2 space-y-2">
          {results.map((r: any) => (
            <li key={r.id || JSON.stringify(r)} className="p-2 border rounded">
              <div className="font-semibold">{r.title || r.name || 'Sans titre'}</div>
              <div className="text-sm text-gray-600">{r.description || r.city}</div>
            </li>
          ))}
          {results.length === 0 && <li className="text-gray-500">Vous n'avez aucun résultat</li>}
        </ul>
      )}
    </div>
  );
}; 

export default SearchWrapper;