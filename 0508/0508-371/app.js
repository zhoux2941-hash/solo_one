import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.esm.min.mjs';

const codeEditor = document.getElementById('code-editor');
const mermaidContainer = document.getElementById('mermaid-container');
const previewContainer = document.getElementById('preview-container');
const zoomLevel = document.getElementById('zoom-level');
const errorPanel = document.getElementById('error-panel');
const errorMessage = document.getElementById('error-message');
const snippetSelect = document.getElementById('snippet-select');
const exportPngBtn = document.getElementById('export-png');
const exportSvgBtn = document.getElementById('export-svg');
const themeSelect = document.getElementById('theme-select');
const fontSelect = document.getElementById('font-select');

let currentZoom = 1;
let debounceTimer = null;

class ThemeService {
    constructor() {
        this.themes = ['default', 'dark', 'forest', 'neutral'];
        this.fonts = {
            'Microsoft YaHei, SimHei, sans-serif': '微软雅黑',
            'SimSun, serif': '宋体',
            'KaiTi, serif': '楷体',
            'Arial, sans-serif': 'Arial',
            'Times New Roman, serif': 'Times New Roman'
        };
        
        this.currentTheme = 'default';
        this.currentFont = 'Microsoft YaHei, SimHei, sans-serif';
        
        this.init();
    }

    init() {
        this.initializeMermaid();
        this.setupEventListeners();
    }

    getConfig() {
        return {
            startOnLoad: false,
            theme: this.currentTheme,
            securityLevel: 'loose',
            fontFamily: `"${this.currentFont}"`
        };
    }

    initializeMermaid() {
        mermaid.initialize(this.getConfig());
    }

    reloadMermaid() {
        mermaid.initialize(this.getConfig());
    }

    setTheme(theme) {
        if (this.themes.includes(theme)) {
            this.currentTheme = theme;
            this.reloadMermaid();
            return true;
        }
        return false;
    }

    setFont(font) {
        if (this.fonts[font]) {
            this.currentFont = font;
            this.reloadMermaid();
            return true;
        }
        return false;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getCurrentFont() {
        return this.currentFont;
    }

    setupEventListeners() {
        themeSelect.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
            renderMermaid(codeEditor.value);
        });

        fontSelect.addEventListener('change', (e) => {
            this.setFont(e.target.value);
            renderMermaid(codeEditor.value);
        });
    }
}

const themeService = new ThemeService();

const defaultCode = `flowchart TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E`;

const codeSnippets = {
    'flowchart-if': `flowchart TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E`,
    'flowchart-loop': `flowchart TD
    A[开始] --> B{循环条件}
    B -->|是| C[执行循环体]
    C --> B
    B -->|否| D[结束]`,
    'flowchart-function': `flowchart TD
    A[主程序] --> B[调用函数F]
    B --> C[函数F开始]
    C --> D[执行处理]
    D --> E[返回结果]
    E --> F[主程序继续]`,
    'sequence-basic': `sequenceDiagram
    participant Client as 客户端
    participant Server as 服务器
    
    Client->>Server: 请求数据
    Server->>Server: 处理请求
    Server-->>Client: 返回响应`,
    'class-basic': `classDiagram
    class Animal {
        -name: string
        +eat(): void
        +sleep(): void
    }
    
    class Dog {
        +bark(): void
    }
    
    Animal <|-- Dog`,
    'state-basic': `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: 开始处理
    Processing --> Completed: 处理完成
    Completed --> [*]`
};

const completionItems = [
    { text: 'flowchart', type: 'keyword', category: '流程图' },
    { text: 'graph', type: 'keyword', category: '流程图' },
    { text: 'TD', type: 'keyword', category: '方向' },
    { text: 'TB', type: 'keyword', category: '方向' },
    { text: 'LR', type: 'keyword', category: '方向' },
    { text: 'RL', type: 'keyword', category: '方向' },
    { text: 'BT', type: 'keyword', category: '方向' },
    { text: 'sequenceDiagram', type: 'keyword', category: '时序图' },
    { text: 'classDiagram', type: 'keyword', category: '类图' },
    { text: 'stateDiagram', type: 'keyword', category: '状态图' },
    { text: 'stateDiagram-v2', type: 'keyword', category: '状态图' },
    { text: 'participant', type: 'keyword', category: '时序图' },
    { text: 'actor', type: 'keyword', category: '时序图' },
    { text: 'note', type: 'keyword', category: '通用' },
    { text: 'loop', type: 'keyword', category: '控制' },
    { text: 'alt', type: 'keyword', category: '控制' },
    { text: 'opt', type: 'keyword', category: '控制' },
    { text: 'par', type: 'keyword', category: '控制' },
    { text: 'critical', type: 'keyword', category: '控制' },
    { text: 'class', type: 'keyword', category: '类图' },
    { text: 'interface', type: 'keyword', category: '类图' },
    { text: 'abstract', type: 'keyword', category: '类图' },
    { text: 'implements', type: 'keyword', category: '类图' },
    { text: 'extends', type: 'keyword', category: '类图' },
    { text: 'state', type: 'keyword', category: '状态图' },
    { text: 'fork', type: 'keyword', category: '状态图' },
    { text: 'join', type: 'keyword', category: '状态图' },
    { text: 'style', type: 'keyword', category: '样式' },
    { text: 'linkStyle', type: 'keyword', category: '样式' },
    { text: 'classDef', type: 'keyword', category: '样式' },
    { text: '[ ]', type: 'node', category: '节点形状' },
    { text: '[[]]', type: 'node', category: '节点形状' },
    { text: '(( ))', type: 'node', category: '节点形状' },
    { text: '(())', type: 'node', category: '节点形状' },
    { text: '> ]', type: 'node', category: '节点形状' },
    { text: '{ }', type: 'node', category: '节点形状' },
    { text: '{{ }}', type: 'node', category: '节点形状' },
    { text: '-->', type: 'arrow', category: '箭头' },
    { text: '--|>', type: 'arrow', category: '箭头' },
    { text: '==>', type: 'arrow', category: '箭头' },
    { text: '==|>', type: 'arrow', category: '箭头' },
    { text: '-.-', type: 'arrow', category: '箭头' },
    { text: '-.-|>', type: 'arrow', category: '箭头' },
    { text: 'o-->', type: 'arrow', category: '箭头' },
    { text: 'x-->', type: 'arrow', category: '箭头' },
    { text: '->', type: 'arrow', category: '箭头' },
    { text: '->>', type: 'arrow', category: '箭头' },
    { text: '-->>', type: 'arrow', category: '箭头' },
];

let completionDropdown = null;
let completionIndex = 0;

function renderMermaid(code) {
    if (!code.trim()) {
        mermaidContainer.innerHTML = '<div style="color: #999; text-align: center;">请在左侧编辑器输入Mermaid代码</div>';
        hideError();
        return;
    }

    mermaid.render('mermaid-graph', code)
        .then(({ svg }) => {
            mermaidContainer.innerHTML = svg;
            hideError();
        })
        .catch((error) => {
            showError(error);
            mermaidContainer.innerHTML = '<div style="color: #dc2626; text-align: center; padding: 2rem;">渲染失败，请检查代码</div>';
        });
}

function showError(error) {
    const errorText = error.toString();
    const lineMatch = errorText.match(/line (\d+)/);
    const lineNum = lineMatch ? `第 ${lineMatch[1]} 行 - ` : '';
    const message = errorText.replace(/Error:?\s*/i, '').trim();
    errorMessage.textContent = lineNum + message;
    errorPanel.classList.remove('hidden');
}

function hideError() {
    errorPanel.classList.add('hidden');
}

function debounce(func, delay) {
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedRender = debounce(renderMermaid, 500);

codeEditor.addEventListener('input', () => {
    debouncedRender(codeEditor.value);
});

codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        if (completionDropdown && completionDropdown.style.display !== 'none') {
            selectCompletion();
            return;
        }
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
    }

    if (e.key === 'Enter') {
        if (completionDropdown && completionDropdown.style.display !== 'none') {
            e.preventDefault();
            selectCompletion();
            return;
        }
        const start = codeEditor.selectionStart;
        const lineStart = codeEditor.value.lastIndexOf('\n', start - 1) + 1;
        const line = codeEditor.value.substring(lineStart, start);
        const match = line.match(/^\s*/);
        const indent = match ? match[0] : '';
        e.preventDefault();
        codeEditor.value = codeEditor.value.substring(0, start) + '\n' + indent + codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 1 + indent.length;
    }

    if (e.key === 'ArrowDown' && completionDropdown && completionDropdown.style.display !== 'none') {
        e.preventDefault();
        navigateCompletions(1);
    }

    if (e.key === 'ArrowUp' && completionDropdown && completionDropdown.style.display !== 'none') {
        e.preventDefault();
        navigateCompletions(-1);
    }

    if (e.key === 'Escape' && completionDropdown) {
        hideCompletion();
    }
});

codeEditor.addEventListener('input', () => {
    debouncedRender(codeEditor.value);
    showCompletion();
});

codeEditor.addEventListener('click', hideCompletion);
document.addEventListener('click', (e) => {
    if (completionDropdown && !completionDropdown.contains(e.target) && e.target !== codeEditor) {
        hideCompletion();
    }
});

function showCompletion() {
    const cursorPos = codeEditor.selectionStart;
    const textBeforeCursor = codeEditor.value.substring(0, cursorPos);
    const lastWord = textBeforeCursor.split(/[\s\n\t-><>=.{}()]+/).pop();
    
    if (!lastWord || lastWord.length < 1) {
        hideCompletion();
        return;
    }

    const filteredItems = completionItems.filter(item => 
        item.text.toLowerCase().startsWith(lastWord.toLowerCase())
    );

    if (filteredItems.length === 0) {
        hideCompletion();
        return;
    }

    if (!completionDropdown) {
        createCompletionDropdown();
    }

    const editorRect = codeEditor.getBoundingClientRect();
    const lineNumber = textBeforeCursor.split('\n').length;
    const charPosition = textBeforeCursor.length - textBeforeCursor.lastIndexOf('\n') - 1;
    const lineHeight = 19;
    const charWidth = 8.4;

    completionDropdown.style.left = `${editorRect.left + charPosition * charWidth + 8}px`;
    completionDropdown.style.top = `${editorRect.top + lineNumber * lineHeight + 8}px`;

    completionDropdown.innerHTML = filteredItems.map((item, index) => `
        <div class="completion-item ${index === 0 ? 'selected' : ''}" data-text="${item.text}">
            <span class="completion-icon">${getTypeIcon(item.type)}</span>
            <span>${item.text}</span>
            <span class="completion-shortcut">${item.category}</span>
        </div>
    `).join('');

    completionDropdown.style.display = 'block';
    completionIndex = 0;
}

function createCompletionDropdown() {
    completionDropdown = document.createElement('div');
    completionDropdown.className = 'completion-dropdown';
    document.body.appendChild(completionDropdown);

    completionDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.completion-item');
        if (item) {
            insertCompletion(item.dataset.text);
            hideCompletion();
        }
    });
}

function hideCompletion() {
    if (completionDropdown) {
        completionDropdown.style.display = 'none';
    }
}

function navigateCompletions(direction) {
    const items = completionDropdown.querySelectorAll('.completion-item');
    items[completionIndex]?.classList.remove('selected');
    completionIndex = (completionIndex + direction + items.length) % items.length;
    items[completionIndex]?.classList.add('selected');
    items[completionIndex]?.scrollIntoView({ block: 'nearest' });
}

function selectCompletion() {
    const items = completionDropdown.querySelectorAll('.completion-item');
    const selectedItem = items[completionIndex];
    if (selectedItem) {
        insertCompletion(selectedItem.dataset.text);
        hideCompletion();
    }
}

function insertCompletion(text) {
    const cursorPos = codeEditor.selectionStart;
    const textBeforeCursor = codeEditor.value.substring(0, cursorPos);
    const lastWord = textBeforeCursor.split(/[\s\n\t-><>=.{}()]+/).pop();
    const start = cursorPos - lastWord.length;
    
    codeEditor.value = codeEditor.value.substring(0, start) + text + codeEditor.value.substring(cursorPos);
    codeEditor.selectionStart = codeEditor.selectionEnd = start + text.length;
    codeEditor.focus();
}

function getTypeIcon(type) {
    const icons = {
        keyword: 'K',
        node: '◉',
        arrow: '→',
        style: '✎'
    };
    return icons[type] || '●';
}

snippetSelect.addEventListener('change', () => {
    const snippet = codeSnippets[snippetSelect.value];
    if (snippet) {
        codeEditor.value = snippet;
        renderMermaid(snippet);
        snippetSelect.value = '';
    }
});

function zoom(delta) {
    currentZoom = Math.max(0.25, Math.min(3, currentZoom + delta));
    previewContainer.style.transform = `scale(${currentZoom})`;
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
}

document.getElementById('zoom-in').addEventListener('click', () => zoom(0.1));
document.getElementById('zoom-out').addEventListener('click', () => zoom(-0.1));
document.getElementById('zoom-fit').addEventListener('click', () => {
    currentZoom = 1;
    previewContainer.style.transform = 'scale(1)';
    zoomLevel.textContent = '100%';
});

async function exportPNG() {
    const svgElement = mermaidContainer.querySelector('svg');
    if (!svgElement) {
        alert('请先输入有效的Mermaid代码');
        return;
    }

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            const link = document.createElement('a');
            link.download = 'mermaid-diagram.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            URL.revokeObjectURL(url);
        };
        img.src = url;
    } catch (error) {
        alert('导出PNG失败: ' + error.message);
    }
}

function exportSVG() {
    const svgElement = mermaidContainer.querySelector('svg');
    if (!svgElement) {
        alert('请先输入有效的Mermaid代码');
        return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = 'mermaid-diagram.svg';
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
}

exportPngBtn.addEventListener('click', exportPNG);
exportSvgBtn.addEventListener('click', exportSVG);

codeEditor.value = defaultCode;
renderMermaid(defaultCode);