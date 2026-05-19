class KeyboardVisualizer {
    constructor() {
        this.selectedKey = null;
        this.currentLayer = 0;
        this.keymap = {};
        this.keyboardLayout = this.getDefaultLayout();
        this.init();
    }

    getDefaultLayout() {
        return [
            [
                { row: 0, col: 0, width: 'w1', label: 'ESC' },
                { row: 0, col: 1, width: 'w1', label: '1' },
                { row: 0, col: 2, width: 'w1', label: '2' },
                { row: 0, col: 3, width: 'w1', label: '3' },
                { row: 0, col: 4, width: 'w1', label: '4' },
                { row: 0, col: 5, width: 'w1', label: '5' },
                { row: 0, col: 6, width: 'w1', label: '6' },
                { row: 0, col: 7, width: 'w1', label: '7' },
                { row: 0, col: 8, width: 'w1', label: '8' },
                { row: 0, col: 9, width: 'w1', label: '9' },
                { row: 0, col: 10, width: 'w1', label: '0' },
                { row: 0, col: 11, width: 'w1', label: '-_' },
                { row: 0, col: 12, width: 'w1', label: '=+' },
                { row: 0, col: 13, width: 'w2', label: '退格' }
            ],
            [
                { row: 1, col: 0, width: 'w15', label: 'Tab' },
                { row: 1, col: 1, width: 'w1', label: 'Q' },
                { row: 1, col: 2, width: 'w1', label: 'W' },
                { row: 1, col: 3, width: 'w1', label: 'E' },
                { row: 1, col: 4, width: 'w1', label: 'R' },
                { row: 1, col: 5, width: 'w1', label: 'T' },
                { row: 1, col: 6, width: 'w1', label: 'Y' },
                { row: 1, col: 7, width: 'w1', label: 'U' },
                { row: 1, col: 8, width: 'w1', label: 'I' },
                { row: 1, col: 9, width: 'w1', label: 'O' },
                { row: 1, col: 10, width: 'w1', label: 'P' },
                { row: 1, col: 11, width: 'w1', label: '[{' },
                { row: 1, col: 12, width: 'w1', label: ']}' },
                { row: 1, col: 13, width: 'w15', label: '\\|' }
            ],
            [
                { row: 2, col: 0, width: 'w175', label: '大写' },
                { row: 2, col: 1, width: 'w1', label: 'A' },
                { row: 2, col: 2, width: 'w1', label: 'S' },
                { row: 2, col: 3, width: 'w1', label: 'D' },
                { row: 2, col: 4, width: 'w1', label: 'F' },
                { row: 2, col: 5, width: 'w1', label: 'G' },
                { row: 2, col: 6, width: 'w1', label: 'H' },
                { row: 2, col: 7, width: 'w1', label: 'J' },
                { row: 2, col: 8, width: 'w1', label: 'K' },
                { row: 2, col: 9, width: 'w1', label: 'L' },
                { row: 2, col: 10, width: 'w1', label: ';:' },
                { row: 2, col: 11, width: 'w1', label: '\'"' },
                { row: 2, col: 12, width: 'w225', label: '回车' }
            ],
            [
                { row: 3, col: 0, width: 'w225', label: 'Shift' },
                { row: 3, col: 1, width: 'w1', label: 'Z' },
                { row: 3, col: 2, width: 'w1', label: 'X' },
                { row: 3, col: 3, width: 'w1', label: 'C' },
                { row: 3, col: 4, width: 'w1', label: 'V' },
                { row: 3, col: 5, width: 'w1', label: 'B' },
                { row: 3, col: 6, width: 'w1', label: 'N' },
                { row: 3, col: 7, width: 'w1', label: 'M' },
                { row: 3, col: 8, width: 'w1', label: ',<' },
                { row: 3, col: 9, width: 'w1', label: '.>' },
                { row: 3, col: 10, width: 'w1', label: '/?' },
                { row: 3, col: 11, width: 'w275', label: 'Shift' }
            ],
            [
                { row: 4, col: 0, width: 'w125', label: 'Ctrl' },
                { row: 4, col: 1, width: 'w125', label: 'Win' },
                { row: 4, col: 2, width: 'w125', label: 'Alt' },
                { row: 4, col: 3, width: 'w625', label: '空格' },
                { row: 4, col: 4, width: 'w125', label: 'Alt' },
                { row: 4, col: 5, width: 'w125', label: 'Fn' },
                { row: 4, col: 6, width: 'w125', label: 'Win' },
                { row: 4, col: 7, width: 'w125', label: 'Ctrl' }
            ]
        ];
    }

    init() {
        this.renderKeyboard();
        this.setupKeySelector();
        this.bindEvents();
    }

    renderKeyboard() {
        const container = document.getElementById('keyboardVisual');
        container.innerHTML = '';

        this.keyboardLayout.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'keyboard-row';

            row.forEach((key, colIndex) => {
                const keyElement = document.createElement('div');
                keyElement.className = `key ${key.width}`;
                keyElement.dataset.row = key.row;
                keyElement.dataset.col = key.col;
                keyElement.dataset.index = `${rowIndex}-${colIndex}`;
                keyElement.textContent = key.label;
                rowElement.appendChild(keyElement);
            });

            container.appendChild(rowElement);
        });
    }

    setupKeySelector() {
        this.showKeyCategory('basic');
    }

    showKeyCategory(category) {
        const grid = document.getElementById('keyGrid');
        grid.innerHTML = '';

        const keys = KeyCodes[category] || [];
        keys.forEach(key => {
            const option = document.createElement('div');
            option.className = 'key-option';
            option.textContent = key.label;
            option.dataset.code = key.code;
            option.dataset.name = key.name;
            option.addEventListener('click', () => this.selectKeyCode(key));
            grid.appendChild(option);
        });
    }

    bindEvents() {
        document.getElementById('keyboardVisual').addEventListener('click', (e) => {
            if (e.target.classList.contains('key')) {
                this.selectKey(e.target);
            }
        });

        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showKeyCategory(btn.dataset.cat);
            });
        });

        document.getElementById('layerSelect').addEventListener('change', (e) => {
            this.currentLayer = parseInt(e.target.value);
            this.loadLayerKeymap();
        });
    }

    selectKey(keyElement) {
        document.querySelectorAll('.key.selected').forEach(k => k.classList.remove('selected'));
        keyElement.classList.add('selected');
        this.selectedKey = keyElement;
        document.getElementById('keySelectorPanel').style.display = 'block';
    }

    selectKeyCode(key) {
        if (!this.selectedKey) return;

        const row = parseInt(this.selectedKey.dataset.row);
        const col = parseInt(this.selectedKey.dataset.col);
        
        this.keymap[`${this.currentLayer}-${row}-${col}`] = key.code;
        this.selectedKey.textContent = key.label;
        
        usbManager.log('info', `设置键位 [层${this.currentLayer}, 行${row}, 列${col}] = ${key.name} (0x${key.code.toString(16)})`);
    }

    async loadLayerKeymap() {
        if (!usbManager.isConnected) return;

        usbManager.log('info', `正在读取层 ${this.currentLayer} 的键位映射...`);
        
        for (const row of this.keyboardLayout) {
            for (const key of row) {
                try {
                    const keycode = await usbManager.readKeymap(this.currentLayer, key.row, key.col);
                    this.keymap[`${this.currentLayer}-${key.row}-${key.col}`] = keycode;
                    
                    const keyElement = document.querySelector(`.key[data-row="${key.row}"][data-col="${key.col}"]`);
                    if (keyElement) {
                        keyElement.textContent = getKeyLabel(keycode);
                    }
                } catch (e) {
                    console.error(`读取键位失败 [${key.row},${key.col}]:`, e);
                }
            }
        }
        
        usbManager.log('success', '键位映射读取完成');
    }

    async writeLayerKeymap() {
        if (!usbManager.isConnected) return;

        usbManager.log('info', `正在写入层 ${this.currentLayer} 的键位映射...`);
        
        for (const row of this.keyboardLayout) {
            for (const key of row) {
                const keycode = this.keymap[`${this.currentLayer}-${key.row}-${key.col}`];
                if (keycode !== undefined) {
                    try {
                        await usbManager.writeKeymap(this.currentLayer, key.row, key.col, keycode);
                    } catch (e) {
                        console.error(`写入键位失败 [${key.row},${key.col}]:`, e);
                    }
                }
            }
        }
        
        usbManager.log('success', '键位映射写入完成');
    }

    resetSelection() {
        document.querySelectorAll('.key.selected').forEach(k => k.classList.remove('selected'));
        this.selectedKey = null;
        document.getElementById('keySelectorPanel').style.display = 'none';
    }
}

const keyboardVisualizer = new KeyboardVisualizer();