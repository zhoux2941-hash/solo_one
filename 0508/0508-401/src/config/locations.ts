export interface LocationConfig {
  id: string;
  name: string;
  englishName: string;
  position: {
    x: number;
    y: number;
  };
  description: string;
}

export const locations: LocationConfig[] = [
  {
    id: 'yangliuqing',
    name: '天津杨柳青',
    englishName: 'Yangliuqing, Tianjin',
    position: { x: 58, y: 22 },
    description: '杨柳青年画始于明代万历年间，是中国著名的民间木版年画。以木版套印和手工彩绘相结合，笔法细腻，色彩典雅，具有浓郁的宫廷绘画风格。'
  },
  {
    id: 'taohuawu',
    name: '苏州桃花坞',
    englishName: 'Taohuawu, Suzhou',
    position: { x: 72, y: 45 },
    description: '桃花坞年画是江南地区的民间木版年画，源于宋代的雕版印刷工艺。色彩鲜明，造型夸张，具有浓郁的江南水乡特色和市民文化气息。'
  },
  {
    id: 'yangjiabu',
    name: '山东杨家埠',
    englishName: 'Yangjiabu, Shandong',
    position: { x: 65, y: 30 },
    description: '杨家埠年画是山东潍坊的传统民间艺术，始于明代。以木版套色印制，风格粗犷豪放，色彩对比强烈，充满浓郁的北方农村生活气息。'
  },
  {
    id: 'zhuxianzhen',
    name: '河南朱仙镇',
    englishName: 'Zhuxianzhen, Henan',
    position: { x: 57, y: 38 },
    description: '朱仙镇木版年画是中国古老的传统工艺品之一，被誉为中国木版年画的鼻祖。造型古朴夸张，色彩对比强烈，具有鲜明的中原文化特色。'
  },
  {
    id: 'wuqiang',
    name: '河北武强',
    englishName: 'Wuqiang, Hebei',
    position: { x: 60, y: 26 },
    description: '武强年画是河北省武强县传统民间工艺品之一，具有浓郁的乡土气息和地方特色。构图饱满，线条粗犷，色彩鲜明，被誉为"河北民俗文化的象征"。'
  },
  {
    id: 'fengxiang',
    name: '陕西凤翔',
    englishName: 'Fengxiang, Shaanxi',
    position: { x: 45, y: 35 },
    description: '凤翔年画是陕西省凤翔县的传统民间艺术，始于明代。色彩鲜艳夺目，造型生动夸张，融合了黄土高原的粗犷与江南的细腻，具有独特的西北风情。'
  },
  {
    id: 'mianzhu',
    name: '四川绵竹',
    englishName: 'Mianzhu, Sichuan',
    position: { x: 35, y: 48 },
    description: '绵竹年画是四川绵竹市的传统民间艺术，与天津杨柳青、苏州桃花坞、山东潍坊并称中国四大年画。造型夸张奔放，色彩鲜艳夺目，具有浓郁的巴蜀文化特色。'
  },
  {
    id: 'foshan',
    name: '广东佛山',
    englishName: 'Foshan, Guangdong',
    position: { x: 68, y: 72 },
    description: '佛山年画是广东省佛山市的传统民间艺术，始于宋元时期。以红丹、金银色为特色，色彩艳丽夺目，常用金箔点缀，具有浓郁的岭南文化特色和商业文化气息。'
  }
];
