export interface ColorNode {
  color: string;
  name: string;
  traits: string[];
  strength: number;
}

export interface ColorEdge {
  from: string;
  to: string;
  type: 'conflict' | 'enhance';
  weight: number;
  description: string;
}

export interface ColorKnowledgeGraph {
  nodes: ColorNode[];
  edges: ColorEdge[];
}

export const colorKnowledgeGraph: ColorKnowledgeGraph = {
  nodes: [
    {
      color: '#C41E3A',
      name: '正红',
      traits: ['忠勇', '正义', '刚烈', '热血'],
      strength: 5,
    },
    {
      color: '#8B0000',
      name: '深红',
      traits: ['沉稳', '忠烈', '坚毅', '庄重'],
      strength: 4,
    },
    {
      color: '#1E1E1E',
      name: '黑色',
      traits: ['刚直', '勇猛', '严肃', '铁面'],
      strength: 5,
    },
    {
      color: '#4A4A4A',
      name: '深灰',
      traits: ['深沉', '内敛', '思虑', '稳重'],
      strength: 3,
    },
    {
      color: '#FFFFFF',
      name: '白色',
      traits: ['奸诈', '多疑', '狡猾', '虚伪'],
      strength: 5,
    },
    {
      color: '#F0F0F0',
      name: '米白',
      traits: ['素雅', '纯净', '高洁', '正直'],
      strength: 3,
    },
    {
      color: '#FFD700',
      name: '金色',
      traits: ['神圣', '威严', '尊贵', '超凡'],
      strength: 5,
    },
    {
      color: '#DAA520',
      name: '古金',
      traits: ['古朴', '华贵', '沉稳', '厚重'],
      strength: 3,
    },
    {
      color: '#2E7D32',
      name: '深绿',
      traits: ['勇猛', '莽撞', '豪放', '野性'],
      strength: 4,
    },
    {
      color: '#4CAF50',
      name: '草绿',
      traits: ['生机', '活力', '清新', '自然'],
      strength: 3,
    },
    {
      color: '#1565C0',
      name: '深蓝',
      traits: ['沉稳', '坚毅', '智慧', '谋略'],
      strength: 5,
    },
    {
      color: '#42A5F5',
      name: '天蓝',
      traits: ['清新', '开朗', '豁达', '飘逸'],
      strength: 3,
    },
    {
      color: '#9C27B0',
      name: '紫色',
      traits: ['神秘', '高贵', '仙气', '幽深'],
      strength: 4,
    },
    {
      color: '#E040FB',
      name: '亮紫',
      traits: ['飘逸', '灵动', '梦幻', '神秘'],
      strength: 3,
    },
    {
      color: '#FF8C00',
      name: '橙色',
      traits: ['暴躁', '冲动', '热情', '直率'],
      strength: 4,
    },
    {
      color: '#FFB74D',
      name: '浅橙',
      traits: ['温暖', '热情', '乐观', '开朗'],
      strength: 3,
    },
    {
      color: '#F5DEB3',
      name: '肤色',
      traits: ['憨厚', '老实', '忠诚', '本分'],
      strength: 4,
    },
    {
      color: '#DEB887',
      name: '棕褐',
      traits: ['老成', '持重', '阅历', '沉稳'],
      strength: 3,
    },
    {
      color: '#FF69B4',
      name: '粉红',
      traits: ['娇媚', '温柔', '美丽', '柔情'],
      strength: 4,
    },
    {
      color: '#FFB6C1',
      name: '浅粉',
      traits: ['甜美', '可爱', '娇羞', '纯真'],
      strength: 3,
    },
    {
      color: '#8B4513',
      name: '棕色',
      traits: ['老成', '持重', '公正', '廉明'],
      strength: 4,
    },
    {
      color: '#A0522D',
      name: '赭石',
      traits: ['质朴', '自然', '踏实', '可靠'],
      strength: 3,
    },
    {
      color: '#40E0D0',
      name: '青绿',
      traits: ['清新', '脱俗', '精灵', '古怪'],
      strength: 4,
    },
    {
      color: '#008080',
      name: 'Teal',
      traits: ['沉稳', '内敛', '冷静', '睿智'],
      strength: 3,
    },
  ],
  edges: [
    {
      from: '#C41E3A',
      to: '#1E1E1E',
      type: 'enhance',
      weight: 0.8,
      description: '红黑相配，忠勇刚直，如关羽的忠肝义胆',
    },
    {
      from: '#C41E3A',
      to: '#FFFFFF',
      type: 'conflict',
      weight: 0.9,
      description: '红白对立，忠奸分明，正邪不两立',
    },
    {
      from: '#1E1E1E',
      to: '#FFFFFF',
      type: 'conflict',
      weight: 0.85,
      description: '黑白分明，刚直与奸诈势不两立',
    },
    {
      from: '#C41E3A',
      to: '#FFD700',
      type: 'enhance',
      weight: 0.6,
      description: '红金相映，忠义与尊贵并存',
    },
    {
      from: '#1565C0',
      to: '#FFD700',
      type: 'enhance',
      weight: 0.7,
      description: '蓝金相配，智慧与神圣相得益彰',
    },
    {
      from: '#2E7D32',
      to: '#1E1E1E',
      type: 'enhance',
      weight: 0.75,
      description: '绿黑相合，勇猛刚烈，如张飞之猛',
    },
    {
      from: '#2E7D32',
      to: '#FF8C00',
      type: 'enhance',
      weight: 0.7,
      description: '绿橙相配，鲁莽与冲动相加',
    },
    {
      from: '#FFFFFF',
      to: '#4A4A4A',
      type: 'enhance',
      weight: 0.65,
      description: '白灰相间，奸诈中藏深沉思虑',
    },
    {
      from: '#9C27B0',
      to: '#FFD700',
      type: 'enhance',
      weight: 0.8,
      description: '紫金相配，神秘高贵，仙气缭绕',
    },
    {
      from: '#FF69B4',
      to: '#E040FB',
      type: 'enhance',
      weight: 0.7,
      description: '粉红与亮紫，娇媚与仙气交融',
    },
    {
      from: '#FF69B4',
      to: '#42A5F5',
      type: 'enhance',
      weight: 0.6,
      description: '粉蓝相映，柔美清新，如仙女下凡',
    },
    {
      from: '#8B4513',
      to: '#4A4A4A',
      type: 'enhance',
      weight: 0.65,
      description: '棕灰相配，老成持重，阅历深厚',
    },
    {
      from: '#F5DEB3',
      to: '#8B4513',
      type: 'enhance',
      weight: 0.6,
      description: '肤色与棕色，憨厚与老成相融',
    },
    {
      from: '#40E0D0',
      to: '#9C27B0',
      type: 'enhance',
      weight: 0.65,
      description: '青绿与紫色，精灵古怪与神秘交织',
    },
    {
      from: '#FF8C00',
      to: '#1565C0',
      type: 'conflict',
      weight: 0.7,
      description: '橙蓝相克，冲动与沉稳互相制衡',
    },
    {
      from: '#FF69B4',
      to: '#1E1E1E',
      type: 'conflict',
      weight: 0.75,
      description: '粉黑对立，柔美与刚直形成反差',
    },
    {
      from: '#FFD700',
      to: '#FFFFFF',
      type: 'conflict',
      weight: 0.8,
      description: '金白相克，神圣与奸邪不能共存',
    },
    {
      from: '#2E7D32',
      to: '#FF69B4',
      type: 'conflict',
      weight: 0.65,
      description: '绿粉反差，勇猛与娇媚形成对比',
    },
  ],
};

export const getColorNode = (color: string): ColorNode | undefined => {
  return colorKnowledgeGraph.nodes.find((n) => n.color.toUpperCase() === color.toUpperCase());
};

export const getColorEdges = (color: string): ColorEdge[] => {
  return colorKnowledgeGraph.edges.filter(
    (e) => e.from.toUpperCase() === color.toUpperCase() || e.to.toUpperCase() === color.toUpperCase()
  );
};

export const getEdgeBetween = (color1: string, color2: string): ColorEdge | undefined => {
  return colorKnowledgeGraph.edges.find(
    (e) =>
      (e.from.toUpperCase() === color1.toUpperCase() && e.to.toUpperCase() === color2.toUpperCase()) ||
      (e.from.toUpperCase() === color2.toUpperCase() && e.to.toUpperCase() === color1.toUpperCase())
  );
};
