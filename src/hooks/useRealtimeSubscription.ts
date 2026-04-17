import { useEffect, useRef } from 'react';
import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Callback<T extends Record<string, any> = Record<string, any>> = (
  payload: RealtimePostgresChangesPayload<T>
) => void;

interface RealtimeSubscriptionOptions<T extends Record<string, any>> {
  table: string;
  filter?: string;
  callback: Callback<T>;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: 'public' | string;
  enabled?: boolean;
}

export function useRealtimeSubscription<T extends Record<string, any>>({
  table,
  filter,
  callback,
  event = '*',
  schema = 'public',
  enabled = true,
}: RealtimeSubscriptionOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);

  // Mettre à jour la ref du callback pour éviter de recréer la souscription à chaque changement de fonction
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Créer un canal de souscription avec un nom déterministe par table/filtre
    const channelName = `realtime:${schema}:${table}:${filter || 'all'}`;
    
    // Nettoyer l'ancien canal s'il existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase.channel(channelName);
    
    channelRef.current
      .on(
        'postgres_changes' as any,
        { event, schema, table, filter },
        (payload: RealtimePostgresChangesPayload<T>) => {
          callbackRef.current(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error subscribing to ${table}`);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filter, event, schema, enabled]);

  return {
    isActive: !!channelRef.current
  };
}

export default useRealtimeSubscription;
