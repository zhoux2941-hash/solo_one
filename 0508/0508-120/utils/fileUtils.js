const fs = require('fs');
const path = require('path');
const levenshtein = require('fast-levenshtein');

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
const SUBTITLE_EXTENSIONS = ['.srt', '.ass', '.ssa', '.vtt'];

const BRACKET_PATTERNS = [
  /\[[^\]]*\]/g,
  /\([^)]*\)/g,
  /\{[^}]*\}/g,
  /<[^>]*>/g,
  /【[^】]*】/g,
  /《[^》]*》/g,
  /「[^」]*」/g,
  /『[^』]*』/g
];

const RESOLUTION_PATTERNS = [
  /\d{3,4}p/i,
  /\d{3,4}x\d{3,4}/i,
  /4k/i,
  /8k/i,
  /1080/i,
  /720/i,
  /2160/i,
  /uhd/i,
  /hd/i
];

const QUALITY_PATTERNS = [
  /bluray/i,
  /brrip/i,
  /bdrip/i,
  /web-?dl/i,
  /webrip/i,
  /dvdrip/i,
  /hdrip/i,
  /hdtv/i,
  /remux/i,
  /proper/i,
  /repack/i,
  /extended/i,
  /director'?s?\s*cut/i,
  /unrated/i,
  /imax/i
];

const RELEASE_GROUP_PATTERNS = [
  /yify/i,
  /yts/i,
  /rarbg/i,
  /etrg/i,
  /galaxyrg/i,
  /sparks/i,
  /shaanig/i,
  /vikings/i,
  /tigole/i,
  /qman/i,
  /ctrlhd/i,
  /chd/i,
  /wiki/i,
  /beast/i,
  /nhanc3/i,
  /mkvtoolnix/i,
  /terminal/i,
  /reward/i,
  /geek/i,
  /psych/i,
  /demand/i,
  /publichd/i,
  /hdchina/i,
  /hdsky/i,
  /ourbits/i,
  /ttg/i,
  /torrentday/i,
  /scene/i
];

const ENCODING_PATTERNS = [
  /x264/i,
  /x265/i,
  /h\.?264/i,
  /h\.?265/i,
  /hevc/i,
  /avc/i,
  /aac/i,
  /ac3/i,
  /dts/i,
  /flac/i,
  /mp3/i,
  /10bit/i,
  /8bit/i
];

const LANGUAGE_PATTERNS = [
  /chinese/i,
  /mandarin/i,
  /cantonese/i,
  /english/i,
  /japanese/i,
  /korean/i,
  /chs/i,
  /cht/i,
  /cn/i,
  /zh/i,
  /en/i,
  /jp/i,
  /kr/i,
  /dual(?:audio)?/i,
  /multi(?:audio)?/i
];

const CHINESE_SITE_PATTERNS = [
  /飘花电影网/,
  /首发影视/,
  /高清版/,
  /蓝光版/,
  /完整版/,
  /未删减版/,
  /导演剪辑版/,
  /电影天堂/,
  /阳光电影/,
  /6v电影/,
  /BT天堂/,
  /电影首发站/,
  /LOL电影天堂/,
  /人人影视/,
  /人人视频/,
  /字幕库/,
  /SubHD/,
  /射手网/,
  /高清影视/,
  /电影网/,
  /BT之家/,
  /悠悠鸟/,
  /圣城家园/,
  /飞鸟娱乐/,
  /影视帝国/,
  /人人影视/,
  /伊甸园/,
  /风软FRM/,
  /破烂熊/,
  /FIX字幕侠/,
  /人人影视字幕组/,
  /ZiMuZu/,
  /字幕组/,
  /YYeTs/,
  /深影字幕组/,
  /电波字幕组/,
  /幻樱字幕组/,
  /青翼字幕组/,
  /诸神字幕组/,
  /WTF字幕组/,
  /字幕库/
];

const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
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

function getHistoryPath() {
  const appDataPath = process.env.APPDATA || 
                      (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
  const appFolder = path.join(appDataPath, 'subtitle-matcher');
  
  if (!fs.existsSync(appFolder)) {
    fs.mkdirSync(appFolder, { recursive: true });
  }
  
  return path.join(appFolder, 'history.json');
}

async function getHistory() {
  const historyPath = getHistoryPath();
  
  if (!fs.existsSync(historyPath)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(historyPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

async function setHistory(key, value) {
  const historyPath = getHistoryPath();
  let history = {};
  
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    } catch (error) {
      history = {};
    }
  }
  
  history[key] = value;
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

async function clearHistory() {
  const historyPath = getHistoryPath();
  
  if (fs.existsSync(historyPath)) {
    fs.unlinkSync(historyPath);
  }
}

function normalizeFileName(fileName) {
  let normalized = fileName;
  
  const ext = path.extname(normalized);
  if (VIDEO_EXTENSIONS.includes(ext.toLowerCase()) || SUBTITLE_EXTENSIONS.includes(ext.toLowerCase())) {
    normalized = path.basename(normalized, ext);
  }
  
  normalized = normalized.replace(/[\[\]{}()<>【】《》「」『』]/g, ' ');
  
  CHINESE_SITE_PATTERNS.forEach(pattern => {
    normalized = normalized.replace(pattern, ' ');
  });
  
  RESOLUTION_PATTERNS.forEach(pattern => {
    normalized = normalized.replace(pattern, ' ');
  });
  
  QUALITY_PATTERNS.forEach(pattern => {
    normalized = normalized.replace(pattern, ' ');
  });
  
  ENCODING_PATTERNS.forEach(pattern => {
    normalized = normalized.replace(pattern, ' ');
  });
  
  RELEASE_GROUP_PATTERNS.forEach(pattern => {
    normalized = normalized.replace(pattern, ' ');
  });
  
  LANGUAGE_PATTERNS.forEach(pattern => {
    normalized = normalized.replace(pattern, ' ');
  });
  
  normalized = normalized.replace(YEAR_PATTERN, ' ');
  
  normalized = normalized.replace(/\b\d+\b/g, ' ');
  
  normalized = normalized.replace(/[^a-zA-Z\u4e00-\u9fa5]+/g, ' ');
  
  normalized = normalized.replace(/\b[a-zA-Z]{1,2}\b/g, ' ');
  
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.trim().toLowerCase();
  
  return normalized;
}

async function scanFolder(folderPath) {
  const videos = [];
  const subtitles = [];
  
  function scanRecursive(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanRecursive(fullPath);
      } else {
        const ext = path.extname(file.name).toLowerCase();
        
        if (VIDEO_EXTENSIONS.includes(ext)) {
          videos.push({
            name: file.name,
            path: fullPath,
            folder: dir,
            normalizedName: normalizeFileName(file.name)
          });
        } else if (SUBTITLE_EXTENSIONS.includes(ext)) {
          subtitles.push({
            name: file.name,
            path: fullPath,
            folder: dir,
            normalizedName: normalizeFileName(file.name)
          });
        }
      }
    });
  }
  
  scanRecursive(folderPath);
  
  return { videos, subtitles };
}

async function matchSubtitles(folderPath, videos, subtitles) {
  const history = await getHistory();
  const results = [];
  const scoreThreshold = 50;
  
  videos.forEach(video => {
    const videoId = `${video.path}|${video.name}`;
    
    if (history[videoId]) {
      return;
    }
    
    const existingSubtitlePath = path.join(
      video.folder,
      path.basename(video.name, path.extname(video.name)) + '.srt'
    );
    
    if (fs.existsSync(existingSubtitlePath)) {
      return;
    }
    
    const matches = [];
    
    subtitles.forEach(subtitle => {
      if (subtitle.folder === video.folder && 
          path.basename(subtitle.name, path.extname(subtitle.name)) === 
          path.basename(video.name, path.extname(video.name))) {
        return;
      }
      
      const similarityResult = calculateSimilarity(video.normalizedName, subtitle.normalizedName);
      
      if (similarityResult.score >= scoreThreshold) {
        matches.push({
          subtitle: subtitle,
          distance: similarityResult.distance,
          similarity: similarityResult.score,
          details: {
            levenshteinScore: similarityResult.levenshteinScore,
            wordMatchScore: similarityResult.wordMatchScore,
            containmentScore: similarityResult.containmentScore
          }
        });
      }
    });
    
    if (matches.length > 0) {
      matches.sort((a, b) => b.similarity - a.similarity);
      
      results.push({
        video: video,
        matches: matches,
        selectedMatch: null
      });
    }
  });
  
  return results;
}

async function copyAndRenameSubtitle(videoPath, subtitlePath, newName) {
  const videoFolder = path.dirname(videoPath);
  const subtitleExt = path.extname(subtitlePath);
  const targetName = newName + subtitleExt;
  const targetPath = path.join(videoFolder, targetName);
  
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
  
  fs.copyFileSync(subtitlePath, targetPath);
  
  return {
    success: true,
    targetPath: targetPath
  };
}

async function batchRename(matches) {
  const results = [];
  const history = await getHistory();
  
  for (const match of matches) {
    if (!match.selectedMatch) continue;
    
    try {
      const videoBaseName = path.basename(match.video.name, path.extname(match.video.name));
      const result = await copyAndRenameSubtitle(
        match.video.path,
        match.selectedMatch.subtitle.path,
        videoBaseName
      );
      
      const videoId = `${match.video.path}|${match.video.name}`;
      history[videoId] = {
        matchedSubtitle: match.selectedMatch.subtitle.path,
        timestamp: Date.now()
      };
      
      results.push({
        video: match.video.name,
        success: true,
        targetPath: result.targetPath
      });
    } catch (error) {
      results.push({
        video: match.video.name,
        success: false,
        error: error.message
      });
    }
  }
  
  const historyPath = getHistoryPath();
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  
  return results;
}

function parseSRT(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let currentBlock = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === '') {
      if (currentBlock && currentBlock.textLines.length > 0) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      i++;
      continue;
    }

    if (!currentBlock) {
      if (/^\d+$/.test(line)) {
        currentBlock = {
          index: parseInt(line),
          startTime: null,
          endTime: null,
          textLines: []
        };
        i++;
        continue;
      }
    }

    if (currentBlock && currentBlock.startTime === null) {
      const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
      if (timeMatch) {
        currentBlock.startTime = {
          hours: parseInt(timeMatch[1]),
          minutes: parseInt(timeMatch[2]),
          seconds: parseInt(timeMatch[3]),
          milliseconds: parseInt(timeMatch[4])
        };
        currentBlock.endTime = {
          hours: parseInt(timeMatch[5]),
          minutes: parseInt(timeMatch[6]),
          seconds: parseInt(timeMatch[7]),
          milliseconds: parseInt(timeMatch[8])
        };
        i++;
        continue;
      }
    }

    if (currentBlock) {
      currentBlock.textLines.push(lines[i]);
    }

    i++;
  }

  if (currentBlock && currentBlock.textLines.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

function parseASS(content) {
  const lines = content.split(/\r?\n/);
  const events = [];
  let inEventsSection = false;
  let formatFields = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.toLowerCase() === '[events]') {
      inEventsSection = true;
      continue;
    }

    if (inEventsSection && trimmedLine.startsWith('[')) {
      inEventsSection = false;
      continue;
    }

    if (inEventsSection && trimmedLine.toLowerCase().startsWith('format:')) {
      const formatPart = trimmedLine.substring(7).trim();
      formatFields = formatPart.split(',').map(f => f.trim().toLowerCase());
      continue;
    }

    if (inEventsSection && (trimmedLine.toLowerCase().startsWith('dialogue:') || trimmedLine.toLowerCase().startsWith('comment:'))) {
      const isComment = trimmedLine.toLowerCase().startsWith('comment:');
      const dialoguePart = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
      const parts = splitASSFields(dialoguePart);

      if (formatFields.length > 0 && parts.length >= formatFields.length) {
        const event = {
          isComment: isComment,
          rawLine: line,
          fields: {}
        };

        for (let j = 0; j < formatFields.length; j++) {
          event.fields[formatFields[j]] = parts[j];
        }

        if (event.fields.start && event.fields.end) {
          event.startTime = parseASSTime(event.fields.start);
          event.endTime = parseASSTime(event.fields.end);
          events.push(event);
        }
      }
    }
  }

  return { events, formatFields, originalContent: content };
}

function splitASSFields(line) {
  const fields = [];
  let currentField = '';
  let braceDepth = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '{') {
      braceDepth++;
      currentField += char;
    } else if (char === '}') {
      braceDepth--;
      currentField += char;
    } else if (char === ',' && braceDepth === 0) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField !== '') {
    fields.push(currentField);
  }

  return fields;
}

function parseASSTime(timeStr) {
  const match = timeStr.match(/(\d+):(\d{2}):(\d{2})[.](\d{2})/);
  if (match) {
    return {
      hours: parseInt(match[1]),
      minutes: parseInt(match[2]),
      seconds: parseInt(match[3]),
      milliseconds: parseInt(match[4]) * 10
    };
  }
  return null;
}

function timeToMilliseconds(time) {
  if (!time) return 0;
  return time.hours * 3600000 +
         time.minutes * 60000 +
         time.seconds * 1000 +
         time.milliseconds;
}

function millisecondsToTime(ms) {
  if (ms < 0) ms = 0;
  const hours = Math.floor(ms / 3600000);
  ms %= 3600000;
  const minutes = Math.floor(ms / 60000);
  ms %= 60000;
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;

  return { hours, minutes, seconds, milliseconds };
}

function formatSRTTime(time) {
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')},${String(time.milliseconds).padStart(3, '0')}`;
}

function formatASSTime(time) {
  const centiseconds = Math.floor(time.milliseconds / 10);
  return `${time.hours}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function shiftSRT(content, offsetSeconds) {
  const blocks = parseSRT(content);
  const offsetMs = Math.round(offsetSeconds * 1000);

  const shiftedBlocks = blocks.map(block => {
    const startMs = timeToMilliseconds(block.startTime) + offsetMs;
    const endMs = timeToMilliseconds(block.endTime) + offsetMs;

    return {
      ...block,
      startTime: millisecondsToTime(startMs),
      endTime: millisecondsToTime(endMs)
    };
  });

  let result = '';
  shiftedBlocks.forEach((block, index) => {
    result += `${index + 1}\n`;
    result += `${formatSRTTime(block.startTime)} --> ${formatSRTTime(block.endTime)}\n`;
    result += block.textLines.join('\n') + '\n\n';
  });

  return result.trim() + '\n';
}

function shiftASS(content, offsetSeconds) {
  const { events, formatFields, originalContent } = parseASS(content);
  const offsetMs = Math.round(offsetSeconds * 1000);

  let result = '';
  const lines = originalContent.split(/\r?\n/);
  let inEventsSection = false;
  let eventIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.toLowerCase() === '[events]') {
      inEventsSection = true;
      result += line + '\n';
      continue;
    }

    if (inEventsSection && trimmedLine.startsWith('[')) {
      inEventsSection = false;
    }

    if (inEventsSection && 
        (trimmedLine.toLowerCase().startsWith('dialogue:') || 
         trimmedLine.toLowerCase().startsWith('comment:'))) {
      
      if (eventIndex < events.length) {
        const event = events[eventIndex];
        
        if (event.startTime && event.endTime) {
          const startMs = timeToMilliseconds(event.startTime) + offsetMs;
          const endMs = timeToMilliseconds(event.endTime) + offsetMs;

          const newStartTime = millisecondsToTime(startMs);
          const newEndTime = millisecondsToTime(endMs);

          const newStartStr = formatASSTime(newStartTime);
          const newEndStr = formatASSTime(newEndTime);

          const startFieldIndex = formatFields.indexOf('start');
          const endFieldIndex = formatFields.indexOf('end');

          if (startFieldIndex !== -1 && endFieldIndex !== -1) {
            const parts = splitASSFields(line.substring(line.indexOf(':') + 1).trim());
            
            if (startFieldIndex < parts.length) {
              parts[startFieldIndex] = newStartStr;
            }
            if (endFieldIndex < parts.length) {
              parts[endFieldIndex] = newEndStr;
            }

            const prefix = line.substring(0, line.indexOf(':') + 1);
            result += prefix + ' ' + parts.join(',') + '\n';
          } else {
            result += line + '\n';
          }
        } else {
          result += line + '\n';
        }
        eventIndex++;
      } else {
        result += line + '\n';
      }
    } else {
      result += line + '\n';
    }
  }

  return result;
}

function shiftSubtitleFile(subtitlePath, offsetSeconds, outputPath = null) {
  const ext = path.extname(subtitlePath).toLowerCase();
  const content = fs.readFileSync(subtitlePath, 'utf-8');

  let shiftedContent;

  if (ext === '.srt') {
    shiftedContent = shiftSRT(content, offsetSeconds);
  } else if (ext === '.ass' || ext === '.ssa') {
    shiftedContent = shiftASS(content, offsetSeconds);
  } else {
    throw new Error(`不支持的字幕格式: ${ext}`);
  }

  const targetPath = outputPath || subtitlePath;

  if (!outputPath) {
    const baseName = path.basename(subtitlePath, ext);
    const dir = path.dirname(subtitlePath);
    const suffix = offsetSeconds >= 0 ? `_+${offsetSeconds}s` : `_${offsetSeconds}s`;
    outputPath = path.join(dir, `${baseName}${suffix}${ext}`);
  }

  fs.writeFileSync(outputPath, shiftedContent, 'utf-8');

  return {
    success: true,
    originalPath: subtitlePath,
    outputPath: outputPath,
    offset: offsetSeconds
  };
}

module.exports = {
  scanFolder,
  matchSubtitles,
  copyAndRenameSubtitle,
  batchRename,
  getHistory,
  setHistory,
  clearHistory,
  normalizeFileName,
  shiftSubtitleFile,
  parseSRT,
  parseASS,
  shiftSRT,
  shiftASS
};
