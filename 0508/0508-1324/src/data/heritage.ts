import type { HeritageContent } from '@/types';

export const heritageContents: HeritageContent[] = [
  {
    id: 'heritage-1',
    title: '侗族大歌的历史起源',
    content: '侗族大歌起源于春秋战国时期，至今已有2500多年的历史，是中国侗族地区一种多声部、无指挥、无伴奏、自然合声的民间合唱形式。侗族大歌的历史可以追溯到唐代，当时的侗族先民已经开始创作和演唱这种多声部合唱歌曲。侗族大歌主要流行于贵州省黔东南苗族侗族自治州黎平、从江、榕江三县毗邻地区，以及广西壮族自治区三江侗族自治县等地。',
    unlockRequirement: 3,
  },
  {
    id: 'heritage-2',
    title: '侗族大歌的声部结构特点',
    content: '侗族大歌是一种多声部合唱音乐，通常分为高音部、中音部和低音部三个声部，其中最具特色的是高音部和低音部的对比与融合。高音部通常由一人或数人演唱，曲调明亮高亢，富于装饰性；低音部则由众人演唱，曲调沉稳浑厚，起着基础和支撑的作用。侗族大歌的声部结构采用支声复调的手法，各声部之间既有独立性又相互协调，形成了独特的和声效果。',
    unlockRequirement: 6,
  },
  {
    id: 'heritage-3',
    title: '侗族大歌的演唱形式',
    content: '侗族大歌的演唱形式独特，通常在侗族鼓楼内进行，由歌师带领演唱。演唱者分为歌队，每队由数十人组成，分男女两队。演唱时无指挥、无伴奏，各声部自然合声。侗族大歌的演唱场合十分广泛，包括节日庆典、婚礼丧葬、迎宾待客等。最著名的演唱形式是"鼓楼大歌"，通常在重大节日或宾客来访时在鼓楼内演唱，场面庄重热烈。',
    unlockRequirement: 9,
  },
  {
    id: 'heritage-4',
    title: '侗族大歌的文化意义',
    content: '侗族大歌不仅是一种音乐形式，更是侗族文化的重要载体，承载着侗族的历史、哲学、伦理、美学等丰富的文化内涵。侗族大歌被誉为"侗族文化的活化石"，它通过歌唱的方式传承着侗族的历史记忆、生产生活知识和道德规范。侗族大歌中蕴含的"和谐"理念，体现了侗族人民崇尚自然、追求和谐的哲学思想。2009年，侗族大歌被联合国教科文组织列入人类非物质文化遗产代表作名录。',
    unlockRequirement: 12,
  },
  {
    id: 'heritage-5',
    title: '侗族大歌的传承现状',
    content: '侗族大歌的传承主要依靠家族传承和师徒传承，歌师在传承过程中起着关键作用。近年来，随着现代化进程的加快，侗族大歌的传承面临着许多挑战，年轻人外出打工，传统演唱场合减少等。为了保护和传承这一珍贵的文化遗产，政府和社会各界采取了一系列措施，包括建立侗族大歌生态博物馆、举办侗族大歌节、开展进校园活动等。通过这些努力，侗族大歌正在焕发出新的生命力，走向更广阔的舞台。',
    unlockRequirement: 15,
  },
];

export const getUnlockedHeritage = (unlockedIds: string[]) => {
  return heritageContents.filter(h => unlockedIds.includes(h.id));
};

export const getNextUnlockRequirement = (correctCount: number): number | null => {
  const locked = heritageContents.filter(h => h.unlockRequirement > correctCount);
  if (locked.length === 0) return null;
  return Math.min(...locked.map(h => h.unlockRequirement));
};
