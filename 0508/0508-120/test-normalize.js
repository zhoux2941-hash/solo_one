const { normalizeFileName } = require('./utils/fileUtils');

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return { score: 0, distance: 0 };
  
  const levenshtein = require('fast-levenshtein');
  const distance = levenshtein.get(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  const levenshteinScore = maxLen > 0 ? (1 - distance / maxLen) * 100 : 0;
  
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 1));
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 1));
  
  let commonWords = 0;
  words1.forEach(word => {
    if (words2.has(word)) {
      commonWords++;
    }
  });
  
  const totalWords = Math.max(words1.size, words2.size);
  const wordMatchScore = totalWords > 0 ? (commonWords / totalWords) * 100 : 0;
  
  const hasChinese1 = /[\u4e00-\u9fa5]/.test(str1);
  const hasChinese2 = /[\u4e00-\u9fa5]/.test(str2);
  const hasEnglish1 = /[a-zA-Z]/.test(str1);
  const hasEnglish2 = /[a-zA-Z]/.test(str2);
  
  let containmentScore = 0;
  if (hasChinese1 && hasChinese2) {
    const chinese1 = str1.replace(/[^\u4e00-\u9fa5]/g, '');
    const chinese2 = str2.replace(/[^\u4e00-\u9fa5]/g, '');
    if (chinese1 && chinese2) {
      if (chinese1.includes(chinese2) || chinese2.includes(chinese1)) {
        containmentScore = 100;
      } else {
        const commonChars = [...chinese1].filter(c => chinese2.includes(c)).length;
        containmentScore = (commonChars / Math.max(chinese1.length, chinese2.length)) * 100;
      }
    }
  }
  
  if (hasEnglish1 && hasEnglish2) {
    const english1 = str1.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
    const english2 = str2.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
    if (english1.trim() && english2.trim()) {
      if (english1.includes(english2) || english2.includes(english1)) {
        containmentScore = Math.max(containmentScore, 100);
      }
    }
  }
  
  let finalScore;
  
  if (distance === 0) {
    finalScore = 100;
  } else if (containmentScore === 100) {
    finalScore = 80;
  } else if (wordMatchScore === 100) {
    finalScore = 90;
  } else if (wordMatchScore >= 75 && levenshteinScore >= 60) {
    finalScore = 75;
  } else if (wordMatchScore >= 50 && levenshteinScore >= 50 && containmentScore >= 50) {
    finalScore = 60;
  } else {
    finalScore = Math.max(
      levenshteinScore * 0.4,
      wordMatchScore * 0.3,
      containmentScore * 0.3
    );
  }
  
  return {
    score: finalScore,
    distance: distance,
    levenshteinScore: levenshteinScore,
    wordMatchScore: wordMatchScore,
    containmentScore: containmentScore
  };
}

const testCases = [
  {
    name: '基本测试 - 带分辨率和括号',
    video: '[CHD].Avengers.Endgame.2019.1080p.BluRay.x264.mp4',
    subtitle: 'Avengers.Endgame.2019.BluRay.1080p.x264-CHD.chs.srt',
    expectedMatch: true
  },
  {
    name: '测试 - 带多种括号',
    video: '(YIFY) The Matrix [1999] {720p}.mkv',
    subtitle: 'The.Matrix.1999.720p.BrRip.x264.YIFY.ass',
    expectedMatch: true
  },
  {
    name: '测试 - 中文文件名',
    video: '【飘花电影网】复仇者联盟4_终局之战.2019.1080p.mp4',
    subtitle: '复仇者联盟4 终局之战 [2019].1080p.BluRay.chs.srt',
    expectedMatch: true
  },
  {
    name: '测试 - 不同字幕组',
    video: '[RARBG].Inception.2010.2160p.UHD.BluRay.x265.mkv',
    subtitle: 'Inception.2010.2160p.UHD.BluRay.x265-TERMiNAL.eng.srt',
    expectedMatch: true
  },
  {
    name: '测试 - 带语言标签',
    video: 'Interstellar.2014.1080p.BluRay.x264.DualAudio.mkv',
    subtitle: 'Interstellar.2014.1080p.BluRay.x264.chs&eng.ass',
    expectedMatch: true
  },
  {
    name: '测试 - 不同电影（不应匹配）',
    video: 'Avatar.2009.1080p.BluRay.mp4',
    subtitle: 'Titanic.1997.1080p.BluRay.srt',
    expectedMatch: false
  },
  {
    name: '测试 - 同系列不同集（不应匹配）',
    video: 'Harry.Potter.and.the.Sorcerers.Stone.2001.mp4',
    subtitle: 'Harry.Potter.and.the.Chamber.of.Secrets.2002.srt',
    expectedMatch: false
  },
  {
    name: '测试 - 大量特殊字符',
    video: '《盗梦空间》[2010].1080p_高清版-[首发影视].mp4',
    subtitle: '盗梦空间_Inception_2010.1080p.BluRay.chs.srt',
    expectedMatch: true
  },
  {
    name: '测试 - 带编码信息',
    video: 'The.Dark.Knight.2008.1080p.BluRay.x264.DTS-HD.MA.5.1.mkv',
    subtitle: 'The.Dark.Knight.2008.1080p.BluRay.x264.AC3.srt',
    expectedMatch: true
  },
  {
    name: '测试 - 季和集（电视剧）',
    video: 'Breaking.Bad.S01E01.Pilot.1080p.BluRay.x264.mp4',
    subtitle: 'Breaking.Bad.S01E01.1080p.BluRay.x264-REWARD.srt',
    expectedMatch: true
  }
];

const scoreThreshold = 50;

console.log('=' .repeat(80));
console.log('文件名规范化和相似度测试');
console.log('=' .repeat(80));
console.log();

let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  const normalizedVideo = normalizeFileName(test.video);
  const normalizedSub = normalizeFileName(test.subtitle);
  
  const similarityResult = calculateSimilarity(normalizedVideo, normalizedSub);
  const actualMatch = similarityResult.score >= scoreThreshold;
  const passed = actualMatch === test.expectedMatch;
  
  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
  
  console.log(`测试 ${index + 1}: ${test.name}`);
  console.log(`  视频文件: ${test.video}`);
  console.log(`  字幕文件: ${test.subtitle}`);
  console.log(`  规范化视频: "${normalizedVideo}"`);
  console.log(`  规范化字幕: "${normalizedSub}"`);
  console.log(`  编辑距离: ${similarityResult.distance}`);
  console.log(`  综合相似度: ${similarityResult.score.toFixed(1)}%`);
  console.log(`  详细分数: 编辑距离=${similarityResult.levenshteinScore.toFixed(1)}%, 词袋=${similarityResult.wordMatchScore.toFixed(1)}%, 包含=${similarityResult.containmentScore.toFixed(1)}%`);
  console.log(`  期望匹配: ${test.expectedMatch ? '是' : '否'}`);
  console.log(`  实际匹配: ${actualMatch ? '是' : '否'}`);
  console.log(`  结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
  console.log();
});

console.log('=' .repeat(80));
console.log(`测试完成: ${passCount} 通过, ${failCount} 失败`);
console.log('=' .repeat(80));

process.exit(failCount > 0 ? 1 : 0);
