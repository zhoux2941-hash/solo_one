export interface PolyphoneEntry {
  char: string;
  default: string;
  contexts: {
    context: string[];
    pinyin: string;
  }[];
}

export const polyphoneDict: PolyphoneEntry[] = [
  {
    char: '乐',
    default: 'le',
    contexts: [
      { context: ['音', '音声', '音乐', '乐曲', '乐谱', '乐器', '乐理', '声乐', '交响乐'], pinyin: 'yue' },
      { context: ['快', '快乐', '欢乐', '乐趣', '乐意', '乐观', '乐园', '享乐'], pinyin: 'le' },
    ],
  },
  {
    char: '行',
    default: 'xing',
    contexts: [
      { context: ['银', '银行', '行业', '商行', '排行'], pinyin: 'hang' },
      { context: ['走', '行走', '行动', '行为', '进行', '流行', '运行'], pinyin: 'xing' },
    ],
  },
  {
    char: '好',
    default: 'hao',
    contexts: [
      { context: ['爱', '爱好', '喜好', '嗜好'], pinyin: 'hao4' },
      { context: ['很', '好', '好人', '好事', '美好', '友好'], pinyin: 'hao' },
    ],
  },
  {
    char: '重',
    default: 'zhong',
    contexts: [
      { context: ['重', '重要', '重量', '重点', '严重', '沉重'], pinyin: 'zhong' },
      { context: ['重', '重复', '重新', '重逢', '重叠'], pinyin: 'chong' },
    ],
  },
  {
    char: '长',
    default: 'chang',
    contexts: [
      { context: ['长', '长度', '长短', '长期', '长城', '长江'], pinyin: 'chang' },
      { context: ['长', '长大', '生长', '增长', '班长', '校长'], pinyin: 'zhang' },
    ],
  },
  {
    char: '数',
    default: 'shu',
    contexts: [
      { context: ['数', '数学', '数字', '数量', '数据', '数字'], pinyin: 'shu' },
      { context: ['数', '数数', '数落', '数说'], pinyin: 'shu3' },
    ],
  },
  {
    char: '着',
    default: 'zhe',
    contexts: [
      { context: ['看', '听', '说', '想', '走', '跑'], pinyin: 'zhe' },
      { context: ['着', '着急', '着火', '着凉'], pinyin: 'zhao' },
      { context: ['着', '穿着', '着装'], pinyin: 'zhuo' },
    ],
  },
  {
    char: '地',
    default: 'di',
    contexts: [
      { context: ['土', '土地', '地方', '地面', '地球'], pinyin: 'di' },
      { context: ['的', '得', '慢慢', '快快', '轻轻'], pinyin: 'de' },
    ],
  },
  {
    char: '得',
    default: 'de',
    contexts: [
      { context: ['得', '得到', '获得', '得意', '心得'], pinyin: 'de' },
      { context: ['的', '地', '跑得快', '写得好'], pinyin: 'de5' },
    ],
  },
  {
    char: '为',
    default: 'wei',
    contexts: [
      { context: ['因', '因为', '为何', '为了'], pinyin: 'wei4' },
      { context: ['为', '作为', '成为', '行为', '认为'], pinyin: 'wei' },
    ],
  },
  {
    char: '会',
    default: 'hui',
    contexts: [
      { context: ['会', '会议', '开会', '会员', '工会'], pinyin: 'hui' },
      { context: ['会', '会计', '财会'], pinyin: 'kuai' },
    ],
  },
  {
    char: '觉',
    default: 'jue',
    contexts: [
      { context: ['睡', '睡觉', '午觉'], pinyin: 'jiao' },
      { context: ['觉', '感觉', '觉得', '觉醒', '知觉'], pinyin: 'jue' },
    ],
  },
  {
    char: '校',
    default: 'xiao',
    contexts: [
      { context: ['学', '学校', '校园', '校友', '校长'], pinyin: 'xiao' },
      { context: ['校', '校对', '校勘', '校订'], pinyin: 'jiao' },
    ],
  },
  {
    char: '教',
    default: 'jiao',
    contexts: [
      { context: ['教', '教学', '教授', '教室', '教育'], pinyin: 'jiao4' },
      { context: ['教', '教书', '教给'], pinyin: 'jiao' },
    ],
  },
  {
    char: '鲜',
    default: 'xian',
    contexts: [
      { context: ['新', '新鲜', '鲜美', '鲜艳'], pinyin: 'xian' },
      { context: ['鲜', '鲜见', '鲜有', '鲜为人知'], pinyin: 'xian3' },
    ],
  },
  {
    char: '相',
    default: 'xiang',
    contexts: [
      { context: ['相', '相信', '相互', '相同', '相反'], pinyin: 'xiang' },
      { context: ['相', '相貌', '相片', '照相', '宰相'], pinyin: 'xiang4' },
    ],
  },
  {
    char: '中',
    default: 'zhong',
    contexts: [
      { context: ['中', '中国', '中心', '中间', '中央'], pinyin: 'zhong' },
      { context: ['中', '中奖', '中标', '中弹', '中箭'], pinyin: 'zhong4' },
    ],
  },
  {
    char: '发',
    default: 'fa',
    contexts: [
      { context: ['发', '发现', '发展', '发生', '发明'], pinyin: 'fa' },
      { context: ['头', '头发', '毛发'], pinyin: 'fa4' },
    ],
  },
  {
    char: '量',
    default: 'liang',
    contexts: [
      { context: ['量', '重量', '数量', '质量', '大量'], pinyin: 'liang4' },
      { context: ['量', '测量', '计量', '估量', '量体裁衣'], pinyin: 'liang' },
    ],
  },
  {
    char: '结',
    default: 'jie',
    contexts: [
      { context: ['结', '结果', '结论', '结合', '结束'], pinyin: 'jie' },
      { context: ['结', '结实', '结巴'], pinyin: 'jie1' },
    ],
  },
  {
    char: '难',
    default: 'nan',
    contexts: [
      { context: ['难', '困难', '难题', '难受', '艰难'], pinyin: 'nan' },
      { context: ['难', '灾难', '难民', '难友'], pinyin: 'nan4' },
    ],
  },
  {
    char: '便',
    default: 'bian',
    contexts: [
      { context: ['便', '方便', '便利', '便捷', '便宜'], pinyin: 'bian' },
      { context: ['便', '便宜'], pinyin: 'pian' },
    ],
  },
  {
    char: '折',
    default: 'zhe',
    contexts: [
      { context: ['折', '折叠', '折断', '折扣', '折腾'], pinyin: 'zhe' },
      { context: ['折', '折本', '折耗'], pinyin: 'she' },
    ],
  },
  {
    char: '差',
    default: 'cha',
    contexts: [
      { context: ['差', '差别', '差异', '差错', '差距'], pinyin: 'cha' },
      { context: ['差', '差不多', '差一点'], pinyin: 'cha4' },
      { context: ['差', '出差', '差事'], pinyin: 'chai' },
    ],
  },
  {
    char: '恶',
    default: 'e',
    contexts: [
      { context: ['恶', '恶劣', '恶毒', '凶恶', '恶意'], pinyin: 'e' },
      { context: ['恶', '恶心'], pinyin: 'e3' },
      { context: ['恶', '可恶', '厌恶', '深恶痛绝'], pinyin: 'wu' },
    ],
  },
];