const GameState = {
    MENU: 'menu',
    RACING: 'racing',
    BATON_PASS: 'baton_pass',
    FINISHED: 'finished'
};

const CONFIG = {
    TRACK_LENGTH: 800,
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 400,
    GROUND_Y: 320,
    MIN_SPEED: 1,
    MAX_SPEED: 15,
    AI_SKILL_MIN: 0.75,
    AI_SKILL_MAX: 0.95,
    KEY_DECAY_TIME: 300,
    BATON_PASS_DURATION: 1.5
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.MENU;
        this.currentLeg = 1;
        this.legTimes = [0, 0, 0];
        this.totalTime = 0;
        this.legStartTime = 0;
        this.lastTime = 0;
        this.keyPressQueue = [];
        this.lastKeyPressed = null;
        this.terrain = new TerrainProfile(CONFIG.TRACK_LENGTH);
        this.physics = new PhysicsEngine({
            minSpeed: CONFIG.MIN_SPEED,
            maxSpeed: CONFIG.MAX_SPEED,
            worldScale: 50,
            animScale: 8
        });
        this.opponents = this.createOpponents();
        this.player = this.createPlayer();
        this.animationId = null;
        this.playerAISkill = 0;
        this.batonPassStart = 0;

        this.setupEventListeners();
    }

    createPlayer() {
        return {
            x: 0,
            y: CONFIG.GROUND_Y,
            speed: 0,
            color: '#E53935',
            basketColor: '#8D6E63',
            legPhase: 0
        };
    }

    createOpponents() {
        const teamNames = ['阿里山队', '玉山队', '合欢山队', '太鲁阁队'];
        const colors = ['#1E88E5', '#43A047', '#FB8C00', '#8E24AA'];

        return teamNames.map((name, i) => ({
            name,
            color: colors[i],
            x: 0,
            y: CONFIG.GROUND_Y,
            speed: 0,
            skill: CONFIG.AI_SKILL_MIN + Math.random() * (CONFIG.AI_SKILL_MAX - CONFIG.AI_SKILL_MIN),
            legTimes: [0, 0, 0],
            totalTime: 0,
            currentLeg: 1,
            legStartTime: 0,
            finished: false,
            legPhase: Math.random() * Math.PI * 2
        }));
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.resetGame());

        document.addEventListener('keydown', (e) => {
            if (this.state !== GameState.RACING || this.currentLeg !== 1) return;

            const now = Date.now();

            if (e.key === 'ArrowLeft') {
                if (this.lastKeyPressed !== 'left') {
                    this.keyPressQueue.push({ time: now, key: 'left' });
                    this.lastKeyPressed = 'left';
                    this.updateKeyDisplay('left', true);
                }
            } else if (e.key === 'ArrowRight') {
                if (this.lastKeyPressed !== 'right') {
                    this.keyPressQueue.push({ time: now, key: 'right' });
                    this.lastKeyPressed = 'right';
                    this.updateKeyDisplay('right', true);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') {
                this.updateKeyDisplay('left', false);
            } else if (e.key === 'ArrowRight') {
                this.updateKeyDisplay('right', false);
            }
        });
    }

    updateKeyDisplay(key, active) {
        const element = document.getElementById(key === 'left' ? 'leftKey' : 'rightKey');
        if (active) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }

    calculateKeyPressSpeed() {
        const now = Date.now();
        this.keyPressQueue = this.keyPressQueue.filter(k => now - k.time < CONFIG.KEY_DECAY_TIME);

        if (this.keyPressQueue.length < 2) return 0;

        const recentPresses = this.keyPressQueue.slice(-10);
        if (recentPresses.length < 2) return 0;

        let alternations = 0;
        for (let i = 1; i < recentPresses.length; i++) {
            if (recentPresses[i].key !== recentPresses[i - 1].key) {
                alternations++;
            }
        }

        const timeSpan = recentPresses[recentPresses.length - 1].time - recentPresses[0].time;
        if (timeSpan === 0) return 0;

        const pressesPerSecond = (alternations / timeSpan) * 1000;
        return Math.min(pressesPerSecond / 8, 1);
    }

    startGame() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');

        this.state = GameState.RACING;
        this.currentLeg = 1;
        this.legTimes = [0, 0, 0];
        this.totalTime = 0;
        this.legStartTime = performance.now();
        this.lastTime = performance.now();
        this.playerAISkill = 0;

        this.opponents.forEach(opp => {
            opp.x = 0;
            opp.currentLeg = 1;
            opp.legStartTime = performance.now();
            opp.legTimes = [0, 0, 0];
            opp.totalTime = 0;
            opp.finished = false;
        });

        this.player.x = 0;
        this.player.y = this.terrain.getHeightAt(0, CONFIG.GROUND_Y);
        this.player.speed = 0;

        this.keyPressQueue = [];
        this.lastKeyPressed = null;

        for (let i = 1; i <= 3; i++) {
            document.getElementById(`leg${i}Time`).textContent = '--';
            document.querySelector(`.time-slot:nth-child(${i})`).classList.remove('completed');
        }

        this.gameLoop();
    }

    resetGame() {
        document.getElementById('resultScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');

        this.state = GameState.MENU;
        this.terrain = new TerrainProfile(CONFIG.TRACK_LENGTH);
        this.opponents = this.createOpponents();
        this.player = this.createPlayer();
    }

    updatePlayerLeg(deltaTime, now) {
        const dt = deltaTime / 1000;
        const terrainType = this.terrain.getTypeAt(this.player.x);

        if (this.currentLeg === 1) {
            const inputForce = this.calculateKeyPressSpeed();
            this.physics.updateRunner(this.player, dt, inputForce, terrainType);
        } else {
            this.physics.updateAIRunner(
                this.player, dt, this.playerAISkill,
                terrainType, now, this.currentLeg * 2
            );
        }

        this.player.y = this.terrain.getHeightAt(this.player.x, CONFIG.GROUND_Y);

        if (this.player.x >= CONFIG.TRACK_LENGTH) {
            this.player.x = CONFIG.TRACK_LENGTH;
            this.player.y = this.terrain.getHeightAt(this.player.x, CONFIG.GROUND_Y);
            this.legTimes[this.currentLeg - 1] = (now - this.legStartTime) / 1000;
            this.totalTime += this.legTimes[this.currentLeg - 1];
            this.updateLegDisplay(this.currentLeg);

            if (this.currentLeg < 3) {
                this.state = GameState.BATON_PASS;
                this.batonPassStart = now;
            } else {
                this.currentLeg = 4;
            }
        }
    }

    updateOpponents(deltaTime, now) {
        const dt = deltaTime / 1000;

        this.opponents.forEach(opp => {
            if (opp.finished) return;

            const terrainType = this.terrain.getTypeAt(opp.x);
            this.physics.updateAIRunner(
                opp, dt, opp.skill,
                terrainType, now, opp.currentLeg
            );

            opp.y = this.terrain.getHeightAt(opp.x, CONFIG.GROUND_Y);

            if (opp.x >= CONFIG.TRACK_LENGTH) {
                opp.legTimes[opp.currentLeg - 1] = (now - opp.legStartTime) / 1000;
                opp.totalTime += opp.legTimes[opp.currentLeg - 1];

                if (opp.currentLeg < 3) {
                    opp.currentLeg++;
                    opp.x = 0;
                    opp.legStartTime = now;
                } else {
                    opp.x = CONFIG.TRACK_LENGTH;
                    opp.finished = true;
                }
            }
        });
    }

    update(deltaTime) {
        const now = performance.now();

        if (this.state === GameState.RACING) {
            this.updatePlayerLeg(deltaTime, now);
            this.updateOpponents(deltaTime, now);
            this.updateHUD(now);
        } else if (this.state === GameState.BATON_PASS) {
            this.updateOpponents(deltaTime, now);

            const elapsed = (now - this.batonPassStart) / 1000;
            if (elapsed >= CONFIG.BATON_PASS_DURATION) {
                this.currentLeg++;
                this.player.x = 0;
                this.player.y = this.terrain.getHeightAt(0, CONFIG.GROUND_Y);
                this.player.speed = 0;
                this.playerAISkill = CONFIG.AI_SKILL_MIN + 0.05 + Math.random() * 0.15;
                this.legStartTime = now;
                this.state = GameState.RACING;
            }
            this.updateHUD(now);
        }

        if (this.currentLeg > 3 && this.opponents.every(o => o.finished)) {
            this.finishGame();
        }
    }

    updateLegDisplay(leg) {
        const element = document.getElementById(`leg${leg}Time`);
        element.textContent = this.legTimes[leg - 1].toFixed(2) + 's';
        document.querySelector(`.time-slot:nth-child(${leg})`).classList.add('completed');
    }

    updateHUD(now) {
        const currentLegTime = (now - this.legStartTime) / 1000;

        document.getElementById('currentLeg').textContent = `${Math.min(this.currentLeg, 3)} / 3`;
        document.getElementById('currentTime').textContent = currentLegTime.toFixed(2) + 's';
        document.getElementById('totalTime').textContent = this.totalTime.toFixed(2) + 's';
        document.getElementById('speed').textContent = Math.round(this.player.speed * 3.6) + ' km/h';
    }

    render() {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        const skyGradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F7FA');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.drawMountains(ctx);
        this.drawTrack(ctx);
        this.drawTerrainMarkers(ctx);
        this.drawOpponents(ctx);

        const playerLabel = this.currentLeg === 1 ? '你' : 'AI队友' + this.currentLeg;
        this.drawPlayer(ctx, this.player, playerLabel);

        this.drawStartFinish(ctx);

        if (this.state === GameState.BATON_PASS) {
            this.drawBatonPassOverlay(ctx);
        }
    }

    drawBatonPassOverlay(ctx) {
        const now = performance.now();
        const elapsed = (now - this.batonPassStart) / 1000;
        const progress = Math.min(elapsed / CONFIG.BATON_PASS_DURATION, 1);

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const nextLeg = this.currentLeg + 1;
        ctx.fillText(`交接背篓 → 第${nextLeg}棒`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 30);

        ctx.font = 'bold 20px Microsoft YaHei';
        ctx.fillStyle = '#A5D6A7';
        const countdown = Math.ceil(CONFIG.BATON_PASS_DURATION - elapsed);
        ctx.fillText(`${countdown}秒后出发`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);

        const barWidth = 300;
        const barHeight = 10;
        const barX = (CONFIG.CANVAS_WIDTH - barWidth) / 2;
        const barY = CONFIG.CANVAS_HEIGHT / 2 + 55;

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }

    drawMountains(ctx) {
        ctx.fillStyle = '#81C784';
        ctx.beginPath();
        ctx.moveTo(0, 250);
        for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += 50) {
            const y = 200 + Math.sin(x * 0.01) * 30 + Math.cos(x * 0.02) * 20;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.lineTo(0, CONFIG.CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.moveTo(0, 280);
        for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += 40) {
            const y = 250 + Math.sin(x * 0.015 + 1) * 25 + Math.cos(x * 0.025) * 15;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.lineTo(0, CONFIG.CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
    }

    drawTrack(ctx) {
        const scale = CONFIG.CANVAS_WIDTH / CONFIG.TRACK_LENGTH;

        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.moveTo(0, CONFIG.GROUND_Y + 20);

        for (let x = 0; x <= CONFIG.TRACK_LENGTH; x += 5) {
            const y = this.terrain.getHeightAt(x, CONFIG.GROUND_Y) + 20;
            ctx.lineTo(x * scale, y);
        }

        ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.lineTo(0, CONFIG.CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#A1887F';
        ctx.beginPath();
        ctx.moveTo(0, CONFIG.GROUND_Y + 20);

        for (let x = 0; x <= CONFIG.TRACK_LENGTH; x += 5) {
            const y = this.terrain.getHeightAt(x, CONFIG.GROUND_Y) + 10;
            ctx.lineTo(x * scale, y);
        }

        ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.GROUND_Y + 20);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#6D4C41';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, this.terrain.getHeightAt(0, CONFIG.GROUND_Y));

        for (let x = 0; x <= CONFIG.TRACK_LENGTH; x += 5) {
            const y = this.terrain.getHeightAt(x, CONFIG.GROUND_Y);
            ctx.lineTo(x * scale, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawTerrainMarkers(ctx) {
        const scale = CONFIG.CANVAS_WIDTH / CONFIG.TRACK_LENGTH;

        this.terrain.segments.forEach(segment => {
            const centerX = (segment.start + segment.end) / 2 * scale;
            const y = this.terrain.getHeightAt(centerX / scale, CONFIG.GROUND_Y) - 30;

            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';

            if (segment.type === 'up') {
                ctx.fillStyle = '#E53935';
                ctx.fillText('\u2B06\uFE0F 上坡', centerX, y);
            } else if (segment.type === 'down') {
                ctx.fillStyle = '#43A047';
                ctx.fillText('\u2B07\uFE0F 下坡', centerX, y);
            } else {
                ctx.fillStyle = '#FB8C00';
                ctx.fillText('\u27A1\uFE0F 平地', centerX, y);
            }
        });
    }

    drawStartFinish(ctx) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, this.terrain.getHeightAt(0, CONFIG.GROUND_Y) - 80, 5, 100);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#2E7D32';
        ctx.textAlign = 'left';
        ctx.fillText('起点', 10, this.terrain.getHeightAt(0, CONFIG.GROUND_Y) - 50);

        ctx.fillStyle = '#E53935';
        ctx.fillRect(CONFIG.CANVAS_WIDTH - 5, this.terrain.getHeightAt(CONFIG.TRACK_LENGTH, CONFIG.GROUND_Y) - 80, 5, 100);
        ctx.fillStyle = '#C62828';
        ctx.textAlign = 'right';
        ctx.fillText('终点', CONFIG.CANVAS_WIDTH - 10, this.terrain.getHeightAt(CONFIG.TRACK_LENGTH, CONFIG.GROUND_Y) - 50);
    }

    drawPlayer(ctx, player, label) {
        const scale = CONFIG.CANVAS_WIDTH / CONFIG.TRACK_LENGTH;
        const x = player.x * scale;
        const y = player.y;

        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 25, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = player.color;
        ctx.fillRect(x - 12, y - 40, 24, 35);

        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(x, y - 50, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(x, y - 55, 12, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#6D4C41';
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 55);
        ctx.lineTo(x + 5, y - 55);
        ctx.lineTo(x, y - 70);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = player.basketColor;
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 35);
        ctx.lineTo(x + 25, y - 30);
        ctx.lineTo(x + 28, y);
        ctx.lineTo(x + 10, y - 5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 14, y - 30);
        ctx.lineTo(x + 14, y - 5);
        ctx.moveTo(x + 22, y - 28);
        ctx.lineTo(x + 25, y - 3);
        ctx.stroke();

        const legOffset = Math.sin(player.legPhase) * 15;
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(x - 10, y - 5, 8, 25 + legOffset * 0.5);
        ctx.fillRect(x + 2, y - 5, 8, 25 - legOffset * 0.5);

        const armOffset = Math.sin(player.legPhase + Math.PI) * 10;
        ctx.fillStyle = '#FFCCBC';
        ctx.fillRect(x - 18, y - 35, 6, 20 + armOffset * 0.5);
        ctx.fillRect(x + 12, y - 35, 6, 20 - armOffset * 0.5);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - 75);

        ctx.restore();
    }

    drawOpponents(ctx) {
        this.opponents.forEach((opp, index) => {
            const yOffset = (index + 1) * 50;
            const scale = CONFIG.CANVAS_WIDTH / CONFIG.TRACK_LENGTH;
            const x = opp.x * scale;

            ctx.save();

            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(x, CONFIG.GROUND_Y + yOffset + 15, 20, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = opp.color;
            ctx.fillRect(x - 10, CONFIG.GROUND_Y + yOffset - 30, 20, 30);

            ctx.fillStyle = '#FFCCBC';
            ctx.beginPath();
            ctx.arc(x, CONFIG.GROUND_Y + yOffset - 38, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x + 8, CONFIG.GROUND_Y + yOffset - 25, 12, 20);

            const legOffset = Math.sin(opp.legPhase) * 10;
            ctx.fillStyle = '#333';
            ctx.fillRect(x - 8, CONFIG.GROUND_Y + yOffset, 6, 15 + legOffset * 0.3);
            ctx.fillRect(x + 2, CONFIG.GROUND_Y + yOffset, 6, 15 - legOffset * 0.3);

            ctx.fillStyle = '#333';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(opp.name, x, CONFIG.GROUND_Y + yOffset - 48);

            ctx.fillStyle = opp.color;
            ctx.fillRect(x - 3, CONFIG.GROUND_Y + yOffset + 30, 6, 3);

            ctx.restore();
        });
    }

    finishGame() {
        this.state = GameState.FINISHED;
        cancelAnimationFrame(this.animationId);

        const results = [
            { name: '你的队伍', time: this.totalTime, isPlayer: true, legTimes: [...this.legTimes] },
            ...this.opponents.map(opp => ({
                name: opp.name,
                time: opp.totalTime,
                isPlayer: false,
                legTimes: [...opp.legTimes]
            }))
        ];

        results.sort((a, b) => a.time - b.time);

        const rankingTable = document.getElementById('rankingTable');
        rankingTable.innerHTML = `
            <div class="ranking-header">
                <span>排名</span>
                <span>队伍</span>
                <span>用时</span>
                <span>分数</span>
            </div>
        `;

        results.forEach((result, index) => {
            let rankClass = '';
            if (index === 0) rankClass = 'gold';
            else if (index === 1) rankClass = 'silver';
            else if (index === 2) rankClass = 'bronze';

            const score = Math.round(1000 - result.time * 10);
            const medal = index === 0 ? '\uD83E\uDD47' : index === 1 ? '\uD83E\uDD48' : index === 2 ? '\uD83E\uDD49' : '';

            rankingTable.innerHTML += `
                <div class="ranking-row ${result.isPlayer ? 'player' : ''}">
                    <span class="rank ${rankClass}">${medal} ${index + 1}</span>
                    <span class="team-name">${result.name}${result.isPlayer ? ' (你)' : ''}</span>
                    <span class="team-time">${result.time.toFixed(2)}s</span>
                    <span class="team-time">${Math.max(0, score)}</span>
                </div>
            `;
        });

        document.getElementById('finalLeg1').textContent = this.legTimes[0].toFixed(2) + 's';
        document.getElementById('finalLeg2').textContent = this.legTimes[1].toFixed(2) + 's';
        document.getElementById('finalLeg3').textContent = this.legTimes[2].toFixed(2) + 's';
        document.getElementById('finalTotal').textContent = this.totalTime.toFixed(2) + 's';

        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('resultScreen').classList.remove('hidden');
    }

    gameLoop(currentTime = performance.now()) {
        if (this.state === GameState.FINISHED) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
}

const game = new Game();
