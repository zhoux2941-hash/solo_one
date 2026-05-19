class Synthesizer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.oscillators = [];
        this.activeOscillators = new Map();
        this.effects = {};
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.destinationNode = null;
        
        this.waveforms = ['sine', 'square', 'sawtooth', 'triangle', 'noise'];
        this.waveformLabels = {
            'sine': '正弦波',
            'square': '方波',
            'sawtooth': '锯齿波',
            'triangle': '三角波',
            'noise': '白噪声'
        };
        
        this.keyMap = {
            'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4',
            'f': 'F4', 't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4',
            'u': 'A#4', 'j': 'B4', 'k': 'C5'
        };
        
        this.noteFrequencies = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
            'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
            'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25
        };
        
        this.oscillatorConfigs = [
            { enabled: true, waveform: 'sine', volume: 0.5, attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
            { enabled: false, waveform: 'square', volume: 0.3, attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
            { enabled: false, waveform: 'sawtooth', volume: 0.2, attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 },
            { enabled: false, waveform: 'triangle', volume: 0.2, attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.35 }
        ];
        
        this.effectConfigs = {
            filter: { enabled: true, frequency: 1000, q: 1 },
            distortion: { enabled: false, amount: 50 },
            delay: { enabled: false, time: 0.3, feedback: 0.3, mix: 0.3 },
            reverb: { enabled: false, decay: 2, mix: 0.3 }
        };
        
        this.masterVolume = 0.7;
        this.pressedKeys = new Set();
        
        this.init();
    }
    
    init() {
        this.buildOscillatorUI();
        this.buildKeyboard();
        this.bindEvents();
    }
    
    async initAudio() {
        if (this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            return;
        }
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive'
        });
        
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.masterVolume;
        
        this.initEffects();
        
        this.destinationNode = this.audioContext.createMediaStreamDestination();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.connect(this.destinationNode);
        
        document.getElementById('initBtn').textContent = '✓ 音频引擎已启动';
        document.getElementById('initBtn').disabled = true;
    }
    
    initEffects() {
        const ctx = this.audioContext;
        
        this.effects.filter = ctx.createBiquadFilter();
        this.effects.filter.type = 'lowpass';
        this.effects.filter.frequency.value = this.effectConfigs.filter.frequency;
        this.effects.filter.Q.value = this.effectConfigs.filter.q;
        
        this.effects.distortion = ctx.createWaveShaper();
        this.effects.distortion.curve = this.makeDistortionCurve(this.effectConfigs.distortion.amount);
        this.effects.distortion.oversample = '4x';
        
        this.effects.delay = ctx.createDelay(5.0);
        this.effects.delay.delayTime.value = this.effectConfigs.delay.time;
        this.effects.delayFeedback = ctx.createGain();
        this.effects.delayFeedback.gain.value = this.effectConfigs.delay.feedback;
        this.effects.delayMix = ctx.createGain();
        this.effects.delayMix.gain.value = 0;
        this.effects.delay.connect(this.effects.delayFeedback);
        this.effects.delayFeedback.connect(this.effects.delay);
        this.effects.delay.connect(this.effects.delayMix);
        
        this.effects.reverb = ctx.createConvolver();
        this.effects.reverb.buffer = this.createReverbImpulse(this.effectConfigs.reverb.decay);
        this.effects.reverbMix = ctx.createGain();
        this.effects.reverbMix.gain.value = 0;
        
        this.effects.filter.connect(this.effects.distortion);
        this.effects.distortion.connect(this.effects.delay);
        this.effects.distortion.connect(this.effects.delayMix);
        this.effects.delayMix.connect(this.effects.reverb);
        this.effects.delayMix.connect(this.effects.reverbMix);
        this.effects.reverb.connect(this.effects.reverbMix);
        this.effects.reverbMix.connect(this.masterGain);
    }
    
    makeDistortionCurve(amount) {
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; i++) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }
    
    createReverbImpulse(duration) {
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const impulse = ctx.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        return impulse;
    }
    
    buildOscillatorUI() {
        const container = document.getElementById('oscillators');
        container.innerHTML = '';
        
        this.oscillatorConfigs.forEach((config, index) => {
            const oscDiv = document.createElement('div');
            oscDiv.className = 'oscillator-module' + (config.enabled ? ' active' : '');
            oscDiv.id = `osc-${index}`;
            
            oscDiv.innerHTML = `
                <div class="oscillator-header">
                    <h3>振荡器 ${index + 1}</h3>
                    <label>
                        <input type="checkbox" id="osc-${index}-enabled" ${config.enabled ? 'checked' : ''}>
                        启用
                    </label>
                </div>
                <div class="oscillator-controls">
                    <div class="slider-group">
                        <label>波形: 
                            <select class="waveform-select" id="osc-${index}-waveform">
                                ${this.waveforms.map(w => `
                                    <option value="${w}" ${config.waveform === w ? 'selected' : ''}>${this.waveformLabels[w]}</option>
                                `).join('')}
                            </select>
                        </label>
                    </div>
                    <div class="slider-group">
                        <label>音量: <span id="osc-${index}-volume-value">${Math.round(config.volume * 100)}</span>%</label>
                        <input type="range" id="osc-${index}-volume" min="0" max="100" value="${Math.round(config.volume * 100)}" step="1">
                    </div>
                    <div class="adsr-controls">
                        <div class="slider-group">
                            <label>起音 (A): <span id="osc-${index}-attack-value">${config.attack}</span>s</label>
                            <input type="range" id="osc-${index}-attack" min="0.001" max="2" value="${config.attack}" step="0.001">
                        </div>
                        <div class="slider-group">
                            <label>衰减 (D): <span id="osc-${index}-decay-value">${config.decay}</span>s</label>
                            <input type="range" id="osc-${index}-decay" min="0.01" max="2" value="${config.decay}" step="0.01">
                        </div>
                        <div class="slider-group">
                            <label>维持 (S): <span id="osc-${index}-sustain-value">${Math.round(config.sustain * 100)}</span>%</label>
                            <input type="range" id="osc-${index}-sustain" min="0" max="100" value="${Math.round(config.sustain * 100)}" step="1">
                        </div>
                        <div class="slider-group">
                            <label>释音 (R): <span id="osc-${index}-release-value">${config.release}</span>s</label>
                            <input type="range" id="osc-${index}-release" min="0.01" max="3" value="${config.release}" step="0.01">
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(oscDiv);
        });
    }
    
    buildKeyboard() {
        const keyboard = document.getElementById('keyboard');
        keyboard.innerHTML = '';
        
        const whiteKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        const blackKeys = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'];
        const keyLabels = {
            'C4': 'A', 'C#4': 'W', 'D4': 'S', 'D#4': 'E', 'E4': 'D',
            'F4': 'F', 'F#4': 'T', 'G4': 'G', 'G#4': 'Y', 'A4': 'H',
            'A#4': 'U', 'B4': 'J', 'C5': 'K'
        };
        
        let whiteKeyIndex = 0;
        const keyWidth = 62;
        const blackKeyWidth = 40;
        
        whiteKeys.forEach((note, index) => {
            const key = document.createElement('div');
            key.className = 'key key-white';
            key.dataset.note = note;
            key.innerHTML = `<span class="key-label">${note.replace('4', '').replace('5', '')}<br>${keyLabels[note]}</span>`;
            keyboard.appendChild(key);
        });
        
        const blackKeyPositions = [42, 104, 228, 290, 352];
        blackKeys.forEach((note, index) => {
            const key = document.createElement('div');
            key.className = 'key key-black';
            key.dataset.note = note;
            key.style.left = blackKeyPositions[index] + 'px';
            key.innerHTML = `<span class="key-label">${keyLabels[note]}</span>`;
            keyboard.appendChild(key);
        });
    }
    
    bindEvents() {
        document.getElementById('initBtn').addEventListener('click', () => this.initAudio());
        
        document.getElementById('recordBtn').addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecordBtn').addEventListener('click', () => this.stopRecording());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAudio());
        
        document.getElementById('masterVolume').addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.masterVolume = value;
            document.getElementById('masterVolumeValue').textContent = e.target.value;
            if (this.masterGain) {
                this.masterGain.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
            }
        });
        
        this.bindOscillatorEvents();
        this.bindEffectEvents();
        this.bindKeyboardEvents();
    }
    
    bindOscillatorEvents() {
        this.oscillatorConfigs.forEach((config, index) => {
            const enabledCheckbox = document.getElementById(`osc-${index}-enabled`);
            enabledCheckbox.addEventListener('change', (e) => {
                this.oscillatorConfigs[index].enabled = e.target.checked;
                document.getElementById(`osc-${index}`).classList.toggle('active', e.target.checked);
            });
            
            const waveformSelect = document.getElementById(`osc-${index}-waveform`);
            waveformSelect.addEventListener('change', (e) => {
                this.oscillatorConfigs[index].waveform = e.target.value;
            });
            
            const volumeSlider = document.getElementById(`osc-${index}-volume`);
            volumeSlider.addEventListener('input', (e) => {
                const value = e.target.value / 100;
                this.oscillatorConfigs[index].volume = value;
                document.getElementById(`osc-${index}-volume-value`).textContent = e.target.value;
            });
            
            ['attack', 'decay', 'sustain', 'release'].forEach(param => {
                const slider = document.getElementById(`osc-${index}-${param}`);
                slider.addEventListener('input', (e) => {
                    const value = param === 'sustain' ? e.target.value / 100 : parseFloat(e.target.value);
                    this.oscillatorConfigs[index][param] = value;
                    document.getElementById(`osc-${index}-${param}-value`).textContent = 
                        param === 'sustain' ? e.target.value : e.target.value;
                });
            });
        });
    }
    
    bindEffectEvents() {
        document.getElementById('filterEnabled').addEventListener('change', (e) => {
            this.effectConfigs.filter.enabled = e.target.checked;
        });
        
        document.getElementById('filterFreq').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.effectConfigs.filter.frequency = value;
            document.getElementById('filterFreqValue').textContent = Math.round(value);
            if (this.effects.filter) {
                this.effects.filter.frequency.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
            }
        });
        
        document.getElementById('filterQ').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.effectConfigs.filter.q = value;
            document.getElementById('filterQValue').textContent = value.toFixed(1);
            if (this.effects.filter) {
                this.effects.filter.Q.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
            }
        });
        
        document.getElementById('distortionEnabled').addEventListener('change', (e) => {
            this.effectConfigs.distortion.enabled = e.target.checked;
        });
        
        document.getElementById('distortion').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.effectConfigs.distortion.amount = value;
            document.getElementById('distortionValue').textContent = Math.round(value);
            if (this.effects.distortion) {
                this.effects.distortion.curve = this.makeDistortionCurve(value);
            }
        });
        
        document.getElementById('delayEnabled').addEventListener('change', (e) => {
            this.effectConfigs.delay.enabled = e.target.checked;
            if (this.effects.delayMix) {
                this.effects.delayMix.gain.setTargetAtTime(
                    e.target.checked ? this.effectConfigs.delay.mix : 0,
                    this.audioContext.currentTime, 0.01
                );
            }
        });
        
        document.getElementById('delayTime').addEventListener('input', (e) => {
            const value = e.target.value / 1000;
            this.effectConfigs.delay.time = value;
            document.getElementById('delayTimeValue').textContent = e.target.value;
            if (this.effects.delay) {
                this.effects.delay.delayTime.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
            }
        });
        
        document.getElementById('delayFeedback').addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.effectConfigs.delay.feedback = value;
            document.getElementById('delayFeedbackValue').textContent = e.target.value;
            if (this.effects.delayFeedback) {
                this.effects.delayFeedback.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
            }
        });
        
        document.getElementById('delayMix').addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.effectConfigs.delay.mix = value;
            document.getElementById('delayMixValue').textContent = e.target.value;
            if (this.effects.delayMix && this.effectConfigs.delay.enabled) {
                this.effects.delayMix.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
            }
        });
        
        document.getElementById('reverbEnabled').addEventListener('change', (e) => {
            this.effectConfigs.reverb.enabled = e.target.checked;
            if (this.effects.reverbMix) {
                this.effects.reverbMix.gain.setTargetAtTime(
                    e.target.checked ? this.effectConfigs.reverb.mix : 0,
                    this.audioContext.currentTime, 0.01
                );
            }
        });
        
        document.getElementById('reverbDecay').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.effectConfigs.reverb.decay = value;
            document.getElementById('reverbDecayValue').textContent = value.toFixed(1);
            if (this.effects.reverb && this.audioContext) {
                this.effects.reverb.buffer = this.createReverbImpulse(value);
            }
        });
        
        document.getElementById('reverbMix').addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.effectConfigs.reverb.mix = value;
            document.getElementById('reverbMixValue').textContent = e.target.value;
            if (this.effects.reverbMix && this.effectConfigs.reverb.enabled) {
                this.effects.reverbMix.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
            }
        });
    }
    
    bindKeyboardEvents() {
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(key.dataset.note);
            });
            
            key.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.stopNote(key.dataset.note);
            });
            
            key.addEventListener('mouseleave', (e) => {
                this.stopNote(key.dataset.note);
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const note = this.keyMap[e.key.toLowerCase()];
            if (note && !this.pressedKeys.has(note)) {
                this.playNote(note);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const note = this.keyMap[e.key.toLowerCase()];
            if (note) {
                this.stopNote(note);
            }
        });
    }
    
    playNote(note) {
        if (!this.audioContext) {
            alert('请先点击"启动音频引擎"按钮！');
            return;
        }
        
        if (this.activeOscillators.has(note)) {
            return;
        }
        
        this.pressedKeys.add(note);
        
        const keyElement = document.querySelector(`.key[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
        }
        
        const frequency = this.noteFrequencies[note];
        const oscillators = [];
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const startDelay = 0.005;
        
        this.oscillatorConfigs.forEach((config, index) => {
            if (!config.enabled) return;
            
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            gainNode.gain.setValueAtTime(0, now);
            
            if (config.waveform === 'noise') {
                const bufferSize = 2 * ctx.sampleRate;
                const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
                
                const noiseSource = ctx.createBufferSource();
                noiseSource.buffer = noiseBuffer;
                noiseSource.loop = true;
                
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.value = frequency;
                noiseFilter.Q.value = 10;
                
                noiseSource.connect(noiseFilter);
                noiseFilter.connect(gainNode);
                
                let outputNode = gainNode;
                if (this.effectConfigs.filter.enabled) {
                    outputNode.connect(this.effects.filter);
                } else {
                    outputNode.connect(this.effects.distortion);
                }
                
                noiseSource.start(now + startDelay);
                
                oscillators.push({ oscillator: noiseSource, gainNode, type: 'noise' });
            } else {
                osc.type = config.waveform;
                osc.frequency.value = frequency;
                osc.connect(gainNode);
                
                let outputNode = gainNode;
                if (this.effectConfigs.filter.enabled) {
                    outputNode.connect(this.effects.filter);
                } else {
                    outputNode.connect(this.effects.distortion);
                }
                
                osc.start(now + startDelay);
                
                oscillators.push({ oscillator: osc, gainNode, type: 'osc' });
            }
            
            const volume = config.volume;
            const attack = Math.max(config.attack, 0.005);
            const decay = config.decay;
            const sustain = config.sustain;
            
            const attackTimeConstant = Math.max(attack / 3, 0.002);
            gainNode.gain.setTargetAtTime(volume, now + startDelay, attackTimeConstant);
            
            const decayStartTime = now + startDelay + attack;
            const decayTimeConstant = Math.max(decay / 3, 0.005);
            gainNode.gain.setTargetAtTime(volume * sustain, decayStartTime, decayTimeConstant);
        });
        
        this.activeOscillators.set(note, { oscillators, configs: this.oscillatorConfigs.map(c => ({...c})) });
    }
    
    stopNote(note) {
        if (!this.activeOscillators.has(note)) return;
        
        this.pressedKeys.delete(note);
        
        const keyElement = document.querySelector(`.key[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.remove('active');
        }
        
        const noteData = this.activeOscillators.get(note);
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        let maxRelease = 0;
        
        noteData.oscillators.forEach((oscData, index) => {
            const config = this.oscillatorConfigs[index];
            if (!config.enabled) return;
            
            const release = Math.max(config.release, 0.02);
            maxRelease = Math.max(maxRelease, release);
            
            const gainNode = oscData.gainNode;
            gainNode.gain.cancelScheduledValues(now);
            
            const currentGain = gainNode.gain.value;
            gainNode.gain.setValueAtTime(currentGain, now);
            
            const releaseTimeConstant = Math.max(release / 3, 0.005);
            gainNode.gain.setTargetAtTime(0, now, releaseTimeConstant);
            
            const stopTime = now + release * 4;
            setTimeout(() => {
                try {
                    oscData.oscillator.stop(stopTime);
                    oscData.oscillator.disconnect();
                    gainNode.disconnect();
                } catch (e) {}
            }, release * 4000 + 50);
        });
        
        setTimeout(() => {
            this.activeOscillators.delete(note);
        }, maxRelease * 4000 + 100);
    }
    
    startRecording() {
        if (!this.audioContext) {
            alert('请先启动音频引擎！');
            return;
        }
        
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(this.destinationNode.stream);
        
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            document.getElementById('exportBtn').disabled = false;
            document.getElementById('exportFormat').disabled = false;
        };
        
        this.mediaRecorder.start();
        this.isRecording = true;
        
        document.getElementById('recordBtn').disabled = true;
        document.getElementById('stopRecordBtn').disabled = false;
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('exportFormat').disabled = true;
        document.getElementById('recordingIndicator').classList.remove('hidden');
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('stopRecordBtn').disabled = true;
        document.getElementById('exportBtn').disabled = false;
        document.getElementById('exportFormat').disabled = false;
        document.getElementById('recordingIndicator').classList.add('hidden');
    }
    
    async exportAudio() {
        if (this.recordedChunks.length === 0) {
            alert('没有录制的音频！');
            return;
        }
        
        const format = document.getElementById('exportFormat').value;
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        let exportBlob, extension;
        
        switch (format) {
            case 'wav':
                exportBlob = this.encodeWAV(audioBuffer);
                extension = 'wav';
                break;
            case 'webm':
                exportBlob = blob;
                extension = 'webm';
                break;
            case 'mp3':
                exportBlob = this.encodeMP3(audioBuffer);
                extension = 'mp3';
                break;
            case 'flac':
                exportBlob = this.encodeFLAC(audioBuffer);
                extension = 'flac';
                break;
            default:
                exportBlob = this.encodeWAV(audioBuffer);
                extension = 'wav';
        }
        
        const url = URL.createObjectURL(exportBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `synthesizer_recording_${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    encodeWAV(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1;
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const dataLength = buffer.length * blockAlign;
        const bufferLength = 44 + dataLength;
        
        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);
        
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, bufferLength - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);
        
        const channels = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }
        
        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                let sample = channels[channel][i];
                sample = Math.max(-1, Math.min(1, sample));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, sample, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
    
    encodeMP3(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        
        const samples = [];
        for (let i = 0; i < buffer.length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                let sample = buffer.getChannelData(ch)[i];
                sample = Math.max(-1, Math.min(1, sample));
                samples.push(sample);
            }
        }
        
        const bitRate = 128000;
        const samplesPerFrame = 1152;
        const bytesPerFrame = Math.floor(bitRate * samplesPerFrame / sampleRate / 8);
        
        const totalFrames = Math.ceil(samples.length / (numChannels * samplesPerFrame));
        const totalBytes = totalFrames * bytesPerFrame + 128;
        
        const arrayBuffer = new ArrayBuffer(totalBytes);
        const view = new DataView(arrayBuffer);
        let offset = 0;
        
        const id3v2 = new Uint8Array([
            0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        for (let i = 0; i < id3v2.length; i++) {
            view.setUint8(offset++, id3v2[i]);
        }
        
        for (let frame = 0; frame < totalFrames; frame++) {
            const frameHeader = new Uint8Array([
                0xFF, 0xFB, 0x90, 0x00
            ]);
            for (let i = 0; i < frameHeader.length; i++) {
                view.setUint8(offset++, frameHeader[i]);
            }
            
            const frameDataStart = frame * numChannels * samplesPerFrame;
            for (let i = 0; i < samplesPerFrame && frameDataStart + i * numChannels < samples.length; i++) {
                for (let ch = 0; ch < numChannels; ch++) {
                    const sampleIndex = frameDataStart + i * numChannels + ch;
                    if (sampleIndex < samples.length) {
                        let sample = samples[sampleIndex];
                        sample = Math.max(-1, Math.min(1, sample));
                        const encoded = Math.floor((sample + 1) * 127);
                        if (offset < totalBytes) {
                            view.setUint8(offset++, encoded);
                        }
                    }
                }
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/mpeg' });
    }
    
    encodeFLAC(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const totalSamples = buffer.length;
        
        const samples = [];
        for (let i = 0; i < buffer.length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                let sample = buffer.getChannelData(ch)[i];
                sample = Math.max(-1, Math.min(1, sample));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                samples.push(Math.floor(sample));
            }
        }
        
        const parts = [];
        
        const fLaC = new Uint8Array([0x66, 0x4C, 0x61, 0x43]);
        parts.push(fLaC);
        
        const streamInfo = new Uint8Array(34);
        streamInfo[0] = 0x80;
        streamInfo[1] = 0x00;
        streamInfo[2] = 0x00;
        streamInfo[3] = 0x22;
        
        streamInfo[10] = (sampleRate >> 12) & 0xFF;
        streamInfo[11] = (sampleRate >> 4) & 0xFF;
        streamInfo[12] = ((sampleRate & 0x0F) << 4) | ((numChannels - 1) << 1) | 0;
        streamInfo[13] = 0xF0;
        
        streamInfo[18] = (totalSamples >> 24) & 0xFF;
        streamInfo[19] = (totalSamples >> 16) & 0xFF;
        streamInfo[20] = (totalSamples >> 8) & 0xFF;
        streamInfo[21] = totalSamples & 0xFF;
        
        parts.push(streamInfo);
        
        const dataBuffer = new ArrayBuffer(4 + samples.length * 2);
        const dataView = new DataView(dataBuffer);
        
        dataView.setUint8(0, 0xFF);
        dataView.setUint8(1, 0xFF);
        dataView.setUint8(2, 0xF8);
        dataView.setUint8(3, 0x72);
        
        for (let i = 0; i < samples.length; i++) {
            dataView.setInt16(4 + i * 2, samples[i], true);
        }
        
        parts.push(new Uint8Array(dataBuffer));
        
        return new Blob(parts, { type: 'audio/flac' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.synthesizer = new Synthesizer();
});
