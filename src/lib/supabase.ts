// Single source of truth: re-export from supabaseClient to avoid multiple GoTrueClient instances
export { supabase } from './supabaseClient';

export type UserRole = 'admin' | 'partner_tourism' | 'partner_car' | 'partner_realestate' | 'client';
export type PropertyType = 'apartment' | 'villa' | 'hotel' | 'car' | 'tour';
export interface Profile { [key: string]: any }
export interface Property { [key: string]: any }