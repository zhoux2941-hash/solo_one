import { getConstitutionColor } from "@/data/constitutions";

interface Props {
  constitutionId: string;
  name: string;
  description: string;
  color?: string;
}

export default function ConstitutionCard({
  constitutionId,
  name,
  description,
  color,
}: Props) {
  const bgColor = color || getConstitutionColor(constitutionId);

  return (
    <div
      className="rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default"
      style={{
        backgroundColor: `${bgColor}12`,
        borderColor: `${bgColor}40`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: bgColor }}
        >
          {name[0]}
        </div>
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: bgColor, fontFamily: "'Noto Serif SC', serif" }}
          >
            {name}
          </h3>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
