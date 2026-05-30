import React, { useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { EarthquakeEvent, TriangulationResult, StationAnnotation, STATION_COLORS } from '../types';
import { triangulate } from '../utils/triangulation';

interface EpicenterMapProps {
  event: EarthquakeEvent | null;
  annotations: Record<string, StationAnnotation>;
  triangulationResult: TriangulationResult | null;
}

const EpicenterMap: React.FC<EpicenterMapProps> = ({ event, annotations, triangulationResult }) => {
  const result = event ? triangulate(event.stations, annotations) : null;

  const option = useMemo(() => {
    if (!event) return { backgroundColor: '#0f172a' };

    const { stations, epicenter } = event;
    const allX = [...stations.map(s => s.x), epicenter.x];
    const allY = [...stations.map(s => s.y), epicenter.y];
    const minX = Math.min(...allX) - 60;
    const maxX = Math.max(...allX) + 60;
    const minY = Math.min(...allY) - 60;
    const maxY = Math.max(...allY) + 60;

    const stationSeriesData = stations.map((s, idx) => ({
      value: [s.x, s.y],
      name: s.name,
      stationId: s.id,
      itemStyle: {
        color: STATION_COLORS[idx % STATION_COLORS.length]
      }
    }));

    const trueEpicenterData = [{
      value: [epicenter.x, epicenter.y],
      name: 'True Epicenter'
    }];

    const series: any[] = [
      {
        name: 'Stations',
        type: 'scatter',
        data: stationSeriesData,
        symbolSize: (val: any, params: any) => {
          const sId = stations[params.dataIndex]?.id;
          const ann = annotations[sId];
          return ann && ann.pTime !== null && ann.sTime !== null ? 16 : 10;
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'top',
          color: '#94a3b8',
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        },
        z: 20
      },
      {
        name: 'True Epicenter',
        type: 'scatter',
        data: trueEpicenterData,
        symbol: 'diamond',
        symbolSize: 12,
        itemStyle: { color: '#64748b', borderColor: '#94a3b8', borderWidth: 1 },
        label: {
          show: true,
          formatter: '{b}',
          position: 'bottom',
          color: '#64748b',
          fontSize: 9,
          fontFamily: 'JetBrains Mono'
        },
        z: 15
      }
    ];

    if (result) {
      const circles: any[] = [];
      result.stations.forEach((s, idx) => {
        const station = stations.find(st => st.id === s.id);
        if (!station) return;

        const circlePoints: number[][] = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
          const angle = (2 * Math.PI * i) / segments;
          circlePoints.push([
            station.x + s.distance * Math.cos(angle),
            station.y + s.distance * Math.sin(angle)
          ]);
        }

        series.push({
          name: `Distance: ${s.name}`,
          type: 'line',
          data: circlePoints,
          symbol: 'none',
          lineStyle: {
            color: STATION_COLORS[stations.findIndex(st => st.id === s.id) % STATION_COLORS.length],
            width: 1.5,
            type: 'dashed',
            opacity: 0.4
          },
          z: 10
        });
      });

      series.push({
        name: 'Estimated Epicenter',
        type: 'scatter',
        data: [{ value: [result.epicenterX, result.epicenterY], name: 'Est. Epicenter' }],
        symbol: 'pin',
        symbolSize: 28,
        itemStyle: {
          color: '#ef4444',
          borderColor: '#fca5a5',
          borderWidth: 2,
          shadowColor: 'rgba(239, 68, 68, 0.6)',
          shadowBlur: 15
        },
        label: {
          show: true,
          formatter: (params: any) => `${result.lat.toFixed(2)}N, ${result.lon.toFixed(2)}E`,
          position: 'bottom',
          color: '#fca5a5',
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        },
        z: 30
      });

      series.push({
        name: 'Epicenter Effect',
        type: 'effectScatter',
        data: [{ value: [result.epicenterX, result.epicenterY] }],
        symbolSize: 10,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 4,
          period: 3
        },
        itemStyle: { color: '#ef4444' },
        z: 25
      });
    }

    return {
      backgroundColor: '#0f172a',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0', fontSize: 11, fontFamily: 'JetBrains Mono' },
        formatter: (params: any) => {
          if (params.seriesName === 'Stations') {
            const sId = stations[params.dataIndex]?.id;
            const ann = annotations[sId];
            const annotated = ann && ann.pTime !== null && ann.sTime !== null;
            return `<b>${params.name}</b><br/>Pos: (${params.value[0]}, ${params.value[1]}) km<br/>${annotated ? 'Annotated' : 'Not annotated'}`;
          }
          if (params.seriesName === 'Estimated Epicenter') {
            return `<b>Est. Epicenter</b><br/>Pos: (${result!.lat.toFixed(3)}N, ${result!.lon.toFixed(3)}E)<br/>Confidence: ${result!.confidence}%`;
          }
          if (params.seriesName === 'True Epicenter') {
            return `<b>True Epicenter</b><br/>Pos: (${epicenter.x}, ${epicenter.y}) km`;
          }
          return `${params.seriesName}`;
        }
      },
      grid: {
        left: 50,
        right: 20,
        top: 20,
        bottom: 35
      },
      xAxis: {
        type: 'value',
        name: 'X (km)',
        nameLocation: 'center',
        nameGap: 22,
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        min: minX,
        max: maxX,
        axisLine: { lineStyle: { color: '#334155' } },
        axisTick: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
      },
      yAxis: {
        type: 'value',
        name: 'Y (km)',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        min: minY,
        max: maxY,
        axisLine: { lineStyle: { color: '#334155' } },
        axisTick: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
      },
      series
    };
  }, [event, annotations, result]);

  if (!event) {
    return (
      <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center" style={{ height: 400 }}>
        <p className="text-slate-500 text-sm">Select an event to view map</p>
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 400, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default EpicenterMap;
