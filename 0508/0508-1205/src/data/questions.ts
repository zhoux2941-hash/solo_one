import { Question } from '@/types';

const chapters = [
  '道路交通安全法律法规',
  '交通信号',
  '安全行车基础知识',
  '机动车驾驶操作基础知识',
  '违法行为综合判断与案例分析',
  '安全行车常识',
  '常见交通标志、标线和交通手势',
  '恶劣天气和复杂道路条件下的驾驶知识',
  '紧急情况下避险常识',
  '交通事故救护及常见危险品处置常识'
];

const questionTemplates = [
  {
    question: '机动车驾驶人初次申领驾驶证后的实习期是多长时间？',
    options: ['3个月', '6个月', '12个月', '24个月'],
    answer: 'C' as const,
    explanation: '根据《道路交通安全法实施条例》规定，机动车驾驶人初次申领驾驶证后的实习期为12个月。'
  },
  {
    question: '驾驶机动车在高速公路上行驶，车速超过每小时100公里时，应当与同车道前车保持多少米以上的距离？',
    options: ['50米', '100米', '150米', '200米'],
    answer: 'B' as const,
    explanation: '根据《道路交通安全法实施条例》规定，车速超过每小时100公里时，应当与同车道前车保持100米以上的距离。'
  },
  {
    question: '红色圆形信号灯亮时，表示什么？',
    options: ['准许车辆通行', '禁止车辆通行', '警示车辆注意', '车辆准备通行'],
    answer: 'B' as const,
    explanation: '红色圆形信号灯亮时，表示禁止车辆通行。这是最基本的交通信号灯含义。'
  },
  {
    question: '驾驶机动车遇到前方车辆停车排队等候时，以下做法正确的是？',
    options: ['从前方车辆两侧穿插', '从前方车辆左侧超越', '从前方车辆右侧超越', '依次排队等候'],
    answer: 'D' as const,
    explanation: '遇到前方车辆停车排队等候时，应当依次排队，不得从前方车辆两侧穿插或者超越行驶。'
  },
  {
    question: '机动车在道路上发生故障，需要停车排除时，驾驶人应当怎么做？',
    options: ['就地停车排除故障', '开启近光灯或雾灯', '将车移至不妨碍交通的地方停放', '将车停在道路中间'],
    answer: 'C' as const,
    explanation: '机动车在道路上发生故障，需要停车排除故障时，驾驶人应当立即开启危险报警闪光灯，将机动车移至不妨碍交通的地方停放。'
  },
  {
    question: '驾驶机动车在没有中心线的道路上遇对向来车时，应当怎样会车？',
    options: ['减速靠右通行', '加速靠右通行', '减速靠左通行', '加速靠左通行'],
    answer: 'A' as const,
    explanation: '在没有中心线的道路上遇对向来车时，应当减速靠右通行，并注意非机动车和行人安全。'
  },
  {
    question: '车辆驶近人行横道时，应当怎样做？',
    options: ['加速通过', '立即停车', '减速，注意观察，确认安全后通过', '鸣喇叭示意行人让道'],
    answer: 'C' as const,
    explanation: '车辆驶近人行横道时，应当减速，注意观察，确认安全后通过。遇行人正在通过人行横道，应当停车让行。'
  },
  {
    question: '在雾天行车时，应开启什么灯光？',
    options: ['远光灯', '近光灯', '雾灯和危险报警闪光灯', '倒车灯'],
    answer: 'C' as const,
    explanation: '雾天行车时，应当开启雾灯、近光灯、示廓灯和前后位灯，能见度低时还应开启危险报警闪光灯。'
  },
  {
    question: '驾驶机动车在山区冰雪路面上行驶，遇有前车正在爬坡时，后车应当怎样做？',
    options: ['紧随其后爬坡', '选择适当地点停车，等前车通过后再爬坡', '迅速超越前车', '鸣喇叭催促前车'],
    answer: 'B' as const,
    explanation: '在山区冰雪路面上行驶，遇有前车正在爬坡时，后车应当选择适当地点停车，等前车通过后再爬坡，以避免前车打滑后溜。'
  },
  {
    question: '机动车在道路上发生交通事故，造成人身伤亡时，驾驶人应当首先做什么？',
    options: ['立即将车移至路边', '立即停车，保护现场，抢救受伤人员', '立即离开现场', '立即与对方协商处理'],
    answer: 'B' as const,
    explanation: '发生交通事故造成人身伤亡时，驾驶人应当立即停车，保护现场，抢救受伤人员，并迅速报告执勤的交通警察或者公安机关交通管理部门。'
  }
];

function generateQuestion(baseId: number, templateIndex: number): Question {
  const template = questionTemplates[templateIndex % questionTemplates.length];
  const primaryChapterIndex = Math.floor(baseId / 100) % chapters.length;
  const secondaryChapterIndex = (primaryChapterIndex + 1 + Math.floor(baseId / 50)) % chapters.length;
  
  const questionChapters = [chapters[primaryChapterIndex]];
  if (baseId % 3 === 0) {
    questionChapters.push(chapters[secondaryChapterIndex]);
  }
  
  return {
    id: baseId,
    question: `【第${baseId}题】${template.question}`,
    optionA: template.options[0],
    optionB: template.options[1],
    optionC: template.options[2],
    optionD: template.options[3],
    answer: template.answer,
    explanation: template.explanation,
    chapters: questionChapters
  };
}

export const questions: Question[] = Array.from({ length: 1000 }, (_, i) => 
  generateQuestion(i + 1, i)
);

export function getRandomQuestions(count: number): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getQuestionsByChapter(chapter: string): Question[] {
  return questions.filter(q => q.chapters.includes(chapter));
}

export function getQuestionsByIds(ids: number[]): Question[] {
  return ids.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[];
}

interface WeightedOptions {
  wrongQuestions: { questionId: number; wrongCount: number }[];
  wrongQuestionRatio?: number;
  weightDecayRate?: number;
}

export function getWeightedRandomQuestions(
  count: number,
  options: WeightedOptions
): Question[] {
  const {
    wrongQuestions,
    wrongQuestionRatio = 0.4,
    weightDecayRate = 0.5
  } = options;

  const wrongQuestionCount = Math.min(
    Math.floor(count * wrongQuestionRatio),
    wrongQuestions.length
  );

  const wrongQuestionIds = new Set(wrongQuestions.map(wq => wq.questionId));

  const selectedQuestions: Question[] = [];
  const selectedIds = new Set<number>();

  if (wrongQuestionCount > 0 && wrongQuestions.length > 0) {
    const weightedPool = wrongQuestions.map(wq => ({
      questionId: wq.questionId,
      wrongCount: wq.wrongCount,
      currentWeight: wq.wrongCount,
      effectiveWeight: wq.wrongCount
    }));

    for (let i = 0; i < wrongQuestionCount && i < wrongQuestions.length; i++) {
      let maxWeight = -1;
      let selectedIndex = -1;

      for (let j = 0; j < weightedPool.length; j++) {
        if (selectedIds.has(weightedPool[j].questionId)) continue;
        
        if (weightedPool[j].effectiveWeight > maxWeight) {
          maxWeight = weightedPool[j].effectiveWeight;
          selectedIndex = j;
        }
      }

      if (selectedIndex !== -1) {
        const selected = weightedPool[selectedIndex];
        const question = questions.find(q => q.id === selected.questionId);
        if (question) {
          selectedQuestions.push(question);
          selectedIds.add(selected.questionId);
        }

        for (let j = 0; j < weightedPool.length; j++) {
          if (j === selectedIndex) {
            weightedPool[j].effectiveWeight = weightedPool[j].currentWeight * Math.pow(weightDecayRate, 2);
          } else {
            weightedPool[j].effectiveWeight = weightedPool[j].effectiveWeight + weightedPool[j].currentWeight;
          }
        }
      }
    }
  }

  const remainingCount = count - selectedQuestions.length;
  const normalQuestions = questions.filter(q => !wrongQuestionIds.has(q.id) && !selectedIds.has(q.id));
  const shuffledNormal = [...normalQuestions].sort(() => Math.random() - 0.5);
  const selectedNormalQuestions = shuffledNormal.slice(0, remainingCount);

  const allSelected = [...selectedQuestions, ...selectedNormalQuestions];
  return allSelected.sort(() => Math.random() - 0.5);
}
