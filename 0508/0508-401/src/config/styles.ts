export interface StyleConfig {
  locationId: string;
  styleFeatures: string[];
  commonThemes: string[];
}

export const styleConfigs: Record<string, StyleConfig> = {
  yangliuqing: {
    locationId: 'yangliuqing',
    styleFeatures: ['工笔细腻', '色彩雅致', '构图丰满'],
    commonThemes: ['门神', '吉祥喜庆', '戏文故事']
  },
  taohuawu: {
    locationId: 'taohuawu',
    styleFeatures: ['色彩明艳', '构图饱满', '江南韵味'],
    commonThemes: ['门神', '吉祥喜庆', '戏文故事']
  },
  yangjiabu: {
    locationId: 'yangjiabu',
    styleFeatures: ['粗犷豪放', '色彩浓烈', '乡土气息'],
    commonThemes: ['门神', '吉祥喜庆', '戏文故事']
  },
  zhuxianzhen: {
    locationId: 'zhuxianzhen',
    styleFeatures: ['古朴浑厚', '线条粗犷', '色彩对比'],
    commonThemes: ['门神', '吉祥喜庆', '戏文故事']
  },
  wuqiang: {
    locationId: 'wuqiang',
    styleFeatures: ['构图饱满', '线条简练', '造型夸张'],
    commonThemes: ['门神', '吉祥喜庆', '戏文故事']
  },
  fengxiang: {
    locationId: 'fengxiang',
    styleFeatures: ['色彩鲜艳', '造型生动', '黄土风情'],
    commonThemes: ['门神', '吉祥喜庆', '戏文故事']
  },
  mianzhu: {
    locationId: 'mianzhu',
    styleFeatures: ['夸张奔放', '构图对称', '巴蜀特色'],
    commonThemes: ['门神', '吉祥喜庆', '戏文故事']
  },
  foshan: {
    locationId: 'foshan',
    styleFeatures: ['色彩艳丽', '金箔点缀', '岭南风格'],
    commonThemes: ['门神', '吉祥喜庆', '戏文故事']
  }
};

export const themes = ['all', '门神', '吉祥喜庆', '戏文故事'] as const;
