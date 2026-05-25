export interface Question {
  id: number;
  constitutionId: string;
  text: string;
  reverseScored: boolean;
}

export const questions: Question[] = [
  { id: 1, constitutionId: "pinghe", text: "您精力充沛吗？", reverseScored: false },
  { id: 2, constitutionId: "pinghe", text: "您容易疲乏吗？", reverseScored: true },
  { id: 3, constitutionId: "pinghe", text: "您说话声音低弱无力吗？", reverseScored: true },
  { id: 4, constitutionId: "pinghe", text: "您容易失眠多梦吗？", reverseScored: true },
  { id: 5, constitutionId: "pinghe", text: "您能适应外界自然和社会环境的变化吗？", reverseScored: false },
  { id: 6, constitutionId: "pinghe", text: "您容易感冒吗？", reverseScored: true },
  { id: 7, constitutionId: "pinghe", text: "您不喜欢说话吗？", reverseScored: true },
  { id: 8, constitutionId: "pinghe", text: "您情绪稳定、性格开朗吗？", reverseScored: false },

  { id: 9, constitutionId: "qixu", text: "您容易疲乏吗？", reverseScored: false },
  { id: 10, constitutionId: "qixu", text: "您容易气短、呼吸短促吗？", reverseScored: false },
  { id: 11, constitutionId: "qixu", text: "您说话声音低弱无力吗？", reverseScored: false },
  { id: 12, constitutionId: "qixu", text: "您容易头晕或站起时晕眩吗？", reverseScored: false },
  { id: 13, constitutionId: "qixu", text: "您比别人容易感冒吗？", reverseScored: false },
  { id: 14, constitutionId: "qixu", text: "您喜欢安静、懒得说话吗？", reverseScored: false },
  { id: 15, constitutionId: "qixu", text: "您活动量稍大就容易出虚汗吗？", reverseScored: false },
  { id: 16, constitutionId: "qixu", text: "您容易心慌吗？", reverseScored: false },

  { id: 17, constitutionId: "yangxu", text: "您手脚发凉吗？", reverseScored: false },
  { id: 18, constitutionId: "yangxu", text: "您胃脘部、背部或腰膝部怕冷吗？", reverseScored: false },
  { id: 19, constitutionId: "yangxu", text: "您比一般人怕冷吗？", reverseScored: false },
  { id: 20, constitutionId: "yangxu", text: "您喜欢热饮食吗？", reverseScored: false },
  { id: 21, constitutionId: "yangxu", text: "您吃凉东西会感到不舒服吗？", reverseScored: false },
  { id: 22, constitutionId: "yangxu", text: "您大便稀溏吗？", reverseScored: false },
  { id: 23, constitutionId: "yangxu", text: "您夜尿多吗？", reverseScored: false },

  { id: 24, constitutionId: "yinxu", text: "您手脚心发热吗？", reverseScored: false },
  { id: 25, constitutionId: "yinxu", text: "您口干咽燥吗？", reverseScored: false },
  { id: 26, constitutionId: "yinxu", text: "您面部或皮肤偏干吗？", reverseScored: false },
  { id: 27, constitutionId: "yinxu", text: "您比别人瘦吗？", reverseScored: false },
  { id: 28, constitutionId: "yinxu", text: "您大便干燥吗？", reverseScored: false },
  { id: 29, constitutionId: "yinxu", text: "您感到眼睛干涩吗？", reverseScored: false },
  { id: 30, constitutionId: "yinxu", text: "您容易失眠吗？", reverseScored: false },

  { id: 31, constitutionId: "tanshi", text: "您腹部松软肥胖吗？", reverseScored: false },
  { id: 32, constitutionId: "tanshi", text: "您身体沉重不轻松吗？", reverseScored: false },
  { id: 33, constitutionId: "tanshi", text: "您容易困倦吗？", reverseScored: false },
  { id: 34, constitutionId: "tanshi", text: "您嘴里有黏黏的感觉吗？", reverseScored: false },
  { id: 35, constitutionId: "tanshi", text: "您痰多吗？", reverseScored: false },
  { id: 36, constitutionId: "tanshi", text: "您舌苔厚腻吗？", reverseScored: false },
  { id: 37, constitutionId: "tanshi", text: "您面部出油多吗？", reverseScored: false },

  { id: 38, constitutionId: "shire", text: "您面部或鼻部出油吗？", reverseScored: false },
  { id: 39, constitutionId: "shire", text: "您容易生痤疮或疮疖吗？", reverseScored: false },
  { id: 40, constitutionId: "shire", text: "您感到口苦或嘴里有异味吗？", reverseScored: false },
  { id: 41, constitutionId: "shire", text: "您大便黏滞不爽吗？", reverseScored: false },
  { id: 42, constitutionId: "shire", text: "您小便时尿道有发热感吗？", reverseScored: false },
  { id: 43, constitutionId: "shire", text: "您舌苔黄腻吗？", reverseScored: false },
  { id: 44, constitutionId: "shire", text: "您皮肤容易瘙痒吗？", reverseScored: false },

  { id: 45, constitutionId: "xueyu", text: "您面色晦暗或容易出现褐斑吗？", reverseScored: false },
  { id: 46, constitutionId: "xueyu", text: "您身体某部位有刺痛感吗？", reverseScored: false },
  { id: 47, constitutionId: "xueyu", text: "您口唇颜色偏暗吗？", reverseScored: false },
  { id: 48, constitutionId: "xueyu", text: "您身上有瘀斑吗？", reverseScored: false },
  { id: 49, constitutionId: "xueyu", text: "您舌下静脉曲张吗？", reverseScored: false },
  { id: 50, constitutionId: "xueyu", text: "您容易忘事吗？", reverseScored: false },

  { id: 51, constitutionId: "qiyu", text: "您情绪低落、容易紧张焦虑吗？", reverseScored: false },
  { id: 52, constitutionId: "qiyu", text: "您多愁善感、感情脆弱吗？", reverseScored: false },
  { id: 53, constitutionId: "qiyu", text: "您感到闷闷不乐、情绪低沉吗？", reverseScored: false },
  { id: 54, constitutionId: "qiyu", text: "您容易精神紧张、焦虑不安吗？", reverseScored: false },
  { id: 55, constitutionId: "qiyu", text: "您容易无缘无故叹气吗？", reverseScored: false },
  { id: 56, constitutionId: "qiyu", text: "您感到胸胁胀痛吗？", reverseScored: false },

  { id: 57, constitutionId: "tebing", text: "您容易过敏（药物、食物、气味、花粉等）吗？", reverseScored: false },
  { id: 58, constitutionId: "tebing", text: "您容易起荨麻疹吗？", reverseScored: false },
  { id: 59, constitutionId: "tebing", text: "您容易鼻塞、打喷嚏、流鼻涕吗？", reverseScored: false },
  { id: 60, constitutionId: "tebing", text: "您容易哮喘吗？", reverseScored: false },
];

export function getQuestionsByConstitution(constitutionId: string): Question[] {
  return questions.filter((q) => q.constitutionId === constitutionId);
}

export function getQuestionCountByConstitution(constitutionId: string): number {
  return questions.filter((q) => q.constitutionId === constitutionId).length;
}
