const { KNOT_STYLES, getWrestlerById, saveMatch, computeEffectiveFirmness } = require("./database");

function calculateWinRate(wa, wb) {
  const knotA = KNOT_STYLES[wa.knot_style] || { firmness: 0.5 };
  const knotB = KNOT_STYLES[wb.knot_style] || { firmness: 0.5 };

  const effA = computeEffectiveFirmness(wa.knot_style, wa.knot_skill || 50);
  const effB = computeEffectiveFirmness(wb.knot_style, wb.knot_skill || 50);

  const winRateAExp = wa.wins / Math.max(wa.wins + wa.losses, 1);
  const winRateBExp = wb.wins / Math.max(wb.wins + wb.losses, 1);

  const weightFactor = (wa.weight - wb.weight) / 40.0;
  const expFactor = (wa.experience - wb.experience) / 10.0;
  const firmnessFactor = (effA.effectiveFirmness - effB.effectiveFirmness) * 0.3;

  let baseScoreA = 0.5 + weightFactor * 0.25 + expFactor * 0.2 + firmnessFactor + (winRateAExp - winRateBExp) * 0.15;

  const noise = (Math.random() - 0.5) * 0.1;
  const scoreA = Math.max(0.05, Math.min(0.95, baseScoreA + noise));
  const scoreB = 1.0 - scoreA;

  return [Math.round(scoreA * 1000) / 10, Math.round(scoreB * 1000) / 10];
}

function generateAnalysis(wa, wb, winRateA, winRateB) {
  const weightDiff = Math.abs(wa.weight - wb.weight);
  const expDiff = Math.abs(wa.experience - wb.experience);
  const knotA = KNOT_STYLES[wa.knot_style] || {};
  const knotB = KNOT_STYLES[wb.knot_style] || {};
  const effA = computeEffectiveFirmness(wa.knot_style, wa.knot_skill || 50);
  const effB = computeEffectiveFirmness(wb.knot_style, wb.knot_skill || 50);
  const parts = [];

  if (weightDiff > 20) {
    const heavier = wa.weight > wb.weight ? wa : wb;
    parts.push(`体重方面，${heavier.name}重${Math.max(wa.weight, wb.weight)}kg，比对手多${weightDiff}kg，具有明显力量优势。`);
  } else if (weightDiff > 10) {
    const heavier = wa.weight > wb.weight ? wa : wb;
    parts.push(`体重方面，${heavier.name}略重，差${weightDiff}kg，有一定力量优势。`);
  } else {
    parts.push(`体重方面，两位选手体重接近（差${weightDiff}kg），力量基本对等。`);
  }

  if (expDiff > 8) {
    const moreExp = wa.experience > wb.experience ? wa : wb;
    parts.push(`跤龄方面，${moreExp.name}经验丰富（${Math.max(wa.experience, wb.experience)}年），差${expDiff}年，技术成熟度差异明显。`);
  } else if (expDiff > 3) {
    const moreExp = wa.experience > wb.experience ? wa : wb;
    parts.push(`跤龄方面，${moreExp.name}经验更丰富，差${expDiff}年，有一定技术优势。`);
  } else {
    parts.push(`跤龄方面，两位选手经验相当（差${expDiff}年），技术水平接近。`);
  }

  const skillDiff = Math.abs((wa.knot_skill || 50) - (wb.knot_skill || 50));
  if (skillDiff > 20) {
    const moreSkilled = (wa.knot_skill || 50) > (wb.knot_skill || 50) ? wa : wb;
    const moreSkilledVal = Math.max(wa.knot_skill || 50, wb.knot_skill || 50);
    parts.push(`系带手艺方面，${moreSkilled.name}手艺精湛（熟练度${moreSkilledVal}），远胜对手（差${skillDiff}点），系带质量差异显著。`);
  } else if (skillDiff > 10) {
    const moreSkilled = (wa.knot_skill || 50) > (wb.knot_skill || 50) ? wa : wb;
    parts.push(`系带手艺方面，${moreSkilled.name}手艺更熟练（差${skillDiff}点），系带质量略优。`);
  } else {
    parts.push(`系带手艺方面，两位选手系带手艺相当（差${skillDiff}点），系带质量接近。`);
  }

  if (effA.effectiveRisk !== effB.effectiveRisk) {
    const safer = effA.effectiveFirmness > effB.effectiveFirmness ? wa : wb;
    parts.push(`综合系带评估，${wa.name}（${wa.knot_style}+手艺${wa.knot_skill || 50}）有效松脱风险：${effA.effectiveRisk}，${wb.name}（${wb.knot_style}+手艺${wb.knot_skill || 50}）有效松脱风险：${effB.effectiveRisk}。${safer.name}的系带综合更牢固。`);
  } else {
    const safer = effA.effectiveFirmness >= effB.effectiveFirmness ? wa : wb;
    if (effA.effectiveFirmness === effB.effectiveFirmness) {
      parts.push(`综合系带评估，两人有效松脱风险均为${effA.effectiveRisk}，系带牢固度完全对等。`);
    } else {
      parts.push(`综合系带评估，两人有效松脱风险均为${effA.effectiveRisk}，但${safer.name}的有效牢固度略高。`);
    }
  }

  const riskChanged = (w, eff) => {
    const base = KNOT_STYLES[w.knot_style] || {};
    return base.risk !== eff.effectiveRisk;
  };
  if (riskChanged(wa, effA)) {
    parts.push(`值得注意的是，${wa.name}虽使用${wa.knot_style}（固有风险：${effA.baseRisk}），但凭借手艺熟练度${wa.knot_skill || 50}，有效松脱风险调整为${effA.effectiveRisk}。`);
  }
  if (riskChanged(wb, effB)) {
    parts.push(`值得注意的是，${wb.name}虽使用${wb.knot_style}（固有风险：${effB.baseRisk}），但凭借手艺熟练度${wb.knot_skill || 50}，有效松脱风险调整为${effB.effectiveRisk}。`);
  }

  if (winRateA > winRateB) {
    parts.push(`综合预测：${wa.name}胜率为${winRateA}%，${wb.name}胜率为${winRateB}%，${wa.name}更被看好。`);
  } else if (winRateB > winRateA) {
    parts.push(`综合预测：${wb.name}胜率为${winRateB}%，${wa.name}胜率为${winRateA}%，${wb.name}更被看好。`);
  } else {
    parts.push("综合预测：两位选手实力相当，胜负难料。");
  }

  return parts.join("\n");
}

function simulateMatch(wrestlerAId, wrestlerBId) {
  const wa = getWrestlerById(wrestlerAId);
  const wb = getWrestlerById(wrestlerBId);
  if (!wa || !wb) return null;

  const [winRateA, winRateB] = calculateWinRate(wa, wb);
  const winnerId = Math.random() < winRateA / 100 ? wrestlerAId : wrestlerBId;

  saveMatch(wrestlerAId, wrestlerBId, winnerId, winRateA, winRateB);

  const effA = computeEffectiveFirmness(wa.knot_style, wa.knot_skill || 50);
  const effB = computeEffectiveFirmness(wb.knot_style, wb.knot_skill || 50);

  return {
    wrestler_a: wa,
    wrestler_b: wb,
    win_rate_a: winRateA,
    win_rate_b: winRateB,
    winner_id: winnerId,
    knot_a: KNOT_STYLES[wa.knot_style] || {},
    knot_b: KNOT_STYLES[wb.knot_style] || {},
    effective_knot_a: effA,
    effective_knot_b: effB,
    analysis: generateAnalysis(wa, wb, winRateA, winRateB),
  };
}

module.exports = { simulateMatch };
