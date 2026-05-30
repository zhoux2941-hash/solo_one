import { ClassicFormula } from '../types';

export const CLASSIC_FORMULAS: ClassicFormula[] = [
  {
    id: 'ersu-jiuju',
    name: '二苏旧局',
    origin: '《陈氏香谱》',
    era: '宋代',
    ingredients: [
      { spiceId: 'chenxiang', grams: 2 },
      { spiceId: 'tanxiang', grams: 2 },
      { spiceId: 'ruixiang', grams: 1 },
      { spiceId: 'moxiang', grams: 1 },
      { spiceId: 'huoxiang', grams: 0.5 },
    ],
    description: '宋代著名香方，由苏轼、苏辙兄弟所传，香气温润雅致，如文人雅士围炉论道，为历代香家所推崇。',
    story: '此香为苏东坡与弟子由共同研制，二人被贬谪期间，以香为伴，将沉香、檀香与乳香、安息香调和，香气清润而不浓烈，正如二人患难与共的兄弟情谊。',
  },
  {
    id: 'xuezhong-chunxin',
    name: '雪中春信',
    origin: '《颜氏香史》',
    era: '唐代',
    ingredients: [
      { spiceId: 'chenxiang', grams: 1.5 },
      { spiceId: 'tanxiang', grams: 1 },
      { spiceId: 'longnao', grams: 0.5 },
      { spiceId: 'guihua', grams: 1 },
      { spiceId: 'moxiang', grams: 0.5 },
    ],
    description: '唐代名香，取雪中之梅的意境，香气清冽中透出春意，苦寒中蕴含生机，被誉为"雪中第一香"。',
    story: '相传唐代香师在大雪纷飞之日，采集初绽梅花与沉香、檀香合制，龙脑的清凉与花香的清甜交融，如冬日雪地里透出的春讯，令人心神俱清。',
  },
  {
    id: 'guzhang-chun',
    name: '古帐春',
    origin: '《香乘》',
    era: '明代',
    ingredients: [
      { spiceId: 'tanxiang', grams: 3 },
      { spiceId: 'chenxiang', grams: 2 },
      { spiceId: 'guihua', grams: 1.5 },
      { spiceId: 'dingxiang', grams: 0.5 },
      { spiceId: 'shexiang', grams: 0.3 },
    ],
    description: '明代宫廷名香，相传为永乐皇帝御用，香气缠绵悱恻，如闺中春梦，故得名"古帐春"，极富浪漫气息。',
    story: '明代香师周嘉胄所创制，融合檀香的温润、沉香的醇厚与桂花的清甜，再以微量麝香点睛，香气温柔缠绵，令人心旷神怡，为古代文人雅士书房必备之香。',
  },
];

export const getFormulaById = (id: string): ClassicFormula | undefined => {
  return CLASSIC_FORMULAS.find((f) => f.id === id);
};
