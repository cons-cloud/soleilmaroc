interface CircuitTouristique {
  id: string;
  titre: string;
  description?: string;
  duree?: string;
  prix?: number;
  difficulte?: string;
  ville_depart?: string;
  points_forts?: string[];
  images?: string[];
  available: boolean;
  en_vedette?: boolean;
  created_at: string;
  updated_at: string;
}