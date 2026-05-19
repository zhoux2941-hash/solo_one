class MacroController {
    constructor() {
        this.macros = [];
        this.currentMacroIndex = null;
        this.isRecording = false;
        this.recordedSteps = [];
        this.init();
    }

    init() {
        this.loadDefaultMacros();
        this.renderMacroList();
        this.bindEvents();
    }

    loadDefaultMacros() {
        for (let i = 0; i < 16; i++) {
            this.macros.push({
                name: `宏 ${i}`,
                steps: []
            });
        }
    }

    renderMacroList() {
        const list = document.getElementById('macroList');
        list.innerHTML = '';

        this.macros.forEach((macro, index) => {
            const item = document.createElement('div');
            item.className = `macro-item ${index === this.currentMacroIndex ? 'selected' : ''}`;
            item.dataset.index = index;
            item.innerHTML = `
                <span class="macro-item-name">${macro.name}</span>
                <span class="macro-item-delete" data-index="${index}">×</span>
            `;
            
            item.querySelector('.macro-item-name').addEventListener('click', () => {
                this.selectMacro(index);
            });
            
            item.querySelector('.macro-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteMacro(index);
            });
            
            list.appendChild(item);
        });
    }

    selectMacro(index) {
        this.currentMacroIndex = index;
        this.renderMacroList();
        this.renderMacroEditor();
        usbManager.log('info', `选择宏: ${this.macros[index].name}`);
    }

    renderMacroEditor() {
        if (this.currentMacroIndex === null) return;

        const macro = this.macros[this.currentMacroIndex];
        document.getElementById('macroName').value = macro.name;
        
        const stepsContainer = document.getElementById('macroSteps');
        
        const steps = this.isRecording ? this.recordedSteps : macro.steps;
        
        if (steps.length === 0) {
            stepsContainer.innerHTML = '<p class="empty-hint">点击"开始录制"或手动添加按键步骤</p>';
        } else {
            stepsContainer.innerHTML = steps.map((step, index) => `
                <div class="macro-step" data-index="${index}">
                    <span class="step-key">${step.key || getKeyLabel(step.code)}</span>
                    <span class="step-state ${step.pressed ? 'pressed' : 'released'}">
                        ${step.pressed ? '↓ 按下' : '↑ 弹起'}
                    </span>
                    <span class="step-delay">
                        延迟: <input type="number" value="${step.delay || 0}" min="0" max="1000" data-index="${index}"> ms
                    </span>
                    ${!this.isRecording ? `<span class="step-delete" data-index="${index}">×</span>` : ''}
                </div>
            `).join('');
            
            if (!this.isRecording) {
                stepsContainer.querySelectorAll('.step-delete').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.deleteStep(parseInt(e.target.dataset.index));
                    });
                });
                
                stepsContainer.querySelectorAll('.step-delay input').forEach(input => {
                    input.addEventListener('change', (e) => {
                        this.updateStepDelay(parseInt(e.target.dataset.index), parseInt(e.target.value));
                    });
                });
            }
        }
    }

    bindEvents() {
        document.getElementById('addMacroBtn').addEventListener('click', () => {
            this.addMacro();
        });

        document.getElementById('recordMacroBtn').addEventListener('click', () => {
            this.startRecording();
        });

        document.getElementById('stopRecordBtn').addEventListener('click', () => {
            this.stopRecording();
        });

        document.getElementById('addStepBtn').addEventListener('click', () => {
            this.addStep();
        });

        document.getElementById('clearMacroBtn').addEventListener('click', () => {
            this.clearMacro();
        });

        document.getElementById('macroName').addEventListener('change', (e) => {
            if (this.currentMacroIndex !== null) {
                this.macros[this.currentMacroIndex].name = e.target.value;
                this.renderMacroList();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this.isRecording && !e.repeat) {
                this.recordKey(e, true);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.isRecording) {
                this.recordKey(e, false);
            }
        });
    }

    addMacro() {
        const index = this.macros.length;
        this.macros.push({
            name: `新宏 ${index}`,
            steps: []
        });
        this.renderMacroList();
        this.selectMacro(index);
        usbManager.log('info', '创建新宏');
    }

    deleteMacro(index) {
        if (confirm(`确定要删除宏 "${this.macros[index].name}" 吗?`)) {
            this.macros.splice(index, 1);
            if (this.currentMacroIndex === index) {
                this.currentMacroIndex = null;
            } else if (this.currentMacroIndex > index) {
                this.currentMacroIndex--;
            }
            this.renderMacroList();
            this.renderMacroEditor();
            usbManager.log('info', '宏已删除');
        }
    }

    startRecording() {
        if (this.currentMacroIndex === null) {
            usbManager.log('warning', '请先选择一个宏');
            return;
        }

        this.isRecording = true;
        this.recordedSteps = [];
        document.getElementById('recordingStatus').style.display = 'flex';
        document.getElementById('recordMacroBtn').style.display = 'none';
        document.getElementById('stopRecordBtn').style.display = 'block';
        usbManager.log('info', '开始录制宏，请按键盘按键...');
    }

    stopRecording() {
        this.isRecording = false;
        document.getElementById('recordingStatus').style.display = 'none';
        document.getElementById('recordMacroBtn').style.display = 'block';
        document.getElementById('stopRecordBtn').style.display = 'none';

        if (this.currentMacroIndex !== null) {
            this.macros[this.currentMacroIndex].steps = [...this.recordedSteps];
            this.renderMacroEditor();
            usbManager.log('success', `录制完成，共 ${this.recordedSteps.length} 个按键`);
        }
    }

    recordKey(e, isPressed) {
        e.preventDefault();
        
        let keyName = e.key;
        if (e.key === ' ') keyName = 'Space';
        if (e.key === 'Enter') keyName = 'Enter';
        if (e.key === 'Backspace') keyName = 'Backspace';
        if (e.key === 'Tab') keyName = 'Tab';
        if (e.key === 'Escape') keyName = 'Esc';
        
        const keyCode = e.keyCode || e.which;
        const qmkCode = this.jsKeycodeToQmk(keyCode);
        
        this.recordedSteps.push({
            key: keyName,
            code: qmkCode,
            pressed: isPressed,
            delay: isPressed ? 10 : 50
        });
        
        const action = isPressed ? '按下' : '弹起';
        usbManager.log('info', `录制 ${action}: ${keyName} (0x${qmkCode.toString(16)})`);
        
        if (this.currentMacroIndex !== null) {
            this.renderMacroEditor();
        }
    }

    jsKeycodeToQmk(jsCode) {
        const keyMap = {
            8: 0x2A,
            9: 0x2B,
            13: 0x28,
            16: 0xE1,
            17: 0xE0,
            18: 0xE2,
            27: 0x29,
            32: 0x2C,
            33: 0x4B,
            34: 0x4E,
            35: 0x4D,
            36: 0x4A,
            37: 0x50,
            38: 0x52,
            39: 0x4F,
            40: 0x51,
            45: 0x49,
            46: 0x4C,
            91: 0xE3,
            93: 0xE7
        };
        
        if (keyMap[jsCode]) {
            return keyMap[jsCode];
        }
        
        if (jsCode >= 48 && jsCode <= 57) {
            return jsCode === 48 ? 0x27 : 0x1E + (jsCode - 49);
        }
        
        if (jsCode >= 65 && jsCode <= 90) {
            return 0x04 + (jsCode - 65);
        }
        
        if (jsCode >= 112 && jsCode <= 123) {
            return 0x3A + (jsCode - 112);
        }
        
        return jsCode;
    }

    addStep() {
        if (this.currentMacroIndex === null) {
            usbManager.log('warning', '请先选择一个宏');
            return;
        }

        this.macros[this.currentMacroIndex].steps.push({
            key: 'A',
            code: 0x04,
            pressed: true,
            delay: 10
        });
        this.macros[this.currentMacroIndex].steps.push({
            key: 'A',
            code: 0x04,
            pressed: false,
            delay: 50
        });
        this.renderMacroEditor();
    }

    deleteStep(index) {
        if (this.currentMacroIndex === null) return;
        
        this.macros[this.currentMacroIndex].steps.splice(index, 1);
        this.renderMacroEditor();
    }

    updateStepDelay(index, delay) {
        if (this.currentMacroIndex === null) return;
        
        this.macros[this.currentMacroIndex].steps[index].delay = delay;
    }

    clearMacro() {
        if (this.currentMacroIndex === null) return;
        
        if (confirm('确定要清空此宏的所有步骤吗?')) {
            this.macros[this.currentMacroIndex].steps = [];
            this.renderMacroEditor();
            usbManager.log('info', '宏步骤已清空');
        }
    }

    async loadMacros() {
        if (!usbManager.isConnected) return;

        usbManager.log('info', '正在读取宏数据...');
        
        for (let i = 0; i < Math.min(16, this.macros.length); i++) {
            try {
                const data = await usbManager.readMacro(i);
                if (data && data.length > 0) {
                    this.macros[i].steps = this.parseMacroData(data);
                }
            } catch (e) {
                console.error(`读取宏 ${i} 失败:`, e);
            }
        }
        
        this.renderMacroEditor();
        usbManager.log('success', '宏数据读取完成');
    }

    async writeMacros() {
        if (!usbManager.isConnected) return;

        usbManager.log('info', '正在写入宏数据...');
        
        for (let i = 0; i < Math.min(16, this.macros.length); i++) {
            if (this.macros[i].steps.length > 0) {
                try {
                    const data = this.serializeMacroData(this.macros[i].steps);
                    await usbManager.writeMacro(i, data);
                } catch (e) {
                    console.error(`写入宏 ${i} 失败:`, e);
                }
            }
        }
        
        usbManager.log('success', '宏数据写入完成');
    }

    parseMacroData(data) {
        const steps = [];
        for (let i = 0; i < data.length; i += 3) {
            if (i + 2 < data.length) {
                steps.push({
                    code: data[i],
                    pressed: data[i + 1] === 1,
                    delay: data[i + 2],
                    key: getKeyLabel(data[i])
                });
            }
        }
        return steps;
    }

    serializeMacroData(steps) {
        const data = [];
        steps.forEach(step => {
            data.push(step.code & 0xFF);
            data.push(step.pressed ? 1 : 0);
            data.push(step.delay & 0xFF);
        });
        return data.slice(0, 30);
    }
}

const macroController = new MacroController();