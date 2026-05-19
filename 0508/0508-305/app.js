class App {
    constructor() {
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupButtons();
        this.setupConsole();
        this.checkWebUSBSupport();
    }

    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tabId}Tab`).classList.add('active');
            });
        });
    }

    setupButtons() {
        document.getElementById('connectBtn').addEventListener('click', async () => {
            await this.handleConnect();
        });

        document.getElementById('readConfigBtn').addEventListener('click', async () => {
            await this.handleReadConfig();
        });

        document.getElementById('writeConfigBtn').addEventListener('click', async () => {
            await this.handleWriteConfig();
        });

        document.getElementById('resetBtn').addEventListener('click', async () => {
            await this.handleReset();
        });

        document.getElementById('clearConsoleBtn').addEventListener('click', () => {
            document.getElementById('consoleOutput').innerHTML = '';
        });
    }

    setupConsole() {
        usbManager.log('info', '欢迎使用机械键盘固件配置工具');
        usbManager.log('info', '请点击"连接键盘"按钮开始');
    }

    checkWebUSBSupport() {
        if (!navigator.usb) {
            usbManager.log('error', '您的浏览器不支持 WebUSB 协议');
            usbManager.log('warning', '请使用 Chrome 89+ 或 Edge 89+ 浏览器');
            document.getElementById('connectBtn').disabled = true;
        }
    }

    async handleConnect() {
        const btn = document.getElementById('connectBtn');
        
        if (usbManager.isConnected) {
            await usbManager.disconnect();
            this.updateConnectionStatus(false);
            btn.innerHTML = '<span>🔌 连接键盘</span>';
        } else {
            const success = await usbManager.connect();
            if (success) {
                this.updateConnectionStatus(true);
                btn.innerHTML = '<span>🔌 断开连接</span>';
                await this.handleReadConfig();
            }
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        
        if (connected) {
            indicator.className = 'status-indicator connected';
            text.textContent = '已连接';
        } else {
            indicator.className = 'status-indicator disconnected';
            text.textContent = '未连接';
        }

        document.getElementById('readConfigBtn').disabled = !connected;
        document.getElementById('writeConfigBtn').disabled = !connected;
        document.getElementById('resetBtn').disabled = !connected;
    }

    async handleReadConfig() {
        if (!usbManager.isConnected) {
            usbManager.log('warning', '请先连接键盘');
            return;
        }

        usbManager.log('info', '='.repeat(50));
        usbManager.log('info', '开始读取键盘配置...');
        usbManager.log('info', '='.repeat(50));

        try {
            await keyboardVisualizer.loadLayerKeymap();
            await rgbController.loadConfig();
            await macroController.loadMacros();
            
            usbManager.log('success', '='.repeat(50));
            usbManager.log('success', '所有配置读取完成!');
            usbManager.log('success', '='.repeat(50));
        } catch (error) {
            usbManager.log('error', `读取配置时出错: ${error.message}`);
        }
    }

    async handleWriteConfig() {
        if (!usbManager.isConnected) {
            usbManager.log('warning', '请先连接键盘');
            return;
        }

        if (!confirm('确定要将配置写入键盘吗?')) {
            return;
        }

        usbManager.log('info', '='.repeat(50));
        usbManager.log('info', '开始写入键盘配置...');
        usbManager.log('info', '='.repeat(50));

        try {
            await keyboardVisualizer.writeLayerKeymap();
            await rgbController.writeConfig();
            await macroController.writeMacros();

            usbManager.log('info', '正在保存到 EEPROM...');
            await usbManager.saveToEEPROM();
            
            usbManager.log('info', '正在应用配置...');
            await usbManager.applyConfig();
            
            usbManager.log('success', '='.repeat(50));
            usbManager.log('success', '所有配置写入完成!');
            usbManager.log('success', '配置已立即生效，无需重启键盘');
            usbManager.log('success', '='.repeat(50));
        } catch (error) {
            usbManager.log('error', `写入配置时出错: ${error.message}`);
        }
    }

    async handleReset() {
        if (!usbManager.isConnected) {
            usbManager.log('warning', '请先连接键盘');
            return;
        }

        if (!confirm('确定要重置键盘为默认配置吗? 这将清除所有自定义设置!')) {
            return;
        }

        if (!confirm('再次确认: 重置后所有自定义键位、RGB设置、宏都将丢失!')) {
            return;
        }

        usbManager.log('info', '正在重置键盘配置...');

        try {
            await usbManager.resetEEPROM();
            usbManager.log('success', '键盘已重置为默认配置');
            
            await this.handleReadConfig();
        } catch (error) {
            usbManager.log('error', `重置配置时出错: ${error.message}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});