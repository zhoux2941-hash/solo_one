import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import type { WeeklySales } from '@/types';
import { formatCurrency, formatNumber } from '@/utils';

interface TrendChartProps {
  data: WeeklySales[];
  type?: 'line' | 'bar';
  showSales?: boolean;
}

interface ChartDataPoint {
  week: string;
  销量: number;
  销售额: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="font-medium text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name === '销量' ? formatNumber(entry.value) + ' 份' : formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  type = 'line',
  showSales = true,
}) => {
  const chartData: ChartDataPoint[] = useMemo(() => {
    return data.map((item) => ({
      week: item.week,
      销量: item.quantity,
      销售额: item.sales,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        暂无趋势数据
      </div>
    );
  }

  const ChartComponent = type === 'line' ? LineChart : BarChart;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
            label={{ value: '销量(份)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
          />
          {showSales && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
              label={{ value: '销售额(元)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#6b7280' } }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            iconType={type === 'line' ? 'line' : 'rect'}
          />
          {type === 'line' ? (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="销量"
                stroke="#1a472a"
                strokeWidth={3}
                dot={{ fill: '#1a472a', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#2f7b4e' }}
                animationDuration={1000}
              />
              {showSales && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="销售额"
                  stroke="#d4af37"
                  strokeWidth={3}
                  dot={{ fill: '#d4af37', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#e4a83f' }}
                  animationDuration={1000}
                />
              )}
            </>
          ) : (
            <>
              <Bar
                yAxisId="left"
                dataKey="销量"
                fill="#1a472a"
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
              />
              {showSales && (
                <Bar
                  yAxisId="right"
                  dataKey="销售额"
                  fill="#d4af37"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                />
              )}
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};
