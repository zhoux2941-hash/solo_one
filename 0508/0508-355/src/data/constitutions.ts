export interface Recipe {
  name: string;
  description: string;
  ingredients: string;
  effect: string;
}

export interface Constitution {
  id: string;
  name: string;
  color: string;
  description: string;
  traits: string;
  advice: {
    diet: string[];
    lifestyle: string[];
    exercise: string[];
    acupoints: { name: string; location: string; method: string }[];
  };
  recipes: Recipe[];
}

export const constitutions: Constitution[] = [
  {
    id: "pinghe",
    name: "平和质",
    color: "#4a9e7e",
    description: "阴阳气血调和，体形匀称健壮，面色红润有光泽，精力充沛",
    traits: "睡眠好，二便通畅，性格开朗，适应能力强",
    advice: {
      diet: [
        "饮食有节，不偏食、不挑食",
        "多吃五谷杂粮、蔬菜瓜果",
        "少食过于油腻辛辣之物",
        "注意饮食卫生，避免暴饮暴食",
      ],
      lifestyle: [
        "起居有常，劳逸结合",
        "保持乐观开朗的心态",
        "保证充足睡眠，不熬夜",
        "适度节制房事",
      ],
      exercise: [
        "坚持适度运动，如散步、慢跑、太极拳",
        "每周运动3-5次，每次30分钟以上",
        "运动强度以微微出汗为宜",
        "根据年龄和体质选择适合的运动方式",
      ],
      acupoints: [
        { name: "足三里", location: "小腿外侧，犊鼻下3寸", method: "用拇指按揉，每次1-3分钟，每日1次" },
        { name: "关元", location: "前正中线上，脐下3寸", method: "用掌心摩擦，每次3-5分钟，每日1次" },
      ],
    },
    recipes: [
      {
        name: "山药排骨汤",
        description: "健脾益胃，滋补强身",
        ingredients: "山药200g、排骨300g、枸杞10g、姜片适量",
        effect: "健脾养胃，补气养血，适合平和质日常调养",
      },
      {
        name: "五谷杂粮粥",
        description: "营养均衡，调理脾胃",
        ingredients: "大米50g、小米30g、黑米30g、红豆20g、绿豆20g",
        effect: "健脾养胃，调和五脏，维持身体平衡",
      },
      {
        name: "清蒸鲈鱼",
        description: "补肝肾，益脾胃",
        ingredients: "鲈鱼1条、葱丝、姜丝、蒸鱼豉油适量",
        effect: "补肝肾，益脾胃，适合平和质日常食用",
      },
    ],
  },
  {
    id: "qixu",
    name: "气虚质",
    color: "#e8a87c",
    description: "元气不足，容易疲乏，声音低弱，易出汗",
    traits: "肌肉松软，气短懒言，容易感冒",
    advice: {
      diet: [
        "宜食益气健脾食物，如山药、黄芪、小米、鸡肉",
        "少食生冷、苦寒食物，如西瓜、冰饮",
        "可常食山药粥、黄芪炖鸡",
        "饮食宜温热，忌生冷油腻",
      ],
      lifestyle: [
        "注意保暖，避免风寒",
        "不可过度劳累，注意休息",
        "保持心情舒畅，避免过度思虑",
        "避免剧烈运动和大汗淋漓",
      ],
      exercise: [
        "宜柔缓运动，如散步、太极拳、八段锦",
        "不宜剧烈运动和高强度训练",
        "运动时注意保暖，出汗后及时擦干",
        "每次运动20-30分钟，循序渐进",
      ],
      acupoints: [
        { name: "足三里", location: "小腿外侧，犊鼻下3寸", method: "用拇指按揉，每次1-3分钟，每日1次" },
        { name: "气海", location: "前正中线上，脐下1.5寸", method: "用艾条温和灸，每次10-15分钟，每日1次" },
        { name: "脾俞", location: "背部，第11胸椎棘突下旁开1.5寸", method: "用拇指按揉，每次2分钟，每日1次" },
      ],
    },
    recipes: [
      {
        name: "黄芪炖鸡",
        description: "补气健脾，增强体力",
        ingredients: "黄芪30g、鸡肉500g、红枣10颗、姜片适量",
        effect: "补气健脾，适合气虚质疲乏无力、容易感冒者",
      },
      {
        name: "山药小米粥",
        description: "健脾益气，养胃安神",
        ingredients: "山药100g、小米50g、红枣5颗",
        effect: "健脾益气，适合气虚质食欲不振、脾胃虚弱者",
      },
      {
        name: "党参瘦肉汤",
        description: "补中益气，强身健体",
        ingredients: "党参20g、瘦肉300g、茯苓15g、生姜3片",
        effect: "补中益气，适合气虚质气短懒言、体倦乏力者",
      },
    ],
  },
  {
    id: "yangxu",
    name: "阳虚质",
    color: "#d4753c",
    description: "阳气不足，畏寒怕冷，手足不温，喜热饮食",
    traits: "肌肉松软，精神不振，舌淡胖嫩",
    advice: {
      diet: [
        "宜食温热食物，如羊肉、牛肉、韭菜、生姜",
        "忌食生冷寒凉，如冰饮、生冷瓜果",
        "可常食当归生姜羊肉汤",
        "冬季可适当食用温热补品",
      ],
      lifestyle: [
        "注意保暖，尤其是腰腹和下肢",
        "夏季避免长时间待在空调房",
        "避免在寒冷环境中久留",
        "性生活要有节制，避免过度耗损阳气",
      ],
      exercise: [
        "宜在阳光充足时运动",
        "可选择慢跑、快走、太极拳等",
        "避免在寒冷及阴雨天运动",
        "运动后注意保暖，避免受凉",
      ],
      acupoints: [
        { name: "关元", location: "前正中线上，脐下3寸", method: "用艾条温和灸，每次15-20分钟，每日1次" },
        { name: "命门", location: "腰部，第2腰椎棘突下凹陷中", method: "用艾条温和灸，每次10-15分钟，每日1次" },
        { name: "肾俞", location: "腰部，第2腰椎棘突下旁开1.5寸", method: "用掌擦法，擦热为度，每日1次" },
      ],
    },
    recipes: [
      {
        name: "当归生姜羊肉汤",
        description: "温中补虚，散寒止痛",
        ingredients: "羊肉500g、当归20g、生姜30g",
        effect: "温阳散寒，适合阳虚质畏寒怕冷、手足不温者",
      },
      {
        name: "核桃韭菜炒虾仁",
        description: "温补肾阳，益精壮骨",
        ingredients: "核桃仁30g、韭菜200g、虾仁100g",
        effect: "温补肾阳，适合阳虚质腰膝酸软、夜尿多者",
      },
      {
        name: "肉桂炖牛肉",
        description: "温中散寒，补肾壮阳",
        ingredients: "牛肉500g、肉桂5g、八角2个、姜片适量",
        effect: "温中散寒，适合阳虚质胃脘冷痛、大便稀溏者",
      },
    ],
  },
  {
    id: "yinxu",
    name: "阴虚质",
    color: "#9b7ec4",
    description: "阴液亏少，口燥咽干，手足心热，喜冷饮",
    traits: "体形偏瘦，舌红少津，性情急躁",
    advice: {
      diet: [
        "宜食甘凉滋润食物，如银耳、百合、梨、鸭肉",
        "忌食辛辣燥热，如辣椒、羊肉、酒",
        "可常食银耳莲子羹、百合粥",
        "多饮水，保持体内水分充足",
      ],
      lifestyle: [
        "避免熬夜，保证充足睡眠",
        "保持心情平和，避免急躁易怒",
        "环境宜安静凉爽，避免高温环境",
        "性生活要适度，避免过度耗损阴精",
      ],
      exercise: [
        "宜选择柔和的运动，如太极拳、游泳、散步",
        "避免剧烈运动和大汗淋漓",
        "运动时间宜在清晨或傍晚",
        "运动时注意补充水分",
      ],
      acupoints: [
        { name: "太溪", location: "足内侧，内踝后方凹陷处", method: "用拇指按揉，每次2分钟，每日1次" },
        { name: "三阴交", location: "小腿内侧，内踝尖上3寸", method: "用拇指按揉，每次2分钟，每日1次" },
        { name: "照海", location: "足内侧，内踝尖下方凹陷处", method: "用拇指按揉，每次1-2分钟，每日1次" },
      ],
    },
    recipes: [
      {
        name: "银耳莲子羹",
        description: "滋阴润肺，养胃生津",
        ingredients: "银耳15g、莲子30g、百合15g、冰糖适量",
        effect: "滋阴润燥，适合阴虚质口干咽燥、手足心热者",
      },
      {
        name: "百合鸭肉粥",
        description: "滋阴清热，润肺止咳",
        ingredients: "百合30g、鸭肉100g、大米50g",
        effect: "滋阴清热，适合阴虚质体形偏瘦、大便干燥者",
      },
      {
        name: "雪梨冰糖盅",
        description: "润肺止咳，清热化痰",
        ingredients: "雪梨1个、川贝粉3g、冰糖适量",
        effect: "滋阴润肺，适合阴虚质眼睛干涩、失眠多梦者",
      },
    ],
  },
  {
    id: "tanshi",
    name: "痰湿质",
    color: "#6b8e9e",
    description: "痰湿凝聚，体形肥胖，腹部松软，口黏苔腻",
    traits: "面色淡黄，容易困倦，舌体胖大",
    advice: {
      diet: [
        "宜食健脾利湿食物，如薏米、冬瓜、荷叶、白萝卜",
        "忌食肥甘厚腻，如肥肉、奶油、甜食",
        "可常食薏米红豆粥、冬瓜汤",
        "饮食宜清淡，少盐少油",
      ],
      lifestyle: [
        "避免潮湿环境，保持居室干燥通风",
        "不宜久坐，应适当活动",
        "衣着宽松透气，避免紧身衣物",
        "定期体检，关注血糖血脂",
      ],
      exercise: [
        "需坚持长期运动，循序渐进",
        "可选择快走、慢跑、游泳、骑车",
        "运动强度逐步增加，以出汗为度",
        "每次运动30-60分钟，每周5次以上",
      ],
      acupoints: [
        { name: "丰隆", location: "小腿外侧，外踝尖上8寸", method: "用拇指按揉，每次2-3分钟，每日1次" },
        { name: "中脘", location: "前正中线上，脐上4寸", method: "用掌摩法，顺时针摩腹，每次5分钟，每日1次" },
        { name: "阴陵泉", location: "小腿内侧，胫骨内侧髁下缘凹陷处", method: "用拇指按揉，每次2分钟，每日1次" },
      ],
    },
    recipes: [
      {
        name: "薏米红豆粥",
        description: "健脾利湿，化痰消肿",
        ingredients: "薏米50g、红豆50g、茯苓20g",
        effect: "健脾利湿，适合痰湿质体形肥胖、腹部松软者",
      },
      {
        name: "冬瓜荷叶汤",
        description: "清热利湿，化痰减肥",
        ingredients: "冬瓜300g、鲜荷叶1张、瘦肉100g",
        effect: "利湿化痰，适合痰湿质身体沉重、容易困倦者",
      },
      {
        name: "白萝卜炖排骨",
        description: "理气化痰，健脾消食",
        ingredients: "白萝卜300g、排骨300g、陈皮10g",
        effect: "理气化痰，适合痰湿质痰多、口黏苔腻者",
      },
    ],
  },
  {
    id: "shire",
    name: "湿热质",
    color: "#c4654a",
    description: "湿热内蕴，面垢油光，易生痤疮，口苦口干",
    traits: "身重困倦，大便黏滞，舌质红苔黄腻",
    advice: {
      diet: [
        "宜食清热利湿食物，如绿豆、苦瓜、黄瓜、莲藕",
        "忌食辛辣滋腻，如辣椒、羊肉、酒、甜食",
        "可常食绿豆汤、凉拌苦瓜",
        "饮食宜清淡，多饮水",
      ],
      lifestyle: [
        "避免潮湿闷热环境",
        "保持皮肤清洁，避免油腻",
        "保持心情舒畅，避免急躁",
        "戒烟限酒，避免辛辣刺激",
      ],
      exercise: [
        "宜选择中高强度运动，如跑步、游泳、球类",
        "运动时间宜在清晨或傍晚凉爽时",
        "运动后及时清洁皮肤，更换衣物",
        "避免在高温高湿环境中运动",
      ],
      acupoints: [
        { name: "曲池", location: "肘横纹外侧端，屈肘取穴", method: "用拇指按揉，每次2分钟，每日1次" },
        { name: "阴陵泉", location: "小腿内侧，胫骨内侧髁下缘凹陷处", method: "用拇指按揉，每次2分钟，每日1次" },
        { name: "足三里", location: "小腿外侧，犊鼻下3寸", method: "用拇指按揉，每次2分钟，每日1次" },
      ],
    },
    recipes: [
      {
        name: "绿豆薏米汤",
        description: "清热利湿，解毒消肿",
        ingredients: "绿豆50g、薏米50g、冰糖适量",
        effect: "清热利湿，适合湿热质面垢油光、易生痤疮者",
      },
      {
        name: "凉拌苦瓜",
        description: "清热解毒，消暑明目",
        ingredients: "苦瓜300g、蒜末、生抽、醋、香油适量",
        effect: "清热泻火，适合湿热质口苦口干、大便黏滞者",
      },
      {
        name: "黄瓜莲藕拌",
        description: "清热生津，凉血止血",
        ingredients: "黄瓜200g、莲藕200g、醋、生抽、香油适量",
        effect: "清热利湿，适合湿热质身重困倦、舌苔黄腻者",
      },
    ],
  },
  {
    id: "xueyu",
    name: "血瘀质",
    color: "#a34040",
    description: "血行不畅，肤色晦暗，易有瘀斑，口唇暗淡",
    traits: "身体某部位常有刺痛感，舌质紫暗",
    advice: {
      diet: [
        "宜食活血化瘀食物，如山楂、醋、黑豆、玫瑰花",
        "忌食寒凉收涩，如冰饮、柿子",
        "可常食山楂红糖水、黑豆粥",
        "少量饮酒可活血，但不可过量",
      ],
      lifestyle: [
        "保持乐观开朗，避免抑郁苦闷",
        "注意防寒保暖，避免寒冷刺激",
        "避免长时间久坐不动",
        "可适当按摩推拿，促进气血运行",
      ],
      exercise: [
        "宜选择有氧运动，如快走、慢跑、舞蹈",
        "可练习太极拳、八段锦等",
        "运动时注意避免受伤",
        "运动前做好热身，运动后做好放松",
      ],
      acupoints: [
        { name: "血海", location: "大腿内侧，髌底内侧端上2寸", method: "用拇指按揉，每次2-3分钟，每日1次" },
        { name: "合谷", location: "手背，第1、2掌骨间凹陷处", method: "用拇指按揉，每次2分钟，每日1次" },
        { name: "太冲", location: "足背，第1、2跖骨间凹陷处", method: "用拇指按揉，每次2分钟，每日1次" },
      ],
    },
    recipes: [
      {
        name: "山楂红糖水",
        description: "活血化瘀，消食化积",
        ingredients: "山楂30g、红糖20g、红枣5颗",
        effect: "活血化瘀，适合血瘀质肤色晦暗、易有瘀斑者",
      },
      {
        name: "黑豆粥",
        description: "活血利水，祛风解毒",
        ingredients: "黑豆50g、大米50g、红糖适量",
        effect: "活血化瘀，适合血瘀质身体刺痛、口唇暗淡者",
      },
      {
        name: "玫瑰花茶",
        description: "行气解郁，活血止痛",
        ingredients: "玫瑰花6g、陈皮3g、蜂蜜适量",
        effect: "行气活血，适合血瘀质容易忘事、舌下静脉曲张者",
      },
    ],
  },
  {
    id: "qiyu",
    name: "气郁质",
    color: "#4a6e8e",
    description: "气机郁滞，情绪低落，胸胁胀满，善太息",
    traits: "性格内向，多愁善感，舌淡红苔薄白",
    advice: {
      diet: [
        "宜食疏肝理气食物，如橙子、柚子、薄荷、佛手",
        "少食收敛酸涩食物，如乌梅、石榴",
        "可常食陈皮茶、玫瑰花茶",
        "饮食宜清淡，忌肥甘厚腻",
      ],
      lifestyle: [
        "保持心情开朗，多与人交往",
        "培养兴趣爱好，陶冶情操",
        "避免独处时间过长",
        "适当倾诉，避免情绪积压",
      ],
      exercise: [
        "宜选择群体性运动，如广场舞、集体登山",
        "可练习瑜伽、冥想、呼吸放松",
        "多在户外阳光下活动",
        "运动时保持愉悦心情，避免竞技对抗",
      ],
      acupoints: [
        { name: "太冲", location: "足背，第1、2跖骨间凹陷处", method: "用拇指按揉，每次2-3分钟，每日1次" },
        { name: "期门", location: "胸部，乳头直下第6肋间隙", method: "用掌擦法，擦热为度，每日1次" },
        { name: "膻中", location: "前正中线上，两乳头连线中点", method: "用拇指按揉，每次2分钟，每日1次" },
      ],
    },
    recipes: [
      {
        name: "陈皮茶",
        description: "理气健脾，燥湿化痰",
        ingredients: "陈皮6g、佛手3g、蜂蜜适量",
        effect: "疏肝理气，适合气郁质情绪低落、胸胁胀满者",
      },
      {
        name: "薄荷菊花茶",
        description: "疏肝解郁，清热明目",
        ingredients: "薄荷3g、菊花5g、枸杞10g",
        effect: "疏肝解郁，适合气郁质多愁善感、善太息者",
      },
      {
        name: "白萝卜炖排骨",
        description: "理气化痰，消食除胀",
        ingredients: "白萝卜300g、排骨300g、陈皮10g",
        effect: "理气化痰，适合气郁质情绪低沉、容易紧张者",
      },
    ],
  },
  {
    id: "tebing",
    name: "特禀质",
    color: "#8cb369",
    description: "过敏体质，易对药物、食物、花粉等过敏",
    traits: "易患哮喘、荨麻疹、过敏性鼻炎",
    advice: {
      diet: [
        "饮食宜清淡均衡，粗细搭配",
        "避免食用已知过敏食物",
        "少食荞麦、蚕豆、牛肉、鹅肉",
        "可常食蜂蜜、红枣、胡萝卜",
      ],
      lifestyle: [
        "避免接触已知过敏原",
        "注意环境卫生，保持室内清洁",
        "季节更替时注意防护",
        "保持心情舒畅，减少精神压力",
      ],
      exercise: [
        "选择温和的运动，如散步、游泳",
        "避免在花粉季节或空气污染严重时运动",
        "运动时注意观察身体反应",
        "避免剧烈运动和过度疲劳",
      ],
      acupoints: [
        { name: "曲池", location: "肘横纹外侧端，屈肘取穴", method: "用拇指按揉，每次2分钟，每日1次" },
        { name: "血海", location: "大腿内侧，髌底内侧端上2寸", method: "用拇指按揉，每次2分钟，每日1次" },
        { name: "足三里", location: "小腿外侧，犊鼻下3寸", method: "用拇指按揉，每次2分钟，每日1次" },
      ],
    },
    recipes: [
      {
        name: "蜂蜜红枣茶",
        description: "补气养血，增强免疫",
        ingredients: "红枣10颗、蜂蜜适量、枸杞10g",
        effect: "补气养血，适合特禀质容易过敏、体质虚弱者",
      },
      {
        name: "胡萝卜炒木耳",
        description: "补气健脾，养血润燥",
        ingredients: "胡萝卜200g、黑木耳50g、瘦肉100g",
        effect: "补气健脾，适合特禀质易患哮喘、荨麻疹者",
      },
      {
        name: "山药排骨汤",
        description: "健脾益胃，滋补强身",
        ingredients: "山药200g、排骨300g、枸杞10g、姜片适量",
        effect: "健脾益胃，适合特禀质过敏性鼻炎、容易感冒者",
      },
    ],
  },
];

export const CONSTITUTION_ORDER = [
  "pinghe",
  "qixu",
  "yangxu",
  "yinxu",
  "tanshi",
  "shire",
  "xueyu",
  "qiyu",
  "tebing",
] as const;

export function getConstitution(id: string): Constitution | undefined {
  return constitutions.find((c) => c.id === id);
}

export function getConstitutionName(id: string): string {
  return getConstitution(id)?.name ?? id;
}

export function getConstitutionColor(id: string): string {
  return getConstitution(id)?.color ?? "#999";
}
