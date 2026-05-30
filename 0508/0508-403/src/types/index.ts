export interface Line {
  id: string;
  name: string;
  color: string;
}

export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  lines: string[];
}

export interface LineStation {
  lineId: string;
  stationId: string;
  order: number;
  minutesFromPrev: number;
}

export interface Transfer {
  stationId: string;
  fromLineId: string;
  toLineId: string;
  transferMinutes: number;
}

export interface FavoriteRoute {
  id: string;
  fromStationId: string;
  toStationId: string;
  fromName: string;
  toName: string;
  createdAt: number;
}

export interface RouteSegment {
  lineId: string;
  stationIds: string[];
}

export interface RouteResult {
  segments: RouteSegment[];
  stationPath: string[];
  totalMinutes: number;
  transfers: { stationId: string; fromLineId: string; toLineId: string }[];
}

export interface CityTime {
  cityName: string;
  minutes: number;
}
