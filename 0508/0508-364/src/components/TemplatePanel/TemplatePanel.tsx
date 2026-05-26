import { useAppStore } from '../../store/useAppStore';
import { templates } from '../../utils/templates';
import { TemplateCard } from './TemplateCard';

export function TemplatePanel() {
  const { selectedTemplate, applyTemplate } = useAppStore();

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">快速模板</h3>
      <div className="space-y-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onClick={() => applyTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  );
}
