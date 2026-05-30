const express = require("express");
const path = require("path");
const { initDb, getAllWrestlers, getWrestlerById, KNOT_STYLES, REGION_ROBE_STYLES, getMatchHistory, computeEffectiveFirmness, computeLeaderboard } = require("./database");
const { simulateMatch } = require("./simulation");

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/wrestlers", (req, res) => {
  const wrestlers = getAllWrestlers();
  for (const w of wrestlers) {
    w.win_rate = Math.round((w.wins / Math.max(w.wins + w.losses, 1)) * 1000) / 10;
    w.knot_info = KNOT_STYLES[w.knot_style] || {};
    w.effective_knot = computeEffectiveFirmness(w.knot_style, w.knot_skill || 50);
    w.robe_style = REGION_ROBE_STYLES[w.region] || null;
  }
  res.json(wrestlers);
});

app.get("/api/knot-styles", (req, res) => {
  res.json(KNOT_STYLES);
});

app.get("/api/robe-styles", (req, res) => {
  res.json(REGION_ROBE_STYLES);
});

app.post("/api/simulate", (req, res) => {
  const { wrestler_a_id, wrestler_b_id } = req.body;
  if (!wrestler_a_id || !wrestler_b_id) {
    return res.status(400).json({ error: "请选择两名选手" });
  }
  if (wrestler_a_id === wrestler_b_id) {
    return res.status(400).json({ error: "请选择不同的选手" });
  }

  const result = simulateMatch(wrestler_a_id, wrestler_b_id);
  if (!result) {
    return res.status(404).json({ error: "选手不存在" });
  }
  result.wrestler_a.robe_style = REGION_ROBE_STYLES[result.wrestler_a.region] || null;
  result.wrestler_b.robe_style = REGION_ROBE_STYLES[result.wrestler_b.region] || null;
  res.json(result);
});

app.get("/api/history", (req, res) => {
  const history = getMatchHistory();
  res.json(history);
});

app.get("/api/leaderboard", (req, res) => {
  const data = computeLeaderboard();
  res.json(data);
});

app.post("/api/export", (req, res) => {
  const { wrestler_a_id, wrestler_b_id } = req.body;
  if (!wrestler_a_id || !wrestler_b_id) {
    return res.status(400).json({ error: "请选择两名选手" });
  }

  const wa = getWrestlerById(wrestler_a_id);
  const wb = getWrestlerById(wrestler_b_id);
  if (!wa || !wb) {
    return res.status(404).json({ error: "选手不存在" });
  }

  const ka = KNOT_STYLES[wa.knot_style] || {};
  const kb = KNOT_STYLES[wb.knot_style] || {};
  const ra = REGION_ROBE_STYLES[wa.region] || {};
  const rb = REGION_ROBE_STYLES[wb.region] || {};
  const effA = computeEffectiveFirmness(wa.knot_style, wa.knot_skill || 50);
  const effB = computeEffectiveFirmness(wb.knot_style, wb.knot_skill || 50);

  const { simulateMatch: sim } = require("./simulation");

  const result = sim(wrestler_a_id, wrestler_b_id);
  if (!result) {
    return res.status(404).json({ error: "推演失败" });
  }

  const waRate = Math.round((wa.wins / (wa.wins + wa.losses)) * 1000) / 10;
  const wbRate = Math.round((wb.wins / (wb.wins + wb.losses)) * 1000) / 10;
  const kaBaseFirm = Math.round((ka.firmness || 0) * 100);
  const kbBaseFirm = Math.round((kb.firmness || 0) * 100);
  const kaEffFirm = Math.round(effA.effectiveFirmness * 100);
  const kbEffFirm = Math.round(effB.effectiveFirmness * 100);

  const report = `
╔══════════════════════════════════════════════════╗
║         蒙古族搏克配对推演报告卡                    ║
╚══════════════════════════════════════════════════╝

━━━━━━━━━━ 选手 A ━━━━━━━━━━
  姓名：${wa.name}
  体重：${wa.weight}kg
  地区：${wa.region}
  跤龄：${wa.experience}年
  战绩：${wa.wins}胜 ${wa.losses}负
  胜率：${waRate}%
  跤衣系带：${wa.knot_style}
  系带手艺熟练度：${wa.knot_skill || 50}
  固有牢固度：${kaBaseFirm}%（固有松脱风险：${ka.risk || '-'}）
  有效牢固度：${kaEffFirm}%（有效松脱风险：${effA.effectiveRisk}）
  跤衣样式：${ra.pattern || '-'}（${wa.region}传统）
  跤衣主色：${ra.primary_color || '-'}

━━━━━━━━━━ 选手 B ━━━━━━━━━━
  姓名：${wb.name}
  体重：${wb.weight}kg
  地区：${wb.region}
  跤龄：${wb.experience}年
  战绩：${wb.wins}胜 ${wb.losses}负
  胜率：${wbRate}%
  跤衣系带：${wb.knot_style}
  系带手艺熟练度：${wb.knot_skill || 50}
  固有牢固度：${kbBaseFirm}%（固有松脱风险：${kb.risk || '-'}）
  有效牢固度：${kbEffFirm}%（有效松脱风险：${effB.effectiveRisk}）
  跤衣样式：${rb.pattern || '-'}（${wb.region}传统）
  跤衣主色：${rb.primary_color || '-'}

━━━━━━━━ 预测结果 ━━━━━━━━
  ${wa.name} 胜率：${result.win_rate_a}%
  ${wb.name} 胜率：${result.win_rate_b}%

━━━━━━━━ 分析 ━━━━━━━━━━━
${result.analysis}

━━━━━━━━ 系带详解 ━━━━━━━━
  ${wa.knot_style}：${ka.description || '-'}
    手艺影响：熟练度${wa.knot_skill || 50} → 固有${kaBaseFirm}% → 有效${kaEffFirm}%
  ${wb.knot_style}：${kb.description || '-'}
    手艺影响：熟练度${wb.knot_skill || 50} → 固有${kbBaseFirm}% → 有效${kbEffFirm}%

━━━━━━━━ 跤衣文化 ━━━━━━━━
  ${wa.region}跤衣：${ra.description || '-'}
  ${wb.region}跤衣：${rb.description || '-'}
`;

  res.json({ report });
});

async function start() {
  await initDb();
  console.log("数据库初始化完成");

  app.listen(PORT, () => {
    console.log(`搏克配对模拟系统已启动: http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("启动失败:", err);
  process.exit(1);
});
