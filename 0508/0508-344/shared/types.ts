export type LayerType = 'channel_note' | 'warning_zone' | 'anchorage' | 'berth_point';

export type WarningType = 'construction' | 'danger' | 'restricted';

export type CollisionType = 'main_route' | 'key_point' | 'other_element';

export type Severity = 'warning' | 'danger';

export interface LayerElement {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
}

export interface ChannelNote extends LayerElement {
  type: 'channel_note';
  channelId: string;
  depth?: number;
}

export interface WarningZone extends LayerElement {
  type: 'warning_zone';
  warningType: WarningType;
  startTime: string;
  endTime: string;
}

export interface Anchorage extends LayerElement {
  type: 'anchorage';
  anchorageNo: string;
  capacity?: number;
}

export interface BerthPoint extends LayerElement {
  type: 'berth_point';
  berthNo: string;
  vesselName?: string;
  eta?: string;
}

export interface CollisionResult {
  elementId: string;
  elementText: string;
  collisionType: CollisionType;
  severity: Severity;
  message: string;
  overlapArea: number;
}

export interface MainRoute {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  width: number;
}

export interface KeyPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
}

export interface VersionRecord {
  id: string;
  timestamp: string;
  operator: string;
  description: string;
  layerData: LayerElement[];
  snapshotUrl?: string;
}

export interface CollisionCheckRequest {
  elements: LayerElement[];
  mainRoutes: MainRoute[];
  keyPoints: KeyPoint[];
}

export interface CollisionCheckResponse {
  success: boolean;
  collisions: CollisionResult[];
  checkTime: number;
}

export interface SaveVersionRequest {
  layerData: LayerElement[];
  operator: string;
  description: string;
  snapshot?: string;
}

export interface SaveVersionResponse {
  success: boolean;
  versionId: string;
  timestamp: string;
}

export type AnyLayerElement = ChannelNote | WarningZone | Anchorage | BerthPoint;
