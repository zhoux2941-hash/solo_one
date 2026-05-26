const regexInput = document.getElementById('regex-input');
const testText = document.getElementById('test-text');
const highlightContent = document.getElementById('highlight-content');
const resultsList = document.getElementById('results-list');
const regexError = document.getElementById('regex-error');
const explanationBox = document.getElementById('regex-explanation');
const matchCount = document.getElementById('match-count');
const processingStatus = document.getElementById('processing-status');
const lineCount = document.getElementById('line-count');
const charCount = document.getElementById('char-count');
const flagG = document.getElementById('flag-g');
const flagI = document.getElementById('flag-i');
const flagM = document.getElementById('flag-m');
const flagS = document.getElementById('flag-s');

let worker = null;
let debounceTimer = null;
let currentTaskId = 0;
let lastResults = [];

const RegexppExplainer = {
    parse(pattern, flags = '') {
        try {
            const fullPattern = `/${pattern}/${flags}`;
            const ast = window.regexpp.parseRegExpLiteral(fullPattern);
            return ast;
        } catch (e) {
            return null;
        }
    },

    explain(pattern, flags = '') {
        const ast = this.parse(pattern, flags);
        if (!ast) {
            return { summary: '语法错误', detailed: '无法解析正则表达式', tokens: [] };
        }

        const summary = this.explainNode(ast.pattern).summary;
        const detailed = this.explainNode(ast.pattern).detailed;
        const tokens = this.tokenizePattern(pattern);

        return { summary, detailed, tokens };
    },

    explainNode(node, context = {}) {
        switch (node.type) {
            case 'Pattern':
                return this.explainAlternatives(node.alternatives);
            case 'Alternative':
                return this.explainElements(node.elements);
            case 'Group':
                return this.explainGroup(node);
            case 'CapturingGroup':
                return this.explainCapturingGroup(node);
            case 'Quantifier':
                return this.explainQuantifier(node);
            case 'CharacterClass':
                return this.explainCharacterClass(node);
            case 'CharacterClassRange':
                return this.explainCharacterClassRange(node);
            case 'Character':
                return this.explainCharacter(node);
            case 'CharacterSet':
                return this.explainCharacterSet(node);
            case 'Backreference':
                return this.explainBackreference(node);
            case 'Assertion':
                return this.explainAssertion(node);
            case 'AnyCharacter':
                return { summary: '任意字符', detailed: '匹配除换行符外的任意字符' };
            default:
                return { summary: '未知', detailed: `未知节点类型: ${node.type}` };
        }
    },

    explainAlternatives(alternatives) {
        if (alternatives.length === 1) {
            return this.explainElements(alternatives[0].elements);
        }

        const explained = alternatives.map(alt => this.explainElements(alt.elements));
        const summary = explained.map(e => e.summary).filter(Boolean).join(' 或 ');
        const detailed = explained.map((e, i) => `选项${i + 1}: ${e.detailed}`).filter(Boolean).join('；');

        return {
            summary: `(${summary})`,
            detailed: `匹配以下任一情况: ${detailed}`
        };
    },

    explainElements(elements) {
        if (elements.length === 0) {
            return { summary: '', detailed: '' };
        }
        if (elements.length === 1) {
            return this.explainNode(elements[0]);
        }

        const explained = elements.map(el => this.explainNode(el));
        const summary = explained.map(e => e.summary).filter(Boolean).join('，接着');
        const detailed = explained.map((e, i) => `第${i + 1}部分: ${e.detailed}`).filter(Boolean).join('；');

        return {
            summary,
            detailed: `依次匹配: ${detailed}`
        };
    },

    explainGroup(node) {
        const result = this.explainAlternatives(node.alternatives);
        return {
            summary: result.summary,
            detailed: `[非捕获组] ${result.detailed}`
        };
    },

    explainCapturingGroup(node) {
        const result = this.explainAlternatives(node.alternatives);
        const groupName = node.name ? ` "${node.name}"` : ` ${node.groupNumber}`;
        return {
            summary: result.summary,
            detailed: `[捕获组${groupName}] ${result.detailed}`
        };
    },

    explainQuantifier(node) {
        const elementResult = this.explainNode(node.element);

        let quantDesc, summary;

        if (node.min === 0 && node.max === Infinity) {
            quantDesc = '零个或多个';
            summary = `任意数量的${elementResult.summary}`;
        } else if (node.min === 1 && node.max === Infinity) {
            quantDesc = '一个或多个';
            summary = `一个或多个${elementResult.summary}`;
        } else if (node.min === 0 && node.max === 1) {
            quantDesc = '零个或一个';
            summary = `可选的${elementResult.summary}`;
        } else if (node.min === node.max) {
            quantDesc = `恰好${node.min}个`;
            summary = `${node.min}个${elementResult.summary}`;
        } else if (node.max === Infinity) {
            quantDesc = `至少${node.min}个`;
            summary = `${node.min}个以上的${elementResult.summary}`;
        } else {
            quantDesc = `${node.min}到${node.max}个`;
            summary = `${node.min}-${node.max}个${elementResult.summary}`;
        }

        const greedyText = node.greedy ? '' : '（非贪婪）';

        return {
            summary,
            detailed: `${elementResult.detailed}，重复${quantDesc}${greedyText}`
        };
    },

    explainCharacterClass(node) {
        const elements = node.elements.map(el => this.explainClassElement(el));
        const prefix = node.negate ? '除' : '';
        const elemStr = elements.join('或');

        let summary;
        if (node.negate) {
            summary = `${prefix}${elemStr}之外的字符`;
        } else {
            summary = `${elemStr}`;
        }

        return {
            summary,
            detailed: `匹配${node.negate ? '不在' : ''} [${elemStr}] ${node.negate ? '中' : '中的'}字符`
        };
    },

    explainClassElement(el) {
        if (el.type === 'CharacterClassRange') {
            return this.explainCharacterClassRange(el).summary;
        }
        if (el.type === 'Character') {
            return this.explainCharacter(el).summary.replace(/"/g, '');
        }
        if (el.type === 'CharacterSet') {
            return this.explainCharacterSet(el).summary;
        }
        return '未知';
    },

    explainCharacterClassRange(node) {
        const start = this.explainCharacter(node.min).summary.replace(/"/g, '');
        const end = this.explainCharacter(node.max).summary.replace(/"/g, '');
        return {
            summary: `${start}到${end}`,
            detailed: `匹配从${start}到${end}范围的字符`
        };
    },

    explainCharacter(node) {
        let value;
        if (node.raw === '\\n') {
            value = '换行';
        } else if (node.raw === '\\t') {
            value = '制表符';
        } else if (node.raw === '\\r') {
            value = '回车';
        } else if (node.raw.startsWith('\\x') || node.raw.startsWith('\\u')) {
            value = node.raw;
        } else {
            value = node.value;
        }
        return {
            summary: `"${value}"`,
            detailed: `匹配字符 "${value}"`
        };
    },

    explainCharacterSet(node) {
        const setMap = {
            'digit': { summary: '数字', detailed: '匹配0-9的数字' },
            'word': { summary: '字母数字下划线', detailed: '匹配字母、数字或下划线' },
            'space': { summary: '空白字符', detailed: '匹配空格、制表符等空白字符' },
        };

        if (setMap[node.kind]) {
            const result = setMap[node.kind];
            if (node.negate) {
                return {
                    summary: `非${result.summary}`,
                    detailed: `匹配${result.detailed.replace('匹配', '不匹配')}`
                };
            }
            return result;
        }

        return { summary: node.kind || '字符集', detailed: '' };
    },

    explainBackreference(node) {
        const refText = node.ref === 'number' 
            ? `第${node.number}个捕获组` 
            : `命名组"${node.ref}"`;
        return {
            summary: `反向引用${refText}`,
            detailed: `匹配之前${refText}捕获的内容`
        };
    },

    explainAssertion(node) {
        const assertionMap = {
            '^': { summary: '行首', detailed: '匹配一行的开始位置' },
            '$': { summary: '行尾', detailed: '匹配一行的结束位置' },
            '\\b': { summary: '单词边界', detailed: '匹配单词的边界位置' },
            '\\B': { summary: '非单词边界', detailed: '匹配非单词边界的位置' },
        };

        if (assertionMap[node.raw]) {
            return assertionMap[node.raw];
        }

        if (node.kind === 'lookahead') {
            const result = this.explainAlternatives(node.alternatives);
            return {
                summary: `正向预查: ${result.summary}`,
                detailed: `[正向预查] 断言后面是: ${result.detailed}`
            };
        }

        if (node.kind === 'lookbehind') {
            const result = this.explainAlternatives(node.alternatives);
            return {
                summary: `正向后顾: ${result.summary}`,
                detailed: `[正向后顾] 断言前面是: ${result.detailed}`
            };
        }

        if (node.kind === 'negativeLookahead') {
            const result = this.explainAlternatives(node.alternatives);
            return {
                summary: `负向预查: ${result.summary}`,
                detailed: `[负向预查] 断言后面不是: ${result.detailed}`
            };
        }

        if (node.kind === 'negativeLookbehind') {
            const result = this.explainAlternatives(node.alternatives);
            return {
                summary: `负向后顾: ${result.summary}`,
                detailed: `[负向后顾] 断言前面不是: ${result.detailed}`
            };
        }

        return { summary: node.kind || '断言', detailed: '' };
    },

    tokenizePattern(pattern) {
        const tokens = [];
        let i = 0;

        while (i < pattern.length) {
            const ch = pattern[i];

            if (ch === '\\') {
                const escapeMap = {
                    'd': { pattern: '\\d', desc: '数字 (0-9)' },
                    'D': { pattern: '\\D', desc: '非数字' },
                    'w': { pattern: '\\w', desc: '字母、数字、下划线' },
                    'W': { pattern: '\\W', desc: '非字母数字下划线' },
                    's': { pattern: '\\s', desc: '空白字符' },
                    'S': { pattern: '\\S', desc: '非空白字符' },
                    'b': { pattern: '\\b', desc: '单词边界' },
                    'B': { pattern: '\\B', desc: '非单词边界' },
                    'n': { pattern: '\\n', desc: '换行符' },
                    't': { pattern: '\\t', desc: '制表符' },
                    'r': { pattern: '\\r', desc: '回车符' },
                    '1': { pattern: '\\1', desc: '反向引用第1组' },
                    '2': { pattern: '\\2', desc: '反向引用第2组' },
                    '3': { pattern: '\\3', desc: '反向引用第3组' },
                };

                i++;
                if (i < pattern.length) {
                    const escapeCh = pattern[i];
                    if (escapeMap[escapeCh]) {
                        tokens.push(escapeMap[escapeCh]);
                    } else if (escapeCh >= '1' && escapeCh <= '9') {
                        tokens.push({ pattern: `\\${escapeCh}`, desc: `反向引用第${escapeCh}组` });
                    } else {
                        tokens.push({ pattern: `\\${escapeCh}`, desc: `转义字符 "${escapeCh}"` });
                    }
                    i++;
                }
            } else if (ch === '[') {
                let end = pattern.indexOf(']', i);
                if (end === -1) end = pattern.length;
                tokens.push({
                    pattern: pattern.slice(i, end + 1),
                    desc: pattern[i + 1] === '^' ? '排除字符集' : '字符集'
                });
                i = end + 1;
            } else if (ch === '(') {
                if (pattern[i + 1] === '?' && pattern[i + 2] === ':') {
                    tokens.push({ pattern: '(?:', desc: '非捕获组开始' });
                    i += 3;
                } else if (pattern[i + 1] === '?' && pattern[i + 2] === '=') {
                    tokens.push({ pattern: '(?=', desc: '正向预查开始' });
                    i += 3;
                } else if (pattern[i + 1] === '?' && pattern[i + 2] === '!') {
                    tokens.push({ pattern: '(?!', desc: '负向预查开始' });
                    i += 3;
                } else if (pattern[i + 1] === '?' && pattern[i + 2] === '<' && pattern[i + 3] === '=') {
                    tokens.push({ pattern: '(?<=', desc: '正向后顾开始' });
                    i += 4;
                } else if (pattern[i + 1] === '?' && pattern[i + 2] === '<' && pattern[i + 3] === '!') {
                    tokens.push({ pattern: '(?<!', desc: '负向后顾开始' });
                    i += 4;
                } else {
                    tokens.push({ pattern: '(', desc: '捕获组开始' });
                    i++;
                }
            } else if (ch === ')') {
                tokens.push({ pattern: ')', desc: '组结束' });
                i++;
            } else if ('^$'.includes(ch)) {
                const descMap = { '^': '行首', '$': '行尾' };
                tokens.push({ pattern: ch, desc: descMap[ch] });
                i++;
            } else if (ch === '.') {
                tokens.push({ pattern: '.', desc: '任意字符' });
                i++;
            } else if ('*+?'.includes(ch)) {
                const descMap = { '*': '重复0次或多次', '+': '重复1次或多次', '?': '重复0次或1次' };
                tokens.push({ pattern: ch, desc: descMap[ch] });
                i++;
            } else if (ch === '{') {
                const match = pattern.slice(i).match(/^\{\d+(,\d*)?\}/);
                if (match) {
                    tokens.push({ pattern: match[0], desc: '重复次数' });
                    i += match[0].length;
                } else {
                    tokens.push({ pattern: ch, desc: `字符 "${ch}"` });
                    i++;
                }
            } else if (ch === '|') {
                tokens.push({ pattern: '|', desc: '或 (二选一)' });
                i++;
            } else {
                tokens.push({ pattern: ch, desc: `字符 "${ch}"` });
                i++;
            }
        }

        return tokens;
    }
};

function initWorker() {
    if (worker) {
        worker.terminate();
    }
    worker = new Worker('regex-worker.js');
    
    worker.onmessage = function(e) {
        const { type, taskId, results, matchCount: count, progress, error, duration } = e.data;
        
        if (taskId !== currentTaskId) return;

        if (type === 'start') {
            updateStatus('处理中...', 'processing');
        } else if (type === 'progress') {
            updateStatus(`处理中 ${progress}% (${count} 个匹配)`, 'processing');
            matchCount.textContent = `${count} 个匹配`;
        } else if (type === 'complete') {
            lastResults = results;
            updateHighlight(results);
            updateResultsList(results);
            matchCount.textContent = `${count} 个匹配`;
            updateStatus(`完成 (${duration}ms)`, 'done');
        } else if (type === 'error') {
            showError(error);
            updateStatus('错误', 'idle');
        } else if (type === 'cancelled') {
            updateStatus('已取消', 'idle');
        }
    };
}

function updateStatus(text, type) {
    processingStatus.textContent = text;
    processingStatus.className = `status-${type}`;
}

function showError(message) {
    regexError.textContent = message;
    regexInput.classList.add('error');
}

function clearError() {
    regexError.textContent = '';
    regexInput.classList.remove('error');
}

function getFlags() {
    let flags = '';
    if (flagG.checked) flags += 'g';
    if (flagI.checked) flags += 'i';
    if (flagM.checked) flags += 'm';
    if (flagS.checked) flags += 's';
    return flags;
}

function performMatch() {
    const pattern = regexInput.value;
    const text = testText.value;
    const flags = getFlags();

    if (!pattern.trim()) {
        clearError();
        updateHighlight([]);
        updateResultsList([]);
        matchCount.textContent = '0 个匹配';
        updateStatus('就绪', 'idle');
        lastResults = [];
        return;
    }

    try {
        new RegExp(pattern, flags);
        clearError();
    } catch (e) {
        showError(e.message);
        return;
    }

    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        currentTaskId++;
        initWorker();
        worker.postMessage({
            type: 'match',
            taskId: currentTaskId,
            pattern: pattern,
            flags: flags,
            text: text
        });
    }, 300);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateHighlight(results) {
    const text = testText.value;
    
    if (results.length === 0) {
        highlightContent.innerHTML = escapeHtml(text);
        return;
    }

    let html = '';
    let lastIndex = 0;

    for (const result of results) {
        html += escapeHtml(text.substring(lastIndex, result.start));
        
        const groupClass = result.groups.length > 0 ? ` group-${(result.index % 5) + 1}` : '';
        html += `<span class="match${groupClass}">${escapeHtml(result.match)}</span>`;
        
        lastIndex = result.end;
    }

    html += escapeHtml(text.substring(lastIndex));
    highlightContent.innerHTML = html;
}

function updateResultsList(results) {
    if (results.length === 0) {
        resultsList.innerHTML = '<p class="placeholder">暂无匹配结果</p>';
        return;
    }

    let html = '';
    const displayResults = results.slice(0, 500);
    const hiddenCount = results.length - 500;

    for (const result of displayResults) {
        const lineNum = getLineNumber(testText.value, result.start);
        html += `
            <div class="result-item">
                <div class="result-header">
                    <span class="result-index">匹配 #${result.index + 1}</span>
                    <span class="result-position">位置: ${result.start}-${result.end} | 行: ${lineNum}</span>
                </div>
                <div class="result-match">${escapeHtml(result.match)}</div>
                ${result.groups.length > 0 ? `
                    <div class="result-groups">
                        ${result.groups.map(g => `
                            <div class="result-group">
                                <span class="result-group-label">组 ${g.index}:</span>
                                <span class="result-group-value">${escapeHtml(g.value)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    if (hiddenCount > 0) {
        html += `<p class="placeholder">还有 ${hiddenCount} 个匹配结果未显示</p>`;
    }

    resultsList.innerHTML = html;
}

function getLineNumber(text, position) {
    return text.substring(0, position).split('\n').length;
}

function generateExplanation(pattern) {
    if (!pattern.trim()) {
        return '<p class="placeholder">输入正则表达式后，这里将显示中文解释</p>';
    }

    if (typeof window.regexpp === 'undefined') {
        return '<p class="placeholder" style="color: #f59f00;">正在加载解析库...</p>';
    }

    try {
        new RegExp(pattern);
    } catch (e) {
        return `<p class="placeholder" style="color: #ef4444;">正则表达式语法错误: ${escapeHtml(e.message)}</p>`;
    }

    const flags = getFlags();
    const explanation = RegexppExplainer.explain(pattern, flags);
    const tokens = explanation.tokens && explanation.tokens.length > 0 
        ? explanation.tokens 
        : RegexppExplainer.tokenizePattern(pattern);

    const summary = explanation.summary ? `匹配：${explanation.summary}` : '空表达式';

    let html = `
        <div class="explanation-title">功能说明</div>
        <div class="explanation-content">${escapeHtml(summary)}</div>
        <div class="explanation-detail">${escapeHtml(explanation.detailed)}</div>
        <div class="breakdown">
            <div class="explanation-title">语法分解</div>
            ${tokens.slice(1).map(t => `
                <div class="breakdown-item">
                    <span class="breakdown-pattern">${escapeHtml(t.pattern)}</span>
                    <span class="breakdown-desc">${t.desc}</span>
                </div>
            `).join('')}
        </div>
    `;

    return html;
}

function updateExplanation() {
    const pattern = regexInput.value;
    explanationBox.innerHTML = generateExplanation(pattern);
}

function updateStats() {
    const text = testText.value;
    const lines = text.split('\n').length;
    lineCount.textContent = `${lines} 行`;
    charCount.textContent = `${text.length} 字符`;
}

function insertAtCursor(input, textToInsert) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    input.value = before + textToInsert + after;
    
    const newCursorPos = start + textToInsert.length;
    input.selectionStart = input.selectionEnd = newCursorPos;
    input.focus();
    
    handleInputChange();
}

function handleInputChange() {
    performMatch();
    updateExplanation();
}

document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const pattern = btn.dataset.pattern;
        const isPreset = btn.classList.contains('preset');
        
        if (isPreset) {
            regexInput.value = pattern;
        } else {
            insertAtCursor(regexInput, pattern);
        }
        
        handleInputChange();
    });
});

regexInput.addEventListener('input', handleInputChange);
testText.addEventListener('input', () => {
    updateStats();
    handleInputChange();
});

[flagG, flagI, flagM, flagS].forEach(flag => {
    flag.addEventListener('change', handleInputChange);
});

function init() {
    updateStats();
    updateExplanation();
    performMatch();
}

init();
