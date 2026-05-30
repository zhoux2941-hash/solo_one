const App = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    armillarySphere: null,
    sightingTube: null,
    raDecRing: null,
    autoRotate: false,
    currentRA: 0,
    currentDec: 0,
    currentStar: null,
    lockedStar: null,
    allStars: [],
    brightStars: [],
    selectedDemoStar: null,
    isDemoRunning: false,
    demoAnimationId: null,
    mansionInfo: {
        '角宿': '东方苍龙七宿之首，包含两颗主要恒星，为东方青龙的角，象征天门。',
        '亢宿': '东方苍龙七宿之二，象征苍龙的颈部，主天子、主疾病。',
        '氐宿': '东方苍龙七宿之三，象征苍龙的胸，主宫室、国邦。',
        '房宿': '东方苍龙七宿之四，象征苍龙的腹部，主天子布政之宫。',
        '心宿': '东方苍龙七宿之五，象征苍龙的心脏，又称"心宿二即心大星。',
        '尾宿': '东方苍龙七宿之六，象征苍龙的尾部，主后宫。',
        '箕宿': '东方苍龙七宿之末，象征龙尾摆动，主口舌。',
        '斗宿': '北方玄武七宿之首，又称南斗，主天子寿命、宰相爵禄。',
        '牛宿': '北方玄武七宿之二，主牺牲之事，牵牛织女传说。',
        '女宿': '北方玄武七宿之三，主布帛、珍宝。',
        '虚宿': '北方玄武七宿之四，主庙堂、祭祀。',
        '危宿': '北方玄武七宿之五，主坟墓、祠祀。',
        '室宿': '北方玄武七宿之六，主军粮、府库。',
        '壁宿': '北方玄武七宿之末，主文章、图书。',
        '奎宿': '西方白虎七宿之首，主兵戎、库府。',
        '娄宿': '西方白虎七宿之二，主苑牧、牺牲。',
        '胃宿': '西方白虎七宿之三，主仓廪、五谷。',
        '昴宿': '西方白虎七宿之四，主丧纪、牢狱。',
        '毕宿': '西方白虎七宿之五，主弋猎、边兵。',
        '觜宿': '西方白虎七宿之六，主军旅、收敛。',
        '参宿': '西方白虎七宿之末，主斩刈、权衡。',
        '井宿': '南方朱雀七宿之首，主水事、酒旗。',
        '鬼宿': '鬼宿，南方朱雀七宿之二，主祠祀、死丧。',
        '柳宿': '南方朱雀七宿之三，主草木、万物。',
        '星宿': '南方朱雀七宿之四，主急事、盗贼。',
        '张宿': '南方朱雀七宿之五，主珍宝、宗庙。',
        '翼宿': '南方朱雀七宿之六，主远客、夷狄。',
        '轸宿': '轸宿，南方朱雀七宿之末，主车骑、载任。',
        '紫微垣': '三垣之中垣，位于北天中央，又称紫宫，是天帝居住的地方，象征皇宫。',
        '太微垣': '三垣之上垣，位于紫微垣东北，是天帝处理政事的地方，象征朝廷。',
        '天市垣': '三垣之下垣，位于紫微垣东南，是天帝率领诸侯游幸的地方，象征市集。'
    },

    init: async function() {
        this.initThreeJS();
        this.bindEvents();
        this.loadAllStars();
        this.loadBrightStars();
        this.loadTasks();
        this.loadObservations();
        this.loadMansions();
        this.animate();
        this.updateStatus('浑仪系统初始化完成');
    },

    initThreeJS: function() {
        const container = document.getElementById('armillary-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 2, 8);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 15;

        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        this.createArmillarySphere();

        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02,
            transparent: true,
            opacity: 0.6
        });
        const starsVertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            starsVertices.push(x, y, z);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);

        window.addEventListener('resize', () => this.onWindowResize());
    },

    createArmillarySphere: function() {
        this.armillarySphere = new THREE.Group();

        const bronzeMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b5a2b,
            shininess: 10,
            specular: 0x333333
        });

        const brightBronzeMaterial = new THREE.MeshPhongMaterial({
            color: 0xa0522d,
            shininess: 30,
            specular: 0x555555
        });

        const equatorRing = this.createRing(3, 0x8b5a2b);
        equatorRing.rotation.x = Math.PI / 2;
        this.armillarySphere.add(equatorRing);

        const eclipticRing = this.createRing(3.2, 0xa0522d);
        eclipticRing.rotation.x = (23.5 * Math.PI / 180);
        this.armillarySphere.add(eclipticRing);

        const meridianRing = this.createRing(3.4, 0x8b5a2b);
        this.armillarySphere.add(meridianRing);

        const horizonRing = this.createRing(3.6, 0xa0522d);
        horizonRing.rotation.x = Math.PI / 2;
        this.armillarySphere.add(horizonRing);

        this.raDecRing = new THREE.Group();
        const raRing = this.createRing(2.8, 0xd4af37);
        raRing.rotation.x = Math.PI / 2;
        this.raDecRing.add(raRing);

        const decRing = this.createRing(2.8, 0xd4af37);
        this.raDecRing.add(decRing);
        this.armillarySphere.add(this.raDecRing);

        this.sightingTube = new THREE.Group();
        const tubeGeom = new THREE.CylinderGeometry(0.05, 0.05, 5.5, 16);
        const tubeMesh = new THREE.Mesh(tubeGeom, brightBronzeMaterial);
        tubeMesh.rotation.z = Math.PI / 2;
        this.sightingTube.add(tubeMesh);

        const pointerGeom = new THREE.ConeGeometry(0.08, 0.2, 8);
        const pointer = new THREE.Mesh(pointerGeom, brightBronzeMaterial);
        pointer.position.set(0, 0, -2.8);
        pointer.rotation.x = -Math.PI / 2;
        this.sightingTube.add(pointer);

        this.raDecRing.add(this.sightingTube);

        const centerSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 32, 32),
            new THREE.MeshPhongMaterial({ color: 0xd4af37, emissive: 0x443300 })
        );
        this.armillarySphere.add(centerSphere);

        const supportMat = new THREE.MeshPhongMaterial({ color: 0x654321 });
        const supportGeom = new THREE.BoxGeometry(0.1, 4, 0.1);
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const support = new THREE.Mesh(supportGeom, supportMat);
            support.position.set(
                Math.cos(angle) * 3.8,
                -0.5,
                Math.sin(angle) * 3.8
            );
            support.rotation.z = Math.PI / 6;
            this.armillarySphere.add(support);
        }

        const baseGeom = new THREE.CylinderGeometry(4, 4.5, 0.3, 32);
        const base = new THREE.Mesh(baseGeom, supportMat);
        base.position.y = -2.5;
        this.armillarySphere.add(base);

        this.scene.add(this.armillarySphere);
    },

    createRing: function(radius, color) {
        const tubeRadius = 0.03;
        const tubularSegments = 128;
        const radialSegments = 8;
        const geometry = new THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments);
        const material = new THREE.MeshPhongMaterial({ color: color, shininess: 20 });
        return new THREE.Mesh(geometry, material);
    },

    onWindowResize: function() {
        const container = document.getElementById('armillary-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    bindEvents: function() {
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        document.getElementById('auto-rotate').addEventListener('click', () => this.toggleAutoRotate());
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.getElementById('lock-star').addEventListener('click', () => this.lockCurrentStar());
        document.getElementById('save-observation').addEventListener('click', () => this.showObservationModal());
        document.getElementById('cancel-obs').addEventListener('click', () => this.hideObservationModal());
        document.getElementById('confirm-obs').addEventListener('click', () => this.saveObservation());

        document.getElementById('export-csv').addEventListener('click', () => this.exportCSV());

        document.getElementById('start-demo').addEventListener('click', () => this.startDemo());
        document.getElementById('stop-demo').addEventListener('click', () => this.stopDemo());

        document.getElementById('mag-limit').addEventListener('input', (e) => {
            document.getElementById('mag-value').textContent = e.target.value;
            this.drawStarChart();
        });

        document.getElementById('enclosure-filter').addEventListener('change', () => this.drawStarChart());

        document.getElementById('obs-year').addEventListener('change', () => this.updateAltAz());
        document.getElementById('obs-location').addEventListener('change', () => this.updateAltAz());

        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        const container = document.getElementById('armillary-container');
        
        container.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                isDragging = true;
                previousMousePosition = { x: e.clientX, y: e.clientY };
                this.controls.enabled = false;
            }
        });

        container.addEventListener('contextmenu', (e) => e.preventDefault());

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                this.rotateSightingTube(deltaX * 0.5, deltaY * 0.5);
                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.controls.enabled = true;
            }
        });
    },

    rotateSightingTube: function(deltaRA, deltaDec) {
        this.currentRA = (this.currentRA + deltaRA) % 360;
        this.currentRA = (this.currentRA + 360) % 360;
        
        this.currentDec = Math.max(-90, Math.min(90, this.currentDec + deltaDec));
        
        this.raDecRing.rotation.y = this.currentRA * Math.PI / 180;
        this.raDecRing.rotation.x = this.currentDec * Math.PI / 180;
        
        this.updateCoordsDisplay();
        this.findNearestStar();
    },

    resetView: function() {
        this.camera.position.set(0, 2, 8);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    },

    toggleAutoRotate: function() {
        this.autoRotate = !this.autoRotate;
        const btn = document.getElementById('auto-rotate');
        btn.textContent = this.autoRotate ? '停止旋转' : '自动旋转';
        btn.classList.toggle('btn-danger', this.autoRotate);
        btn.classList.toggle('btn-secondary', !this.autoRotate);
    },

    switchTab: function(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        if (tabName === 'star-chart') {
            this.drawStarChart();
        }
    },

    updateCoordsDisplay: function() {
        document.getElementById('current-ra').textContent = this.currentRA.toFixed(2) + '°';
        document.getElementById('current-dec').textContent = this.currentDec.toFixed(2) + '°';
        this.updateAltAz();
    },

    updateAltAz: async function() {
        if (!this.currentStar) {
            return;
        }

        try {
            const response = await fetch('/api/calculate/altaz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ra: this.currentStar.ra,
                    dec: this.currentStar.dec,
                    year: parseInt(document.getElementById('obs-year').value),
                    location: document.getElementById('obs-location').value
                })
            });

            const data = await response.json();
            document.getElementById('current-alt').textContent = data.altitude + '°';
            document.getElementById('current-az').textContent = data.azimuth + '°';
        } catch (err) {
            console.error('计算地平坐标失败:', err);
        }
    },

    loadAllStars: async function() {
        try {
            const response = await fetch('/api/stars');
            const data = await response.json();
            this.allStars = data.stars;
            document.getElementById('star-count').textContent = data.count;
            this.drawStarChart();
        } catch (err) {
            console.error('加载恒星数据失败:', err);
            this.updateStatus('加载恒星数据失败');
        }
    },

    loadBrightStars: async function() {
        try {
            const response = await fetch('/api/bright-stars');
            const data = await response.json();
            this.brightStars = data.stars;
            this.renderBrightStarsList();
        } catch (err) {
            console.error('加载亮星失败:', err);
        }
    },

    renderBrightStarsList: function() {
        const container = document.getElementById('bright-stars-list');
        
        if (this.brightStars.length === 0) {
            container.innerHTML = '<p>暂无亮星数据</p>';
            return;
        }

        container.innerHTML = this.brightStars.map(star => `
            <div class="bright-star-card" data-star-id="${star.id}" onclick="App.selectDemoStar(${star.id})">
                <div class="star-name">${star.name}</div>
                <div class="star-chinese">${star.chineseName}</div>
                <div class="star-mag">星等: ${star.magnitude}</div>
            </div>
        `).join('');
    },

    selectDemoStar: function(starId) {
        this.selectedDemoStar = this.brightStars.find(s => s.id === starId);
        
        document.querySelectorAll('.bright-star-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`.bright-star-card[data-star-id="${starId}"]`).classList.add('selected');
        
        document.getElementById('start-demo').disabled = false;
    },

    startDemo: function() {
        if (!this.selectedDemoStar) return;

        this.isDemoRunning = true;
        document.getElementById('start-demo').disabled = true;
        document.getElementById('stop-demo').disabled = false;

        const star = this.selectedDemoStar;
        const targetRA = star.ra;
        const targetDec = star.dec;

        document.getElementById('demo-status').textContent = `正在对准: ${star.name} (${star.chineseName})...`;

        const duration = 2000;
        const startTime = Date.now();
        const startRA = this.currentRA;
        const startDec = this.currentDec;

        const animate = () => {
            if (!this.isDemoRunning) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            this.currentRA = startRA + (targetRA - startRA) * easeProgress;
            this.currentDec = startDec + (targetDec - startDec) * easeProgress;

            this.raDecRing.rotation.y = this.currentRA * Math.PI / 180;
            this.raDecRing.rotation.x = this.currentDec * Math.PI / 180;

            this.updateCoordsDisplay();

            if (progress < 1) {
                this.demoAnimationId = requestAnimationFrame(animate);
            } else {
                document.getElementById('demo-status').textContent = `已对准 ${star.name}！赤经: ${star.ra.toFixed(2)}°, 赤纬: ${star.dec.toFixed(2)}°`;
                this.findNearestStar();
                
                setTimeout(() => {
                    if (this.isDemoRunning) {
                        this.lockCurrentStar();
                    }
                }, 500);
            }
        };

        animate();
    },

    stopDemo: function() {
        this.isDemoRunning = false;
        if (this.demoAnimationId) {
            cancelAnimationFrame(this.demoAnimationId);
        }
        document.getElementById('start-demo').disabled = false;
        document.getElementById('stop-demo').disabled = true;
        document.getElementById('demo-status').textContent = '演示已停止';
    },

    findNearestStar: async function() {
        try {
            const response = await fetch(`/api/stars/nearest?ra=${this.currentRA}&dec=${this.currentDec}&tolerance=0.5`);
            const star = await response.json();
            
            if (star && parseFloat(star.angularDistance) <= 0.5) {
                this.currentStar = star;
                this.updateStarInfo(star);
                document.getElementById('lock-star').disabled = false;
                document.getElementById('save-observation').disabled = false;
                this.updateAltAz();
                this.highlightStarOnChart(star);
            } else {
                this.currentStar = null;
                document.getElementById('current-star').innerHTML = '<p class="no-star">移动窥管对准恒星...</p>';
                document.getElementById('lock-star').disabled = true;
                document.getElementById('save-observation').disabled = true;
                this.highlightStarOnChart(null);
            }
        } catch (err) {
                console.error('查找最近恒星失败:', err);
        }
    },

    updateStarInfo: function(star) {
        const container = document.getElementById('current-star');
        container.innerHTML = `
            <div class="star-detail">
                <div class="star-name">${star.name}</div>
                <div class="star-chinese">${star.chineseName}</div>
                <div class="star-meta">
                    <span>${star.mansion}</span>
                    <span>${star.enclosure}</span>
                    <span>星等: ${star.magnitude}</span>
                    <span>角距: ${star.angularDistance}°</span>
                </div>
            </div>
        `;
    },

    lockCurrentStar: function() {
        if (!this.currentStar) return;

        this.lockedStar = { ...this.currentStar };

        const container = document.getElementById('locked-star-display');
        container.innerHTML = `
            <div class="locked-star-info">
                <div class="locked-star-name">${this.lockedStar.name}</div>
                <div class="locked-coords">
                    <div>
                        <span class="label">赤经</span>
                        <span class="value">${this.lockedStar.ra.toFixed(2)}°</span>
                    </div>
                    <div>
                        <span class="label">赤纬</span>
                        <span class="value">${this.lockedStar.dec.toFixed(2)}°</span>
                    </div>
                    <div>
                        <span class="label">高度</span>
                        <span class="value" id="locked-alt">-</span>
                    </div>
                    <div>
                        <span class="label">方位</span>
                        <span class="value" id="locked-az">-</span>
                    </div>
                </div>
                <button class="btn btn-danger unlock-btn" onclick="App.unlockStar()">解除锁定</button>
            </div>
        `;

        this.updateLockedAltAz();
        this.updateStatus(`已锁定 ${this.lockedStar.name}`);
    },

    unlockStar: function() {
        this.lockedStar = null;
        document.getElementById('locked-star-display').innerHTML = '<p class="no-star">未锁定星体</p>';
        this.updateStatus('已解除星体锁定');
    },

    updateLockedAltAz: async function() {
        if (!this.lockedStar) return;

        try {
            const response = await fetch('/api/calculate/altaz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ra: this.lockedStar.ra,
                    dec: this.lockedStar.dec,
                    year: parseInt(document.getElementById('obs-year').value),
                    location: document.getElementById('obs-location').value
                })
            });

            const data = await response.json();
            const altEl = document.getElementById('locked-alt');
            const azEl = document.getElementById('locked-az');
            if (altEl) altEl.textContent = data.altitude + '°';
            if (azEl) azEl.textContent = data.azimuth + '°';
        } catch (err) {
            console.error('计算锁定星体地平坐标失败:', err);
        }
    },

    showObservationModal: function() {
        if (!this.currentStar) return;

        const now = new Date();
        const timeStr = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');

        document.getElementById('obs-time').value = timeStr;
        document.getElementById('obs-star-name').value = this.currentStar.name;
        document.getElementById('obs-note').value = '';
        document.getElementById('observation-modal').classList.remove('hidden');
    },

    hideObservationModal: function() {
        document.getElementById('observation-modal').classList.add('hidden');
    },

    saveObservation: async function() {
        if (!this.currentStar) return;

        const observation = {
            time: document.getElementById('obs-time').value,
            starName: this.currentStar.name,
            ra: this.currentStar.ra,
            dec: this.currentStar.dec,
            altitude: parseFloat(document.getElementById('current-alt').textContent),
            azimuth: parseFloat(document.getElementById('current-az').textContent),
            note: document.getElementById('obs-note').value,
            location: document.getElementById('obs-location').value
        };

        try {
            const response = await fetch('/api/observations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(observation)
            });

            const result = await response.json();
            this.updateStatus(result.message);
            this.hideObservationModal();
            this.loadObservations();
        } catch (err) {
            console.error('保存观测记录失败:', err);
            this.updateStatus('保存观测记录失败');
        }
    },

    loadObservations: async function() {
        try {
            const response = await fetch('/api/observations');
            const data = await response.json();
            this.renderObservationsList(data.observations);
            document.getElementById('obs-count').textContent = data.count;
        } catch (err) {
            console.error('加载观测记录失败:', err);
        }
    },

    renderObservationsList: function(observations) {
        const container = document.getElementById('observations-list');

        if (observations.length === 0) {
            container.innerHTML = '<p>暂无观测记录</p>';
            return;
        }

        container.innerHTML = observations.map(obs => `
            <div class="observation-item">
                <div class="obs-header">
                    <span class="obs-star">${obs.starName}</span>
                    <span class="obs-time">${obs.time}</span>
                </div>
                <div class="obs-coords">
                    <span>RA: ${obs.ra?.toFixed(2)}°</span>
                    <span>Dec: ${obs.dec?.toFixed(2)}°</span>
                    <span>高度: ${obs.altitude}°</span>
                    <span>方位: ${obs.azimuth}°</span>
                    <span>地点: ${obs.location}</span>
                </div>
                ${obs.note ? `<div class="obs-note">${obs.note}</div>` : ''}
                <button class="btn btn-danger delete-obs-btn" onclick="App.deleteObservation(${obs.id})">删除</button>
            </div>
        `).join('');
    },

    deleteObservation: async function(id) {
        if (!confirm('确定要删除这条观测记录吗？')) return;

        try {
            await fetch(`/api/observations/${id}`, { method: 'DELETE' });
            this.updateStatus('观测记录已删除');
            this.loadObservations();
        } catch (err) {
            console.error('删除观测记录失败:', err);
            this.updateStatus('删除观测记录失败');
        }
    },

    exportCSV: function() {
        window.open('/api/observations/export/csv', '_blank');
        this.updateStatus('正在导出CSV...');
    },

    loadTasks: async function() {
        try {
            const response = await fetch('/api/tasks');
            const data = await response.json();
            this.renderTasksList(data.tasks);
        } catch (err) {
            console.error('加载任务失败:', err);
        }
    },

    renderTasksList: function(tasks) {
        const container = document.getElementById('tasks-list');

        if (tasks.length === 0) {
            container.innerHTML = '<p>暂无观测任务</p>';
            return;
        }

        container.innerHTML = tasks.map((task, index) => `
            <div class="task-card" data-task-index="${index}">
                <h4>${task.name}</h4>
                <div class="task-desc">${task.description}</div>
                <div class="task-meta">
                    <span>🎯 目标: ${task.targetStar}</span>
                    <span>📅 年份: ${task.year}年</span>
                    <span>📍 地点: ${task.location}</span>
                </div>
                <button class="btn btn-primary start-task-btn" data-task-index="${index}">开始任务</button>
            </div>
        `).join('');

        this.tasksData = tasks;

        container.querySelectorAll('.start-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.taskIndex);
                this.startTask(index);
            });
        });
    },

    startTask: function(taskIndex) {
        const task = this.tasksData[taskIndex];
        if (!task) return;

        const star = this.allStars.find(s => s.name === task.targetStar);
        if (star) {
            this.currentRA = star.ra;
            this.currentDec = star.dec;
            this.raDecRing.rotation.y = this.currentRA * Math.PI / 180;
            this.raDecRing.rotation.x = this.currentDec * Math.PI / 180;
            this.updateCoordsDisplay();
            this.findNearestStar();
            
            document.getElementById('obs-year').value = task.year;
            document.getElementById('obs-location').value = task.location;
            
            this.updateStatus(`开始任务: ${task.name}`);
            this.switchTab('star-chart');
        } else {
            this.updateStatus(`未找到目标星体: ${task.targetStar}`);
        }
    },

    loadMansions: async function() {
        const mansions = {
            ziwei: ['紫微垣', '奎宿', '娄宿', '胃宿', '昴宿', '毕宿', '觜宿', '参宿', '井宿', '鬼宿', '柳宿', '星宿', '张宿', '翼宿', '轸宿'],
            taiwei: ['太微垣', '角宿', '亢宿', '氐宿', '房宿', '心宿', '尾宿', '箕宿'],
            tianshi: ['天市垣', '斗宿', '牛宿', '女宿', '虚宿', '危宿', '室宿', '壁宿']
        };

        this.renderMansionList('ziwei-mansions', mansions.ziwei);
        this.renderMansionList('taiwei-mansions', mansions.taiwei);
        this.renderMansionList('tianshi-mansions', mansions.tianshi);
    },

    renderMansionList: function(containerId, mansions) {
        const container = document.getElementById(containerId);
        container.innerHTML = mansions.map(m => `
            <div class="mansion-item" onclick="App.showMansionInfo('${m}')">${m}</div>
        `).join('');
    },

    showMansionInfo: function(mansionName) {
        document.querySelectorAll('.mansion-item').forEach(item => {
            item.classList.remove('active');
            if (item.textContent === mansionName) {
                item.classList.add('active');
            }
        });

        const info = this.mansionInfo[mansionName] || '暂无详细说明';
        const starsInMansion = this.allStars.filter(s => s.mansion === mansionName || s.enclosure === mansionName);

        let starsHtml = '';
        if (starsInMansion.length > 0) {
            starsHtml = `<br><br><strong>主要恒星:</strong><br>` +
                starsInMansion.map(s => `${s.name} (${s.chineseName})`).join(', ');
        }

        document.getElementById('mansion-info').innerHTML = `
            <h4>${mansionName}</h4>
            ${info}${starsHtml}
        `;
    },

    drawStarChart: function() {
        const canvas = document.getElementById('star-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;

        ctx.clearRect(0, 0, width, height);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2;
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
            ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        for (let r = radius / 4; r < radius; r += radius / 4) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(139, 90, 43, 0.2)';
            ctx.stroke();
        }

        ctx.fillStyle = '#d4af37';
        ctx.font = '12px Microsoft YaHei';
        ctx.fillText('0°', centerX + radius + 5, centerY + 4);
        ctx.fillText('90°', centerX - 4, centerY - radius - 5);
        ctx.fillText('180°', centerX - radius - 20, centerY + 4);
        ctx.fillText('270°', centerX - 4, centerY + radius + 15);

        const magLimit = parseFloat(document.getElementById('mag-limit').value);
        const enclosureFilter = document.getElementById('enclosure-filter').value;

        const displayStars = this.allStars.filter(star => {
            if (star.magnitude > magLimit) return false;
            if (enclosureFilter && star.enclosure !== enclosureFilter) return false;
            return true;
        });

        displayStars.forEach(star => {
            const raRad = star.ra * Math.PI / 180;
            const decRad = star.dec * Math.PI / 180;
            
            const r = radius * (1 - Math.abs(decRad) / (Math.PI / 2));
            const x = centerX + Math.cos(raRad) * r;
            const y = centerY - Math.sin(raRad) * r;

            const size = Math.max(1, 5 - star.magnitude);
            const opacity = Math.max(0.3, 1 - star.magnitude / 6);

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();

            if (star.magnitude <= 2) {
                ctx.fillStyle = '#d4af37';
                ctx.font = '10px Microsoft YaHei';
                ctx.fillText(star.name, x + size + 2, y - size - 2);
            }
        });

        this.drawPointerOnChart(ctx, centerX, centerY, radius);
    },

    drawPointerOnChart: function(ctx, centerX, centerY, radius) {
        const raRad = this.currentRA * Math.PI / 180;
        const decRad = this.currentDec * Math.PI / 180;
        
        const r = radius * (1 - Math.abs(decRad) / (Math.PI / 2));
        const x = centerX + Math.cos(raRad) * r;
        const y = centerY - Math.sin(raRad) * r;

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 12, y);
        ctx.lineTo(x + 12, y);
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x, y + 12);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
    },

    highlightStarOnChart: function(star) {
        this.drawStarChart();
        
        if (!star) return;

        const canvas = document.getElementById('star-chart');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;

        const raRad = star.ra * Math.PI / 180;
        const decRad = star.dec * Math.PI / 180;
        
        const r = radius * (1 - Math.abs(decRad) / (Math.PI / 2));
        const x = centerX + Math.cos(raRad) * r;
        const y = centerY - Math.sin(raRad) * r;

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 12px Microsoft YaHei';
        ctx.fillText(star.name, x + 15, y - 15);
    },

    updateStatus: function(message) {
        document.getElementById('status-text').textContent = message;
        console.log('[状态]', message);
    },

    animate: function() {
        requestAnimationFrame(() => this.animate());

        if (this.autoRotate && !this.isDemoRunning) {
            this.armillarySphere.rotation.y += 0.002;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
