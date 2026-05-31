export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface GeoHashResult {
  hash: string;
  center: GeoPoint;
  bbox: BBox;
  precision: number;
}

export interface PresetLocation {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
}

const BASE32_CHARS = "0123456789bcdefghjkmnpqrstuvwxyz";

const PRESET_LOCATIONS: PresetLocation[] = [
  { name: "天安门广场", nameEn: "Tiananmen Square", lat: 39.9054, lng: 116.3976 },
  { name: "自由女神像", nameEn: "Statue of Liberty", lat: 40.6892, lng: -74.0445 },
  { name: "埃菲尔铁塔", nameEn: "Eiffel Tower", lat: 48.8584, lng: 2.2945 },
  { name: "悉尼歌剧院", nameEn: "Sydney Opera House", lat: -33.8568, lng: 151.2153 },
  { name: "富士山", nameEn: "Mount Fuji", lat: 35.3606, lng: 138.7274 },
  { name: "大本钟", nameEn: "Big Ben", lat: 51.5007, lng: -0.1246 },
  { name: "金字塔", nameEn: "Great Pyramid of Giza", lat: 29.9792, lng: 31.1342 },
  { name: "莫斯科红场", nameEn: "Red Square", lat: 55.7539, lng: 37.6208 },
  { name: "东京塔", nameEn: "Tokyo Tower", lat: 35.6586, lng: 139.7454 },
  { name: "故宫", nameEn: "Forbidden City", lat: 39.9163, lng: 116.3972 },
  { name: "长城（八达岭）", nameEn: "Great Wall (Badaling)", lat: 40.4319, lng: 116.5704 },
  { name: "旧金山金门大桥", nameEn: "Golden Gate Bridge", lat: 37.8199, lng: -122.4783 },
];

interface PrecisionInfo {
  latRange: string;
  lngRange: string;
  latSize: string;
  lngSize: string;
  description: string;
}

const PRECISION_REFERENCE: PrecisionInfo[] = [
  { latRange: "45°", lngRange: "45°", latSize: "~5000 km", lngSize: "~5000 km", description: "洲际" },
  { latRange: "11.25°", lngRange: "11.25°", latSize: "~1250 km", lngSize: "~1250 km", description: "大型国家" },
  { latRange: "2.8125°", lngRange: "5.625°", latSize: "~312 km", lngSize: "~625 km", description: "省份/州" },
  { latRange: "0.703125°", lngRange: "0.703125°", latSize: "~78 km", lngSize: "~78 km", description: "城市" },
  { latRange: "0.17578125°", lngRange: "0.3515625°", latSize: "~19.5 km", lngSize: "~39 km", description: "区县" },
  { latRange: "0.0439453125°", lngRange: "0.0439453125°", latSize: "~4.9 km", lngSize: "~4.9 km", description: "街区" },
  { latRange: "0.010986328125°", lngRange: "0.02197265625°", latSize: "~1.2 km", lngSize: "~2.4 km", description: "社区" },
  { latRange: "0.00274658203125°", lngRange: "0.00274658203125°", latSize: "~305 m", lngSize: "~305 m", description: "建筑物群" },
  { latRange: "0.0006866455078125°", lngRange: "0.001373291015625°", latSize: "~76 m", lngSize: "~153 m", description: "单个建筑" },
  { latRange: "0.000171661376953125°", lngRange: "0.000171661376953125°", latSize: "~19 m", lngSize: "~19 m", description: "房屋" },
  { latRange: "0.00004291534423828125°", lngRange: "0.0000858306884765625°", latSize: "~4.8 m", lngSize: "~9.5 m", description: "房间" },
  { latRange: "0.000010728836059570312°", lngRange: "0.000010728836059570312°", latSize: "~1.2 m", lngSize: "~1.2 m", description: "精确点位" },
];

function getPrecisionInfo(precision: number): PrecisionInfo {
  const index = Math.max(0, Math.min(11, Math.floor(precision) - 1));
  return PRECISION_REFERENCE[index];
}

function encodeGeoHash(lat: number, lng: number, precision: number): string {
  let hash = "";
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let isLng = true;
  let bitCount = 0;
  let bitVal = 0;

  while (hash.length < precision) {
    if (isLng) {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        bitVal = bitVal * 2 + 1;
        lngRange[0] = mid;
      } else {
        bitVal = bitVal * 2;
        lngRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        bitVal = bitVal * 2 + 1;
        latRange[0] = mid;
      } else {
        bitVal = bitVal * 2;
        latRange[1] = mid;
      }
    }
    isLng = !isLng;
    bitCount++;
    if (bitCount === 5) {
      hash += BASE32_CHARS[bitVal];
      bitCount = 0;
      bitVal = 0;
    }
  }
  return hash;
}

function decodeGeoHash(hash: string): { center: GeoPoint; bbox: BBox } {
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let isLng = true;

  for (let i = 0; i < hash.length; i++) {
    const char = hash[i].toLowerCase();
    const charIndex = BASE32_CHARS.indexOf(char);
    if (charIndex === -1) continue;

    for (let bit = 4; bit >= 0; bit--) {
      const mask = 1 << bit;
      const bitVal = (charIndex & mask) !== 0 ? 1 : 0;

      if (isLng) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (bitVal === 1) {
          lngRange[0] = mid;
        } else {
          lngRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (bitVal === 1) {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }
      isLng = !isLng;
    }
  }

  const bbox: BBox = {
    minLat: latRange[0],
    maxLat: latRange[1],
    minLng: lngRange[0],
    maxLng: lngRange[1],
  };

  const center: GeoPoint = {
    lat: (latRange[0] + latRange[1]) / 2,
    lng: (lngRange[0] + lngRange[1]) / 2,
  };

  return { center, bbox };
}

function getNeighbors(hash: string): Record<string, string> {
  const { center, bbox } = decodeGeoHash(hash);
  const precision = hash.length;
  const latDelta = (bbox.maxLat - bbox.minLat) / 2;
  const lngDelta = (bbox.maxLng - bbox.minLng) / 2;

  const directions: [string, number, number][] = [
    ["n", 0, latDelta],
    ["ne", lngDelta, latDelta],
    ["e", lngDelta, 0],
    ["se", lngDelta, -latDelta],
    ["s", 0, -latDelta],
    ["sw", -lngDelta, -latDelta],
    ["w", -lngDelta, 0],
    ["nw", -lngDelta, latDelta],
  ];

  const neighbors: Record<string, string> = {};
  for (const [dir, dLng, dLat] of directions) {
    const neighborHash = encodeGeoHash(center.lat + dLat, center.lng + dLng, precision);
    neighbors[dir] = neighborHash;
  }
  return neighbors;
}

function isValidGeoHash(hash: string): boolean {
  return /^[0123456789bcdefghjkmnpqrstuvwxyz]+$/i.test(hash);
}

function batchEncode(input: string, precision: number): GeoHashResult[] {
  const lines = input.split(/\r?\n/);
  const results: GeoHashResult[] = [];

  for (const line of lines) {
    try {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const hash = encodeGeoHash(lat, lng, precision);
          const { center, bbox } = decodeGeoHash(hash);
          results.push({ hash, center, bbox, precision });
        }
      }
    } catch {
      continue;
    }
  }
  return results;
}

export {
  encodeGeoHash,
  decodeGeoHash,
  getNeighbors,
  isValidGeoHash,
  batchEncode,
  getPrecisionInfo,
  PRESET_LOCATIONS,
  PRECISION_REFERENCE,
  BASE32_CHARS,
};

export type { PrecisionInfo };
