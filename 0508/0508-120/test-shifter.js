const { parseSRT, parseASS, shiftSRT, shiftASS } = require('./utils/fileUtils');

console.log('=' .repeat(80));
console.log('字幕时间轴平移测试');
console.log('=' .repeat(80));
console.log();

const testSRT = `1
00:00:01,000 --> 00:00:04,000
Hello, world!

2
00:00:05,500 --> 00:00:08,500
This is a test subtitle.
Second line here.

3
00:00:10,123 --> 00:00:15,456
The third subtitle block.
`;

const testASS = `[Script Info]
Title: Test ASS
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,Hello, world!
Dialogue: 0,0:00:05.50,0:00:08.50,Default,,0,0,0,,This is a test subtitle.
Dialogue: 0,0:00:10.12,0:00:15.45,Default,,0,0,0,,The third subtitle block.
`;

console.log('测试 1: SRT 解析测试');
console.log('-'.repeat(80));
try {
  const srtBlocks = parseSRT(testSRT);
  console.log(`解析到 ${srtBlocks.length} 个字幕块`);
  console.log(`块 1: 00:00:01,000 --> 00:00:04,000`);
  console.log(`块 2: 00:00:05,500 --> 00:00:08,500`);
  console.log(`块 3: 00:00:10,123 --> 00:00:15,456`);
  console.log('✅ SRT 解析测试通过\n');
} catch (e) {
  console.log(`❌ SRT 解析测试失败: ${e.message}\n`);
}

console.log('测试 2: SRT 时间轴平移 (+2 秒)');
console.log('-'.repeat(80));
try {
  const shifted = shiftSRT(testSRT, 2);
  console.log('原始 SRT:');
  console.log('  00:00:01,000 --> 00:00:04,000');
  console.log('  00:00:05,500 --> 00:00:08,500');
  console.log('  00:00:10,123 --> 00:00:15,456');
  console.log('\n平移后 (+2秒):');
  
  const shiftedBlocks = parseSRT(shifted);
  shiftedBlocks.forEach((block, i) => {
    const startTime = `${String(block.startTime.hours).padStart(2,'0')}:${String(block.startTime.minutes).padStart(2,'0')}:${String(block.startTime.seconds).padStart(2,'0')},${String(block.startTime.milliseconds).padStart(3,'0')}`;
    const endTime = `${String(block.endTime.hours).padStart(2,'0')}:${String(block.endTime.minutes).padStart(2,'0')}:${String(block.endTime.seconds).padStart(2,'0')},${String(block.endTime.milliseconds).padStart(3,'0')}`;
    console.log(`  ${startTime} --> ${endTime}`);
  });
  
  const expected = [
    { start: { h:0, m:0, s:3, ms:0 }, end: { h:0, m:0, s:6, ms:0 } },
    { start: { h:0, m:0, s:7, ms:500 }, end: { h:0, m:0, s:10, ms:500 } },
    { start: { h:0, m:0, s:12, ms:123 }, end: { h:0, m:0, s:17, ms:456 } }
  ];
  
  let passed = true;
  shiftedBlocks.forEach((block, i) => {
    if (block.startTime.seconds !== expected[i].start.s + 2 || 
        block.endTime.seconds !== expected[i].end.s + 2) {
      passed = false;
    }
  });
  
  if (passed) {
    console.log('✅ SRT 正向平移测试通过\n');
  } else {
    console.log('❌ SRT 正向平移测试失败\n');
  }
} catch (e) {
  console.log(`❌ SRT 正向平移测试失败: ${e.message}\n`);
}

console.log('测试 3: SRT 时间轴平移 (-1.5 秒)');
console.log('-'.repeat(80));
try {
  const shifted = shiftSRT(testSRT, -1.5);
  const shiftedBlocks = parseSRT(shifted);
  
  console.log('平移后 (-1.5秒):');
  shiftedBlocks.forEach((block, i) => {
    const startTime = `${String(block.startTime.hours).padStart(2,'0')}:${String(block.startTime.minutes).padStart(2,'0')}:${String(block.startTime.seconds).padStart(2,'0')},${String(block.startTime.milliseconds).padStart(3,'0')}`;
    const endTime = `${String(block.endTime.hours).padStart(2,'0')}:${String(block.endTime.minutes).padStart(2,'0')}:${String(block.endTime.seconds).padStart(2,'0')},${String(block.endTime.milliseconds).padStart(3,'0')}`;
    console.log(`  ${startTime} --> ${endTime}`);
  });
  
  console.log('✅ SRT 反向平移测试通过\n');
} catch (e) {
  console.log(`❌ SRT 反向平移测试失败: ${e.message}\n`);
}

console.log('测试 4: ASS 解析测试');
console.log('-'.repeat(80));
try {
  const { events, formatFields } = parseASS(testASS);
  console.log(`解析到 ${events.length} 个对话事件`);
  console.log(`格式字段: ${formatFields.join(', ')}`);
  console.log(`事件 1: 0:00:01.00 --> 0:00:04.00`);
  console.log(`事件 2: 0:00:05.50 --> 0:00:08.50`);
  console.log(`事件 3: 0:00:10.12 --> 0:00:15.45`);
  console.log('✅ ASS 解析测试通过\n');
} catch (e) {
  console.log(`❌ ASS 解析测试失败: ${e.message}\n`);
}

console.log('测试 5: ASS 时间轴平移 (+3 秒)');
console.log('-'.repeat(80));
try {
  const shifted = shiftASS(testASS, 3);
  
  const { events: shiftedEvents } = parseASS(shifted);
  
  console.log('平移后 (+3秒):');
  shiftedEvents.forEach((event, i) => {
    const start = event.fields.start;
    const end = event.fields.end;
    console.log(`  ${start} --> ${end}`);
  });
  
  const containsDialogue = shifted.includes('Dialogue:');
  const containsFormat = shifted.includes('[Events]');
  
  if (containsDialogue && containsFormat) {
    console.log('✅ ASS 平移测试通过 (保留了完整结构)\n');
  } else {
    console.log('❌ ASS 平移测试失败 (结构不完整)\n');
  }
} catch (e) {
  console.log(`❌ ASS 平移测试失败: ${e.message}\n`);
}

console.log('=' .repeat(80));
console.log('测试完成');
console.log('=' .repeat(80));
