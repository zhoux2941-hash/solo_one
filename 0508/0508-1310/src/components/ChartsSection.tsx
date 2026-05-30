import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useSimulationStore } from '../store/useSimulationStore';
import { COLORS } from '../utils/constants';
import { formatTime } from '../utils/fitting';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsSectionProps {
  className?: string;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ className = '' }) => {
  const { theoreticalData, fittingResult, currentTime } = useSimulationStore();

  const waterHeightChartData = useMemo(() => {
    const labels = theoreticalData.map((d) => d.time);

    const datasets = [
      {
        label: '理论水位 (cm)',
        data: theoreticalData.map((d) => d.waterHeight),
        borderColor: COLORS.water,
        backgroundColor: `${COLORS.water}33`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
    ];

    if (fittingResult) {
      datasets.push({
        label: '校正后水位 (cm)',
        data: fittingResult.correctedTimeScale.map((d) => d.waterHeight),
        borderColor: COLORS.gold,
        backgroundColor: `${COLORS.gold}33`,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 3,
        borderDash: [5, 5],
      } as any);
    }

    return {
      labels,
      datasets,
    };
  }, [theoreticalData, fittingResult]);

  const flowRateChartData = useMemo(() => {
    const labels = theoreticalData.map((d) => d.time);

    return {
      labels,
      datasets: [
        {
          label: '瞬时流量 (cm³/s)',
          data: theoreticalData.map((d) => d.flowRate),
          borderColor: COLORS.secondary,
          backgroundColor: `${COLORS.secondary}33`,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          borderWidth: 3,
        },
      ],
    };
  }, [theoreticalData]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'serif',
            size: 13,
          },
          color: COLORS.text,
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(26, 58, 74, 0.95)',
        titleFont: {
          family: 'serif',
          size: 14,
        },
        bodyFont: {
          family: 'serif',
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        borderColor: COLORS.gold,
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            const time = context[0].label;
            return `时间: ${formatTime(parseFloat(time))}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: `${COLORS.border}33`,
        },
        ticks: {
          font: {
            family: 'serif',
            size: 11,
          },
          color: COLORS.textLight,
          maxTicksLimit: 8,
          callback: function(value: any) {
            return formatTime(parseFloat(this.getLabelForValue(value)));
          },
        },
        title: {
          display: true,
          text: '时间',
          font: {
            family: 'serif',
            size: 13,
            weight: 'bold' as const,
          },
          color: COLORS.primary,
        },
      },
      y: {
        grid: {
          color: `${COLORS.border}33`,
        },
        ticks: {
          font: {
            family: 'serif',
            size: 11,
          },
          color: COLORS.textLight,
        },
      },
    },
  };

  const waterHeightOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: '📈 水位-时间曲线',
        font: {
          family: 'serif',
          size: 18,
          weight: 'bold' as const,
        },
        color: COLORS.primary,
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: '水位高度 (cm)',
          font: {
            family: 'serif',
            size: 13,
            weight: 'bold' as const,
          },
          color: COLORS.primary,
        },
      },
    },
  };

  const flowRateOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: '💧 瞬时流量曲线',
        font: {
          family: 'serif',
          size: 18,
          weight: 'bold' as const,
        },
        color: COLORS.primary,
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: '流量 (cm³/s)',
          font: {
            family: 'serif',
            size: 13,
            weight: 'bold' as const,
          },
          color: COLORS.primary,
        },
      },
    },
  };

  const currentTimeIndicator = useMemo(() => {
    if (currentTime <= 0) return null;

    return (
      <div
        className="absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
        style={{
          left: `${Math.min(
            100,
            (currentTime / (theoreticalData[theoreticalData.length - 1]?.time || 1)) * 100
          )}%`,
          backgroundColor: COLORS.error,
          boxShadow: `0 0 10px ${COLORS.error}`,
        }}
      >
        <div
          className="absolute -top-1 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-bold text-white"
          style={{ backgroundColor: COLORS.error }}
        >
          {formatTime(currentTime)}
        </div>
      </div>
    );
  }, [currentTime, theoreticalData]);

  if (theoreticalData.length === 0) {
    return (
      <div
        className={`p-12 rounded-2xl border-2 text-center ${className}`}
        style={{
          backgroundColor: 'rgba(245, 240, 230, 0.8)',
          borderColor: COLORS.border,
        }}
      >
        <p style={{ color: COLORS.textLight }}>
          点击「开始模拟」按钮生成曲线数据
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div
        className="p-6 rounded-2xl border-2 relative overflow-hidden"
        style={{
          backgroundColor: 'rgba(245, 240, 230, 0.8)',
          borderColor: COLORS.border,
        }}
      >
        {currentTimeIndicator}
        <div className="h-64 md:h-80">
          <Line data={waterHeightChartData} options={waterHeightOptions} />
        </div>
      </div>

      <div
        className="p-6 rounded-2xl border-2 relative overflow-hidden"
        style={{
          backgroundColor: 'rgba(245, 240, 230, 0.8)',
          borderColor: COLORS.border,
        }}
      >
        {currentTimeIndicator}
        <div className="h-64 md:h-80">
          <Line data={flowRateChartData} options={flowRateOptions} />
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
