import { FaceTemplate } from '../types';
import { Layers } from 'lucide-react';

interface FaceTemplateSelectorProps {
  templates: FaceTemplate[];
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

const FaceTemplateSelector = ({ templates, selectedTemplate, onSelectTemplate }: FaceTemplateSelectorProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-200">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-6 h-6 text-amber-700" />
        <h3 className="text-xl font-bold text-amber-900">脸型模板</h3>
      </div>
      <div className="flex gap-4 justify-center">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${
              selectedTemplate === template.id
                ? 'bg-amber-100 border-2 border-amber-500 shadow-lg scale-105'
                : 'bg-amber-50 border-2 border-transparent hover:border-amber-300 hover:shadow-md'
            }`}
          >
            <div
              className="w-20 h-24 bg-white rounded-lg shadow-inner mb-2"
              dangerouslySetInnerHTML={{ __html: template.svg }}
            />
            <span className="font-medium text-amber-800">{template.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FaceTemplateSelector;
