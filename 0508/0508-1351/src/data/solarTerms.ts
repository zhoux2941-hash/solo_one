import { SolarTerm } from '../models/solarTerm';

export const SOLAR_TERMS: SolarTerm[] = [
  {
    id: 'lichun',
    name: '立春',
    phenology: ['东风解冻', '蛰虫始振', '鱼陟负冰'],
    farmerProverb: '立春一日，百草回芽；一年之计在于春',
    customs: '立春时节有咬春（吃春饼、春卷）、打春牛、迎春等习俗，象征着春天的开始',
  },
  {
    id: 'jingzhe',
    name: '惊蛰',
    phenology: ['桃始华', '仓庚鸣', '鹰化为鸠'],
    farmerProverb: '惊蛰春雷响，农夫闲转忙',
    customs: '惊蛰有祭白虎、打小人、吃梨等习俗，象征万物复苏',
  },
  {
    id: 'qingming',
    name: '清明',
    phenology: ['桐始华', '田鼠化为鴽', '虹始见'],
    farmerProverb: '清明前后，种瓜点豆',
    customs: '清明节有扫墓祭祖、踏青插柳、放风筝等习俗',
  },
  {
    id: 'lixia',
    name: '立夏',
    phenology: ['蝼蝈鸣', '蚯蚓出', '王瓜生'],
    farmerProverb: '立夏不下，犁耙高挂',
    customs: '立夏有尝新、斗蛋、称人等习俗，象征夏季开始',
  },
  {
    id: 'mangzhong',
    name: '芒种',
    phenology: ['螳螂生', '鵙始鸣', '反舌无声'],
    farmerProverb: '芒种芒种，连收带种',
    customs: '芒种有送花神、安苗、煮梅等习俗，是农忙时节',
  },
  {
    id: 'xiaoshu',
    name: '小暑',
    phenology: ['温风至', '蟋蟀居壁', '鹰乃学习'],
    farmerProverb: '小暑不算热，大暑三伏天',
    customs: '小暑有食新、晒伏、天贶节等习俗',
  },
  {
    id: 'liqiu',
    name: '立秋',
    phenology: ['凉风至', '白露降', '寒蝉鸣'],
    farmerProverb: '立秋之日凉风至',
    customs: '立秋有贴秋膘、啃秋、晒秋等习俗',
  },
  {
    id: 'bailu',
    name: '白露',
    phenology: ['鸿雁来', '玄鸟归', '群鸟养羞'],
    farmerProverb: '白露秋分夜，一夜冷一夜',
    customs: '白露有收清露、祭禹王、吃龙眼等习俗',
  },
  {
    id: 'hanlu',
    name: '寒露',
    phenology: ['鸿雁来宾', '雀入大水为蛤', '菊有黄华'],
    farmerProverb: '寒露时节天渐寒，农夫天天不停闲',
    customs: '寒露有登高、赏菊、饮菊花酒等习俗',
  },
  {
    id: 'xiaoxue',
    name: '小雪',
    phenology: ['虹藏不见', '天气上腾地气下降', '闭塞而成冬'],
    farmerProverb: '小雪雪满天，来年必丰年',
    customs: '小雪有腌腊肉、吃糍粑、晒鱼干等习俗',
  },
];

export const TOTAL_QUESTIONS = 10;
export const CORRECT_SCORE = 10;
export const WRONG_SCORE = -5;
