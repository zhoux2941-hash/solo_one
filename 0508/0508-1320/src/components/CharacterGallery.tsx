import { ClassicCharacter, FaceTemplate } from '../types';
import { User, Clock } from 'lucide-react';

interface CharacterGalleryProps {
  characters: ClassicCharacter[];
  faceTemplates: FaceTemplate[];
  onSelectCharacter: (character: ClassicCharacter) => void;
}

const CharacterGallery = ({ characters, faceTemplates, onSelectCharacter }: CharacterGalleryProps) => {
  const getFaceTemplate = (templateId: string) => {
    return faceTemplates.find(t => t.id === templateId);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-200">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-6 h-6 text-amber-700" />
        <h3 className="text-xl font-bold text-amber-900">经典角色</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
        {characters.map((character) => {
          const template = getFaceTemplate(character.faceTemplate);
          return (
            <button
              key={character.id}
              onClick={() => onSelectCharacter(character)}
              className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border-2 border-amber-200 hover:border-amber-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
            >
              <div className="flex flex-col items-center">
                <div
                  className="w-16 h-20 rounded-lg overflow-hidden mb-2 bg-white shadow-inner"
                  dangerouslySetInnerHTML={{
                    __html: template?.svg || ''
                  }}
                />
                <h4 className="font-semibold text-amber-900 text-sm">{character.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-amber-500 font-medium">{character.era}</span>
                </div>
                <p className="text-xs text-amber-600 text-center mt-1 line-clamp-2">
                  {character.description}
                </p>
              </div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterGallery;
