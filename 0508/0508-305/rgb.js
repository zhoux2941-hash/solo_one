class RGBController {
    constructor() {
        this.config = {
            mode: 0,
            brightness: 100,
            speed: 50,
            hue: 180,
            sat: 255
        };
        this.effects = [
            { id: 0, name: '静态单色', icon: '💡', description: '所有按键显示相同颜色' },
            { id: 1, name: '呼吸灯效', icon: '💨', description: '亮度渐变呼吸效果' },
            { id: 2, name: '波浪效果', icon: '🌊', description: '彩虹波浪从左到右流动' },
            { id: 3, name: '涟漪扩散', icon: '💧', description: '按键触发时产生涟漪' },
            { id: 4, name: '彩虹渐变', icon: '🌈', description: '全键彩虹色彩循环' },
            { id: 5, name: '渐变脉冲', icon: '💫', description: '颜色渐变脉冲效果' },
            { id: 6, name: '螺旋旋转', icon: '🌀', description: '彩虹螺旋旋转效果' },
            { id: 7, name: '激光追逐', icon: '⚡', description: '光点追逐移动' },
            { id: 8, name: 'KITT扫描', icon: '🚗', description: '骑士游侠车灯效果' },
            { id: 9, name: '音乐律动', icon: '🎵', description: '随音乐节奏变化', isMusic: true },
            { id: 10, name: '打字点亮', icon: '⌨️', description: '按键触发点亮' },
            { id: 11, name: '关闭', icon: '🌙', description: '关闭所有灯光' }
        ];
        this.musicController = null;
        this.init();
    }

    init() {
        this.renderEffects();
        this.bindEvents();
        this.musicController = new MusicController(this);
    }

    renderEffects() {
        const grid = document.getElementById('effectGrid');
        grid.innerHTML = '';

        this.effects.forEach(effect => {
            const option = document.createElement('div');
            option.className = `effect-option ${effect.id === this.config.mode ? 'selected' : ''}`;
            option.dataset.mode = effect.id;
            option.innerHTML = `
                <div class="effect-icon">${effect.icon}</div>
                <div class="effect-name">${effect.name}</div>
            `;
            option.addEventListener('click', () => this.selectEffect(effect.id));
            grid.appendChild(option);
        });
    }

    bindEvents() {
        document.getElementById('brightnessSlider').addEventListener('input', (e) => {
            this.config.brightness = parseInt(e.target.value);
            document.getElementById('brightnessValue').textContent = this.config.brightness;
        });

        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.config.speed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.config.speed;
        });

        document.getElementById('colorPicker').addEventListener('input', (e) => {
            const hex = e.target.value;
            document.getElementById('colorValue').textContent = hex;
            const { h, s } = this.hexToHS(hex);
            this.config.hue = h;
            this.config.sat = s;
        });
    }

    selectEffect(mode) {
        this.config.mode = mode;
        
        document.querySelectorAll('.effect-option').forEach(opt => {
            opt.classList.toggle('selected', parseInt(opt.dataset.mode) === mode);
        });

        const effect = this.effects.find(e => e.id === mode);
        if (effect) {
            usbManager.log('info', `选择灯效: ${effect.name}`);
        }
        
        if (this.musicController) {
            this.musicController.showMusicControls(effect?.isMusic || false);
        }
    }

    hexToHS(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;

        let h = 0;
        const s = max === 0 ? 0 : d / max;

        if (max !== min) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 255),
            s: Math.round(s * 255)
        };
    }

    hsToHex(h, s) {
        h = h / 255;
        s = s / 255;
        const l = 0.5;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    async loadConfig() {
        if (!usbManager.isConnected) return;

        usbManager.log('info', '正在读取RGB配置...');
        
        try {
            const config = await usbManager.readRGBConfig();
            if (config) {
                this.config = config;
                
                this.selectEffect(config.mode);
                
                document.getElementById('brightnessSlider').value = config.brightness;
                document.getElementById('brightnessValue').textContent = config.brightness;
                
                document.getElementById('speedSlider').value = config.speed;
                document.getElementById('speedValue').textContent = config.speed;
                
                const hex = this.hsToHex(config.hue, config.sat);
                document.getElementById('colorPicker').value = hex;
                document.getElementById('colorValue').textContent = hex;
                
                usbManager.log('success', 'RGB配置读取完成');
            }
        } catch (e) {
            usbManager.log('error', `读取RGB配置失败: ${e.message}`);
        }
    }

    async writeConfig() {
        if (!usbManager.isConnected) return;

        usbManager.log('info', '正在写入RGB配置...');
        
        try {
            await usbManager.writeRGBConfig(this.config);
            usbManager.log('success', 'RGB配置写入完成');
        } catch (e) {
            usbManager.log('error', `写入RGB配置失败: ${e.message}`);
        }
    }
}

const rgbController = new RGBController();