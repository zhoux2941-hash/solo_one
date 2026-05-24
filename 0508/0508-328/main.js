const RTL_SDR_VENDOR_ID = 0x0BDA;
const RTL_SDR_PRODUCT_ID = 0x2838;

class FFT {
    constructor(size) {
        this.size = size;
        this.log2Size = Math.log2(size);
        this.real = new Float32Array(size);
        this.imag = new Float32Array(size);
        this.reverseTable = new Uint16Array(size);
        this.twiddleReal = new Float32Array(size / 2);
        this.twiddleImag = new Float32Array(size / 2);
        
        this.initReverseTable();
        this.initTwiddleFactors();
    }

    initReverseTable() {
        for (let i = 0; i < this.size; i++) {
            let j = 0;
            let n = i;
            for (let k = 0; k < this.log2Size; k++) {
                j = (j << 1) | (n & 1);
                n >>= 1;
            }
            this.reverseTable[i] = j;
        }
    }

    initTwiddleFactors() {
        const halfSize = this.size / 2;
        for (let i = 0; i < halfSize; i++) {
            const angle = -2 * Math.PI * i / this.size;
            this.twiddleReal[i] = Math.cos(angle);
            this.twiddleImag[i] = Math.sin(angle);
        }
    }

    transform(iqData) {
        const n = this.size;
        
        for (let i = 0; i < n; i++) {
            const j = this.reverseTable[i];
            this.real[j] = iqData[i * 2];
            this.imag[j] = iqData[i * 2 + 1];
        }

        for (let level = 1; level <= this.log2Size; level++) {
            const levelSize = 1 << level;
            const halfLevel = levelSize >> 1;
            const step = n / levelSize;

            for (let i = 0; i < n; i += levelSize) {
                for (let j = 0; j < halfLevel; j++) {
                    const idx = i + j;
                    const idx2 = idx + halfLevel;
                    const twiddleIdx = j * step;

                    const tr = this.twiddleReal[twiddleIdx];
                    const ti = this.twiddleImag[twiddleIdx];

                    const r2 = this.real[idx2];
                    const i2 = this.imag[idx2];

                    const ur = tr * r2 - ti * i2;
                    const ui = tr * i2 + ti * r2;

                    this.real[idx2] = this.real[idx] - ur;
                    this.imag[idx2] = this.imag[idx] - ui;
                    this.real[idx] += ur;
                    this.imag[idx] += ui;
                }
            }
        }

        return this.real.map((r, i) => {
            const im = this.imag[i];
            return Math.sqrt(r * r + im * im);
        });
    }
}

class SpectrumProcessor {
    constructor(fftSize = 4096) {
        this.fftSize = fftSize;
        this.fft = new FFT(fftSize);
        this.window = this.hanningWindow(fftSize);
        this.windowCorrection = this.calculateWindowCorrection();
        this.fftCorrection = 1.0 / fftSize;
        this.avgBuffer = null;
        this.avgFrames = 5;
        this.frameCount = 0;
        this.calibrationOffset = -72.0;
    }

    hanningWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        return window;
    }

    calculateWindowCorrection() {
        let sum = 0;
        for (let i = 0; i < this.window.length; i++) {
            sum += this.window[i];
        }
        return this.window.length / sum;
    }

    setAvgFrames(frames) {
        this.avgFrames = frames;
        this.avgBuffer = null;
        this.frameCount = 0;
    }

    processIQ(iqData) {
        const n = Math.min(iqData.length / 2, this.fftSize);
        
        const windowedIQ = new Float32Array(this.fftSize * 2);
        for (let i = 0; i < n; i++) {
            const idx = i * 2;
            const w = this.window[i];
            windowedIQ[idx] = iqData[idx] * w;
            windowedIQ[idx + 1] = iqData[idx + 1] * w;
        }

        const magnitudes = this.fft.transform(windowedIQ);
        
        const correction = this.fftCorrection * this.windowCorrection * 2.0;
        
        const halfSize = this.fftSize / 2;
        const result = new Float32Array(this.fftSize);
        
        for (let i = 0; i < halfSize; i++) {
            result[i] = magnitudes[i + halfSize] * correction;
            result[i + halfSize] = magnitudes[i] * correction;
        }

        if (this.avgFrames > 1) {
            if (!this.avgBuffer) {
                this.avgBuffer = new Float32Array(this.fftSize);
            }
            
            for (let i = 0; i < this.fftSize; i++) {
                this.avgBuffer[i] = (this.avgBuffer[i] * this.frameCount + result[i]) / (this.frameCount + 1);
            }
            
            this.frameCount = Math.min(this.frameCount + 1, this.avgFrames);
            
            for (let i = 0; i < this.fftSize; i++) {
                result[i] = this.avgBuffer[i];
            }
        }

        return result;
    }

    toDecibels(magnitudes) {
        const db = new Float32Array(magnitudes.length);
        for (let i = 0; i < magnitudes.length; i++) {
            const mag = magnitudes[i];
            db[i] = mag > 0 ? 20 * Math.log10(mag) + this.calibrationOffset : -120;
        }
        return db;
    }
}

class Demodulator {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.audioContext = null;
        this.prevI = 0;
        this.prevQ = 0;
        this.fmDeviation = 75000;
        
        this.dcBlockI1 = 0;
        this.dcBlockQ1 = 0;
        
        this.lpf1State = 0;
        this.lpf2State = 0;
        this.lpf3State = 0;
        this.lpf4State = 0;
        
        this.deemphStateL = 0;
        this.deemphStateR = 0;
        this.deemphTime = 50e-6;
        
        this.agcGain = 1.0;
        this.agcTarget = 0.3;
        this.agcAttack = 0.001;
        this.agcDecay = 0.0001;
        
        this.stereoEnabled = true;
        this.stereoLocked = false;
        this.pilotStrength = 0;
        this.stereoBlend = 1.0;
        
        this.pllPhase = 0;
        this.pllFrequency = 19000;
        this.pllAlpha = 0.05;
        this.pllBeta = 0.001;
        this.pllLockTime = 0;
        
        this.bpf19kHz_z1 = 0;
        this.bpf19kHz_z2 = 0;
        this.bpf38kHz_z1 = 0;
        this.bpf38kHz_z2 = 0;
        
        this.lpfLR_z1 = 0;
        this.lpfLR_z2 = 0;
    }

    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    dcBlockIQ(iqData) {
        const output = new Float32Array(iqData.length);
        const alpha = 0.995;
        
        for (let i = 0; i < iqData.length; i += 2) {
            const I = iqData[i];
            const Q = iqData[i + 1];
            
            this.dcBlockI1 = alpha * this.dcBlockI1 + (1 - alpha) * I;
            this.dcBlockQ1 = alpha * this.dcBlockQ1 + (1 - alpha) * Q;
            
            output[i] = I - this.dcBlockI1;
            output[i + 1] = Q - this.dcBlockQ1;
        }
        
        return output;
    }

    demodAM(iqData, bandwidth = 15000) {
        const dcBlocked = this.dcBlockIQ(iqData);
        const output = new Float32Array(dcBlocked.length / 2);
        
        for (let i = 0; i < output.length; i++) {
            const idx = i * 2;
            const I = dcBlocked[idx];
            const Q = dcBlocked[idx + 1];
            
            output[i] = Math.sqrt(I * I + Q * Q);
        }

        const filtered = this.multiOrderLPF(output, bandwidth);
        return this.agc(filtered);
    }

    bandpassFilter(input, centerFreq, bandwidth) {
        const output = new Float32Array(input.length);
        const f0 = centerFreq / this.sampleRate;
        const bw = bandwidth / this.sampleRate;
        const R = 1 - 3 * bw;
        const K = (1 - 2 * R * Math.cos(2 * Math.PI * f0) + R * R) / (2 - 2 * Math.cos(2 * Math.PI * f0));
        
        const a0 = 1 - K;
        const a1 = 2 * (K - R) * Math.cos(2 * Math.PI * f0);
        const a2 = R * R - K;
        const b1 = 2 * R * Math.cos(2 * Math.PI * f0);
        const b2 = -R * R;
        
        let z1 = this.bpf19kHz_z1;
        let z2 = this.bpf19kHz_z2;
        
        for (let i = 0; i < input.length; i++) {
            const x = input[i];
            const y = a0 * x + a1 * z1 + a2 * z2 + b1 * z1 + b2 * z2;
            output[i] = y;
            z2 = z1;
            z1 = y;
        }
        
        this.bpf19kHz_z1 = z1;
        this.bpf19kHz_z2 = z2;
        
        return output;
    }

    detectPilot(fmSignal) {
        const bpFiltered = this.bandpassFilter(fmSignal, 19000, 200);
        
        let strength = 0;
        for (let i = 0; i < bpFiltered.length; i++) {
            strength += bpFiltered[i] * bpFiltered[i];
        }
        strength = Math.sqrt(strength / bpFiltered.length);
        
        this.pilotStrength = 0.95 * this.pilotStrength + 0.05 * strength;
        
        if (this.pilotStrength > 0.01) {
            this.pllLockTime++;
            if (this.pllLockTime > 100) {
                this.stereoLocked = true;
            }
        } else {
            this.pllLockTime = 0;
            this.stereoLocked = false;
        }
        
        return bpFiltered;
    }

    pllTrack(pilotSignal) {
        if (!this.stereoEnabled || !this.stereoLocked) {
            return;
        }
        
        for (let i = 0; i < pilotSignal.length; i++) {
            const sample = pilotSignal[i];
            
            const ncoOut = Math.sin(this.pllPhase);
            
            const error = sample * ncoOut;
            
            this.pllFrequency += this.pllBeta * error;
            this.pllPhase += 2 * Math.PI * this.pllFrequency / this.sampleRate + this.pllAlpha * error;
            
            while (this.pllPhase > 2 * Math.PI) {
                this.pllPhase -= 2 * Math.PI;
            }
            while (this.pllPhase < 0) {
                this.pllPhase += 2 * Math.PI;
            }
        }
        
        const freqError = Math.abs(this.pllFrequency - 19000);
        if (freqError < 50) {
            this.stereoBlend = Math.min(1.0, this.stereoBlend + 0.001);
        } else if (freqError > 200) {
            this.stereoBlend = Math.max(0.0, this.stereoBlend - 0.01);
        }
    }

    demodStereoFM(fmSignal, bandwidth = 15000) {
        const pilot = this.detectPilot(fmSignal);
        this.pllTrack(pilot);
        
        const lplusr = this.multiOrderLPF(fmSignal, bandwidth);
        
        let lminus = new Float32Array(fmSignal.length);
        if (this.stereoEnabled && this.stereoLocked && this.stereoBlend > 0.1) {
            for (let i = 0; i < fmSignal.length; i++) {
                const carrier38 = Math.sin(2 * this.pllPhase);
                lminus[i] = fmSignal[i] * carrier38 * 2;
            }
            lminus = this.multiOrderLPF(lminus, bandwidth);
        }
        
        const left = new Float32Array(fmSignal.length);
        const right = new Float32Array(fmSignal.length);
        
        for (let i = 0; i < fmSignal.length; i++) {
            const blend = this.stereoBlend;
            left[i] = lplusr[i] + lminus[i] * blend;
            right[i] = lplusr[i] - lminus[i] * blend;
        }
        
        const leftDeemph = this.fmDeemphasisStereo(left, 'L');
        const rightDeemph = this.fmDeemphasisStereo(right, 'R');
        
        const leftAgc = this.agcStereo(leftDeemph, 'L');
        const rightAgc = this.agcStereo(rightDeemph, 'R');
        
        return { left: leftAgc, right: rightAgc, isStereo: this.stereoLocked };
    }

    demodFM(iqData, bandwidth = 15000) {
        const dcBlocked = this.dcBlockIQ(iqData);
        const fmSignal = new Float32Array(dcBlocked.length / 2);
        
        for (let i = 0; i < fmSignal.length; i++) {
            const idx = i * 2;
            const I = dcBlocked[idx];
            const Q = dcBlocked[idx + 1];
            
            const mag = Math.sqrt(I * I + Q * Q);
            const normI = mag > 0.001 ? I / mag : 0;
            const normQ = mag > 0.001 ? Q / mag : 0;
            
            let dPhase = Math.atan2(normI * this.prevQ - normQ * this.prevI, 
                                     normI * this.prevI + normQ * this.prevQ);
            
            if (dPhase > Math.PI) dPhase -= 2 * Math.PI;
            if (dPhase < -Math.PI) dPhase += 2 * Math.PI;
            
            fmSignal[i] = dPhase * (this.sampleRate / (2 * Math.PI * this.fmDeviation));
            
            this.prevI = normI;
            this.prevQ = normQ;
        }

        if (this.stereoEnabled) {
            return this.demodStereoFM(fmSignal, bandwidth);
        }
        
        let filtered = this.multiOrderLPF(fmSignal, bandwidth);
        filtered = this.fmDeemphasis(filtered);
        return this.agc(filtered);
    }

    multiOrderLPF(input, cutoffFreq) {
        const output = new Float32Array(input.length);
        const omega = 2 * Math.PI * cutoffFreq / this.sampleRate;
        const cosOmega = Math.cos(omega);
        const alpha = Math.sin(omega) / (2 * 0.7071);
        
        const b0 = (1 - cosOmega) / 2;
        const b1 = 1 - cosOmega;
        const b2 = b0;
        const a0 = 1 + alpha;
        const a1 = -2 * cosOmega;
        const a2 = 1 - alpha;
        
        const nb0 = b0 / a0;
        const nb1 = b1 / a0;
        const nb2 = b2 / a0;
        const na1 = a1 / a0;
        const na2 = a2 / a0;
        
        let z1 = this.lpf1State;
        let z2 = this.lpf2State;
        let z3 = this.lpf3State;
        let z4 = this.lpf4State;
        
        for (let i = 0; i < input.length; i++) {
            const x0 = input[i];
            const y0 = nb0 * x0 + z1;
            z1 = nb1 * x0 - na1 * y0 + z2;
            z2 = nb2 * x0 - na2 * y0;
            
            const y1 = nb0 * y0 + z3;
            z3 = nb1 * y0 - na1 * y1 + z4;
            z4 = nb2 * y0 - na2 * y1;
            
            output[i] = y1;
        }
        
        this.lpf1State = z1;
        this.lpf2State = z2;
        this.lpf3State = z3;
        this.lpf4State = z4;
        
        return output;
    }

    fmDeemphasis(input) {
        const output = new Float32Array(input.length);
        const alpha = 1.0 - Math.exp(-1.0 / (this.sampleRate * this.deemphTime));
        
        for (let i = 0; i < input.length; i++) {
            this.deemphStateL = this.deemphStateL + alpha * (input[i] - this.deemphStateL);
            output[i] = this.deemphStateL;
        }
        
        return output;
    }

    fmDeemphasisStereo(input, channel) {
        const output = new Float32Array(input.length);
        const alpha = 1.0 - Math.exp(-1.0 / (this.sampleRate * this.deemphTime));
        
        let state = channel === 'L' ? this.deemphStateL : this.deemphStateR;
        
        for (let i = 0; i < input.length; i++) {
            state = state + alpha * (input[i] - state);
            output[i] = state;
        }
        
        if (channel === 'L') {
            this.deemphStateL = state;
        } else {
            this.deemphStateR = state;
        }
        
        return output;
    }

    agc(input) {
        const output = new Float32Array(input.length);
        
        for (let i = 0; i < input.length; i++) {
            const x = input[i] * this.agcGain;
            output[i] = x;
            
            const error = this.agcTarget - Math.abs(x);
            const gainDelta = error > 0 ? this.agcDecay * error : this.agcAttack * error;
            this.agcGain = Math.max(0.1, Math.min(10.0, this.agcGain + gainDelta));
        }
        
        return output;
    }

    agcStereo(input, channel) {
        const output = new Float32Array(input.length);
        
        for (let i = 0; i < input.length; i++) {
            const x = input[i] * this.agcGain;
            output[i] = x;
            
            const error = this.agcTarget - Math.abs(x);
            const gainDelta = error > 0 ? this.agcDecay * error : this.agcAttack * error;
            this.agcGain = Math.max(0.1, Math.min(10.0, this.agcGain + gainDelta));
        }
        
        return output;
    }

    resample(input, inputRate, outputRate) {
        const ratio = outputRate / inputRate;
        const outputLen = Math.floor(input.length * ratio);
        const output = new Float32Array(outputLen);
        
        const halfLen = 8;
        const sincTable = new Float32Array(halfLen * 2 + 1);
        for (let i = 0; i < sincTable.length; i++) {
            const x = (i - halfLen) * Math.PI * ratio;
            sincTable[i] = x === 0 ? 1 : Math.sin(x) / x;
        }
        
        const window = new Float32Array(sincTable.length);
        for (let i = 0; i < window.length; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (window.length - 1)));
        }
        
        for (let i = 0; i < sincTable.length; i++) {
            sincTable[i] *= window[i] * ratio;
        }
        
        for (let i = 0; i < outputLen; i++) {
            const pos = i / ratio;
            const idx = Math.floor(pos);
            const frac = pos - idx;
            
            let sum = 0;
            for (let j = -halfLen; j <= halfLen; j++) {
                const inputIdx = idx + j;
                if (inputIdx >= 0 && inputIdx < input.length) {
                    const sincIdx = j + halfLen + (frac > 0.5 ? 1 : 0);
                    const clampedIdx = Math.max(0, Math.min(sincTable.length - 1, sincIdx));
                    sum += input[inputIdx] * sincTable[clampedIdx];
                }
            }
            output[i] = sum;
        }
        
        return output;
    }

    playAudioMono(audioData, sampleRate, volume = 0.5) {
        if (!this.audioContext) {
            this.initAudio();
        }

        const ctx = this.audioContext;
        const bufferSize = audioData.length;
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            channelData[i] = audioData[i] * volume;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
    }

    playAudioStereo(leftData, rightData, sampleRate, volume = 0.5) {
        if (!this.audioContext) {
            this.initAudio();
        }

        const ctx = this.audioContext;
        const bufferSize = leftData.length;
        const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);
        
        for (let i = 0; i < bufferSize; i++) {
            leftChannel[i] = leftData[i] * volume;
            rightChannel[i] = rightData[i] * volume;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
    }

    playAudio(audioData, sampleRate, volume = 0.5) {
        if (audioData.left && audioData.right) {
            this.playAudioStereo(audioData.left, audioData.right, sampleRate, volume);
        } else {
            this.playAudioMono(audioData, sampleRate, volume);
        }
    }

    getStereoStatus() {
        return {
            enabled: this.stereoEnabled,
            locked: this.stereoLocked,
            pilotStrength: this.pilotStrength,
            blend: this.stereoBlend,
            pllFrequency: this.pllFrequency
        };
    }

    setStereoEnabled(enabled) {
        this.stereoEnabled = enabled;
        if (!enabled) {
            this.stereoLocked = false;
            this.stereoBlend = 0;
        }
    }
}

class PeakDetector {
    constructor() {
        this.peakFreq = 0;
        this.peakPower = -Infinity;
        this.holdFrames = 0;
        this.holdCount = 30;
    }

    detect(spectrum, centerFreq, sampleRate) {
        let maxPower = -Infinity;
        let maxIndex = 0;

        for (let i = 0; i < spectrum.length; i++) {
            if (spectrum[i] > maxPower) {
                maxPower = spectrum[i];
                maxIndex = i;
            }
        }

        const binFreq = sampleRate / spectrum.length;
        const freqOffset = (maxIndex - spectrum.length / 2) * binFreq;
        const peakFreq = centerFreq + freqOffset / 1e6;

        if (maxPower > this.peakPower || this.holdFrames >= this.holdCount) {
            this.peakFreq = peakFreq;
            this.peakPower = maxPower;
            this.holdFrames = 0;
        } else {
            this.holdFrames++;
        }

        return {
            frequency: this.peakFreq,
            power: this.peakPower,
            index: maxIndex
        };
    }

    reset() {
        this.peakFreq = 0;
        this.peakPower = -Infinity;
        this.holdFrames = 0;
    }
}

class RtlSdr {
    constructor() {
        this.device = null;
        this.interface = null;
        this.centerFreq = 100e6;
        this.sampleRate = 2.4e6;
        this.gain = 20;
        this.running = false;
        this.onDataCallback = null;
        this.transferSize = 16384;
        this.iqBuffer = new Float32Array(0);
    }

    async connect() {
        try {
            const filters = [
                { vendorId: RTL_SDR_VENDOR_ID, productId: RTL_SDR_PRODUCT_ID }
            ];
            
            this.device = await navigator.usb.requestDevice({ filters });
            
            if (!this.device) {
                throw new Error('No RTL-SDR device selected');
            }

            await this.device.open();
            
            if (this.device.configuration === null) {
                await this.device.selectConfiguration(1);
            }

            this.interface = this.device.configuration.interfaces[0];
            await this.device.claimInterface(this.interface.interfaceNumber);

            await this.initDevice();
            
            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            throw error;
        }
    }

    async disconnect() {
        this.running = false;
        
        if (this.device) {
            try {
                await this.device.close();
            } catch (e) {
                console.error('Error closing device:', e);
            }
            this.device = null;
        }
    }

    async initDevice() {
        await this.writeReg(0x01, 0x18, 0x20);
        await this.demodWriteReg(0x01, 0x00);
        await this.demodWriteReg(0x01, 0x01);
        
        await this.demodWriteReg(0x15, 0x00);
        await this.demodWriteReg(0x16, 0x00);
        await this.demodWriteReg(0x17, 0x00);
        await this.demodWriteReg(0x18, 0x00);
        
        await this.setIfGain(6, 1, 0);
        await this.setIfGain(6, 2, 0);
        await this.setIfGain(6, 3, 0);
        
        await this.demodWriteReg(0x19, (22 << 0) | (1 << 7));
        await this.demodWriteReg(0x1c, 0x00);
        await this.demodWriteReg(0x1d, (0x80 | 0x40));
        await this.demodWriteReg(0x2e, 0x19);
        await this.demodWriteReg(0x2f, 0x19);
        await this.demodWriteReg(0x60, 0x40);
        await this.demodWriteReg(0x61, 0x40);
        
        await this.demodWriteReg(0xde, 0x10);
        await this.demodWriteArr(0x0d, [0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0xfc, 0x05]);
        
        await this.initTuner();
        await this.setSampleRate(this.sampleRate);
        await this.setCenterFreq(this.centerFreq);
        await this.setGain(this.gain);
        await this.resetBuffer();
    }

    async initTuner() {
        try {
            const initData = [
                [0x05, 0x00], [0x06, 0xb0], [0x07, 0x02], [0x08, 0xd0],
                [0x09, 0x96], [0x0a, 0x8a], [0x0b, 0x39], [0x0c, 0x9c],
                [0x0d, 0x0e], [0x0e, 0x45], [0x0f, 0xc0], [0x10, 0x08],
                [0x11, 0xc0], [0x12, 0x40], [0x13, 0x76], [0x14, 0x69],
                [0x15, 0x98], [0x16, 0x5e], [0x17, 0xca], [0x18, 0x0c],
                [0x19, 0x96], [0x1a, 0x26], [0x1b, 0x01], [0x1c, 0x81],
                [0x1d, 0x01], [0x1e, 0x81], [0x1f, 0x00], [0x20, 0x80],
                [0x21, 0x00], [0x22, 0x00], [0x23, 0x00], [0x24, 0x0f],
                [0x25, 0x00],
            ];

            for (const [reg, val] of initData) {
                await this.r820tWrite(reg, val);
            }
        } catch (e) {
            console.log('Tuner init warning:', e);
        }
    }

    async r820tWrite(reg, val) {
        return this.writeI2C(0x34, [reg, val]);
    }

    async writeI2C(i2cAddr, data) {
        const cmd = new Uint8Array(data.length + 1);
        cmd[0] = i2cAddr << 1;
        cmd.set(data, 1);
        
        await this.demodWriteArr(0x06, cmd);
        await this.demodWriteReg(0x08, 0x01);
        await this.waitForI2C();
    }

    async waitForI2C() {
        for (let i = 0; i < 50; i++) {
            const status = await this.demodReadReg(0x08);
            if ((status & 0x01) === 0) {
                return;
            }
            await this.sleep(1);
        }
    }

    async demodWriteReg(reg, val) {
        return this.writeReg(0, reg, val);
    }

    async demodReadReg(reg) {
        const result = await this.readReg(0, reg, 1);
        return result[0];
    }

    async demodWriteArr(reg, arr) {
        const data = new Uint8Array(arr);
        return this.device.controlTransferOut({
            requestType: 'vendor',
            recipient: 'device',
            request: 0,
            value: reg,
            index: 0
        }, data);
    }

    async writeReg(block, reg, val) {
        return this.device.controlTransferOut({
            requestType: 'vendor',
            recipient: 'device',
            request: 0,
            value: (block << 8) | reg,
            index: val
        });
    }

    async readReg(block, reg, len) {
        const result = await this.device.controlTransferIn({
            requestType: 'vendor',
            recipient: 'device',
            request: 0,
            value: (block << 8) | reg,
            index: len
        }, len);
        
        return new Uint8Array(result.data.buffer);
    }

    async setIfGain(stage, gain, direct) {
        let val = stage;
        if (direct) {
            val |= 0x10;
        }
        val |= gain << 7;
        await this.demodWriteReg(0x11, val);
    }

    async setSampleRate(rate) {
        this.sampleRate = rate;
        
        const ratio = Math.floor(28.8e6 * 256 / rate);
        
        await this.demodWriteReg(0x09, (ratio >> 16) & 0x3f);
        await this.demodWriteReg(0x0a, (ratio >> 8) & 0xff);
        await this.demodWriteReg(0x0b, ratio & 0xff);
        
        const ppm = (1 << 24);
        await this.demodWriteReg(0x0c, (ppm >> 16) & 0x3f);
        await this.demodWriteReg(0x0d, (ppm >> 8) & 0xff);
        await this.demodWriteReg(0x0e, ppm & 0xff);
    }

    async setCenterFreq(freq) {
        this.centerFreq = freq;
        await this.r820tSetFreq(freq);
    }

    async r820tSetFreq(freq) {
        const fosc = 28.8e6;
        const div = Math.floor((freq * 4) / fosc);
        const mixDiv = Math.max(4, Math.min(30, div & ~1));
        const loDiv = Math.floor((freq * mixDiv) / fosc);
        const loDivNum = loDiv - 2;
        
        const remainder = (freq * mixDiv) - (loDiv * fosc);
        const num = Math.round(remainder * Math.pow(2, 20) / fosc);
        
        const reg05 = ((loDivNum >> 8) & 0x03) | 0x08;
        const reg06 = loDivNum & 0xff;
        
        await this.r820tWrite(0x05, reg05);
        await this.r820tWrite(0x06, reg06 | 0x80);
        
        await this.r820tWrite(0x10, (num >> 12) & 0xff);
        await this.r820tWrite(0x11, (num >> 4) & 0xff);
        await this.r820tWrite(0x12, ((num << 4) & 0xf0) | 0x08);
    }

    async setGain(gain) {
        this.gain = gain;
        
        const gainTable = [
            0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77,
            0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff
        ];
        
        const index = Math.min(Math.max(Math.floor(gain / 3.1), 0), gainTable.length - 1);
        await this.r820tWrite(0x0f, gainTable[index]);
    }

    async resetBuffer() {
        await this.demodWriteReg(0x01, 0x01);
        await this.demodWriteReg(0x01, 0x00);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async startStreaming(callback) {
        this.running = true;
        this.onDataCallback = callback;
        
        for (let i = 0; i < 4; i++) {
            this.readLoop();
        }
    }

    async readLoop() {
        while (this.running && this.device) {
            try {
                const result = await this.device.transferIn(0x81, this.transferSize);
                
                if (result.status === 'ok' && result.data) {
                    const rawData = new Uint8Array(result.data.buffer);
                    const iqData = this.convertToIQ(rawData);
                    
                    if (this.onDataCallback) {
                        this.onDataCallback(iqData);
                    }
                }
            } catch (e) {
                if (this.running) {
                    console.error('Transfer error:', e);
                }
                break;
            }
        }
    }

    stopStreaming() {
        this.running = false;
    }

    convertToIQ(rawData) {
        const iqData = new Float32Array(rawData.length);
        
        for (let i = 0; i < rawData.length; i++) {
            iqData[i] = (rawData[i] - 127.5) / 127.5;
        }
        
        return iqData;
    }
}

class SDRApp {
    constructor() {
        this.rtlSdr = new RtlSdr();
        this.spectrumProcessor = new SpectrumProcessor(4096);
        this.demodulator = new Demodulator(2.4e6);
        this.peakDetector = new PeakDetector();
        
        this.connected = false;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
        this.bytesReceived = 0;
        
        this.iqBuffer = new Float32Array(0);
        this.demodBuffer = new Float32Array(0);
        
        this.initCanvas();
        this.initControls();
        this.initWaterfallColorMap();
        this.updateFreqLabels();
    }

    initCanvas() {
        this.spectrumCanvas = document.getElementById('spectrumCanvas');
        this.waterfallCanvas = document.getElementById('waterfallCanvas');
        this.audioCanvas = document.getElementById('audioCanvas');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');
        this.waterfallCtx = this.waterfallCanvas.getContext('2d');
        this.audioCtx = this.audioCanvas.getContext('2d');
        
        this.spectrumCanvas.addEventListener('click', (e) => this.handleSpectrumClick(e));
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        
        const spectrumRect = this.spectrumCanvas.getBoundingClientRect();
        this.spectrumCanvas.width = spectrumRect.width * dpr;
        this.spectrumCanvas.height = spectrumRect.height * dpr;
        
        const waterfallRect = this.waterfallCanvas.getBoundingClientRect();
        this.waterfallCanvas.width = waterfallRect.width * dpr;
        this.waterfallCanvas.height = waterfallRect.height * dpr;
        
        const audioRect = this.audioCanvas.getBoundingClientRect();
        this.audioCanvas.width = audioRect.width * dpr;
        this.audioCanvas.height = audioRect.height * dpr;
    }

    initWaterfallColorMap() {
        this.colorMap = [];
        for (let i = 0; i < 256; i++) {
            const t = i / 255;
            
            let r, g, b;
            if (t < 0.1) {
                r = 0; g = 0; b = 0;
            } else if (t < 0.3) {
                const t2 = (t - 0.1) / 0.2;
                r = 0; g = 0; b = Math.floor(t2 * 255);
            } else if (t < 0.5) {
                const t2 = (t - 0.3) / 0.2;
                r = 0; g = Math.floor(t2 * 255); b = 255;
            } else if (t < 0.7) {
                const t2 = (t - 0.5) / 0.2;
                r = Math.floor(t2 * 255); g = 255; b = Math.floor((1 - t2) * 255);
            } else if (t < 0.9) {
                const t2 = (t - 0.7) / 0.2;
                r = 255; g = Math.floor((1 - t2) * 255); b = 0;
            } else {
                const t2 = (t - 0.9) / 0.1;
                r = 255; g = Math.floor(t2 * 255); b = Math.floor(t2 * 255);
            }
            
            this.colorMap.push({ r, g, b });
        }
    }

    initControls() {
        document.getElementById('connectBtn').addEventListener('click', () => this.toggleConnection());
        
        document.getElementById('centerFreq').addEventListener('change', (e) => {
            this.setCenterFreq(parseFloat(e.target.value) * 1e6);
        });
        
        document.getElementById('sampleRate').addEventListener('change', (e) => {
            this.setSampleRate(parseFloat(e.target.value) * 1e6);
        });
        
        document.getElementById('gain').addEventListener('input', (e) => {
            document.getElementById('gainValue').textContent = e.target.value + ' dB';
            this.setGain(parseFloat(e.target.value));
        });
        
        document.getElementById('displayBW').addEventListener('input', (e) => {
            document.getElementById('displayBWValue').textContent = e.target.value + ' MHz';
            this.updateFreqLabels();
        });
        
        document.getElementById('avgFrames').addEventListener('input', (e) => {
            document.getElementById('avgFramesValue').textContent = e.target.value;
            this.spectrumProcessor.setAvgFrames(parseInt(e.target.value));
        });
        
        document.getElementById('demodMode').addEventListener('change', (e) => {
            document.getElementById('demodContainer').style.display = 
                e.target.value === 'off' ? 'none' : 'block';
        });
        
        document.getElementById('stereoEnabled').addEventListener('change', (e) => {
            this.demodulator.setStereoEnabled(e.target.checked);
            if (!e.target.checked) {
                const statusEl = document.getElementById('stereoStatus');
                statusEl.textContent = 'M';
                statusEl.className = 'stereo-indicator mono';
                statusEl.title = '单声道模式';
            }
        });
        
        document.getElementById('volume').addEventListener('input', (e) => {
            document.getElementById('volumeValue').textContent = Math.round(e.target.value * 100) + '%';
        });
        
        document.getElementById('tuneToPeak').addEventListener('click', () => {
            const peakFreq = this.peakDetector.peakFreq;
            if (peakFreq > 0) {
                document.getElementById('centerFreq').value = peakFreq.toFixed(3);
                this.setCenterFreq(peakFreq * 1e6);
            }
        });
    }

    async toggleConnection() {
        if (this.connected) {
            await this.disconnect();
        } else {
            await this.connect();
        }
    }

    async connect() {
        try {
            document.getElementById('connectBtn').disabled = true;
            document.getElementById('deviceStatus').textContent = '连接中...';
            
            await this.rtlSdr.connect();
            this.connected = true;
            
            document.getElementById('deviceStatus').textContent = '已连接';
            document.getElementById('deviceStatus').className = 'status-connected';
            document.getElementById('connectBtn').textContent = '断开连接';
            
            this.rtlSdr.startStreaming((iqData) => this.handleData(iqData));
            
            this.demodulator.initAudio();
            
        } catch (error) {
            alert('连接失败: ' + error.message + '\n请确保已连接RTL-SDR设备');
            document.getElementById('deviceStatus').textContent = '未连接';
        } finally {
            document.getElementById('connectBtn').disabled = false;
        }
    }

    async disconnect() {
        this.rtlSdr.stopStreaming();
        await this.rtlSdr.disconnect();
        this.connected = false;
        
        document.getElementById('deviceStatus').textContent = '未连接';
        document.getElementById('deviceStatus').className = 'status-disconnected';
        document.getElementById('connectBtn').textContent = '连接设备';
    }

    async setCenterFreq(freq) {
        if (this.connected) {
            await this.rtlSdr.setCenterFreq(freq);
            this.updateFreqLabels();
        }
    }

    async setSampleRate(rate) {
        if (this.connected) {
            await this.rtlSdr.setSampleRate(rate);
            this.demodulator.sampleRate = rate;
            this.updateFreqLabels();
        }
    }

    async setGain(gain) {
        if (this.connected) {
            await this.rtlSdr.setGain(gain);
        }
    }

    updateFreqLabels() {
        const centerFreq = parseFloat(document.getElementById('centerFreq').value);
        const displayBW = parseFloat(document.getElementById('displayBW').value);
        
        const halfBW = displayBW / 2;
        
        document.getElementById('freqLeft').textContent = (centerFreq - halfBW).toFixed(3) + ' MHz';
        document.getElementById('freqCenter').textContent = centerFreq.toFixed(3) + ' MHz';
        document.getElementById('freqRight').textContent = (centerFreq + halfBW).toFixed(3) + ' MHz';
    }

    handleData(iqData) {
        this.bytesReceived += iqData.length * 4;
        
        this.iqBuffer = new Float32Array([...this.iqBuffer, ...iqData]);
        
        const fftSize = 4096 * 2;
        while (this.iqBuffer.length >= fftSize) {
            const fftData = this.iqBuffer.slice(0, fftSize);
            this.iqBuffer = this.iqBuffer.slice(fftSize);
            
            this.processFFT(fftData);
        }
        
        const demodMode = document.getElementById('demodMode').value;
        if (demodMode !== 'off') {
            this.demodBuffer = new Float32Array([...this.demodBuffer, ...iqData]);
            
            const demodSize = 8192 * 2;
            while (this.demodBuffer.length >= demodSize) {
                const demodData = this.demodBuffer.slice(0, demodSize);
                this.demodBuffer = this.demodBuffer.slice(demodSize);
                
                this.processDemod(demodData, demodMode);
            }
        }
        
        this.updateFps();
    }

    processFFT(iqData) {
        const magnitudes = this.spectrumProcessor.processIQ(iqData);
        const db = this.spectrumProcessor.toDecibels(magnitudes);
        
        this.drawSpectrum(db);
        this.drawWaterfall(db);
        
        const centerFreq = parseFloat(document.getElementById('centerFreq').value);
        const sampleRate = parseFloat(document.getElementById('sampleRate').value) * 1e6;
        const peak = this.peakDetector.detect(db, centerFreq, sampleRate);
        
        document.getElementById('peakFreq').textContent = peak.frequency.toFixed(3) + ' MHz';
        document.getElementById('peakPower').textContent = peak.power.toFixed(1) + ' dBm';
        
        this.drawPeak(peak);
    }

    drawSpectrum(db) {
        const ctx = this.spectrumCtx;
        const width = this.spectrumCanvas.width;
        const height = this.spectrumCanvas.height;
        
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, width, height);
        
        const displayBW = parseFloat(document.getElementById('displayBW').value);
        const sampleRate = parseFloat(document.getElementById('sampleRate').value);
        
        const bwRatio = displayBW / sampleRate;
        const startBin = Math.floor(db.length * (0.5 - bwRatio / 2));
        const endBin = Math.floor(db.length * (0.5 + bwRatio / 2));
        const visibleBins = endBin - startBin;
        
        const dbMin = -120;
        const dbMax = -20;
        
        ctx.beginPath();
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < visibleBins; i++) {
            const binIdx = startBin + i;
            const x = (i / visibleBins) * width;
            const y = height - ((db[binIdx] - dbMin) / (dbMax - dbMin)) * height;
            
            if (i === 0) {
                ctx.moveTo(x, Math.max(0, Math.min(height, y)));
            } else {
                ctx.lineTo(x, Math.max(0, Math.min(height, y)));
            }
        }
        
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let dbVal = -110; dbVal <= -20; dbVal += 10) {
            const y = height - ((dbVal - dbMin) / (dbMax - dbMin)) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px sans-serif';
            ctx.fillText(dbVal + ' dBm', 5, y - 5);
        }
    }

    drawPeak(peak) {
        const ctx = this.spectrumCtx;
        const width = this.spectrumCanvas.width;
        const height = this.spectrumCanvas.height;
        
        const displayBW = parseFloat(document.getElementById('displayBW').value);
        const centerFreq = parseFloat(document.getElementById('centerFreq').value);
        
        const freqOffset = peak.frequency - centerFreq;
        const normalizedPos = (freqOffset / (displayBW / 2) + 1) / 2;
        
        if (normalizedPos >= 0 && normalizedPos <= 1) {
            const x = normalizedPos * width;
            
            ctx.beginPath();
            ctx.strokeStyle = '#ff4757';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.beginPath();
            ctx.fillStyle = '#ff4757';
            ctx.arc(x, 15, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawWaterfall(db) {
        const ctx = this.waterfallCtx;
        const width = this.waterfallCanvas.width;
        const height = this.waterfallCanvas.height;
        
        if (height === 0) return;
        
        const displayBW = parseFloat(document.getElementById('displayBW').value);
        const sampleRate = parseFloat(document.getElementById('sampleRate').value);
        
        const bwRatio = displayBW / sampleRate;
        const startBin = Math.floor(db.length * (0.5 - bwRatio / 2));
        const endBin = Math.floor(db.length * (0.5 + bwRatio / 2));
        const visibleBins = endBin - startBin;
        
        const dbMin = -120;
        const dbMax = -20;
        
        const imageData = ctx.createImageData(width, 1);
        const data = imageData.data;
        
        for (let x = 0; x < width; x++) {
            const binIdx = startBin + Math.floor((x / width) * visibleBins);
            const dbVal = db[binIdx];
            const normalized = Math.max(0, Math.min(1, (dbVal - dbMin) / (dbMax - dbMin)));
            const colorIdx = Math.floor(normalized * 255);
            const color = this.colorMap[colorIdx];
            
            const pixelIdx = x * 4;
            data[pixelIdx] = color.r;
            data[pixelIdx + 1] = color.g;
            data[pixelIdx + 2] = color.b;
            data[pixelIdx + 3] = 255;
        }
        
        const scrollHeight = height - 1;
        if (scrollHeight > 0) {
            const scrollData = ctx.getImageData(0, 0, width, scrollHeight);
            ctx.putImageData(scrollData, 0, 1);
        }
        ctx.putImageData(imageData, 0, 0);
    }

    processDemod(iqData, mode) {
        const demodBW = parseFloat(document.getElementById('demodBW').value) * 1000;
        
        let audioData;
        if (mode === 'am') {
            audioData = this.demodulator.demodAM(iqData, demodBW);
        } else if (mode === 'fm') {
            audioData = this.demodulator.demodFM(iqData, demodBW);
        }
        
        const volume = parseFloat(document.getElementById('volume').value);
        const audioSampleRate = 48000;
        
        let resampled;
        if (audioData.left && audioData.right) {
            const leftResampled = this.demodulator.resample(audioData.left, this.rtlSdr.sampleRate, audioSampleRate);
            const rightResampled = this.demodulator.resample(audioData.right, this.rtlSdr.sampleRate, audioSampleRate);
            resampled = { left: leftResampled, right: rightResampled, isStereo: true };
            this.updateStereoStatus();
        } else {
            resampled = this.demodulator.resample(audioData, this.rtlSdr.sampleRate, audioSampleRate);
        }
        
        this.demodulator.playAudio(resampled, audioSampleRate, volume);
        
        this.drawAudioWaveform(resampled);
    }

    updateStereoStatus() {
        const status = this.demodulator.getStereoStatus();
        const statusEl = document.getElementById('stereoStatus');
        if (statusEl) {
            if (status.locked) {
                statusEl.textContent = 'ST';
                statusEl.className = 'stereo-indicator stereo-locked';
                statusEl.title = `立体声已锁定\n导频强度: ${(status.pilotStrength * 100).toFixed(1)}%\n分离度: ${(status.blend * 100).toFixed(0)}%`;
            } else {
                statusEl.textContent = 'M';
                statusEl.className = 'stereo-indicator mono';
                statusEl.title = '单声道模式';
            }
        }
    }

    drawAudioWaveform(audioData) {
        const ctx = this.audioCtx;
        const width = this.audioCanvas.width;
        const height = this.audioCanvas.height;
        
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, width, height);
        
        const isStereo = audioData.left && audioData.right;
        const halfHeight = height / (isStereo ? 2 : 1);
        
        if (isStereo) {
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const stepL = audioData.left.length / width;
            for (let x = 0; x < width; x++) {
                const idx = Math.floor(x * stepL);
                const y = halfHeight / 2 - audioData.left[idx] * halfHeight / 2;
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const stepR = audioData.right.length / width;
            for (let x = 0; x < width; x++) {
                const idx = Math.floor(x * stepR);
                const y = halfHeight + halfHeight / 2 - audioData.right[idx] * halfHeight / 2;
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, halfHeight / 2);
            ctx.lineTo(width, halfHeight / 2);
            ctx.moveTo(0, halfHeight + halfHeight / 2);
            ctx.lineTo(width, halfHeight + halfHeight / 2);
            ctx.stroke();
            
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#00d4ff';
            ctx.fillText('L', 5, 12);
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText('R', 5, halfHeight + 12);
        } else {
            ctx.beginPath();
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            
            const step = audioData.length / width;
            for (let x = 0; x < width; x++) {
                const idx = Math.floor(x * step);
                const y = height / 2 - audioData[idx] * height / 2;
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
        }
    }

    handleSpectrumClick(e) {
        if (!this.connected) return;
        
        const rect = this.spectrumCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const normalizedX = x / rect.width;
        
        const centerFreq = parseFloat(document.getElementById('centerFreq').value);
        const displayBW = parseFloat(document.getElementById('displayBW').value);
        
        const newFreq = centerFreq + (normalizedX - 0.5) * displayBW;
        const clampedFreq = Math.max(24, Math.min(1700, newFreq));
        
        document.getElementById('centerFreq').value = clampedFreq.toFixed(3);
        this.setCenterFreq(clampedFreq * 1e6);
    }

    updateFps() {
        this.frameCount++;
        
        const now = performance.now();
        if (now - this.lastFpsUpdate > 1000) {
            this.currentFps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
            const dataRateMB = (this.bytesReceived / (1024 * 1024)).toFixed(2);
            
            document.getElementById('fps').textContent = this.currentFps + ' fps';
            document.getElementById('dataRate').textContent = dataRateMB + ' MB/s';
            
            this.frameCount = 0;
            this.bytesReceived = 0;
            this.lastFpsUpdate = now;
        }
    }
}

if (!navigator.usb) {
    alert('您的浏览器不支持WebUSB API，请使用Chrome或Edge浏览器');
}

window.addEventListener('DOMContentLoaded', () => {
    window.sdrApp = new SDRApp();
});