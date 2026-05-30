import type { ServiceArea, FacilityType } from './types'

function f(types: FacilityType[], unavailable: FacilityType[] = []): ServiceArea['facilities'] {
  return types.map((t) => ({ type: t, available: !unavailable.includes(t) }))
}

export const serviceAreas: ServiceArea[] = [
  // G4 京港澳高速
  { id: 'G4-01', name: '琉璃河服务区', highwayId: 'G4', distance: 35, svgX: 630, svgY: 215, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G4-02', name: '定州服务区', highwayId: 'G4', distance: 195, svgX: 595, svgY: 265, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G4-03', name: '安阳服务区', highwayId: 'G4', distance: 500, svgX: 582, svgY: 300, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G4-04', name: '许昌服务区', highwayId: 'G4', distance: 720, svgX: 580, svgY: 330, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom'], ['nursery']) },
  { id: 'G4-05', name: '信阳服务区', highwayId: 'G4', distance: 1050, svgX: 580, svgY: 395, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G4-06', name: '孝感服务区', highwayId: 'G4', distance: 1250, svgX: 580, svgY: 445, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G4-07', name: '咸宁服务区', highwayId: 'G4', distance: 1380, svgX: 580, svgY: 470, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G4-08', name: '岳阳服务区', highwayId: 'G4', distance: 1520, svgX: 580, svgY: 495, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G4-09', name: '长沙服务区', highwayId: 'G4', distance: 1680, svgX: 580, svgY: 520, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G4-10', name: '衡阳服务区', highwayId: 'G4', distance: 1880, svgX: 582, svgY: 555, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G4-11', name: '韶关服务区', highwayId: 'G4', distance: 2050, svgX: 586, svgY: 595, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G4-12', name: '广州服务区', highwayId: 'G4', distance: 2200, svgX: 592, svgY: 630, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },

  // G2 京沪高速
  { id: 'G2-01', name: '廊坊服务区', highwayId: 'G2', distance: 55, svgX: 650, svgY: 200, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G2-02', name: '天津服务区', highwayId: 'G2', distance: 120, svgX: 660, svgY: 218, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G2-03', name: '沧州服务区', highwayId: 'G2', distance: 280, svgX: 668, svgY: 248, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G2-04', name: '德州服务区', highwayId: 'G2', distance: 380, svgX: 672, svgY: 272, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G2-05', name: '济南服务区', highwayId: 'G2', distance: 490, svgX: 672, svgY: 288, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G2-06', name: '泰安服务区', highwayId: 'G2', distance: 560, svgX: 668, svgY: 302, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G2-07', name: '临沂服务区', highwayId: 'G2', distance: 720, svgX: 672, svgY: 335, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom'], ['nursery']) },
  { id: 'G2-08', name: '淮安服务区', highwayId: 'G2', distance: 870, svgX: 700, svgY: 358, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G2-09', name: '扬州服务区', highwayId: 'G2', distance: 1000, svgX: 715, svgY: 375, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G2-10', name: '镇江服务区', highwayId: 'G2', distance: 1080, svgX: 730, svgY: 382, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G2-11', name: '苏州服务区', highwayId: 'G2', distance: 1180, svgX: 750, svgY: 388, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },

  // G5 京昆高速
  { id: 'G5-01', name: '涿州服务区', highwayId: 'G5', distance: 65, svgX: 625, svgY: 210, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G5-02', name: '保定服务区', highwayId: 'G5', distance: 180, svgX: 605, svgY: 235, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G5-03', name: '石家庄服务区', highwayId: 'G5', distance: 310, svgX: 585, svgY: 258, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G5-04', name: '太原服务区', highwayId: 'G5', distance: 530, svgX: 560, svgY: 290, facilities: f(['gas_station', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G5-05', name: '临汾服务区', highwayId: 'G5', distance: 760, svgX: 530, svgY: 318, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },
  { id: 'G5-06', name: '西安服务区', highwayId: 'G5', distance: 1100, svgX: 490, svgY: 352, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G5-07', name: '汉中服务区', highwayId: 'G5', distance: 1380, svgX: 460, svgY: 395, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G5-08', name: '广元服务区', highwayId: 'G5', distance: 1560, svgX: 440, svgY: 420, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G5-09', name: '绵阳服务区', highwayId: 'G5', distance: 1750, svgX: 420, svgY: 450, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G5-10', name: '成都服务区', highwayId: 'G5', distance: 1920, svgX: 405, svgY: 475, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G5-11', name: '雅安服务区', highwayId: 'G5', distance: 2080, svgX: 395, svgY: 505, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },
  { id: 'G5-12', name: '西昌服务区', highwayId: 'G5', distance: 2400, svgX: 380, svgY: 550, facilities: f(['gas_station', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G5-13', name: '攀枝花服务区', highwayId: 'G5', distance: 2620, svgX: 375, svgY: 568, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },

  // G15 沈海高速
  { id: 'G15-01', name: '辽阳服务区', highwayId: 'G15', distance: 80, svgX: 758, svgY: 155, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G15-02', name: '大连服务区', highwayId: 'G15', distance: 350, svgX: 725, svgY: 212, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G15-03', name: '烟台服务区', highwayId: 'G15', distance: 620, svgX: 718, svgY: 265, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G15-04', name: '青岛服务区', highwayId: 'G15', distance: 780, svgX: 722, svgY: 288, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G15-05', name: '连云港服务区', highwayId: 'G15', distance: 1050, svgX: 735, svgY: 330, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G15-06', name: '盐城服务区', highwayId: 'G15', distance: 1250, svgX: 748, svgY: 358, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G15-07', name: '南通服务区', highwayId: 'G15', distance: 1420, svgX: 755, svgY: 380, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G15-08', name: '宁波服务区', highwayId: 'G15', distance: 1680, svgX: 750, svgY: 420, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G15-09', name: '温州服务区', highwayId: 'G15', distance: 1980, svgX: 740, svgY: 470, facilities: f(['gas_station', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G15-10', name: '福州服务区', highwayId: 'G15', distance: 2400, svgX: 720, svgY: 535, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G15-11', name: '厦门服务区', highwayId: 'G15', distance: 2720, svgX: 690, svgY: 568, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },
  { id: 'G15-12', name: '汕头服务区', highwayId: 'G15', distance: 3180, svgX: 640, svgY: 605, facilities: f(['gas_station', 'restaurant', 'restroom', 'nursery']) },

  // G30 连霍高速
  { id: 'G30-01', name: '连云港服务区', highwayId: 'G30', distance: 30, svgX: 700, svgY: 318, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G30-02', name: '徐州服务区', highwayId: 'G30', distance: 230, svgX: 662, svgY: 312, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G30-03', name: '商丘服务区', highwayId: 'G30', distance: 440, svgX: 625, svgY: 318, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },
  { id: 'G30-04', name: '开封服务区', highwayId: 'G30', distance: 580, svgX: 600, svgY: 322, facilities: f(['gas_station', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G30-05', name: '郑州服务区', highwayId: 'G30', distance: 680, svgX: 582, svgY: 322, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G30-06', name: '洛阳服务区', highwayId: 'G30', distance: 820, svgX: 545, svgY: 335, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },
  { id: 'G30-07', name: '渭南服务区', highwayId: 'G30', distance: 1020, svgX: 505, svgY: 345, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G30-08', name: '西安服务区', highwayId: 'G30', distance: 1100, svgX: 490, svgY: 348, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G30-09', name: '宝鸡服务区', highwayId: 'G30', distance: 1300, svgX: 445, svgY: 340, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G30-10', name: '天水服务区', highwayId: 'G30', distance: 1480, svgX: 410, svgY: 332, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G30-11', name: '兰州服务区', highwayId: 'G30', distance: 1780, svgX: 370, svgY: 322, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G30-12', name: '武威服务区', highwayId: 'G30', distance: 2100, svgX: 310, svgY: 280, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G30-13', name: '张掖服务区', highwayId: 'G30', distance: 2350, svgX: 260, svgY: 245, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G30-14', name: '嘉峪关服务区', highwayId: 'G30', distance: 2680, svgX: 210, svgY: 215, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G30-15', name: '哈密服务区', highwayId: 'G30', distance: 3200, svgX: 170, svgY: 180, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },
  { id: 'G30-16', name: '乌鲁木齐服务区', highwayId: 'G30', distance: 3800, svgX: 140, svgY: 172, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },

  // G50 沪渝高速
  { id: 'G50-01', name: '上海服务区', highwayId: 'G50', distance: 25, svgX: 755, svgY: 392, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G50-02', name: '苏州服务区', highwayId: 'G50', distance: 110, svgX: 738, svgY: 385, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },
  { id: 'G50-03', name: '湖州服务区', highwayId: 'G50', distance: 210, svgX: 720, svgY: 378, facilities: f(['gas_station', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G50-04', name: '芜湖服务区', highwayId: 'G50', distance: 400, svgX: 680, svgY: 398, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G50-05', name: '铜陵服务区', highwayId: 'G50', distance: 510, svgX: 650, svgY: 412, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G50-06', name: '安庆服务区', highwayId: 'G50', distance: 620, svgX: 620, svgY: 425, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G50-07', name: '黄梅服务区', highwayId: 'G50', distance: 760, svgX: 590, svgY: 435, facilities: f(['gas_station', 'restaurant', 'restroom', 'auto_repair']) },
  { id: 'G50-08', name: '武汉服务区', highwayId: 'G50', distance: 960, svgX: 560, svgY: 440, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
  { id: 'G50-09', name: '荆州服务区', highwayId: 'G50', distance: 1150, svgX: 510, svgY: 448, facilities: f(['gas_station', 'restaurant', 'restroom']) },
  { id: 'G50-10', name: '宜昌服务区', highwayId: 'G50', distance: 1300, svgX: 475, svgY: 455, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery']) },
  { id: 'G50-11', name: '恩施服务区', highwayId: 'G50', distance: 1500, svgX: 455, svgY: 458, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom']) },
  { id: 'G50-12', name: '重庆服务区', highwayId: 'G50', distance: 1768, svgX: 442, svgY: 462, facilities: f(['gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair']) },
]
