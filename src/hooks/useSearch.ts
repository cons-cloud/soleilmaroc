import { useEffect, useState, useRef } from 'react';
import { searchTable, SearchOptions } from '../lib/search';

export function useSearch(initialQuery = '', opts: SearchOptions = {}, debounceMs = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!query) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(async () => {
      try {
        const data = await searchTable(query, opts);
        setResults(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [query, JSON.stringify(opts), debounceMs]);

  return { query, setQuery, results, loading, error };
}