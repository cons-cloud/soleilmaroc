import { supabase } from './supabase';

export type SearchOptions = {
  table?: string;
  fields?: string[]; // colonnes à chercher
  limit?: number;
  partnerId?: string | null;
  onlyAvailable?: boolean;
};

export async function searchTable(q: string, opts: SearchOptions = {}) {
  const table = opts.table || 'partner_products';
  const fields = opts.fields || ['title', 'description'];
  const limit = opts.limit ?? 50;

  const term = (q || '').trim();
  let sb: any = supabase.from(table).select('*').limit(limit);

  if (opts.onlyAvailable) sb = sb.eq('available', true);
  if (opts.partnerId) sb = sb.eq('partner_id', opts.partnerId);

  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/,/g, ' ');
    const clause = fields.map(f => `${f}.ilike.%${esc}%`).join(',');
    sb = sb.or(clause);
  }

  const { data, error } = await sb;
  if (error) throw error;
  return data;
}