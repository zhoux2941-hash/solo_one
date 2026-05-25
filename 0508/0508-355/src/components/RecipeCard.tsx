import { Utensils } from "lucide-react";
import type { Recipe } from "@/data/constitutions";

interface Props {
  recipe: Recipe;
  color: string;
  isMain?: boolean;
}

export default function RecipeCard({ recipe, color, isMain = false }: Props) {
  return (
    <div
      className={`rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        isMain ? "shadow-md" : ""
      }`}
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}40`,
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Utensils className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4
            className="text-lg font-bold"
            style={{
              color: color,
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            {recipe.name}
          </h4>
          <p className="text-sm text-gray-600">{recipe.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 flex-shrink-0 mt-0.5">
            食材：
          </span>
          <span className="text-sm text-gray-600">{recipe.ingredients}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 flex-shrink-0 mt-0.5">
            功效：
          </span>
          <span className="text-sm text-gray-600">{recipe.effect}</span>
        </div>
      </div>
    </div>
  );
}
