// Auto-generated types from Supabase

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at?: string;
          username: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          role?: string;
        };
        Insert: {
          id: string;
          updated_at?: string;
          username: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          role?: string;
        };
        Update: {
          id?: string;
          updated_at?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          role?: string;
        };
      };
      services: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string;
          price: number;
          location: string;
          category: string;
          images: string[];
          user_id: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description: string;
          price: number;
          location: string;
          category: string;
          images: string[];
          user_id: string;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string;
          price?: number;
          location?: string;
          category?: string;
          images?: string[];
          user_id?: string;
          status?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          created_at: string;
          start_date: string;
          end_date: string;
          user_id: string;
          service_id: string;
          status: string;
          total_price: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          start_date: string;
          end_date: string;
          user_id: string;
          service_id: string;
          status?: string;
          total_price: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          start_date?: string;
          end_date?: string;
          user_id?: string;
          service_id?: string;
          status?: string;
          total_price?: number;
        };
      };
    };
    Views: {
      // Define views here if needed
    };
    Functions: {
      // Define functions here if needed
    };
    Enums: {
      // Define enums here if needed
    };
  };
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];