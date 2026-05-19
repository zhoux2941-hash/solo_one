class SimultaneousInterpreter {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.sourceLang = 'en-US';
        this.targetLang = 'zh-CN';
        this.currentDomain = 'general';
        this.history = [];
        this.startTime = 0;
        this.availableVoices = [];
        
        this.currentMode = 'simultaneous';
        this.currentSpeaker = 'A';
        this.speakers = {
            A: { name: '说话人A', lang: 'zh-CN' },
            B: { name: '说话人B', lang: 'en-US' }
        };
        this.conversationHistory = [];
        
        this.domainDictionaries = {
            medical: this.getMedicalDictionary(),
            tech: this.getTechDictionary(),
            legal: this.getLegalDictionary()
        };
        
        this.preferredVoices = {
            'zh-CN': ['Microsoft Huihui', 'Google 普通话', 'Microsoft Yaoyao', 'Ting-Ting'],
            'en-US': ['Microsoft David', 'Google US English', 'Microsoft Zira', 'Samantha']
        };
        
        this.init();
    }

    init() {
        this.initSpeechRecognition();
        this.loadVoices();
        this.bindEvents();
        this.updateStatus('系统就绪', 'connected');
    }

    loadVoices() {
        const loadVoices = () => {
            this.availableVoices = this.synthesis.getVoices();
            console.log('可用语音:', this.availableVoices.map(v => v.name + ' (' + v.lang + ')'));
            this.updateVoiceSelector();
        };

        loadVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = loadVoices;
        }
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert('您的浏览器不支持语音识别功能，请使用Chrome或Edge浏览器');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('正在聆听...', 'listening');
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };

        this.recognition.onresult = (event) => {
            this.handleRecognitionResult(event);
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            if (event.error !== 'no-speech') {
                this.updateStatus('识别错误: ' + event.error, 'disconnected');
            }
        };
    }

    handleRecognitionResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (this.currentMode === 'simultaneous') {
            if (interimTranscript) {
                this.displayOriginal(interimTranscript, true);
            }

            if (finalTranscript) {
                this.startTime = performance.now();
                this.displayOriginal(finalTranscript, false);
                this.processTranslation(finalTranscript.trim());
            }
        } else {
            if (interimTranscript) {
                this.displayCurrentSpeaking(interimTranscript);
            }

            if (finalTranscript) {
                this.startTime = performance.now();
                this.processConversationTranslation(finalTranscript.trim());
            }
        }
    }

    async processTranslation(text) {
        try {
            const optimizedText = this.applyDomainOptimization(text);
            const translation = await this.translate(optimizedText);
            const endTime = performance.now();
            const latency = Math.round(endTime - this.startTime);
            
            this.updateLatency(latency);
            this.displayTranslation(translation);
            this.speak(translation);
            this.addToHistory(text, translation);
            
        } catch (error) {
            console.error('翻译处理错误:', error);
        }
    }

    async processConversationTranslation(text) {
        try {
            const speaker = this.speakers[this.currentSpeaker];
            const otherSpeaker = this.currentSpeaker === 'A' ? 'B' : 'A';
            const targetLang = this.speakers[otherSpeaker].lang;
            
            this.sourceLang = speaker.lang;
            this.targetLang = targetLang;
            
            const optimizedText = this.applyDomainOptimization(text);
            const translation = await this.translate(optimizedText);
            const endTime = performance.now();
            const latency = Math.round(endTime - this.startTime);
            
            this.updateLatency(latency);
            
            const conversationItem = {
                speaker: this.currentSpeaker,
                speakerName: speaker.name,
                original: text,
                translated: translation,
                sourceLang: speaker.lang,
                targetLang: targetLang,
                timestamp: new Date().toLocaleTimeString()
            };
            
            this.conversationHistory.push(conversationItem);
            this.addConversationBubble(conversationItem);
            this.speak(translation);
            this.clearCurrentSpeaking();
            
        } catch (error) {
            console.error('对话翻译处理错误:', error);
        }
    }

    applyDomainOptimization(text) {
        if (this.currentDomain === 'general' || !this.domainDictionaries[this.currentDomain]) {
            return text;
        }

        let optimizedText = text;
        const dictionary = this.domainDictionaries[this.currentDomain];
        
        for (const [term, optimized] of Object.entries(dictionary)) {
            const regex = new RegExp('\\b' + term + '\\b', 'gi');
            optimizedText = optimizedText.replace(regex, optimized);
        }
        
        return optimizedText;
    }

    async translate(text) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (this.sourceLang === 'en-US' && this.targetLang === 'zh-CN') {
            return this.mockTranslateEnToZh(text);
        } else if (this.sourceLang === 'zh-CN' && this.targetLang === 'en-US') {
            return this.mockTranslateZhToEn(text);
        }
        
        return text;
    }

    mockTranslateEnToZh(text) {
        const translations = {
            'hello': '你好',
            'world': '世界',
            'thank you': '谢谢',
            'goodbye': '再见',
            'yes': '是',
            'no': '否',
            'how are you': '你好吗',
            'i love you': '我爱你',
            'good morning': '早上好',
            'good evening': '晚上好',
            'please': '请',
            'help': '帮助',
            'my name is': '我的名字是',
            'nice to meet you': '很高兴认识你',
            'how much': '多少钱',
            'where is': '在哪里',
            'i need': '我需要',
            'i want': '我想要',
            'can you': '你能',
            'do you': '你是否',
            'computer': '电脑',
            'medicine': '药物',
            'hospital': '医院',
            'doctor': '医生',
            'patient': '病人',
            'health': '健康',
            'technology': '技术',
            'software': '软件',
            'hardware': '硬件',
            'internet': '互联网',
            'data': '数据',
            'artificial intelligence': '人工智能',
            'law': '法律',
            'contract': '合同',
            'legal': '合法的',
            'court': '法院',
            'lawyer': '律师',
            'rights': '权利',
            'the': '', 'a': '', 'an': '', 'is': '是', 'are': '是', 'am': '是',
            'i': '我', 'you': '你', 'he': '他', 'she': '她', 'it': '它',
            'we': '我们', 'they': '他们', 'this': '这个', 'that': '那个',
            'and': '和', 'or': '或', 'but': '但是', 'in': '在', 'on': '在',
            'at': '在', 'to': '到', 'for': '为了', 'with': '和', 'of': '的'
        };

        let result = text;
        for (const [en, zh] of Object.entries(translations)) {
            const regex = new RegExp('\\b' + en + '\\b', 'gi');
            result = result.replace(regex, zh);
        }
        
        return result || text;
    }

    mockTranslateZhToEn(text) {
        const translations = {
            '你好': 'hello',
            '世界': 'world',
            '谢谢': 'thank you',
            '再见': 'goodbye',
            '是': 'yes',
            '否': 'no',
            '我': 'I',
            '你': 'you',
            '他': 'he',
            '她': 'she',
            '我们': 'we',
            '他们': 'they',
            '这个': 'this',
            '那个': 'that',
            '和': 'and',
            '或': 'or',
            '但是': 'but',
            '在': 'in',
            '到': 'to',
            '为了': 'for',
            '的': 'of',
            '爱': 'love',
            '早上': 'morning',
            '好': 'good',
            '晚上': 'evening',
            '请': 'please',
            '帮助': 'help',
            '名字': 'name',
            '很': 'very',
            '高兴': 'happy',
            '认识': 'meet',
            '多少': 'how much',
            '哪里': 'where',
            '需要': 'need',
            '想要': 'want',
            '能': 'can',
            '是否': 'do',
            '电脑': 'computer',
            '药物': 'medicine',
            '医院': 'hospital',
            '医生': 'doctor',
            '病人': 'patient',
            '健康': 'health',
            '技术': 'technology',
            '软件': 'software',
            '硬件': 'hardware',
            '互联网': 'internet',
            '数据': 'data',
            '人工智能': 'artificial intelligence',
            '法律': 'law',
            '合同': 'contract',
            '合法的': 'legal',
            '法院': 'court',
            '律师': 'lawyer',
            '权利': 'rights'
        };

        let result = text;
        for (const [zh, en] of Object.entries(translations)) {
            result = result.replace(new RegExp(zh, 'g'), en + ' ');
        }
        
        return result.trim() || text;
    }

    speak(text) {
        if (!text) return;
        
        this.synthesis.cancel();
        
        const processedText = this.processTextForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(processedText);
        utterance.lang = this.targetLang;
        
        const rate = this.customRate || (this.targetLang === 'zh-CN' ? 0.9 : 0.95);
        const pitch = this.customPitch || (this.targetLang === 'zh-CN' ? 1.05 : 1.02);
        
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 1;
        
        const bestVoice = this.getBestVoice();
        if (bestVoice) {
            utterance.voice = bestVoice;
            console.log('使用语音:', bestVoice.name, bestVoice.lang);
        }
        
        utterance.onstart = () => {
            console.log('开始语音播放');
        };
        
        utterance.onerror = (e) => {
            console.error('语音播放错误:', e);
        };
        
        this.synthesis.speak(utterance);
    }



    processTextForSpeech(text) {
        let processed = text.trim();
        
        if (this.targetLang === 'zh-CN') {
            processed = processed.replace(/([，。！？；：])/g, '$1 ');
            processed = processed.replace(/([\u4e00-\u9fa5])([A-Za-z])/g, '$1 $2');
            processed = processed.replace(/([A-Za-z])([\u4e00-\u9fa5])/g, '$1 $2');
        } else {
            processed = processed.replace(/([,.!?;:])/g, '$1 ');
        }
        
        processed = processed.replace(/\s+/g, ' ').trim();
        
        return processed;
    }

    displayOriginal(text, isInterim) {
        const element = document.getElementById('originalText');
        element.textContent = text;
        element.style.opacity = isInterim ? '0.6' : '1';
    }

    displayTranslation(text) {
        document.getElementById('translatedText').textContent = text;
    }

    displayCurrentSpeaking(text) {
        const container = document.getElementById('currentBubbleContainer');
        let bubble = document.querySelector('#currentBubbleContainer .current-speaking');
        
        if (!bubble) {
            bubble = document.createElement('div');
            bubble.className = `current-speaking speaker-${this.currentSpeaker.toLowerCase()}`;
            container.appendChild(bubble);
        }
        
        bubble.innerHTML = `<strong>${this.speakers[this.currentSpeaker].name}:</strong> ${text}`;
        
        const conversationContainer = document.getElementById('conversationView');
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
    }

    clearCurrentSpeaking() {
        const container = document.getElementById('currentBubbleContainer');
        container.innerHTML = '';
    }

    addConversationBubble(item) {
        const container = document.getElementById('conversationBubbles');
        const bubble = document.createElement('div');
        bubble.className = `bubble speaker-${item.speaker.toLowerCase()}`;
        
        bubble.innerHTML = `
            <div class="bubble-header">${item.speakerName}</div>
            <div class="bubble-original">${item.original}</div>
            <div class="bubble-translated">${item.translated}</div>
            <div class="bubble-time">${item.timestamp}</div>
        `;
        
        container.appendChild(bubble);
        
        const conversationContainer = document.getElementById('conversationView');
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
    }

    clearConversationBubbles() {
        document.getElementById('conversationBubbles').innerHTML = '';
        this.conversationHistory = [];
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        document.getElementById('modeSimultaneous').classList.toggle('active', mode === 'simultaneous');
        document.getElementById('modeConversation').classList.toggle('active', mode === 'conversation');
        
        document.getElementById('conversationConfig').style.display = mode === 'conversation' ? 'block' : 'none';
        document.getElementById('simultaneousView').style.display = mode === 'simultaneous' ? 'grid' : 'none';
        document.getElementById('conversationView').style.display = mode === 'conversation' ? 'block' : 'none';
        document.getElementById('historySection').style.display = mode === 'simultaneous' ? 'block' : 'none';
        
        if (this.isListening) {
            this.stop();
            this.start();
        }
    }

    toggleSpeaker() {
        this.currentSpeaker = this.currentSpeaker === 'A' ? 'B' : 'A';
        
        const toggleBtn = document.getElementById('speakerToggle');
        toggleBtn.className = `speaker-toggle-btn speaker-${this.currentSpeaker.toLowerCase()}-active`;
        
        document.getElementById('currentSpeakerName').textContent = this.speakers[this.currentSpeaker].name;
        
        if (this.isListening) {
            this.stop();
            this.start();
        }
    }

    updateSpeakerLang(speaker, lang) {
        this.speakers[speaker].lang = lang;
    }

    updateSpeakerName(speaker, name) {
        this.speakers[speaker].name = name;
        if (speaker === this.currentSpeaker) {
            document.getElementById('currentSpeakerName').textContent = name;
        }
    }

    start() {
        if (!this.recognition) {
            this.initSpeechRecognition();
            if (!this.recognition) return;
        }
        
        if (this.currentMode === 'conversation') {
            this.recognition.lang = this.speakers[this.currentSpeaker].lang;
        } else {
            this.recognition.lang = this.sourceLang;
        }
        
        this.recognition.start();
    }

    updateStatus(message, type) {
        const status = document.getElementById('connectionStatus');
        status.textContent = '● ' + message;
        status.className = 'status ' + type;
    }

    updateLatency(ms) {
        document.getElementById('latency').textContent = `延迟: ${ms} ms`;
    }

    addToHistory(original, translated) {
        const timestamp = new Date().toLocaleTimeString();
        const item = {
            timestamp,
            original,
            translated,
            sourceLang: this.sourceLang,
            targetLang: this.targetLang,
            domain: this.currentDomain
        };
        
        this.history.push(item);
        this.renderHistoryItem(item);
    }

    renderHistoryItem(item) {
        const historyList = document.getElementById('historyList');
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-timestamp">🕐 ${item.timestamp} | ${item.domain}</div>
            <div class="history-original">原文: ${item.original}</div>
            <div class="history-translated">译文: ${item.translated}</div>
        `;
        historyList.insertBefore(div, historyList.firstChild);
    }

    swapLanguages() {
        const temp = this.sourceLang;
        this.sourceLang = this.targetLang;
        this.targetLang = temp;
        
        document.getElementById('sourceLang').value = this.sourceLang;
        document.getElementById('targetLang').value = this.targetLang;
        
        if (this.recognition) {
            this.recognition.lang = this.sourceLang;
        }
    }

    start() {
        if (!this.recognition) {
            this.initSpeechRecognition();
            if (!this.recognition) return;
        }
        
        this.recognition.lang = this.sourceLang;
        this.recognition.start();
    }

    stop() {
        this.isListening = false;
        if (this.recognition) {
            this.recognition.stop();
        }
        this.updateStatus('已停止', 'connected');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
    }

    clear() {
        if (this.currentMode === 'simultaneous') {
            document.getElementById('originalText').textContent = '';
            document.getElementById('translatedText').textContent = '';
            document.getElementById('historyList').innerHTML = '';
            this.history = [];
        } else {
            this.clearConversationBubbles();
        }
    }

    saveHistory() {
        let records, filename;
        
        if (this.currentMode === 'simultaneous') {
            if (this.history.length === 0) {
                alert('没有可保存的记录');
                return;
            }
            records = this.history;
            filename = `translation_history_${Date.now()}.json`;
        } else {
            if (this.conversationHistory.length === 0) {
                alert('没有可保存的对话记录');
                return;
            }
            records = this.conversationHistory;
            filename = `conversation_history_${Date.now()}.json`;
        }

        const data = {
            date: new Date().toLocaleDateString(),
            mode: this.currentMode,
            totalRecords: records.length,
            sourceLang: this.sourceLang,
            targetLang: this.targetLang,
            domain: this.currentDomain,
            records: records
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('记录已保存成功！');
    }

    setDomain(domain) {
        this.currentDomain = domain;
    }

    getMedicalDictionary() {
        return {
            'diagnosis': '临床诊断',
            'treatment': '治疗方案',
            'symptom': '临床症状',
            'prescription': '处方',
            'dosage': '用药剂量',
            'surgery': '外科手术',
            'patient': '患者',
            'physician': '执业医师',
            'medication': '药物治疗',
            'recovery': '术后恢复'
        };
    }

    getTechDictionary() {
        return {
            'algorithm': '算法模型',
            'database': '数据库系统',
            'interface': '用户界面',
            'framework': '开发框架',
            'deployment': '生产部署',
            'authentication': '身份认证',
            'encryption': '数据加密',
            'server': '服务器集群',
            'client': '客户端应用',
            'api': '应用程序接口'
        };
    }

    getLegalDictionary() {
        return {
            'contract': '合同协议',
            'liability': '法律责任',
            'jurisdiction': '司法管辖',
            'plaintiff': '原告方',
            'defendant': '被告方',
            'testimony': '证人证言',
            'evidence': '呈堂证据',
            'verdict': '法庭判决',
            'appeal': '上诉请求',
            'settlement': '庭外和解'
        };
    }

    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveHistory());
        document.getElementById('swapLangs').addEventListener('click', () => this.swapLanguages());
        
        document.getElementById('sourceLang').addEventListener('change', (e) => {
            this.sourceLang = e.target.value;
        });
        
        document.getElementById('targetLang').addEventListener('change', (e) => {
            this.targetLang = e.target.value;
            this.updateVoiceSelector();
        });
        
        document.getElementById('domainSelect').addEventListener('change', (e) => {
            this.setDomain(e.target.value);
        });

        document.getElementById('voiceSelect').addEventListener('change', (e) => {
            this.selectedVoice = e.target.value;
        });

        document.getElementById('rateSlider').addEventListener('input', (e) => {
            this.customRate = parseFloat(e.target.value);
            document.getElementById('rateValue').textContent = this.customRate.toFixed(1);
        });

        document.getElementById('pitchSlider').addEventListener('input', (e) => {
            this.customPitch = parseFloat(e.target.value);
            document.getElementById('pitchValue').textContent = this.customPitch.toFixed(1);
        });

        document.getElementById('modeSimultaneous').addEventListener('click', () => this.switchMode('simultaneous'));
        document.getElementById('modeConversation').addEventListener('click', () => this.switchMode('conversation'));
        
        document.getElementById('speakerToggle').addEventListener('click', () => this.toggleSpeaker());
        
        document.getElementById('speakerALang').addEventListener('change', (e) => {
            this.updateSpeakerLang('A', e.target.value);
        });
        
        document.getElementById('speakerBLang').addEventListener('change', (e) => {
            this.updateSpeakerLang('B', e.target.value);
        });
        
        document.getElementById('speakerAName').addEventListener('input', (e) => {
            this.updateSpeakerName('A', e.target.value);
        });
        
        document.getElementById('speakerBName').addEventListener('input', (e) => {
            this.updateSpeakerName('B', e.target.value);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.currentMode === 'conversation') {
                e.preventDefault();
                this.toggleSpeaker();
            }
        });
    }

    updateVoiceSelector() {
        const selector = document.getElementById('voiceSelect');
        selector.innerHTML = '<option value="">自动选择最佳语音</option>';
        
        const langVoices = this.availableVoices.filter(v => 
            v.lang.startsWith(this.targetLang.split('-')[0])
        );
        
        langVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' - 默认' : ''}`;
            selector.appendChild(option);
        });
    }

    getBestVoice() {
        if (this.selectedVoice) {
            const customVoice = this.availableVoices.find(v => v.name === this.selectedVoice);
            if (customVoice) return customVoice;
        }

        const lang = this.targetLang;
        const preferredNames = this.preferredVoices[lang] || [];
        
        for (const name of preferredNames) {
            const voice = this.availableVoices.find(v => 
                v.name.includes(name) && v.lang.startsWith(lang.split('-')[0])
            );
            if (voice) return voice;
        }
        
        const exactMatch = this.availableVoices.find(v => v.lang === lang);
        if (exactMatch) return exactMatch;
        
        const langMatch = this.availableVoices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (langMatch) return langMatch;
        
        return this.availableVoices.find(v => v.default) || this.availableVoices[0];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SimultaneousInterpreter();
});