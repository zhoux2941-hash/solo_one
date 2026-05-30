import { EarthquakeEvent, StationPosition } from '../types';
import { generateEarthquakeWaveform } from '../utils/waveformGenerator';

const stationSets: Record<string, StationPosition[]> = {
  EQ001: [
    { id: 'STA-WC01', name: '汶川台', lat: 31.0, lon: 103.6, x: 0, y: 0 },
    { id: 'STA-CD02', name: '成都台', lat: 30.6, lon: 104.1, x: 48, y: -44 },
    { id: 'STA-MY03', name: '绵阳台', lat: 31.5, lon: 104.7, x: 100, y: 56 },
    { id: 'STA-DY04', name: '德阳台', lat: 31.1, lon: 104.4, x: 73, y: 11 },
    { id: 'STA-YA05', name: '雅安台', lat: 30.0, lon: 103.0, x: -55, y: -111 }
  ],
  EQ002: [
    { id: 'STA-SN01', name: '仙台台', lat: 38.3, lon: 140.9, x: 0, y: 0 },
    { id: 'STA-TK02', name: '东京台', lat: 35.7, lon: 139.7, x: -118, y: -289 },
    { id: 'STA-OS03', name: '大阪台', lat: 34.7, lon: 135.5, x: -478, y: -400 },
    { id: 'STA-MR04', name: '盛冈台', lat: 39.7, lon: 141.1, x: 18, y: 156 },
    { id: 'STA-AK05', name: '秋田台', lat: 39.7, lon: 140.1, x: -73, y: 156 }
  ],
  EQ003: [
    { id: 'STA-TS01', name: '唐山台', lat: 39.6, lon: 118.2, x: 0, y: 0 },
    { id: 'STA-BJ02', name: '北京台', lat: 39.9, lon: 116.4, x: -162, y: 33 },
    { id: 'STA-TJ03', name: '天津台', lat: 39.1, lon: 117.2, x: -91, y: -56 },
    { id: 'STA-QH04', name: '秦皇岛台', lat: 39.9, lon: 119.6, x: 126, y: 33 },
    { id: 'STA-CF05', name: '承德台', lat: 40.9, lon: 117.9, x: -27, y: 144 }
  ],
  EQ004: [
    { id: 'SA-CP01', name: '康塞普西翁台', lat: -36.8, lon: -73.0, x: 0, y: 0 },
    { id: 'SA-ST02', name: '圣地亚哥台', lat: -33.4, lon: -70.6, x: 217, y: 378 },
    { id: 'SA-VA03', name: '瓦尔帕莱索台', lat: -33.0, lon: -71.6, x: 126, y: 422 },
    { id: 'SA-TA04', name: '塔尔卡台', lat: -35.4, lon: -71.7, x: 117, y: 156 },
    { id: 'SA-TE05', name: '特木科台', lat: -38.7, lon: -72.6, x: 36, y: -211 }
  ],
  EQ005: [
    { id: 'ST-HL01', name: '花莲台', lat: 23.9, lon: 121.6, x: 0, y: 0 },
    { id: 'ST-TP02', name: '台北台', lat: 25.0, lon: 121.5, x: -10, y: 122 },
    { id: 'ST-TC03', name: '台中台', lat: 24.1, lon: 120.7, x: -82, y: 22 },
    { id: 'ST-KH04', name: '高雄台', lat: 22.6, lon: 120.3, x: -118, y: -144 },
    { id: 'ST-TT05', name: '台东台', lat: 22.8, lon: 121.1, x: -45, y: -122 }
  ]
};

const eventConfigs = [
  {
    id: 'EQ001',
    name: '汶川大地震模拟',
    location: '四川汶川',
    magnitude: 8.0,
    depth: 14,
    date: '2008-05-12',
    epicenter: { lat: 31.0, lon: 103.4, x: -18, y: -5 },
    sampleRate: 50,
    duration: 60,
    noiseLevel: 0.3,
    stationDelays: [
      { pDelay: 0, sDelay: 0 },
      { pDelay: 2.5, sDelay: 5.5 },
      { pDelay: 3.8, sDelay: 8.4 },
      { pDelay: 3.0, sDelay: 6.8 },
      { pDelay: 2.0, sDelay: 4.5 }
    ]
  },
  {
    id: 'EQ002',
    name: '东日本大地震模拟',
    location: '日本东海岸',
    magnitude: 9.0,
    depth: 32,
    date: '2011-03-11',
    epicenter: { lat: 38.3, lon: 142.4, x: 134, y: 0 },
    sampleRate: 50,
    duration: 90,
    noiseLevel: 0.2,
    stationDelays: [
      { pDelay: 6, sDelay: 14 },
      { pDelay: 10, sDelay: 23 },
      { pDelay: 16, sDelay: 36 },
      { pDelay: 6.5, sDelay: 15 },
      { pDelay: 7, sDelay: 16 }
    ]
  },
  {
    id: 'EQ003',
    name: '唐山大地震模拟',
    location: '河北唐山',
    magnitude: 7.8,
    depth: 12,
    date: '1976-07-28',
    epicenter: { lat: 39.6, lon: 118.2, x: 0, y: 0 },
    sampleRate: 50,
    duration: 50,
    noiseLevel: 0.25,
    stationDelays: [
      { pDelay: 0, sDelay: 0 },
      { pDelay: 3.0, sDelay: 6.5 },
      { pDelay: 1.8, sDelay: 4.0 },
      { pDelay: 2.2, sDelay: 5.0 },
      { pDelay: 2.8, sDelay: 6.2 }
    ]
  },
  {
    id: 'EQ004',
    name: '智利大地震模拟',
    location: '智利近海',
    magnitude: 8.8,
    depth: 35,
    date: '2010-02-27',
    epicenter: { lat: -36.1, lon: -72.9, x: 10, y: 78 },
    sampleRate: 50,
    duration: 120,
    noiseLevel: 0.2,
    stationDelays: [
      { pDelay: 4, sDelay: 9 },
      { pDelay: 12, sDelay: 27 },
      { pDelay: 11, sDelay: 24 },
      { pDelay: 6, sDelay: 13 },
      { pDelay: 2, sDelay: 5 }
    ]
  },
  {
    id: 'EQ005',
    name: '台湾花莲地震模拟',
    location: '台湾花莲',
    magnitude: 6.7,
    depth: 10,
    date: '2024-04-03',
    epicenter: { lat: 23.4, lon: 121.6, x: 0, y: -56 },
    sampleRate: 50,
    duration: 40,
    noiseLevel: 0.35,
    stationDelays: [
      { pDelay: 1.0, sDelay: 2.3 },
      { pDelay: 3.2, sDelay: 7.2 },
      { pDelay: 2.0, sDelay: 4.5 },
      { pDelay: 4.0, sDelay: 9.0 },
      { pDelay: 2.5, sDelay: 5.6 }
    ]
  }
];

export function generatePresetEvents(): EarthquakeEvent[] {
  return eventConfigs.map(config => {
    const stations = stationSets[config.id] || [];

    const waveforms = stations.map((station, idx) => {
      const delays = config.stationDelays[idx] || { pDelay: 0, sDelay: 0 };
      const components = generateEarthquakeWaveform({
        duration: config.duration,
        sampleRate: config.sampleRate,
        magnitude: config.magnitude,
        pWaveArrival: delays.pDelay,
        sWaveArrival: delays.sDelay,
        noiseLevel: config.noiseLevel
      });

      return {
        stationId: station.id,
        components,
        sampleRate: config.sampleRate,
        duration: config.duration,
        expectedPTime: delays.pDelay,
        expectedSTime: delays.sDelay
      };
    });

    return {
      id: config.id,
      name: config.name,
      location: config.location,
      magnitude: config.magnitude,
      depth: config.depth,
      date: config.date,
      epicenter: config.epicenter,
      stations,
      waveforms
    };
  });
}

export const presetEventList = eventConfigs.map(config => ({
  id: config.id,
  name: config.name,
  location: config.location,
  magnitude: config.magnitude,
  depth: config.depth,
  date: config.date,
  stationCount: (stationSets[config.id] || []).length
}));
