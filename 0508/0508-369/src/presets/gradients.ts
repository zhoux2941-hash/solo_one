import type { PresetGradient } from '../types/gradient'

export const presetGradients: PresetGradient[] = [
  {
    name: '日落橙',
    config: {
      type: 'linear',
      linearDirection: 'to right',
      angle: 90,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#FF6B35', position: 0, opacity: 1 },
        { id: '2', color: '#F7C59F', position: 50, opacity: 1 },
        { id: '3', color: '#EFEFD0', position: 100, opacity: 1 }
      ]
    }
  },
  {
    name: '海洋蓝',
    config: {
      type: 'linear',
      linearDirection: 'to bottom',
      angle: 180,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#0077B6', position: 0, opacity: 1 },
        { id: '2', color: '#00B4D8', position: 50, opacity: 1 },
        { id: '3', color: '#90E0EF', position: 100, opacity: 1 }
      ]
    }
  },
  {
    name: '森林绿',
    config: {
      type: 'linear',
      linearDirection: 'to right',
      angle: 90,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#2D6A4F', position: 0, opacity: 1 },
        { id: '2', color: '#40916C', position: 50, opacity: 1 },
        { id: '3', color: '#95D5B2', position: 100, opacity: 1 }
      ]
    }
  },
  {
    name: '紫罗兰',
    config: {
      type: 'linear',
      linearDirection: 'to top right',
      angle: 45,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#7B2CBF', position: 0, opacity: 1 },
        { id: '2', color: '#9D4EDD', position: 50, opacity: 1 },
        { id: '3', color: '#E0AAFF', position: 100, opacity: 1 }
      ]
    }
  },
  {
    name: '炽热红',
    config: {
      type: 'linear',
      linearDirection: 'to bottom right',
      angle: 135,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#DC2626', position: 0, opacity: 1 },
        { id: '2', color: '#F87171', position: 50, opacity: 1 },
        { id: '3', color: '#FECACA', position: 100, opacity: 1 }
      ]
    }
  },
  {
    name: '极光紫',
    config: {
      type: 'radial',
      linearDirection: 'to right',
      angle: 90,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#8B5CF6', position: 0, opacity: 1 },
        { id: '2', color: '#EC4899', position: 50, opacity: 0.8 },
        { id: '3', color: '#06B6D4', position: 100, opacity: 0.6 }
      ]
    }
  },
  {
    name: '黎明金',
    config: {
      type: 'linear',
      linearDirection: 'to right',
      angle: 90,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#D97706', position: 0, opacity: 1 },
        { id: '2', color: '#FBBF24', position: 50, opacity: 1 },
        { id: '3', color: '#FDE68A', position: 100, opacity: 1 }
      ]
    }
  },
  {
    name: '星空蓝',
    config: {
      type: 'radial',
      linearDirection: 'to right',
      angle: 90,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#1E1B4B', position: 0, opacity: 1 },
        { id: '2', color: '#312E81', position: 40, opacity: 1 },
        { id: '3', color: '#4C1D95', position: 70, opacity: 0.8 },
        { id: '4', color: '#7C3AED', position: 100, opacity: 0.6 }
      ]
    }
  },
  {
    name: '秋叶橙',
    config: {
      type: 'linear',
      linearDirection: 'to bottom',
      angle: 180,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#EA580C', position: 0, opacity: 1 },
        { id: '2', color: '#FB923C', position: 33, opacity: 1 },
        { id: '3', color: '#FDBA74', position: 66, opacity: 1 },
        { id: '4', color: '#FED7AA', position: 100, opacity: 1 }
      ]
    }
  },
  {
    name: '薄荷绿',
    config: {
      type: 'linear',
      linearDirection: 'to right',
      angle: 90,
      radialShape: 'circle',
      radialSize: 'farthest-corner',
      colorStops: [
        { id: '1', color: '#059669', position: 0, opacity: 1 },
        { id: '2', color: '#10B981', position: 50, opacity: 1 },
        { id: '3', color: '#A7F3D0', position: 100, opacity: 1 }
      ]
    }
  }
]
