import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { constitutions } from "@/data/constitutions";
import { getConstitutionName, getConstitutionColor } from "@/data/constitutions";

interface Props {
  scores: Record<string, number>;
  highlighted?: string;
  size?: number;
}

export default function ConstitutionRadarChart({
  scores,
  highlighted,
  size = 320,
}: Props) {
  const data = constitutions.map((c) => ({
    name: c.name,
    id: c.id,
    score: scores[c.id] || 0,
    fullMark: 100,
  }));

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="75%"
        >
          <PolarGrid stroke="#d4c5a9" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="name"
            tick={{
              fill: "#2d5a4a",
              fontSize: 11,
              fontFamily: "'Noto Serif SC', serif",
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#f5f0e6",
              border: "1px solid #c9a962",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${value}分`, "得分"]}
          />
          <Radar
            name="体质得分"
            dataKey="score"
            stroke="#2d5a4a"
            fill="#2d5a4a"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {highlighted && (
            <Radar
              name="高亮"
              dataKey="score"
              stroke="#c9a962"
              fill="#c9a962"
              fillOpacity={0.15}
              strokeWidth={0}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
