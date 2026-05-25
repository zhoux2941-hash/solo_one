import { Database } from 'sql.js';
import type { Score, AnnotationVersion, Annotation } from '../src/types';

const erquanSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <rect width="800" height="400" fill="#ffffff"/>
  <text x="400" y="40" text-anchor="middle" font-size="24" font-family="SimSun, serif" fill="#000">二泉映月</text>
  <text x="400" y="65" text-anchor="middle" font-size="14" font-family="SimSun, serif" fill="#666">华彦钧 曲</text>
  <g font-family="SimSun, serif" font-size="20" fill="#000">
    <text x="40" y="120">1=D 4/4</text>
    <g id="measure-1" transform="translate(40,150)">
      <text x="0" y="0">6</text><text x="30" y="0">5</text><text x="60" y="0">3</text><text x="90" y="0">5</text>
      <text x="0" y="-10" font-size="12" fill="#888">•</text>
    </g>
    <g id="measure-2" transform="translate(200,150)">
      <text x="0" y="0">6</text><text x="30" y="0">1</text><text x="60" y="0">5</text><text x="90" y="0">6</text>
    </g>
    <g id="measure-3" transform="translate(360,150)">
      <text x="0" y="0">3</text><text x="30" y="0">2</text><text x="60" y="0">1</text><text x="90" y="0">3</text>
    </g>
    <g id="measure-4" transform="translate(520,150)">
      <text x="0" y="0">2</text><text x="30" y="0">6</text><text x="60" y="0">1</text><text x="90" y="0">2</text>
    </g>
    <g id="measure-5" transform="translate(40,230)">
      <text x="0" y="0">6</text><text x="30" y="0">5</text><text x="60" y="0">6</text><text x="90" y="0">1</text>
    </g>
    <g id="measure-6" transform="translate(200,230)">
      <text x="0" y="0">2</text><text x="30" y="0">3</text><text x="60" y="0">5</text><text x="90" y="0">6</text>
    </g>
    <g id="measure-7" transform="translate(360,230)">
      <text x="0" y="0">5</text><text x="30" y="0">3</text><text x="60" y="0">2</text><text x="90" y="0">1</text>
    </g>
    <g id="measure-8" transform="translate(520,230)">
      <text x="0" y="0">6</text><text x="30" y="0">6</text><text x="60" y="0">5</text><text x="90" y="0">3</text>
    </g>
  </g>
  <g stroke="#000" stroke-width="1.2">
    <line x1="30" y1="170" x2="770" y2="170"/>
    <line x1="30" y1="250" x2="770" y2="250"/>
    <line x1="150" y1="130" x2="150" y2="180"/>
    <line x1="310" y1="130" x2="310" y2="180"/>
    <line x1="470" y1="130" x2="470" y2="180"/>
    <line x1="630" y1="130" x2="630" y2="180"/>
    <line x1="150" y1="210" x2="150" y2="260"/>
    <line x1="310" y1="210" x2="310" y2="260"/>
    <line x1="470" y1="210" x2="470" y2="260"/>
    <line x1="630" y1="210" x2="630" y2="260"/>
  </g>
</svg>`;

const gaoshanSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <rect width="800" height="400" fill="#ffffff"/>
  <text x="400" y="40" text-anchor="middle" font-size="24" font-family="SimSun, serif" fill="#000">高山流水</text>
  <text x="400" y="65" text-anchor="middle" font-size="14" font-family="SimSun, serif" fill="#666">古琴曲</text>
  <g font-family="SimSun, serif" font-size="20" fill="#000">
    <text x="40" y="120">1=C 2/4</text>
    <g id="measure-1" transform="translate(40,150)">
      <text x="0" y="0">5</text><text x="30" y="0">3</text><text x="60" y="0">2</text><text x="90" y="0">1</text>
    </g>
    <g id="measure-2" transform="translate(200,150)">
      <text x="0" y="0">2</text><text x="30" y="0">3</text><text x="60" y="0">5</text><text x="90" y="0">6</text>
    </g>
    <g id="measure-3" transform="translate(360,150)">
      <text x="0" y="0">1</text><text x="30" y="0">2</text><text x="60" y="0">3</text><text x="90" y="0">5</text>
    </g>
    <g id="measure-4" transform="translate(520,150)">
      <text x="0" y="0">3</text><text x="30" y="0">2</text><text x="60" y="0">1</text><text x="90" y="0">6</text>
    </g>
    <g id="measure-5" transform="translate(40,230)">
      <text x="0" y="0">5</text><text x="30" y="0">6</text><text x="60" y="0">1</text><text x="90" y="0">2</text>
    </g>
    <g id="measure-6" transform="translate(200,230)">
      <text x="0" y="0">1</text><text x="30" y="0">3</text><text x="60" y="0">5</text><text x="90" y="0">6</text>
    </g>
    <g id="measure-7" transform="translate(360,230)">
      <text x="0" y="0">5</text><text x="30" y="0">3</text><text x="60" y="0">2</text><text x="90" y="0">1</text>
    </g>
    <g id="measure-8" transform="translate(520,230)">
      <text x="0" y="0">2</text><text x="30" y="0">1</text><text x="60" y="0">6</text><text x="90" y="0">5</text>
    </g>
  </g>
  <g stroke="#000" stroke-width="1.2">
    <line x1="30" y1="170" x2="770" y2="170"/>
    <line x1="30" y1="250" x2="770" y2="250"/>
    <line x1="150" y1="130" x2="150" y2="180"/>
    <line x1="310" y1="130" x2="310" y2="180"/>
    <line x1="470" y1="130" x2="470" y2="180"/>
    <line x1="630" y1="130" x2="630" y2="180"/>
    <line x1="150" y1="210" x2="150" y2="260"/>
    <line x1="310" y1="210" x2="310" y2="260"/>
    <line x1="470" y1="210" x2="470" y2="260"/>
    <line x1="630" y1="210" x2="630" y2="260"/>
  </g>
</svg>`;

const scores: Score[] = [
  {
    id: 'score-erquan',
    title: '二泉映月',
    composer: '华彦钧',
    instrument: '二胡',
    difficulty: 'advanced',
    svgContent: erquanSvg,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-10T09:00:00Z',
  },
  {
    id: 'score-gaoshan',
    title: '高山流水',
    composer: '伯牙',
    instrument: '古琴',
    difficulty: 'intermediate',
    svgContent: gaoshanSvg,
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-12T09:00:00Z',
  },
];

const annotationVersions: AnnotationVersion[] = [
  { id: 'ver-erquan-zhang', scoreId: 'score-erquan', teacherId: 'teacher-zhang', teacherName: '张老师', versionNumber: 1, color: '#C84B31', isFinal: false, createdAt: '2025-01-11T10:00:00Z' },
  { id: 'ver-erquan-li', scoreId: 'score-erquan', teacherId: 'teacher-li', teacherName: '李老师', versionNumber: 1, color: '#2E5E8B', isFinal: true, createdAt: '2025-01-11T11:00:00Z' },
  { id: 'ver-erquan-wang', scoreId: 'score-erquan', teacherId: 'teacher-wang', teacherName: '王老师', versionNumber: 1, color: '#4A7C59', isFinal: false, createdAt: '2025-01-11T12:00:00Z' },
  { id: 'ver-gaoshan-zhang', scoreId: 'score-gaoshan', teacherId: 'teacher-zhang', teacherName: '张老师', versionNumber: 1, color: '#C84B31', isFinal: true, createdAt: '2025-01-13T10:00:00Z' },
  { id: 'ver-gaoshan-li', scoreId: 'score-gaoshan', teacherId: 'teacher-li', teacherName: '李老师', versionNumber: 1, color: '#2E5E8B', isFinal: false, createdAt: '2025-01-13T11:00:00Z' },
  { id: 'ver-gaoshan-wang', scoreId: 'score-gaoshan', teacherId: 'teacher-wang', teacherName: '王老师', versionNumber: 1, color: '#4A7C59', isFinal: false, createdAt: '2025-01-13T12:00:00Z' },
];

const annotations: Annotation[] = [
  // 二泉映月 - 张老师 (6)
  { id: 'ann-e-z-1', versionId: 'ver-erquan-zhang', scoreId: 'score-erquan', type: 'fingering', measureNumber: 1, beatPosition: 1, content: '内外弦交替，中指轻压', x: 40, y: 135, width: 100, height: 30 },
  { id: 'ann-e-z-2', versionId: 'ver-erquan-zhang', scoreId: 'score-erquan', type: 'phrasing', measureNumber: 2, beatPosition: 3, content: '渐强 cresc.', x: 230, y: 135, width: 80, height: 30 },
  { id: 'ann-e-z-3', versionId: 'ver-erquan-zhang', scoreId: 'score-erquan', type: 'oral', measureNumber: 3, beatPosition: 2, content: '此处弓法要连，如水流', x: 390, y: 135, width: 100, height: 30 },
  { id: 'ann-e-z-4', versionId: 'ver-erquan-zhang', scoreId: 'score-erquan', type: 'fingering', measureNumber: 4, beatPosition: 1, content: '外弦起奏，保留指', x: 540, y: 135, width: 90, height: 30 },
  { id: 'ann-e-z-5', versionId: 'ver-erquan-zhang', scoreId: 'score-erquan', type: 'phrasing', measureNumber: 6, beatPosition: 2, content: '换气 p', x: 230, y: 215, width: 80, height: 30 },
  { id: 'ann-e-z-6', versionId: 'ver-erquan-zhang', scoreId: 'score-erquan', type: 'oral', measureNumber: 8, beatPosition: 1, content: '收尾要柔，略带滑音', x: 540, y: 215, width: 100, height: 30 },

  // 二泉映月 - 李老师 (7)  - 与张老师在 measure 1, 3, 4, 8 有冲突
  { id: 'ann-e-l-1', versionId: 'ver-erquan-li', scoreId: 'score-erquan', type: 'fingering', measureNumber: 1, beatPosition: 1, content: '内弦起，全弓奏', x: 40, y: 135, width: 90, height: 30 },
  { id: 'ann-e-l-2', versionId: 'ver-erquan-li', scoreId: 'score-erquan', type: 'phrasing', measureNumber: 2, beatPosition: 1, content: '强后即弱 subito p', x: 220, y: 135, width: 100, height: 30 },
  { id: 'ann-e-l-3', versionId: 'ver-erquan-li', scoreId: 'score-erquan', type: 'oral', measureNumber: 3, beatPosition: 1, content: '弓法要有顿挫感', x: 380, y: 135, width: 100, height: 30 },
  { id: 'ann-e-l-4', versionId: 'ver-erquan-li', scoreId: 'score-erquan', type: 'fingering', measureNumber: 4, beatPosition: 1, content: '内弦起奏，滑指过渡', x: 540, y: 135, width: 100, height: 30 },
  { id: 'ann-e-l-5', versionId: 'ver-erquan-li', scoreId: 'score-erquan', type: 'phrasing', measureNumber: 5, beatPosition: 3, content: '呼吸点 弓稍停', x: 40, y: 215, width: 100, height: 30 },
  { id: 'ann-e-l-6', versionId: 'ver-erquan-li', scoreId: 'score-erquan', type: 'oral', measureNumber: 7, beatPosition: 2, content: '此处情绪最饱满', x: 390, y: 215, width: 100, height: 30 },
  { id: 'ann-e-l-7', versionId: 'ver-erquan-li', scoreId: 'score-erquan', type: 'oral', measureNumber: 8, beatPosition: 1, content: '收尾要干脆，不要滑音', x: 540, y: 215, width: 100, height: 30 },

  // 二泉映月 - 王老师 (7) - 在 measure 1, 4 有冲突
  { id: 'ann-e-w-1', versionId: 'ver-erquan-wang', scoreId: 'score-erquan', type: 'fingering', measureNumber: 1, beatPosition: 2, content: '中指先压，再换指', x: 70, y: 135, width: 100, height: 30 },
  { id: 'ann-e-w-2', versionId: 'ver-erquan-wang', scoreId: 'score-erquan', type: 'phrasing', measureNumber: 2, beatPosition: 2, content: '渐弱 dim.', x: 230, y: 135, width: 80, height: 30 },
  { id: 'ann-e-w-3', versionId: 'ver-erquan-wang', scoreId: 'score-erquan', type: 'oral', measureNumber: 3, beatPosition: 3, content: '此处注意音准，稍慢', x: 410, y: 135, width: 100, height: 30 },
  { id: 'ann-e-w-4', versionId: 'ver-erquan-wang', scoreId: 'score-erquan', type: 'fingering', measureNumber: 4, beatPosition: 1, content: '外弦起奏，压弓偏上', x: 540, y: 135, width: 100, height: 30 },
  { id: 'ann-e-w-5', versionId: 'ver-erquan-wang', scoreId: 'score-erquan', type: 'phrasing', measureNumber: 5, beatPosition: 4, content: '停顿一下再入下小节', x: 40, y: 215, width: 110, height: 30 },
  { id: 'ann-e-w-6', versionId: 'ver-erquan-wang', scoreId: 'score-erquan', type: 'oral', measureNumber: 6, beatPosition: 1, content: '此段弓要稳，莫慌', x: 220, y: 215, width: 100, height: 30 },
  { id: 'ann-e-w-7', versionId: 'ver-erquan-wang', scoreId: 'score-erquan', type: 'phrasing', measureNumber: 8, beatPosition: 2, content: '延音拉长，渐弱收', x: 560, y: 215, width: 100, height: 30 },

  // 高山流水 - 张老师 (6)
  { id: 'ann-g-z-1', versionId: 'ver-gaoshan-zhang', scoreId: 'score-gaoshan', type: 'fingering', measureNumber: 1, beatPosition: 1, content: '名指按5，托指入弦', x: 40, y: 135, width: 100, height: 30 },
  { id: 'ann-g-z-2', versionId: 'ver-gaoshan-zhang', scoreId: 'score-gaoshan', type: 'phrasing', measureNumber: 2, beatPosition: 3, content: '渐强 f', x: 230, y: 135, width: 80, height: 30 },
  { id: 'ann-g-z-3', versionId: 'ver-gaoshan-zhang', scoreId: 'score-gaoshan', type: 'oral', measureNumber: 3, beatPosition: 1, content: '流水之意，指速要匀', x: 380, y: 135, width: 110, height: 30 },
  { id: 'ann-g-z-4', versionId: 'ver-gaoshan-zhang', scoreId: 'score-gaoshan', type: 'fingering', measureNumber: 4, beatPosition: 1, content: '挑指衔接，音色要清', x: 540, y: 135, width: 100, height: 30 },
  { id: 'ann-g-z-5', versionId: 'ver-gaoshan-zhang', scoreId: 'score-gaoshan', type: 'phrasing', measureNumber: 6, beatPosition: 1, content: '重音开头，如山之巍', x: 220, y: 215, width: 110, height: 30 },
  { id: 'ann-g-z-6', versionId: 'ver-gaoshan-zhang', scoreId: 'score-gaoshan', type: 'oral', measureNumber: 8, beatPosition: 2, content: '余韵悠长，缓缓收', x: 560, y: 215, width: 100, height: 30 },

  // 高山流水 - 李老师 (7) - measure 1, 3, 4 有冲突
  { id: 'ann-g-l-1', versionId: 'ver-gaoshan-li', scoreId: 'score-gaoshan', type: 'fingering', measureNumber: 1, beatPosition: 1, content: '勾指起5，名指辅', x: 40, y: 135, width: 100, height: 30 },
  { id: 'ann-g-l-2', versionId: 'ver-gaoshan-li', scoreId: 'score-gaoshan', type: 'phrasing', measureNumber: 2, beatPosition: 1, content: '起音要沉稳 p', x: 220, y: 135, width: 100, height: 30 },
  { id: 'ann-g-l-3', versionId: 'ver-gaoshan-li', scoreId: 'score-gaoshan', type: 'oral', measureNumber: 3, beatPosition: 2, content: '高山之势，指尖有力', x: 400, y: 135, width: 110, height: 30 },
  { id: 'ann-g-l-4', versionId: 'ver-gaoshan-li', scoreId: 'score-gaoshan', type: 'fingering', measureNumber: 4, beatPosition: 1, content: '抹指过渡，音色温润', x: 540, y: 135, width: 100, height: 30 },
  { id: 'ann-g-l-5', versionId: 'ver-gaoshan-li', scoreId: 'score-gaoshan', type: 'phrasing', measureNumber: 5, beatPosition: 3, content: '换气稍停', x: 40, y: 215, width: 90, height: 30 },
  { id: 'ann-g-l-6', versionId: 'ver-gaoshan-li', scoreId: 'score-gaoshan', type: 'oral', measureNumber: 6, beatPosition: 3, content: '似山之巍峨，音要沉', x: 250, y: 215, width: 110, height: 30 },
  { id: 'ann-g-l-7', versionId: 'ver-gaoshan-li', scoreId: 'score-gaoshan', type: 'oral', measureNumber: 8, beatPosition: 1, content: '收尾要干净，利落', x: 540, y: 215, width: 100, height: 30 },

  // 高山流水 - 王老师 (6) - measure 1, 4 有冲突
  { id: 'ann-g-w-1', versionId: 'ver-gaoshan-wang', scoreId: 'score-gaoshan', type: 'fingering', measureNumber: 1, beatPosition: 1, content: '散挑5，指力要透', x: 40, y: 135, width: 100, height: 30 },
  { id: 'ann-g-w-2', versionId: 'ver-gaoshan-wang', scoreId: 'score-gaoshan', type: 'phrasing', measureNumber: 2, beatPosition: 2, content: '渐强 有层次', x: 230, y: 135, width: 90, height: 30 },
  { id: 'ann-g-w-3', versionId: 'ver-gaoshan-wang', scoreId: 'score-gaoshan', type: 'oral', measureNumber: 3, beatPosition: 3, content: '流水连绵，指速平稳', x: 410, y: 135, width: 110, height: 30 },
  { id: 'ann-g-w-4', versionId: 'ver-gaoshan-wang', scoreId: 'score-gaoshan', type: 'fingering', measureNumber: 4, beatPosition: 1, content: '勾指衔接，音色稍暗', x: 540, y: 135, width: 100, height: 30 },
  { id: 'ann-g-w-5', versionId: 'ver-gaoshan-wang', scoreId: 'score-gaoshan', type: 'phrasing', measureNumber: 7, beatPosition: 2, content: '渐弱 渐入尾声', x: 390, y: 215, width: 100, height: 30 },
  { id: 'ann-g-w-6', versionId: 'ver-gaoshan-wang', scoreId: 'score-gaoshan', type: 'oral', measureNumber: 8, beatPosition: 3, content: '余音袅袅，渐渐消', x: 580, y: 215, width: 100, height: 30 },
];

export function seedDatabase(db: Database): void {
  db.run('DELETE FROM conflict_annotations');
  db.run('DELETE FROM conflicts');
  db.run('DELETE FROM annotations');
  db.run('DELETE FROM annotation_versions');
  db.run('DELETE FROM scores');

  for (const s of scores) {
    db.run(
      'INSERT INTO scores (id, title, composer, instrument, difficulty, svg_content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.title, s.composer, s.instrument, s.difficulty, s.svgContent, s.createdAt, s.updatedAt]
    );
  }

  for (const v of annotationVersions) {
    db.run(
      'INSERT INTO annotation_versions (id, score_id, teacher_id, teacher_name, version_number, color, is_final, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [v.id, v.scoreId, v.teacherId, v.teacherName, v.versionNumber, v.color, v.isFinal ? 1 : 0, v.createdAt]
    );
  }

  for (const a of annotations) {
    db.run(
      'INSERT INTO annotations (id, version_id, score_id, type, measure_number, beat_position, content, x, y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [a.id, a.versionId, a.scoreId, a.type, a.measureNumber, a.beatPosition, a.content, a.x, a.y, a.width, a.height]
    );
  }

  const conflicts = [
    { id: 'conf-erquan-m1', scoreId: 'score-erquan', measureNumber: 1, type: 'fingering', createdAt: '2025-01-11T13:00:00Z', resolved: 0, annotationIds: ['ann-e-z-1', 'ann-e-l-1', 'ann-e-w-1'] },
    { id: 'conf-erquan-m3', scoreId: 'score-erquan', measureNumber: 3, type: 'oral', createdAt: '2025-01-11T13:01:00Z', resolved: 0, annotationIds: ['ann-e-z-3', 'ann-e-l-3', 'ann-e-w-3'] },
    { id: 'conf-erquan-m4', scoreId: 'score-erquan', measureNumber: 4, type: 'fingering', createdAt: '2025-01-11T13:02:00Z', resolved: 1, resolvedVersionId: 'ver-erquan-li', annotationIds: ['ann-e-z-4', 'ann-e-l-4', 'ann-e-w-4'] },
    { id: 'conf-erquan-m8', scoreId: 'score-erquan', measureNumber: 8, type: 'oral', createdAt: '2025-01-11T13:03:00Z', resolved: 0, annotationIds: ['ann-e-z-6', 'ann-e-l-7', 'ann-e-w-7'] },
    { id: 'conf-gaoshan-m1', scoreId: 'score-gaoshan', measureNumber: 1, type: 'fingering', createdAt: '2025-01-13T13:00:00Z', resolved: 1, resolvedVersionId: 'ver-gaoshan-zhang', annotationIds: ['ann-g-z-1', 'ann-g-l-1', 'ann-g-w-1'] },
    { id: 'conf-gaoshan-m3', scoreId: 'score-gaoshan', measureNumber: 3, type: 'oral', createdAt: '2025-01-13T13:01:00Z', resolved: 0, annotationIds: ['ann-g-z-3', 'ann-g-l-3', 'ann-g-w-3'] },
    { id: 'conf-gaoshan-m4', scoreId: 'score-gaoshan', measureNumber: 4, type: 'fingering', createdAt: '2025-01-13T13:02:00Z', resolved: 0, annotationIds: ['ann-g-z-4', 'ann-g-l-4', 'ann-g-w-4'] },
  ];

  for (const c of conflicts) {
    db.run(
      'INSERT INTO conflicts (id, score_id, measure_number, type, resolved, resolved_version_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.scoreId, c.measureNumber, c.type, c.resolved, c.resolvedVersionId ?? null, c.createdAt]
    );
    for (const aid of c.annotationIds) {
      db.run(
        'INSERT INTO conflict_annotations (conflict_id, annotation_id) VALUES (?, ?)',
        [c.id, aid]
      );
    }
  }
}
