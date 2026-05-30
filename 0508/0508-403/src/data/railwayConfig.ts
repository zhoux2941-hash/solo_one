import type { Line, Station, LineStation, Transfer } from '@/types';

interface StationConfig {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface LineStationConfig {
  stationId: string;
  minutesFromPrev: number;
}

interface LineConfig {
  id: string;
  name: string;
  color: string;
  stations: LineStationConfig[];
}

interface TransferConfig {
  stationId: string;
  fromLineId: string;
  toLineId: string;
  transferMinutes: number;
}

interface RailwayConfig {
  stations: StationConfig[];
  lines: LineConfig[];
  transfers: TransferConfig[];
}

export const railwayConfig: RailwayConfig = {
  stations: [
    { id: 'harbin', name: '哈尔滨西', x: 820, y: 80 },
    { id: 'changchun', name: '长春', x: 800, y: 145 },
    { id: 'shenyang', name: '沈阳', x: 780, y: 210 },
    { id: 'dalian', name: '大连', x: 795, y: 290 },
    { id: 'suifenhe', name: '绥芬河', x: 900, y: 70 },
    { id: 'qinhuangdao', name: '秦皇岛', x: 720, y: 260 },
    { id: 'beijing', name: '北京', x: 640, y: 310 },
    { id: 'tianjin', name: '天津', x: 690, y: 310 },
    { id: 'cangzhou', name: '沧州', x: 660, y: 360 },
    { id: 'dezhou', name: '德州', x: 640, y: 400 },
    { id: 'jinanxi', name: '济南西', x: 630, y: 440 },
    { id: 'taian', name: '泰安', x: 625, y: 470 },
    { id: 'xuzhou', name: '徐州', x: 610, y: 530 },
    { id: 'bengbu', name: '蚌埠', x: 620, y: 570 },
    { id: 'nanjingnan', name: '南京南', x: 640, y: 620 },
    { id: 'zhenjiang', name: '镇江', x: 650, y: 645 },
    { id: 'changzhou', name: '常州', x: 665, y: 670 },
    { id: 'wuxi', name: '无锡', x: 680, y: 685 },
    { id: 'suzhou', name: '苏州', x: 695, y: 700 },
    { id: 'shanghai', name: '上海虹桥', x: 720, y: 720 },
    { id: 'shijiazhuang', name: '石家庄', x: 590, y: 370 },
    { id: 'xingtai', name: '邢台', x: 575, y: 410 },
    { id: 'handan', name: '邯郸', x: 560, y: 440 },
    { id: 'xinxiang', name: '新乡', x: 545, y: 480 },
    { id: 'zhengzhoudong', name: '郑州东', x: 530, y: 510 },
    { id: 'xuchang', name: '许昌', x: 520, y: 550 },
    { id: 'luohe', name: '漯河', x: 510, y: 580 },
    { id: 'zhumadian', name: '驻马店', x: 500, y: 610 },
    { id: 'xinyang', name: '信阳', x: 490, y: 650 },
    { id: 'wuhan', name: '武汉', x: 460, y: 720 },
    { id: 'changsha', name: '长沙南', x: 400, y: 810 },
    { id: 'hengyang', name: '衡阳东', x: 380, y: 870 },
    { id: 'chenzhou', name: '郴州西', x: 370, y: 910 },
    { id: 'shaoguan', name: '韶关', x: 365, y: 950 },
    { id: 'guangzhounan', name: '广州南', x: 370, y: 1010 },
    { id: 'shenzhenbei', name: '深圳北', x: 390, y: 1050 },
    { id: 'hangzhou', name: '杭州东', x: 680, y: 730 },
    { id: 'yiwu', name: '义乌', x: 650, y: 760 },
    { id: 'jinhua', name: '金华', x: 635, y: 780 },
    { id: 'shangrao', name: '上饶', x: 600, y: 810 },
    { id: 'yingtan', name: '鹰潭', x: 570, y: 840 },
    { id: 'nanchang', name: '南昌西', x: 530, y: 850 },
    { id: 'yichun', name: '宜春', x: 490, y: 870 },
    { id: 'pingxiang', name: '萍乡', x: 460, y: 885 },
    { id: 'loudi', name: '娄底', x: 420, y: 870 },
    { id: 'shaoyang', name: '邵阳', x: 380, y: 890 },
    { id: 'huaihua', name: '怀化', x: 310, y: 910 },
    { id: 'tongren', name: '铜仁', x: 270, y: 930 },
    { id: 'guiyang', name: '贵阳北', x: 230, y: 960 },
    { id: 'anshun', name: '安顺', x: 200, y: 985 },
    { id: 'panxian', name: '盘州', x: 170, y: 1010 },
    { id: 'qujing', name: '曲靖', x: 140, y: 1040 },
    { id: 'kunming', name: '昆明南', x: 110, y: 1070 },
    { id: 'lanzhou', name: '兰州西', x: 310, y: 470 },
    { id: 'tianshui', name: '天水', x: 350, y: 490 },
    { id: 'baoji', name: '宝鸡', x: 400, y: 500 },
    { id: 'xian', name: '西安北', x: 450, y: 510 },
    { id: 'weinan', name: '渭南', x: 470, y: 520 },
    { id: 'luoyang', name: '洛阳龙门', x: 510, y: 510 },
    { id: 'kaifeng', name: '开封', x: 545, y: 500 },
    { id: 'shangqiu', name: '商丘', x: 580, y: 510 },
    { id: 'hefei', name: '合肥', x: 610, y: 640 },
    { id: 'jingzhou', name: '荆州', x: 420, y: 760 },
    { id: 'yichang', name: '宜昌', x: 390, y: 790 },
    { id: 'enshi', name: '恩施', x: 340, y: 820 },
    { id: 'chongqing', name: '重庆北', x: 280, y: 870 },
    { id: 'chengdu', name: '成都东', x: 230, y: 880 },
    { id: 'ningbo', name: '宁波', x: 720, y: 760 },
    { id: 'taizhou', name: '台州', x: 710, y: 800 },
    { id: 'wenzhou', name: '温州南', x: 700, y: 840 },
    { id: 'fuzhou', name: '福州', x: 660, y: 910 },
    { id: 'putian', name: '莆田', x: 650, y: 940 },
    { id: 'quanzhou', name: '泉州', x: 640, y: 960 },
    { id: 'xiamen', name: '厦门北', x: 625, y: 990 },
    { id: 'shantou', name: '汕头', x: 590, y: 1030 },
  ],

  lines: [
    {
      id: 'jinghu',
      name: '京沪线',
      color: '#EF4444',
      stations: [
        { stationId: 'beijing', minutesFromPrev: 0 },
        { stationId: 'tianjin', minutesFromPrev: 35 },
        { stationId: 'cangzhou', minutesFromPrev: 25 },
        { stationId: 'dezhou', minutesFromPrev: 25 },
        { stationId: 'jinanxi', minutesFromPrev: 25 },
        { stationId: 'taian', minutesFromPrev: 18 },
        { stationId: 'xuzhou', minutesFromPrev: 45 },
        { stationId: 'bengbu', minutesFromPrev: 35 },
        { stationId: 'nanjingnan', minutesFromPrev: 50 },
        { stationId: 'zhenjiang', minutesFromPrev: 20 },
        { stationId: 'changzhou', minutesFromPrev: 20 },
        { stationId: 'wuxi', minutesFromPrev: 15 },
        { stationId: 'suzhou', minutesFromPrev: 12 },
        { stationId: 'shanghai', minutesFromPrev: 25 },
      ],
    },
    {
      id: 'jingguang',
      name: '京广线',
      color: '#F59E0B',
      stations: [
        { stationId: 'beijing', minutesFromPrev: 0 },
        { stationId: 'shijiazhuang', minutesFromPrev: 80 },
        { stationId: 'xingtai', minutesFromPrev: 25 },
        { stationId: 'handan', minutesFromPrev: 22 },
        { stationId: 'xinxiang', minutesFromPrev: 30 },
        { stationId: 'zhengzhoudong', minutesFromPrev: 25 },
        { stationId: 'xuchang', minutesFromPrev: 22 },
        { stationId: 'luohe', minutesFromPrev: 22 },
        { stationId: 'zhumadian', minutesFromPrev: 25 },
        { stationId: 'xinyang', minutesFromPrev: 30 },
        { stationId: 'wuhan', minutesFromPrev: 90 },
        { stationId: 'changsha', minutesFromPrev: 90 },
        { stationId: 'hengyang', minutesFromPrev: 35 },
        { stationId: 'chenzhou', minutesFromPrev: 30 },
        { stationId: 'shaoguan', minutesFromPrev: 40 },
        { stationId: 'guangzhounan', minutesFromPrev: 55 },
        { stationId: 'shenzhenbei', minutesFromPrev: 20 },
      ],
    },
    {
      id: 'hukun',
      name: '沪昆线',
      color: '#10B981',
      stations: [
        { stationId: 'shanghai', minutesFromPrev: 0 },
        { stationId: 'hangzhou', minutesFromPrev: 55 },
        { stationId: 'yiwu', minutesFromPrev: 30 },
        { stationId: 'jinhua', minutesFromPrev: 18 },
        { stationId: 'shangrao', minutesFromPrev: 40 },
        { stationId: 'yingtan', minutesFromPrev: 25 },
        { stationId: 'nanchang', minutesFromPrev: 35 },
        { stationId: 'yichun', minutesFromPrev: 30 },
        { stationId: 'pingxiang', minutesFromPrev: 22 },
        { stationId: 'changsha', minutesFromPrev: 30 },
        { stationId: 'loudi', minutesFromPrev: 35 },
        { stationId: 'shaoyang', minutesFromPrev: 28 },
        { stationId: 'huaihua', minutesFromPrev: 55 },
        { stationId: 'tongren', minutesFromPrev: 35 },
        { stationId: 'guiyang', minutesFromPrev: 60 },
        { stationId: 'anshun', minutesFromPrev: 25 },
        { stationId: 'panxian', minutesFromPrev: 40 },
        { stationId: 'qujing', minutesFromPrev: 35 },
        { stationId: 'kunming', minutesFromPrev: 40 },
      ],
    },
    {
      id: 'hada',
      name: '哈大线',
      color: '#3B82F6',
      stations: [
        { stationId: 'harbin', minutesFromPrev: 0 },
        { stationId: 'changchun', minutesFromPrev: 55 },
        { stationId: 'shenyang', minutesFromPrev: 60 },
        { stationId: 'dalian', minutesFromPrev: 110 },
      ],
    },
    {
      id: 'jingha',
      name: '京哈线',
      color: '#8B5CF6',
      stations: [
        { stationId: 'suifenhe', minutesFromPrev: 0 },
        { stationId: 'harbin', minutesFromPrev: 140 },
        { stationId: 'changchun', minutesFromPrev: 55 },
        { stationId: 'shenyang', minutesFromPrev: 60 },
        { stationId: 'qinhuangdao', minutesFromPrev: 120 },
        { stationId: 'beijing', minutesFromPrev: 130 },
      ],
    },
    {
      id: 'xulan',
      name: '徐兰线',
      color: '#EC4899',
      stations: [
        { stationId: 'lanzhou', minutesFromPrev: 0 },
        { stationId: 'tianshui', minutesFromPrev: 60 },
        { stationId: 'baoji', minutesFromPrev: 45 },
        { stationId: 'xian', minutesFromPrev: 50 },
        { stationId: 'weinan', minutesFromPrev: 20 },
        { stationId: 'luoyang', minutesFromPrev: 65 },
        { stationId: 'zhengzhoudong', minutesFromPrev: 40 },
        { stationId: 'kaifeng', minutesFromPrev: 22 },
        { stationId: 'shangqiu', minutesFromPrev: 30 },
        { stationId: 'xuzhou', minutesFromPrev: 40 },
        { stationId: 'jinanxi', minutesFromPrev: 60 },
      ],
    },
    {
      id: 'huhanrong',
      name: '沪汉蓉线',
      color: '#06B6D4',
      stations: [
        { stationId: 'shanghai', minutesFromPrev: 0 },
        { stationId: 'nanjingnan', minutesFromPrev: 75 },
        { stationId: 'hefei', minutesFromPrev: 55 },
        { stationId: 'wuhan', minutesFromPrev: 100 },
        { stationId: 'jingzhou', minutesFromPrev: 55 },
        { stationId: 'yichang', minutesFromPrev: 45 },
        { stationId: 'enshi', minutesFromPrev: 65 },
        { stationId: 'chongqing', minutesFromPrev: 120 },
        { stationId: 'chengdu', minutesFromPrev: 90 },
      ],
    },
    {
      id: 'dongnanyanhai',
      name: '东南沿海线',
      color: '#F97316',
      stations: [
        { stationId: 'shanghai', minutesFromPrev: 0 },
        { stationId: 'hangzhou', minutesFromPrev: 55 },
        { stationId: 'ningbo', minutesFromPrev: 35 },
        { stationId: 'taizhou', minutesFromPrev: 30 },
        { stationId: 'wenzhou', minutesFromPrev: 30 },
        { stationId: 'fuzhou', minutesFromPrev: 80 },
        { stationId: 'putian', minutesFromPrev: 20 },
        { stationId: 'quanzhou', minutesFromPrev: 22 },
        { stationId: 'xiamen', minutesFromPrev: 28 },
        { stationId: 'shantou', minutesFromPrev: 80 },
        { stationId: 'shenzhenbei', minutesFromPrev: 120 },
      ],
    },
  ],

  transfers: [
    { stationId: 'beijing', fromLineId: 'jinghu', toLineId: 'jingha', transferMinutes: 10 },
    { stationId: 'beijing', fromLineId: 'jinghu', toLineId: 'jingguang', transferMinutes: 10 },
    { stationId: 'beijing', fromLineId: 'jingha', toLineId: 'jingguang', transferMinutes: 10 },
    { stationId: 'jinanxi', fromLineId: 'jinghu', toLineId: 'xulan', transferMinutes: 10 },
    { stationId: 'xuzhou', fromLineId: 'jinghu', toLineId: 'xulan', transferMinutes: 10 },
    { stationId: 'nanjingnan', fromLineId: 'jinghu', toLineId: 'huhanrong', transferMinutes: 10 },
    { stationId: 'shanghai', fromLineId: 'jinghu', toLineId: 'hukun', transferMinutes: 10 },
    { stationId: 'shanghai', fromLineId: 'jinghu', toLineId: 'huhanrong', transferMinutes: 10 },
    { stationId: 'shanghai', fromLineId: 'jinghu', toLineId: 'dongnanyanhai', transferMinutes: 10 },
    { stationId: 'shanghai', fromLineId: 'hukun', toLineId: 'huhanrong', transferMinutes: 10 },
    { stationId: 'shanghai', fromLineId: 'hukun', toLineId: 'dongnanyanhai', transferMinutes: 10 },
    { stationId: 'shanghai', fromLineId: 'huhanrong', toLineId: 'dongnanyanhai', transferMinutes: 10 },
    { stationId: 'zhengzhoudong', fromLineId: 'jingguang', toLineId: 'xulan', transferMinutes: 10 },
    { stationId: 'wuhan', fromLineId: 'jingguang', toLineId: 'huhanrong', transferMinutes: 15 },
    { stationId: 'changsha', fromLineId: 'jingguang', toLineId: 'hukun', transferMinutes: 10 },
    { stationId: 'hangzhou', fromLineId: 'hukun', toLineId: 'dongnanyanhai', transferMinutes: 10 },
    { stationId: 'harbin', fromLineId: 'jingha', toLineId: 'hada', transferMinutes: 10 },
    { stationId: 'changchun', fromLineId: 'jingha', toLineId: 'hada', transferMinutes: 10 },
    { stationId: 'shenyang', fromLineId: 'jingha', toLineId: 'hada', transferMinutes: 10 },
    { stationId: 'shenzhenbei', fromLineId: 'jingguang', toLineId: 'dongnanyanhai', transferMinutes: 10 },
  ],
};

function getStationLines(stationId: string): string[] {
  const lines: string[] = [];
  for (const line of railwayConfig.lines) {
    if (line.stations.some((s) => s.stationId === stationId)) {
      lines.push(line.id);
    }
  }
  return lines;
}

export const lines: Line[] = railwayConfig.lines.map((l) => ({
  id: l.id,
  name: l.name,
  color: l.color,
}));

export const lineMap: Record<string, Line> = Object.fromEntries(
  lines.map((l) => [l.id, l])
);

export const stations: Station[] = railwayConfig.stations.map((s) => ({
  id: s.id,
  name: s.name,
  x: s.x,
  y: s.y,
  lines: getStationLines(s.id),
}));

export const stationMap: Record<string, Station> = Object.fromEntries(
  stations.map((s) => [s.id, s])
);

export const lineStations: LineStation[] = railwayConfig.lines.flatMap((line) =>
  line.stations.map((ls, idx) => ({
    lineId: line.id,
    stationId: ls.stationId,
    order: idx + 1,
    minutesFromPrev: ls.minutesFromPrev,
  }))
);

export const lineStationsByLine: Record<string, LineStation[]> = {};
for (const ls of lineStations) {
  if (!lineStationsByLine[ls.lineId]) lineStationsByLine[ls.lineId] = [];
  lineStationsByLine[ls.lineId].push(ls);
}

export const transfers: Transfer[] = railwayConfig.transfers;

export const transferMap: Record<string, Transfer[]> = {};
for (const t of transfers) {
  if (!transferMap[t.stationId]) transferMap[t.stationId] = [];
  transferMap[t.stationId].push(t);
}
