export const CITIES = [
  'AGADIR', 'ALHOCEIMA', 'CASABLANCA', 'ESSAOUIRA', 'FES', 'IFRANE', 
  'MARRAKECH', 'MEKNES', 'NADOR', 'OUJDA', 'RABAT', 'TANGER', 'TETOUAN', 'CHEF'
] as const;

export type City = typeof CITIES[number];
export type PropertyType = 'apt1' | 'apt2' | 'villa' | 'hotel';

export const getPropertyImages = (city: string, type: string): string[] => {
  const normalizedCity = city.toUpperCase();
  const cityFolder = normalizedCity === 'MEKNES' ? 'Meknès' : 
                    normalizedCity === 'ESSAOUIRA' ? 'Essaouira' :
                    normalizedCity;
  
  const normalizedType = type.toLowerCase().startsWith('appart') ? 
    type.toLowerCase().replace('appart', 'apt') : 
    type.toLowerCase();
  
  const basePath = `/assets/APT/${cityFolder}/${normalizedType}`;
  return Array.from({ length: 10 }, (_, i) => `${basePath}/${i + 1}.jpg`);
};