const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "boke.db");

const WRESTLERS = [
  { id: 1, name: "巴特尔", weight: 120, region: "锡林郭勒", experience: 15, wins: 87, losses: 13, knot_style: "蝴蝶结", knot_skill: 82 },
  { id: 2, name: "苏和", weight: 105, region: "呼伦贝尔", experience: 10, wins: 62, losses: 28, knot_style: "方结", knot_skill: 68 },
  { id: 3, name: "那顺乌日图", weight: 135, region: "赤峰", experience: 18, wins: 102, losses: 18, knot_style: "双环结", knot_skill: 91 },
  { id: 4, name: "朝鲁门", weight: 98, region: "通辽", experience: 7, wins: 41, losses: 29, knot_style: "单结", knot_skill: 45 },
  { id: 5, name: "额尔敦", weight: 112, region: "鄂尔多斯", experience: 12, wins: 73, losses: 27, knot_style: "蝴蝶结", knot_skill: 58 },
  { id: 6, name: "图门巴雅尔", weight: 128, region: "巴彦淖尔", experience: 20, wins: 115, losses: 25, knot_style: "方结", knot_skill: 95 },
  { id: 7, name: "阿斯尔", weight: 95, region: "乌兰察布", experience: 5, wins: 28, losses: 22, knot_style: "活结", knot_skill: 35 },
  { id: 8, name: "孟和", weight: 118, region: "阿拉善", experience: 14, wins: 80, losses: 30, knot_style: "双环结", knot_skill: 73 },
];

const KNOT_STYLES = {
  "蝴蝶结": { risk: "中", risk_score: 0.5, description: "传统蝴蝶结系法，美观但受力后易松动，需频繁调整", firmness: 0.6 },
  "方结": { risk: "低", risk_score: 0.2, description: "方结系法牢固稳定，不易松脱，是搏克高手的首选", firmness: 0.9 },
  "双环结": { risk: "低", risk_score: 0.15, description: "双环结构双重固定，最为牢固，适合力量型选手", firmness: 0.95 },
  "单结": { risk: "高", risk_score: 0.8, description: "单结系法简单快速，但在激烈对抗中极易松脱", firmness: 0.3 },
  "活结": { risk: "高", risk_score: 0.85, description: "活结便于快速穿脱，但牢固度最差，比赛中有极大松脱风险", firmness: 0.2 },
};

const REGION_ROBE_STYLES = {
  "锡林郭勒": {
    primary_color: "#1A365D",
    secondary_color: "#F5E6C8",
    accent_color: "#C0392B",
    pattern: "云纹",
    collar_color: "#D4A843",
    pattern_svg: `
      <pattern id="xlgl_pattern" patternUnits="userSpaceOnUse" width="20" height="20">
        <path d="M0,10 Q5,5 10,10 T20,10" fill="none" stroke="#F5E6C8" stroke-width="1.5" opacity="0.6"/>
        <circle cx="5" cy="5" r="1" fill="#F5E6C8" opacity="0.5"/>
        <circle cx="15" cy="15" r="1" fill="#F5E6C8" opacity="0.5"/>
      </pattern>`,
    description: "锡林郭勒跤衣以深蓝为底色，配以传统云纹图案，象征广阔的草原与天空。金色镶边彰显王者气度，是搏克文化的经典传承。",
    trim_color: "#D4A843",
  },
  "呼伦贝尔": {
    primary_color: "#1E5631",
    secondary_color: "#E8F5E9",
    accent_color: "#8B4513",
    pattern: "鹿角纹",
    collar_color: "#C19A6B",
    pattern_svg: `
      <pattern id="hlbe_pattern" patternUnits="userSpaceOnUse" width="24" height="24">
        <path d="M2,24 L2,12 L6,8 L6,16 L8,16 L8,6 L4,2 M8,6 L12,10 L12,20 L14,20 L14,8 L10,4" fill="none" stroke="#E8F5E9" stroke-width="1.2" opacity="0.5"/>
      </pattern>`,
    description: "呼伦贝尔跤衣采用森林绿为主色调，鹿角纹图案呼应当地驯鹿文化。棕色镶边代表大兴安岭的沃土，体现狩猎与游牧文明的融合。",
    trim_color: "#C19A6B",
  },
  "赤峰": {
    primary_color: "#7B1113",
    secondary_color: "#FDEBD0",
    accent_color: "#F1C40F",
    pattern: "龙凤纹",
    collar_color: "#F1C40F",
    pattern_svg: `
      <pattern id="cf_pattern" patternUnits="userSpaceOnUse" width="28" height="28">
        <path d="M4,20 Q8,12 14,16 Q20,20 24,14" fill="none" stroke="#F1C40F" stroke-width="1.5" opacity="0.7"/>
        <circle cx="14" cy="8" r="3" fill="none" stroke="#F1C40F" stroke-width="1" opacity="0.5"/>
        <path d="M6,6 L10,2 L14,6 L18,2 L22,6" fill="none" stroke="#FDEBD0" stroke-width="1" opacity="0.4"/>
      </pattern>`,
    description: "赤峰跤衣以辽西红为底色，龙凤纹图案象征红山文化的源远流长。金色纹饰富丽堂皇，体现契丹文化与蒙古族文化的交融。",
    trim_color: "#F1C40F",
  },
  "通辽": {
    primary_color: "#4A235A",
    secondary_color: "#E8DAEF",
    accent_color: "#BB8FCE",
    pattern: "盘肠纹",
    collar_color: "#D7BDE2",
    pattern_svg: `
      <pattern id="tl_pattern" patternUnits="userSpaceOnUse" width="22" height="22">
        <rect x="4" y="4" width="14" height="14" fill="none" stroke="#E8DAEF" stroke-width="1.5" opacity="0.5"/>
        <path d="M4,4 L18,18 M4,18 L18,4" fill="none" stroke="#BB8FCE" stroke-width="1" opacity="0.6"/>
        <circle cx="11" cy="11" r="3" fill="none" stroke="#E8DAEF" stroke-width="1" opacity="0.4"/>
      </pattern>`,
    description: "通辽跤衣采用高贵的紫色调，盘肠纹寓意福寿绵长、吉祥如意。银色镶边象征科尔沁草原的月色，是蒙古族文化中尊贵与智慧的代表。",
    trim_color: "#D7BDE2",
  },
  "鄂尔多斯": {
    primary_color: "#873600",
    secondary_color: "#FAD7A0",
    accent_color: "#F39C12",
    pattern: "万字纹",
    collar_color: "#F39C12",
    pattern_svg: `
      <pattern id="erds_pattern" patternUnits="userSpaceOnUse" width="18" height="18">
        <path d="M2,2 H8 V8 H2 Z M10,2 H16 V8 H10 Z M2,10 H8 V16 H2 Z M10,10 H16 V16 H16 Z" fill="none" stroke="#F39C12" stroke-width="1" opacity="0.5"/>
        <path d="M0,9 H18 M9,0 V18" stroke="#FAD7A0" stroke-width="0.5" opacity="0.4"/>
      </pattern>`,
    description: "鄂尔多斯跤衣以土默特褐为主色，万字纹象征永恒不灭与太阳崇拜。金色纹饰富丽堂皇，体现成吉思汗黄金家族的传承。",
    trim_color: "#F39C12",
  },
  "巴彦淖尔": {
    primary_color: "#154360",
    secondary_color: "#AED6F1",
    accent_color: "#D4A843",
    pattern: "回纹",
    collar_color: "#D4A843",
    pattern_svg: `
      <pattern id="byne_pattern" patternUnits="userSpaceOnUse" width="16" height="16">
        <path d="M2,2 H14 V14 H2 Z" fill="none" stroke="#D4A843" stroke-width="1" opacity="0.5"/>
        <path d="M6,6 H10 V10 H6 Z" fill="none" stroke="#AED6F1" stroke-width="1" opacity="0.6"/>
        <path d="M0,8 H16 M8,0 V16" stroke="#AED6F1" stroke-width="0.5" opacity="0.3"/>
      </pattern>`,
    description: "巴彦淖尔跤衣采用河套蓝为主色调，回纹图案寓意富贵不断头。金色镶边象征黄河的富饶，展现河套平原的独特魅力。",
    trim_color: "#D4A843",
  },
  "乌兰察布": {
    primary_color: "#145A32",
    secondary_color: "#D5F5E3",
    accent_color: "#AAB7B8",
    pattern: "卷草纹",
    collar_color: "#AAB7B8",
    pattern_svg: `
      <pattern id="wlcb_pattern" patternUnits="userSpaceOnUse" width="20" height="20">
        <path d="M0,10 Q5,5 10,10 T20,10" fill="none" stroke="#D5F5E3" stroke-width="1.2" opacity="0.5"/>
        <path d="M0,15 Q5,10 10,15 T20,15" fill="none" stroke="#AAB7B8" stroke-width="1" opacity="0.4"/>
        <path d="M0,5 Q5,0 10,5 T20,5" fill="none" stroke="#D5F5E3" stroke-width="1" opacity="0.3"/>
      </pattern>`,
    description: "乌兰察布跤衣以草原绿为主色，卷草纹图案寓意生命力旺盛与生生不息。银色镶边象征辉腾锡勒的风车，体现传统与现代的结合。",
    trim_color: "#AAB7B8",
  },
  "阿拉善": {
    primary_color: "#5D4E37",
    secondary_color: "#F5CBA7",
    accent_color: "#E74C3C",
    pattern: "几何纹",
    collar_color: "#E74C3C",
    pattern_svg: `
      <pattern id="als_pattern" patternUnits="userSpaceOnUse" width="18" height="18">
        <polygon points="9,2 16,9 9,16 2,9" fill="none" stroke="#E74C3C" stroke-width="1" opacity="0.6"/>
        <polygon points="9,5 13,9 9,13 5,9" fill="none" stroke="#F5CBA7" stroke-width="1" opacity="0.5"/>
        <circle cx="9" cy="9" r="1.5" fill="#F5CBA7" opacity="0.4"/>
      </pattern>`,
    description: "阿拉善跤衣以驼绒褐为底色，几何纹图案呼应沙漠绿洲与古城建筑。红色点缀象征骆驼刺的顽强生命力，展现戈壁大漠的独特风情。",
    trim_color: "#E74C3C",
  },
};

let db = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS wrestlers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      weight INTEGER NOT NULL,
      region TEXT NOT NULL,
      experience INTEGER NOT NULL,
      wins INTEGER NOT NULL,
      losses INTEGER NOT NULL,
      knot_style TEXT NOT NULL,
      knot_skill INTEGER NOT NULL DEFAULT 50
    )
  `);

  try { db.run("ALTER TABLE wrestlers ADD COLUMN knot_skill INTEGER NOT NULL DEFAULT 50"); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wrestler_a_id INTEGER NOT NULL,
      wrestler_b_id INTEGER NOT NULL,
      winner_id INTEGER,
      win_rate_a REAL,
      win_rate_b REAL,
      simulated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  const count = db.exec("SELECT COUNT(*) FROM wrestlers");
  if (count.length === 0 || count[0].values[0][0] === 0) {
    for (const w of WRESTLERS) {
      db.run(
        "INSERT INTO wrestlers (id, name, weight, region, experience, wins, losses, knot_style, knot_skill) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [w.id, w.name, w.weight, w.region, w.experience, w.wins, w.losses, w.knot_style, w.knot_skill]
      );
    }
    saveDb();
  } else {
    for (const w of WRESTLERS) {
      db.run(
        "UPDATE wrestlers SET knot_skill = ? WHERE id = ?",
        [w.knot_skill, w.id]
      );
    }
    saveDb();
  }

  return db;
}

function getAllWrestlers() {
  const results = db.exec("SELECT * FROM wrestlers ORDER BY id");
  if (results.length === 0) return [];
  const cols = results[0].columns;
  return results[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj;
  });
}

function getWrestlerById(wid) {
  const results = db.exec("SELECT * FROM wrestlers WHERE id = ?", [wid]);
  if (results.length === 0 || results[0].values.length === 0) return null;
  const cols = results[0].columns;
  const row = results[0].values[0];
  const obj = {};
  cols.forEach((c, i) => { obj[c] = row[i]; });
  return obj;
}

function saveMatch(wrestlerAId, wrestlerBId, winnerId, winRateA, winRateB) {
  db.run(
    "INSERT INTO match_history (wrestler_a_id, wrestler_b_id, winner_id, win_rate_a, win_rate_b) VALUES (?, ?, ?, ?, ?)",
    [wrestlerAId, wrestlerBId, winnerId, winRateA, winRateB]
  );
  saveDb();
}

function getMatchHistory(limit = 20) {
  const results = db.exec(`
    SELECT mh.id, mh.wrestler_a_id, mh.wrestler_b_id, mh.winner_id, mh.win_rate_a, mh.win_rate_b, mh.simulated_at,
      wa.name as wrestler_a_name, wb.name as wrestler_b_name, wn.name as winner_name
    FROM match_history mh
    LEFT JOIN wrestlers wa ON mh.wrestler_a_id = wa.id
    LEFT JOIN wrestlers wb ON mh.wrestler_b_id = wb.id
    LEFT JOIN wrestlers wn ON mh.winner_id = wn.id
    ORDER BY mh.simulated_at DESC
    LIMIT ${limit}
  `);
  if (results.length === 0) return [];
  const cols = results[0].columns;
  return results[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj;
  });
}

function getAllMatches() {
  const results = db.exec(`
    SELECT id, wrestler_a_id, wrestler_b_id, winner_id, win_rate_a, win_rate_b, simulated_at
    FROM match_history
    ORDER BY simulated_at ASC
  `);
  if (results.length === 0) return [];
  const cols = results[0].columns;
  return results[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj;
  });
}

function getHeadToHeadMap(matches) {
  const h2h = {};
  for (const m of matches) {
    if (!m.winner_id) continue;
    const a = m.wrestler_a_id;
    const b = m.wrestler_b_id;
    const winner = m.winner_id;
    const loser = winner === a ? b : a;
    const key = `${Math.min(winner, loser)}_${Math.max(winner, loser)}`;
    if (!h2h[key]) h2h[key] = { wins: {}, count: 0 };
    h2h[key].wins[winner] = (h2h[key].wins[winner] || 0) + 1;
    h2h[key].count++;
  }
  return h2h;
}

function compareWrestlers(a, b, h2h) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;

  const key = `${Math.min(a.id, b.id)}_${Math.max(a.id, b.id)}`;
  const h = h2h[key];
  if (h && h.count > 0) {
    const aWins = h.wins[a.id] || 0;
    const bWins = h.wins[b.id] || 0;
    if (aWins !== bWins) return bWins - aWins;
  }

  if (b.matches !== a.matches) return b.matches - a.matches;
  return a.id - b.id;
}

function computeLeaderboard() {
  const wrestlers = getAllWrestlers();
  const matches = getAllMatches();
  const h2h = getHeadToHeadMap(matches);

  const stats = {};
  for (const w of wrestlers) {
    stats[w.id] = {
      id: w.id,
      name: w.name,
      region: w.region,
      weight: w.weight,
      experience: w.experience,
      wins: 0,
      losses: 0,
      matches: 0,
      points: 0,
      win_rate: 0,
      form: [],
      robe_style: REGION_ROBE_STYLES[w.region] || null,
    };
  }

  for (const m of matches) {
    const a = m.wrestler_a_id;
    const b = m.wrestler_b_id;
    if (!stats[a] || !stats[b]) continue;

    stats[a].matches++;
    stats[b].matches++;

    if (m.winner_id === a) {
      stats[a].wins++;
      stats[a].points += 3;
      stats[b].losses++;
      stats[a].form.push('W');
      stats[b].form.push('L');
    } else if (m.winner_id === b) {
      stats[b].wins++;
      stats[b].points += 3;
      stats[a].losses++;
      stats[b].form.push('W');
      stats[a].form.push('L');
    } else {
      stats[a].points += 1;
      stats[b].points += 1;
      stats[a].form.push('D');
      stats[b].form.push('D');
    }
  }

  const leaderboard = Object.values(stats).map(s => {
    s.win_rate = s.matches > 0 ? Math.round((s.wins / s.matches) * 1000) / 10 : 0;
    s.form = s.form.slice(-5).reverse();
    return s;
  });

  for (let i = 0; i < leaderboard.length; i++) {
    for (let j = 0; j < leaderboard.length - 1 - i; j++) {
      if (compareWrestlers(leaderboard[j], leaderboard[j + 1], h2h) > 0) {
        [leaderboard[j], leaderboard[j + 1]] = [leaderboard[j + 1], leaderboard[j]];
      }
    }
  }

  leaderboard.forEach((s, i) => { s.rank = i + 1; });

  const tiedGroups = [];
  let currentGroup = [leaderboard[0]];
  for (let i = 1; i < leaderboard.length; i++) {
    const curr = leaderboard[i];
    const prev = leaderboard[i - 1];
    const samePoints = curr.points === prev.points && curr.wins === prev.wins && curr.win_rate === prev.win_rate;
    if (samePoints) {
      currentGroup.push(curr);
    } else {
      if (currentGroup.length > 1) tiedGroups.push(currentGroup);
      currentGroup = [curr];
    }
  }
  if (currentGroup.length > 1) tiedGroups.push(currentGroup);

  return { leaderboard, tiedGroups, totalMatches: matches.length };
}

function computeEffectiveFirmness(knotStyle, knotSkill) {
  const base = KNOT_STYLES[knotStyle] || { firmness: 0.5 };
  const skillFactor = 0.5 + 0.5 * (knotSkill / 100);
  const effectiveFirmness = Math.min(1.0, base.firmness * skillFactor);
  let effectiveRisk;
  if (effectiveFirmness >= 0.75) effectiveRisk = "低";
  else if (effectiveFirmness >= 0.4) effectiveRisk = "中";
  else effectiveRisk = "高";
  return { effectiveFirmness: Math.round(effectiveFirmness * 1000) / 1000, effectiveRisk, baseFirmness: base.firmness, baseRisk: base.risk };
}

module.exports = { initDb, getAllWrestlers, getWrestlerById, saveMatch, getMatchHistory, KNOT_STYLES, REGION_ROBE_STYLES, computeEffectiveFirmness, computeLeaderboard };
