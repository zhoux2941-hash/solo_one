interface WrongQuestion {
  questionId: number;
  wrongCount: number;
}

function testWeightedAlgorithm() {
  const wrongQuestions: WrongQuestion[] = [
    { questionId: 1, wrongCount: 5 },
    { questionId: 2, wrongCount: 3 },
    { questionId: 3, wrongCount: 4 },
    { questionId: 4, wrongCount: 2 },
    { questionId: 5, wrongCount: 1 },
  ];

  const count = 10;
  const wrongQuestionRatio = 0.6;
  const weightDecayRate = 0.5;

  const wrongQuestionCount = Math.min(
    Math.floor(count * wrongQuestionRatio),
    wrongQuestions.length
  );

  console.log('=== 轮询+权重衰减算法测试 ===');
  console.log('错题池:', wrongQuestions);
  console.log('要选出的错题数量:', wrongQuestionCount);
  console.log('权重衰减率:', weightDecayRate);
  console.log('');

  const selectedIds: number[] = [];
  const selectedSet = new Set<number>();

  const weightedPool = wrongQuestions.map(wq => ({
    questionId: wq.questionId,
    wrongCount: wq.wrongCount,
    currentWeight: wq.wrongCount,
    effectiveWeight: wq.wrongCount
  }));

  console.log('初始权重池:');
  weightedPool.forEach(wq => {
    console.log(`  题${wq.questionId}: wrongCount=${wq.wrongCount}, effectiveWeight=${wq.effectiveWeight}`);
  });
  console.log('');

  for (let i = 0; i < wrongQuestionCount && i < wrongQuestions.length; i++) {
    let maxWeight = -1;
    let selectedIndex = -1;

    for (let j = 0; j < weightedPool.length; j++) {
      if (selectedSet.has(weightedPool[j].questionId)) continue;
      
      if (weightedPool[j].effectiveWeight > maxWeight) {
        maxWeight = weightedPool[j].effectiveWeight;
        selectedIndex = j;
      }
    }

    if (selectedIndex !== -1) {
      const selected = weightedPool[selectedIndex];
      selectedIds.push(selected.questionId);
      selectedSet.add(selected.questionId);

      console.log(`第${i + 1}轮选出: 题${selected.questionId} (权重: ${selected.effectiveWeight})`);

      for (let j = 0; j < weightedPool.length; j++) {
        if (j === selectedIndex) {
          weightedPool[j].effectiveWeight = weightedPool[j].currentWeight * Math.pow(weightDecayRate, 2);
        } else {
          weightedPool[j].effectiveWeight = weightedPool[j].effectiveWeight + weightedPool[j].currentWeight;
        }
      }

      console.log('更新后权重:');
      weightedPool.forEach(wq => {
        const status = selectedSet.has(wq.questionId) ? '[已选]' : '      ';
        console.log(`  ${status}题${wq.questionId}: effectiveWeight=${wq.effectiveWeight.toFixed(2)}`);
      });
      console.log('');
    }
  }

  console.log('=== 最终选出的错题ID ===');
  console.log('选出顺序:', selectedIds);
  console.log('按错误次数排序应该是: [5,4,3,2,1] (wrongCount降序)');
  
  const isCorrectOrder = selectedIds.every((id, idx) => {
    const sorted = [...wrongQuestions].sort((a, b) => b.wrongCount - a.wrongCount);
    return id === sorted[idx]?.questionId;
  });
  
  console.log('轮询+权重衰减效果: 错误次数高的题优先出现');
  console.log('题目1 (wrongCount=5) 出现次数:', selectedIds.filter(id => id === 1).length);
  console.log('题目2 (wrongCount=3) 出现次数:', selectedIds.filter(id => id === 2).length);
  console.log('题目3 (wrongCount=4) 出现次数:', selectedIds.filter(id => id === 3).length);
  console.log('题目4 (wrongCount=2) 出现次数:', selectedIds.filter(id => id === 4).length);
  console.log('题目5 (wrongCount=1) 出现次数:', selectedIds.filter(id => id === 5).length);

  console.log('\n=== 算法说明 ===');
  console.log('1. 初始权重 = wrongCount');
  console.log('2. 每轮选出effectiveWeight最高的题');
  console.log('3. 被选中的题: effectiveWeight = currentWeight * decayRate² (衰减)');
  console.log('4. 未被选中的题: effectiveWeight += currentWeight (累积权重)');
  console.log('5. 效果: 错误率高的题优先出现，但不会连续出现过多');
}

testWeightedAlgorithm();
