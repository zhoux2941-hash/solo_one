import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { SOLUTION_STATS } from '@/constants';
import { useAppStore } from '@/store/useAppStore';

export function SolutionChart() {
  const { boardSize } = useAppStore();

  const data = SOLUTION_STATS.map((stat) => ({
    ...stat,
    isCurrent: stat.n === boardSize,
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="n"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 10000) return `${(value / 1000).toFixed(0)}k`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              return value;
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number) => [`${value} 个解`, '解数量']}
            labelFormatter={(label) => `${label}×${label} 棋盘`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#colorCount)"
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.isCurrent) {
                return (
                  <circle
                    key={`current-${payload.n}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#6366f1"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }
              return (
                <circle key={`dot-${payload.n}`} cx={cx} cy={cy} r={3} fill="#6366f1" opacity={0.6} />
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
