import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { LayerElement, CollisionResult, MainRoute, KeyPoint, LayerType } from '../../shared/types';
import {
  mockChannelNotes,
  mockWarningZones,
  mockAnchorages,
  mockBerthPoints,
  mockMainRoutes,
  mockKeyPoints,
} from '../data/mockData';
import { detectCollisions } from '../utils/collisionDetector';

export interface VersionRecord {
  id: string;
  name: string;
  timestamp: string;
  operator: string;
  description: string;
  type: 'manual' | 'nightly' | 'auto';
  layerData: LayerElement[];
}

interface LayerVisibility {
  channel_note: boolean;
  warning_zone: boolean;
  anchorage: boolean;
  berth_point: boolean;
}

interface ChartState {
  elements: LayerElement[];
  mainRoutes: MainRoute[];
  keyPoints: KeyPoint[];
  collisions: CollisionResult[];
  layerVisibility: LayerVisibility;
  selectedElementId: string | null;
  stageScale: number;
  stagePosition: { x: number; y: number };
  currentOperator: string;
  versions: VersionRecord[];

  setElementPosition: (id: string, x: number, y: number) => void;
  toggleLayerVisibility: (layerType: LayerType) => void;
  setSelectedElement: (id: string | null) => void;
  setStageTransform: (scale: number, x: number, y: number) => void;
  checkCollisions: () => void;
  getVisibleElements: () => LayerElement[];
  saveVersion: (name: string, description: string, type?: VersionRecord['type']) => string;
  deleteVersion: (id: string) => void;
  loadVersion: (id: string) => void;
  initDemoVersions: () => void;
}

export const useChartStore = create<ChartState>((set, get) => ({
  elements: [
    ...mockChannelNotes,
    ...mockWarningZones,
    ...mockAnchorages,
    ...mockBerthPoints,
  ],
  mainRoutes: mockMainRoutes,
  keyPoints: mockKeyPoints,
  collisions: [],
  layerVisibility: {
    channel_note: true,
    warning_zone: true,
    anchorage: true,
    berth_point: true,
  },
  selectedElementId: null,
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
  currentOperator: '张调度',

  setElementPosition: (id, x, y) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    }));
    get().checkCollisions();
  },

  toggleLayerVisibility: (layerType) => {
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layerType]: !state.layerVisibility[layerType],
      },
      elements: state.elements.map((el) =>
        el.type === layerType ? { ...el, visible: !el.visible } : el
      ),
    }));
    setTimeout(() => get().checkCollisions(), 0);
  },

  setSelectedElement: (id) => {
    set({ selectedElementId: id });
  },

  setStageTransform: (scale, x, y) => {
    set({ stageScale: scale, stagePosition: { x, y } });
  },

  checkCollisions: () => {
    const { elements, mainRoutes, keyPoints } = get();
    const collisions = detectCollisions(elements, mainRoutes, keyPoints);
    set({ collisions });
  },

  getVisibleElements: () => {
    const { elements } = get();
    return elements.filter((el) => el.visible);
  },

  versions: [],

  saveVersion: (name, description, type = 'manual') => {
    const { elements, currentOperator, versions } = get();
    const newVersion: VersionRecord = {
      id: uuidv4(),
      name,
      timestamp: new Date().toISOString(),
      operator: currentOperator,
      description,
      type,
      layerData: JSON.parse(JSON.stringify(elements)),
    };

    const updatedVersions = [newVersion, ...versions].slice(0, 20);
    set({ versions: updatedVersions });
    return newVersion.id;
  },

  deleteVersion: (id) => {
    set((state) => ({
      versions: state.versions.filter((v) => v.id !== id),
    }));
  },

  loadVersion: (id) => {
    const version = get().versions.find((v) => v.id === id);
    if (version) {
      set({ elements: JSON.parse(JSON.stringify(version.layerData)) });
      setTimeout(() => get().checkCollisions(), 0);
    }
  },

  initDemoVersions: () => {
    const { elements, currentOperator } = get();
    if (get().versions.length > 0) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(20, 0, 0, 0);

    const nightVersion: VersionRecord = {
      id: uuidv4(),
      name: '夜班快照_05-23',
      timestamp: yesterday.toISOString(),
      operator: '李调度',
      description: '夜间自动生成快照',
      type: 'nightly',
      layerData: JSON.parse(JSON.stringify(elements)).map((el: LayerElement) => {
        if (el.type === 'anchorage' && el.text.includes('A1')) {
          return { ...el, x: 280, y: 380 };
        }
        if (el.type === 'warning_zone' && el.text.includes('施工区')) {
          return { ...el, x: 420, y: 320 };
        }
        return el;
      }),
    };

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(8, 0, 0, 0);

    const dayVersion: VersionRecord = {
      id: uuidv4(),
      name: '白班值班图_05-22',
      timestamp: twoDaysAgo.toISOString(),
      operator: '王调度',
      description: '白班交接存档',
      type: 'manual',
      layerData: JSON.parse(JSON.stringify(elements)).map((el: LayerElement) => {
        if (el.type === 'channel_note' && el.text.includes('主航道')) {
          return { ...el, x: 180, y: 130 };
        }
        if (el.type === 'berth_point' && el.text.includes('#02')) {
          return { ...el, x: 780, y: 400 };
        }
        return el;
      }),
    };

    set({ versions: [nightVersion, dayVersion] });
  },
}));
