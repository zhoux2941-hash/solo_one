class DrawAndGuessGame {
    constructor() {
        this.connection = null;
        this.writer = null;
        this.reader = null;
        
        this.playerId = null;
        this.playerName = '';
        this.roomId = '';
        this.isDrawer = false;
        this.currentWord = '';
        this.isGameActive = false;
        
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = '#000000';
        this.lineWidth = 5;
        this.isEraser = false;
        this.brushPattern = 'solid';
        
        this.drawThrottleTimer = null;
        this.pendingDraw = null;
        
        this.playerAvatar = '😀';
        this.playerSkin = 'default';
        
        this.canvas = null;
        this.ctx = null;
        
        this.initElements();
        this.initEventListeners();
    }
    
    initElements() {
        this.loginScreen = document.getElementById('loginScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.playerNameInput = document.getElementById('playerName');
        this.roomIdInput = document.getElementById('roomId');
        this.joinBtn = document.getElementById('joinBtn');
        this.startBtn = document.getElementById('startBtn');
        
        this.avatarSelector = document.getElementById('avatarSelector');
        this.skinSelector = document.getElementById('skinSelector');
        
        this.roomIdDisplay = document.getElementById('roomIdDisplay');
        this.copyRoomIdBtn = document.getElementById('copyRoomId');
        this.playersList = document.getElementById('players');
        this.gameStatus = document.getElementById('gameStatus');
        this.currentWordEl = document.getElementById('currentWord');
        this.timerEl = document.getElementById('timer');
        
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.brushToolBtn = document.getElementById('brushTool');
        this.eraserToolBtn = document.getElementById('eraserTool');
        this.clearBtn = document.getElementById('clearBtn');
        this.colorPicker = document.getElementById('colorPicker');
        this.lineWidthInput = document.getElementById('lineWidth');
        this.lineWidthValue = document.getElementById('lineWidthValue');
        this.colorBtns = document.querySelectorAll('.color-btn');
        this.patternBtns = document.querySelectorAll('.pattern-btn');
        
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPicker = document.getElementById('emojiPicker');
        
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        
        this.canvas.width = (Math.max(600, rect.width - 40)) * ratio;
        this.canvas.height = (Math.max(400, rect.height - 40)) * ratio;
        this.canvas.style.width = Math.max(600, rect.width - 40) + 'px';
        this.canvas.style.height = Math.max(400, rect.height - 40) + 'px';
        
        this.ctx.scale(ratio, ratio);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
    }
    
    initEventListeners() {
        this.joinBtn.addEventListener('click', () => this.joinGame());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
        
        this.startBtn.addEventListener('click', () => this.startGame());
        this.copyRoomIdBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(this.roomId);
            alert('房间ID已复制！');
        });
        
        this.avatarSelector.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                this.avatarSelector.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.playerAvatar = option.dataset.avatar;
            });
        });
        
        this.skinSelector.querySelectorAll('.skin-option').forEach(option => {
            option.addEventListener('click', () => {
                this.skinSelector.querySelectorAll('.skin-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.playerSkin = option.dataset.skin;
                document.body.className = `skin-${this.playerSkin}`;
            });
        });
        
        this.brushToolBtn.addEventListener('click', () => {
            this.isEraser = false;
            this.brushToolBtn.classList.add('active');
            this.eraserToolBtn.classList.remove('active');
        });
        
        this.eraserToolBtn.addEventListener('click', () => {
            this.isEraser = true;
            this.eraserToolBtn.classList.add('active');
            this.brushToolBtn.classList.remove('active');
        });
        
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        this.colorPicker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            this.updateActiveColor();
        });
        
        this.lineWidthInput.addEventListener('input', (e) => {
            this.lineWidth = parseInt(e.target.value);
            this.lineWidthValue.textContent = this.lineWidth;
        });
        
        this.colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentColor = btn.dataset.color;
                this.colorPicker.value = this.currentColor;
                this.updateActiveColor();
            });
        });
        
        this.patternBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.patternBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.brushPattern = btn.dataset.pattern;
            });
        });
        
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        
        this.sendBtn.addEventListener('click', () => this.sendChat());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChat();
        });
        
        this.emojiBtn.addEventListener('click', () => {
            this.emojiPicker.style.display = this.emojiPicker.style.display === 'none' ? 'block' : 'none';
        });
        
        this.emojiPicker.querySelectorAll('.emoji-item').forEach(emoji => {
            emoji.addEventListener('click', () => {
                this.chatInput.value += emoji.textContent;
                this.chatInput.focus();
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.emoji-btn') && !e.target.closest('.emoji-picker')) {
                this.emojiPicker.style.display = 'none';
            }
        });
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    updateActiveColor() {
        this.colorBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.currentColor);
        });
    }
    
    async joinGame() {
        const name = this.playerNameInput.value.trim();
        const room = this.roomIdInput.value.trim();
        
        if (!name) {
            alert('请输入玩家昵称！');
            return;
        }
        
        this.playerName = name;
        
        try {
            const url = `https://${window.location.hostname}:4433/webtransport`;
            this.connection = new WebTransport(url);
            
            await this.connection.ready;
            console.log('WebTransport连接成功！');
            
            const stream = await this.connection.createBidirectionalStream();
            this.writer = stream.writable.getWriter();
            this.reader = stream.readable.getReader();
            
            this.sendMessage({
                type: 'join',
                player: name,
                roomId: room,
                avatar: this.playerAvatar
            });
            
            this.receiveMessages();
            
            this.loginScreen.style.display = 'none';
            this.gameScreen.style.display = 'block';
            this.resizeCanvas();
            
        } catch (error) {
            console.error('连接失败:', error);
            alert('连接服务器失败，请确保服务器正在运行！');
        }
    }
    
    async sendMessage(msg) {
        if (!this.writer) return;
        
        const data = JSON.stringify(msg) + '\n';
        const encoder = new TextEncoder();
        await this.writer.write(encoder.encode(data));
    }
    
    async receiveMessages() {
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) break;
                
                buffer += decoder.decode(value);
                const lines = buffer.split('\n');
                buffer = lines.pop();
                
                for (const line of lines) {
                    if (line.trim()) {
                        this.handleMessage(JSON.parse(line));
                    }
                }
            }
        } catch (error) {
            console.error('接收消息错误:', error);
        }
    }
    
    handleMessage(msg) {
        switch (msg.type) {
            case 'joined':
                this.roomId = msg.data;
                this.roomIdDisplay.textContent = this.roomId;
                this.startBtn.style.display = 'block';
                this.addChatMessage('系统', `已加入房间 ${this.roomId}`, 'system');
                break;
                
            case 'playerJoined':
                this.updatePlayerList(msg.data);
                this.addChatMessage('系统', `${msg.player} 加入了房间`, 'system');
                break;
                
            case 'playerLeft':
                this.addChatMessage('系统', `${msg.player} 离开了房间`, 'system');
                break;
                
            case 'playerList':
                this.updatePlayerList(msg.data);
                break;
                
            case 'yourTurn':
                this.isDrawer = true;
                this.isGameActive = true;
                this.currentWord = msg.data;
                this.currentWordEl.textContent = `你要画: ${this.currentWord}`;
                this.canvas.classList.remove('disabled');
                this.gameStatus.textContent = '你的回合 - 正在绘画';
                this.startBtn.style.display = 'none';
                this.clearCanvas();
                break;
                
            case 'guessTurn':
                this.isDrawer = false;
                this.isGameActive = true;
                this.currentWord = '';
                this.currentWordEl.textContent = `请猜: ${'_'.repeat(msg.data).split('').join(' ')}`;
                this.canvas.classList.add('disabled');
                this.gameStatus.textContent = '正在猜词';
                this.startBtn.style.display = 'none';
                break;
                
            case 'draw':
                this.drawRemote(msg.data);
                break;
                
            case 'clearCanvas':
                const ratio = window.devicePixelRatio || 1;
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
                break;
                
            case 'chat':
                this.addChatMessage(msg.player, msg.data, '', msg.avatar);
                break;
                
            case 'correctGuess':
                this.addChatMessage('系统', '恭喜你猜对了！', 'correct');
                break;
                
            case 'roundEnd':
                this.isGameActive = false;
                this.addChatMessage('系统', `回合结束！正确答案是: ${msg.data}`, 'system');
                this.gameStatus.textContent = '回合结束 - 等待下一轮';
                this.currentWordEl.textContent = `答案: ${msg.data}`;
                break;
                
            case 'error':
                alert(msg.data);
                break;
        }
    }
    
    updatePlayerList(players) {
        this.playersList.innerHTML = '';
        players.forEach(p => {
            const li = document.createElement('li');
            li.className = p.isDrawer ? 'drawer' : '';
            li.innerHTML = `<span><span class="player-avatar">${p.avatar || '😀'}</span>${p.name}</span><span class="score">${p.score}</span>`;
            this.playersList.appendChild(li);
        });
    }
    
    startGame() {
        this.sendMessage({ type: 'startGame' });
    }
    
    startDrawing(e) {
        if (!this.isDrawer) return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.lastX = clientX - rect.left;
        this.lastY = clientY - rect.top;
        
        if (this.brushPattern !== 'solid' && this.brushPattern !== 'dashed') {
            this.drawPattern(this.lastX, this.lastY, this.currentColor, this.lineWidth, this.isEraser, this.brushPattern);
        }
    }
    
    draw(e) {
        if (!this.isDrawing || !this.isDrawer) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        this.drawLine(this.lastX, this.lastY, x, y, this.currentColor, this.lineWidth, this.isEraser, this.brushPattern);
        
        const drawData = {
            prevX: this.lastX,
            prevY: this.lastY,
            x: x,
            y: y,
            color: this.currentColor,
            lineWidth: this.lineWidth,
            isEraser: this.isEraser,
            pattern: this.brushPattern
        };
        
        if (this.drawThrottleTimer) {
            this.pendingDraw = drawData;
        } else {
            this.sendMessage({
                type: 'draw',
                data: drawData
            });
            this.drawThrottleTimer = setTimeout(() => {
                this.drawThrottleTimer = null;
                if (this.pendingDraw) {
                    this.sendMessage({
                        type: 'draw',
                        data: this.pendingDraw
                    });
                    this.pendingDraw = null;
                }
            }, 10);
        }
        
        this.lastX = x;
        this.lastY = y;
    }
    
    stopDrawing() {
        this.isDrawing = false;
        if (this.drawThrottleTimer) {
            clearTimeout(this.drawThrottleTimer);
            this.drawThrottleTimer = null;
        }
        if (this.pendingDraw) {
            this.sendMessage({
                type: 'draw',
                data: this.pendingDraw
            });
            this.pendingDraw = null;
        }
    }
    
    drawLine(x1, y1, x2, y2, color, width, isEraser, pattern = 'solid') {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        
        if (pattern === 'dashed') {
            this.ctx.setLineDash([width * 2, width * 2]);
        } else {
            this.ctx.setLineDash([]);
        }
        
        if (pattern === 'dotted') {
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const dots = Math.max(1, Math.floor(dist / (width * 2)));
            for (let i = 0; i <= dots; i++) {
                const t = i / dots;
                const px = x1 + (x2 - x1) * t;
                const py = y1 + (y2 - y1) * t;
                this.ctx.beginPath();
                this.ctx.arc(px, py, isEraser ? width * 1.5 : width / 2, 0, Math.PI * 2);
                this.ctx.fillStyle = isEraser ? 'white' : color;
                this.ctx.fill();
            }
        } else if (pattern === 'spray') {
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const steps = Math.max(1, Math.floor(dist / 3));
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = x1 + (x2 - x1) * t;
                const py = y1 + (y2 - y1) * t;
                for (let j = 0; j < 10; j++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * width * 2;
                    this.ctx.beginPath();
                    this.ctx.arc(px + Math.cos(angle) * r, py + Math.sin(angle) * r, 1, 0, Math.PI * 2);
                    this.ctx.fillStyle = isEraser ? 'white' : color;
                    this.ctx.fill();
                }
            }
        } else if (pattern === 'heart') {
            this.drawEmojiPattern(x1, y1, x2, y2, '❤', color, width, isEraser);
        } else if (pattern === 'star') {
            this.drawEmojiPattern(x1, y1, x2, y2, '★', color, width, isEraser);
        } else {
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = isEraser ? 'white' : color;
            this.ctx.lineWidth = isEraser ? width * 3 : width;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawEmojiPattern(x1, y1, x2, y2, emoji, color, width, isEraser) {
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const steps = Math.max(1, Math.floor(dist / (width * 2)));
        const fontSize = Math.max(10, width * 2);
        
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = isEraser ? 'white' : color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;
            if (isEraser) {
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(px, py, fontSize, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillText(emoji, px, py);
            }
        }
    }
    
    drawPattern(x, y, color, width, isEraser, pattern) {
        if (pattern === 'spray') {
            for (let j = 0; j < 20; j++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * width * 2;
                this.ctx.beginPath();
                this.ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 1, 0, Math.PI * 2);
                this.ctx.fillStyle = isEraser ? 'white' : color;
                this.ctx.fill();
            }
        } else if (pattern === 'heart') {
            const fontSize = Math.max(10, width * 2);
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.fillStyle = color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('❤', x, y);
        } else if (pattern === 'star') {
            const fontSize = Math.max(10, width * 2);
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.fillStyle = color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', x, y);
        }
    }
    
    drawRemote(data) {
        this.drawLine(data.prevX, data.prevY, data.x, data.y, data.color, data.lineWidth, data.isEraser, data.pattern || 'solid');
    }
    
    clearCanvas() {
        if (!this.isDrawer) return;
        const ratio = window.devicePixelRatio || 1;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
        this.sendMessage({ type: 'clearCanvas' });
    }
    
    sendChat() {
        const text = this.chatInput.value.trim();
        if (!text) return;
        
        this.sendMessage({
            type: 'chat',
            data: text,
            avatar: this.playerAvatar
        });
        
        this.chatInput.value = '';
    }
    
    addChatMessage(sender, message, type = '', avatar = '') {
        const div = document.createElement('div');
        div.className = 'chat-message ' + type;
        
        if (type === 'system' || type === 'correct') {
            div.textContent = message;
        } else {
            div.innerHTML = `<span class="avatar">${avatar || '😀'}</span><span class="sender">${sender}:</span>${message}`;
        }
        
        this.chatMessages.appendChild(div);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new DrawAndGuessGame();
});
