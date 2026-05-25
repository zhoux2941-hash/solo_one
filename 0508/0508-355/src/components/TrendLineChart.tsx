import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import { constitutions } from "@/data/constitutions";
import type { AssessmentRecord } from "@/store/useAssessmentStore";

interface Props {
  assessments: AssessmentRecord[];
  visibleConstitutions: Set<string>;
}

export default function TrendLineChart({
  assessments,
  visibleConstitutions,
}: Props) {
  const { chartData, domain, ticks } = useMemo(() => {
    const sorted = [...assessments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const timestamps = sorted.map((a) => new Date(a.date).getTime());
    const minTime = timestamps[0];
    const maxTime = timestamps[timestamps.length - 1];
    const padding = (maxTime - minTime) * 0.08 || 86400000;

    const allData = sorted.flatMap((record) => {
      const timestamp = new Date(record.date).getTime();
      return constitutions.map((c) => ({
        date: timestamp,
        dateLabel: new Date(record.date).toLocaleDateString("zh-CN", {
          month: "short",
          day: "numeric",
        }),
        fullDateLabel: new Date(record.date).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        constitutionId: c.id,
        constitutionName: c.name,
        score: record.scores[c.id] || 0,
      }));
    });

    const tickCount = Math.min(sorted.length, 6);
    const tickTimestamps: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      const index = Math.floor((sorted.length - 1) * (i / (tickCount - 1 || 1)));
      tickTimestamps.push(new Date(sorted[index].date).getTime());
    }

    return {
      chartData: allData,
      domain: [minTime - padding, maxTime + padding] as [number, number],
      ticks: tickTimestamps,
    };
  }, [assessments]);

  const formatXAxis = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: "#f5f0e6",
            border: "1px solid #c9a962",
            fontSize: "12px",
          }}
        >
          <p className="font-bold text-[#2d5a4a] mb-1">{data.fullDateLabel}</p>
          <p style={{ color: data.color }}>
            {data.constitutionName}: {data.score} 分
          </p>
        </div>
      );
    }
    return null;
  };

  if (assessments.length < 2) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-gray-500">
        至少需要2条测评记录才能显示趋势图
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5dcc8" />
          <XAxis
            type="number"
            dataKey="date"
            domain={domain}
            ticks={ticks}
            tickFormatter={formatXAxis}
            tick={{ fill: "#2d5a4a", fontSize: 11 }}
            label={{
              value: "测评日期",
              position: "insideBottom",
              offset: -10,
              fill: "#6b8e9e",
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="score"
            domain={[0, 100]}
            tick={{ fill: "#2d5a4a", fontSize: 12 }}
            label={{
              value: "体质得分",
              angle: -90,
              position: "insideLeft",
              fill: "#6b8e9e",
              fontSize: 12,
            }}
          />
          <ZAxis type="number" range={[60, 60]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {constitutions.map((c) => (
            <Scatter
              key={c.id}
              name={c.name}
              data={chartData.filter(
                (d) => d.constitutionId === c.id
              )}
              fill={c.color}
              stroke={c.color}
              strokeWidth={visibleConstitutions.has(c.id) ? 2 : 1}
              line={{
                stroke: c.color,
                strokeWidth: visibleConstitutions.has(c.id) ? 2.5 : 1,
                strokeDasharray: visibleConstitutions.has(c.id) ? "0" : "4 4",
                type: "monotone",
              }}
              lineType="joint"
              hide={!visibleConstitutions.has(c.id)}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
