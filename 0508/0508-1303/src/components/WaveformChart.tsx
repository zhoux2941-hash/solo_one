import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { ComponentType, COMPONENT_LABELS, COMPONENT_COLORS, STATION_COLORS } from '../types';
import { useSeismicStore } from '../store/useSeismicStore';
import { CONNECT_GROUP } from './EChartsConnect';

interface WaveformChartProps {
  componentType: ComponentType;
}

const WaveformChart: React.FC<WaveformChartProps> = ({ componentType }) => {
  const chartRef = useRef<ReactECharts>(null);
  const {
    selectedEvent,
    selectedStationId,
    stationAnnotations,
    filteredStationData,
    annotationMode
  } = useSeismicStore();

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) {
      chart.group = CONNECT_GROUP;
    }
  }, []);

  const stationIdx = selectedEvent?.stations.findIndex(s => s.id === selectedStationId) || 0;
  const stationColor = STATION_COLORS[stationIdx % STATION_COLORS.length];
  const waveformColor = COMPONENT_COLORS[componentType];
  const label = COMPONENT_LABELS[componentType];

  const data = filteredStationData?.[componentType] || [];
  const sampleRate = selectedEvent?.waveforms.find(w => w.stationId === selectedStationId)?.sampleRate || 50;
  const duration = selectedEvent?.waveforms.find(w => w.stationId === selectedStationId)?.duration || 60;
  const currentAnnotation = stationAnnotations[selectedStationId || ''] || { pTime: null, sTime: null };
  const stationName = selectedEvent?.stations.find(s => s.id === selectedStationId)?.name || 'N/A';

  const seriesData = useMemo(() => {
    if (data.length === 0) return [];
    const step = 1 / sampleRate;
    return data.map((val, idx) => [idx * step, val]);
  }, [data, sampleRate]);

  const markLines = useMemo(() => {
    const lines: any[] = [];
    if (currentAnnotation.pTime !== null) {
      lines.push({
        name: 'P',
        xAxis: currentAnnotation.pTime,
        lineStyle: { color: '#f97316', width: 2, type: 'solid' },
        label: {
          formatter: 'P',
          position: 'insideStartTop',
          color: '#f97316',
          fontWeight: 'bold',
          fontSize: 14,
          fontFamily: 'JetBrains Mono'
        }
      });
    }
    if (currentAnnotation.sTime !== null) {
      lines.push({
        name: 'S',
        xAxis: currentAnnotation.sTime,
        lineStyle: { color: '#ef4444', width: 2, type: 'solid' },
        label: {
          formatter: 'S',
          position: 'insideStartTop',
          color: '#ef4444',
          fontWeight: 'bold',
          fontSize: 14,
          fontFamily: 'JetBrains Mono'
        }
      });
    }
    return lines;
  }, [currentAnnotation.pTime, currentAnnotation.sTime]);

  const option = useMemo(() => ({
    animation: false,
    backgroundColor: '#0f172a',
    grid: {
      left: 55,
      right: 20,
      top: 35,
      bottom: 30
    },
    title: {
      text: `${stationName} | ${label}`,
      left: 10,
      top: 6,
      textStyle: {
        color: waveformColor,
        fontSize: 12,
        fontFamily: 'JetBrains Mono'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 11, fontFamily: 'JetBrains Mono' },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        return `t: ${p.data[0].toFixed(3)}s<br/>A: ${p.data[1].toFixed(5)}`;
      }
    },
    xAxis: {
      type: 'value',
      name: 'Time (s)',
      nameLocation: 'center',
      nameGap: 20,
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      min: 0,
      max: duration,
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: 'Amplitude',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'none',
        height: 18,
        bottom: 4,
        borderColor: '#334155',
        backgroundColor: '#1e293b',
        fillerColor: 'rgba(6, 182, 212, 0.2)',
        handleStyle: { color: '#06b6d4', borderColor: '#06b6d4' },
        textStyle: { color: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' },
        dataBackground: {
          lineStyle: { color: '#334155' },
          areaStyle: { color: 'rgba(6, 182, 212, 0.05)' }
        },
        selectedDataBackground: {
          lineStyle: { color: '#06b6d4' },
          areaStyle: { color: 'rgba(6, 182, 212, 0.1)' }
        }
      }
    ],
    series: [
      {
        type: 'line',
        data: seriesData,
        symbol: 'none',
        lineStyle: {
          color: waveformColor,
          width: 1.2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: waveformColor + '20' },
              { offset: 0.5, color: waveformColor + '05' },
              { offset: 1, color: waveformColor + '20' }
            ]
          }
        },
        markLine: markLines.length > 0 ? {
          symbol: 'none',
          animation: false,
          data: markLines
        } : undefined
      }
    ]
  }), [seriesData, waveformColor, label, stationName, duration, markLines]);

  const handleClick = useCallback((params: any) => {
    if (!annotationMode || !selectedStationId) return;
    if (params.componentType === 'markLine') return;

    const time = params.data?.[0];
    if (time === undefined) return;

    const store = useSeismicStore.getState();
    const existingAnn = store.stationAnnotations[selectedStationId];
    const ann = existingAnn ? { ...existingAnn } : { pTime: null, sTime: null };

    if (annotationMode === 'P') ann.pTime = time;
    else ann.sTime = time;

    store.stationAnnotations[selectedStationId] = ann;
    useSeismicStore.setState({ stationAnnotations: { ...store.stationAnnotations } });
    store.recalculateTriangulation();
  }, [annotationMode, selectedStationId]);

  return (
    <div
      className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700"
      style={{ cursor: annotationMode ? 'crosshair' : 'default' }}
    >
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: 180, width: '100%' }}
        onEvents={{ click: handleClick }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
        lazyUpdate={true}
      />
      {annotationMode && (
        <div className="absolute bottom-8 left-2 z-10 px-2 py-1 rounded text-xs font-bold animate-pulse"
             style={{ backgroundColor: annotationMode === 'P' ? '#f97316' : '#ef4444', color: '#fff' }}>
          Click to mark {annotationMode} wave
        </div>
      )}
    </div>
  );
};

export default WaveformChart;
