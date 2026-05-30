import { City, DrainageStructure, DrainageDescription } from '../types';

export interface CompareResult {
  category: string;
  aspect: string;
  city1Value: string;
  city2Value: string;
  difference: 'higher' | 'lower' | 'different' | 'similar';
}

export const compareCities = (
  city1: City,
  city2: City,
  structures1: DrainageStructure[],
  structures2: DrainageStructure[],
): CompareResult[] => {
  const results: CompareResult[] = [];

  results.push({
    category: '基本信息',
    aspect: '建造年代',
    city1Value: city1.year,
    city2Value: city2.year,
    difference: 'different',
  });

  results.push({
    category: '基本信息',
    aspect: '城池面积',
    city1Value: `${city1.area} 平方公里`,
    city2Value: `${city2.area} 平方公里`,
    difference: city1.area > city2.area ? 'higher' : city1.area < city2.area ? 'lower' : 'similar',
  });

  results.push({
    category: '基本信息',
    aspect: '城市人口',
    city1Value: city1.population,
    city2Value: city2.population,
    difference: 'different',
  });

  const countByType = (structures: DrainageStructure[], type: string) =>
    structures.filter(s => s.type === type).length;

  results.push({
    category: '排水设施',
    aspect: '出水口数量',
    city1Value: `${countByType(structures1, 'outlet')} 处`,
    city2Value: `${countByType(structures2, 'outlet')} 处`,
    difference: countByType(structures1, 'outlet') > countByType(structures2, 'outlet') ? 'higher' :
                countByType(structures1, 'outlet') < countByType(structures2, 'outlet') ? 'lower' : 'similar',
  });

  results.push({
    category: '排水设施',
    aspect: '排水渠长度',
    city1Value: `${countByType(structures1, 'canal')} 条干渠`,
    city2Value: `${countByType(structures2, 'canal')} 条干渠`,
    difference: countByType(structures1, 'canal') > countByType(structures2, 'canal') ? 'higher' :
                countByType(structures1, 'canal') < countByType(structures2, 'canal') ? 'lower' : 'similar',
  });

  results.push({
    category: '排水设施',
    aspect: '蓄水池数量',
    city1Value: `${countByType(structures1, 'reservoir')} 处`,
    city2Value: `${countByType(structures2, 'reservoir')} 处`,
    difference: countByType(structures1, 'reservoir') > countByType(structures2, 'reservoir') ? 'higher' :
                countByType(structures1, 'reservoir') < countByType(structures2, 'reservoir') ? 'lower' : 'similar',
  });

  const getMoatWidth = (structures: DrainageStructure[]) => {
    const moat = structures.find(s => s.type === 'moat');
    return moat ? '宽约20-40米' : '无';
  };

  results.push({
    category: '防御系统',
    aspect: '护城河规模',
    city1Value: getMoatWidth(structures1),
    city2Value: getMoatWidth(structures2),
    difference: 'different',
  });

  return results;
};

export const compareDescriptions = (
  desc1: DrainageDescription[],
  desc2: DrainageDescription[],
): Array<{
  category: string;
  city1: DrainageDescription;
  city2: DrainageDescription;
  similarities: string[];
  differences: string[];
}> => {
  const categories = ['open_ditch', 'terrain', 'defense'] as const;
  
  return categories.map(cat => {
    const d1 = desc1.find(d => d.category === cat)!;
    const d2 = desc2.find(d => d.category === cat)!;
    
    const similarities: string[] = [];
    const differences: string[] = [];

    if (cat === 'open_ditch') {
      similarities.push('都采用明沟暗渠结合的方式');
      similarities.push('都有街道排水系统');
      if (d1.features.length > 2 && d2.features.length > 2) {
        differences.push(`${d1.features[1]}`);
        differences.push(`${d2.features[1]}`);
      }
    } else if (cat === 'terrain') {
      similarities.push('都充分利用自然地势');
      similarities.push('都实现了重力流排水');
      differences.push(d1.features[0]);
      differences.push(d2.features[0]);
    } else {
      similarities.push('护城河都兼具排水与防御功能');
      similarities.push('水门都设有防御设施');
      if (d1.features.length > 1) {
        differences.push(d1.features[1]);
        differences.push(d2.features[1]);
      }
    }

    return {
      category: cat,
      city1: d1,
      city2: d2,
      similarities,
      differences,
    };
  });
};
