import { useState, useRef } from 'react';
import Header from '../components/Header';
import RoleTypeNav from '../components/RoleTypeNav';
import ColorKnowledge from '../components/ColorKnowledge';
import CharacterGallery from '../components/CharacterGallery';
import FaceTemplateSelector from '../components/FaceTemplateSelector';
import MaskCanvas from '../components/MaskCanvas';
import ColorPalette from '../components/ColorPalette';
import PersonalityAnalysis from '../components/PersonalityAnalysis';
import ExportButton from '../components/ExportButton';
import { roleTypes } from '../data/roleTypes';
import { classicCharacters } from '../data/characters';
import { faceTemplates } from '../data/faceTemplates';
import { paletteColors, colorMeanings } from '../data/colorMeanings';
import { RegionColors, ClassicCharacter } from '../types';
import { Clock, BookOpen } from 'lucide-react';

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<string>('warrior');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('square');
  const [selectedColor, setSelectedColor] = useState<string>('#C41E3A');
  const [regionColors, setRegionColors] = useState<RegionColors>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedCharacter, setSelectedCharacter] = useState<ClassicCharacter | null>(null);

  const currentRole = roleTypes.find((r) => r.id === selectedRole);
  const currentTemplate = faceTemplates.find((t) => t.id === selectedTemplate);

  const handleRegionClick = (regionId: string) => {
    setRegionColors((prev) => ({
      ...prev,
      [regionId]: selectedColor,
    }));
  };

  const handleSelectCharacter = (character: ClassicCharacter) => {
    setSelectedRole(character.roleType);
    setSelectedTemplate(character.faceTemplate);
    setRegionColors({ ...character.colorScheme });
    setSelectedCharacter(character);
  };

  const handleReset = () => {
    setRegionColors({});
  };

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `屯堡地戏面具-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <RoleTypeNav
        roleTypes={roleTypes}
        selectedRole={selectedRole}
        onSelectRole={setSelectedRole}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <ColorKnowledge roleType={currentRole} />
            <CharacterGallery
              characters={classicCharacters.filter((c) => c.roleType === selectedRole)}
              faceTemplates={faceTemplates}
              onSelectCharacter={handleSelectCharacter}
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <FaceTemplateSelector
              templates={faceTemplates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
            <MaskCanvas
              template={currentTemplate}
              regionColors={regionColors}
              selectedColor={selectedColor}
              onRegionClick={handleRegionClick}
            />
            {selectedCharacter && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 shadow-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-amber-700" />
                  <h3 className="text-lg font-bold text-amber-900">{selectedCharacter.name}</h3>
                  <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded-full text-xs text-amber-700 font-medium">
                    <Clock className="w-3 h-3" />
                    {selectedCharacter.era}
                  </span>
                </div>
                <p className="text-amber-700 text-sm leading-relaxed">{selectedCharacter.historicalBackground}</p>
              </div>
            )}
            <ExportButton onExport={handleExport} onReset={handleReset} />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <ColorPalette
              colors={paletteColors}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />
            <PersonalityAnalysis
              regionColors={regionColors}
            />
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-amber-200 text-center">
          <p className="text-amber-700">
            🎭 屯堡地戏 · 国家级非物质文化遗产 · 传承六百年大明遗风
          </p>
          <p className="text-amber-600 text-sm mt-2">
            点击面具区域进行填色创作，体验传统面具色彩艺术
          </p>
        </footer>
      </main>
    </div>
  );
}
