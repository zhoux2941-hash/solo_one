import { locations, LocationConfig } from './locations';
import { styleConfigs, StyleConfig, themes } from './styles';
import { locationImages, ImageConfig, LocationImages } from './images';
import { NianhuaLocation } from '../types';

export type { LocationConfig, StyleConfig, ImageConfig, LocationImages };

export { locations, styleConfigs, locationImages, themes };

export const getNianhuaLocations = (): NianhuaLocation[] => {
  return locations.map((loc) => {
    const style = styleConfigs[loc.id];
    const images = locationImages[loc.id];
    
    return {
      id: loc.id,
      name: loc.name,
      englishName: loc.englishName,
      position: loc.position,
      description: loc.description,
      styleFeatures: style?.styleFeatures || [],
      commonThemes: style?.commonThemes || [],
      representativeWorks: images?.images || []
    };
  });
};

export const getLocationById = (id: string): NianhuaLocation | undefined => {
  const loc = locations.find((l) => l.id === id);
  if (!loc) return undefined;
  
  const style = styleConfigs[id];
  const images = locationImages[id];
  
  return {
    id: loc.id,
    name: loc.name,
    englishName: loc.englishName,
    position: loc.position,
    description: loc.description,
    styleFeatures: style?.styleFeatures || [],
    commonThemes: style?.commonThemes || [],
    representativeWorks: images?.images || []
  };
};
