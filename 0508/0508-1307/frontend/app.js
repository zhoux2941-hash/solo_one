class StarCatalogApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.layerGroups = {};
        this.layerVisibility = { background: true, ancient: true, modern: true };

        this.stars = [];
        this.modernStars = [];
        this.backgroundStars = [];
        this.constellations = [];
        this.constellationLines = [];
        this.highlightedStar = null;
        this.currentYear = 2024;
        this.projectionMode = 'sphere';
        this.showConstellations = true;
        this.showLabels = true;

        this.init();
    }

    init() {
        this.initThreeJS();
        this.loadData();
        this.setupEventListeners();
        this.animate();
    }

    initThreeJS() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000510);

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 150);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 300;

        this.layerGroups.background = new THREE.Group();
        this.layerGroups.background.name = 'background';
        this.layerGroups.ancient = new THREE.Group();
        this.layerGroups.ancient.name = 'ancient';
        this.layerGroups.modern = new THREE.Group();
        this.layerGroups.modern.name = 'modern';

        Object.values(this.layerGroups).forEach(g => this.scene.add(g));

        this.createCelestialSphere();
        this.createGrid();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    createCelestialSphere() {
        const geometry = new THREE.SphereGeometry(100, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            color: 0x001030,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.3
        });
        const sphere = new THREE.Mesh(geometry, material);
        this.scene.add(sphere);

        const wireframeGeometry = new THREE.SphereGeometry(100.5, 24, 24);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x1a3060,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.scene.add(wireframe);
    }

    createGrid() {
        const equatorGeometry = new THREE.BufferGeometry();
        const equatorPoints = [];
        for (let i = 0; i <= 360; i += 2) {
            const rad = (i * Math.PI) / 180;
            equatorPoints.push(Math.cos(rad) * 100, 0, Math.sin(rad) * 100);
        }
        equatorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(equatorPoints, 3));
        const equatorMaterial = new THREE.LineBasicMaterial({ color: 0x3366aa, transparent: true, opacity: 0.5 });
        const equator = new THREE.Line(equatorGeometry, equatorMaterial);
        this.scene.add(equator);

        for (let dec = -60; dec <= 60; dec += 30) {
            if (dec === 0) continue;
            const decRad = (dec * Math.PI) / 180;
            const radius = 100 * Math.cos(decRad);
            const y = 100 * Math.sin(decRad);

            const decGeometry = new THREE.BufferGeometry();
            const decPoints = [];
            for (let i = 0; i <= 360; i += 5) {
                const rad = (i * Math.PI) / 180;
                decPoints.push(Math.cos(rad) * radius, y, Math.sin(rad) * radius);
            }
            decGeometry.setAttribute('position', new THREE.Float32BufferAttribute(decPoints, 3));
            const decMaterial = new THREE.LineBasicMaterial({ color: 0x224477, transparent: true, opacity: 0.3 });
            const decLine = new THREE.Line(decGeometry, decMaterial);
            this.scene.add(decLine);
        }
    }

    async loadData() {
        try {
            const [starsRes, modernRes, bgRes, constellationsRes] = await Promise.all([
                fetch(`/api/stars?year=${this.currentYear}`),
                fetch('/api/stars/modern'),
                fetch('/api/stars/background?count=3000'),
                fetch('/api/constellations')
            ]);

            this.stars = await starsRes.json();
            this.modernStars = await modernRes.json();
            this.backgroundStars = await bgRes.json();
            this.constellations = await constellationsRes.json();

            this.renderBackgroundLayer();
            this.renderAncientLayer();
            this.renderModernLayer();
            this.renderConstellations();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    raDecToXYZ(ra, dec, radius = 100) {
        const raRad = (ra * Math.PI) / 180;
        const decRad = (dec * Math.PI) / 180;

        const x = radius * Math.cos(decRad) * Math.cos(raRad);
        const y = radius * Math.sin(decRad);
        const z = radius * Math.cos(decRad) * Math.sin(raRad);

        return { x, y, z };
    }

    getStarColor(magnitude) {
        if (magnitude <= 0) return new THREE.Color(0xffffff);
        if (magnitude <= 1) return new THREE.Color(0xe0e8ff);
        if (magnitude <= 2) return new THREE.Color(0xc0c8e8);
        if (magnitude <= 3) return new THREE.Color(0xa0a8c8);
        if (magnitude <= 4) return new THREE.Color(0x8890b0);
        return new THREE.Color(0x707890);
    }

    getStarSize(magnitude) {
        const baseSize = 0.3;
        const maxSize = 2.5;
        const normalizedMag = Math.max(-1.5, Math.min(5, magnitude));
        return maxSize - ((normalizedMag + 1.5) / 6.5) * (maxSize - baseSize);
    }

    renderBackgroundLayer() {
        const group = this.layerGroups.background;
        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }

        const positions = [];
        const colors = [];
        const sizes = [];

        this.backgroundStars.forEach(star => {
            const pos = this.raDecToXYZ(star.ra, star.dec, 99);
            positions.push(pos.x, pos.y, pos.z);
            const brightness = Math.max(0.15, 0.6 - (star.magnitude - 4.5) / 3.5 * 0.45);
            colors.push(brightness * 0.7, brightness * 0.75, brightness);
            sizes.push(Math.max(0.3, 1.2 - (star.magnitude - 4.5) / 3.5));
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geometry, material);
        group.add(points);
    }

    renderAncientLayer() {
        const group = this.layerGroups.ancient;
        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }

        this.stars.forEach((star, index) => {
            const pos = this.raDecToXYZ(star.ra, star.dec);
            const size = this.getStarSize(star.magnitude);
            const color = this.getStarColor(star.magnitude);

            const geometry = new THREE.SphereGeometry(size, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.95
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.userData = { star, index, layer: 'ancient' };
            group.add(mesh);

            const glowGeometry = new THREE.SphereGeometry(size * 2, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.15
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(mesh.position);
            glow.userData = { isGlow: true, starIndex: index, layer: 'ancient' };
            group.add(glow);

            if (this.showLabels && star.magnitude <= 3.5) {
                this.createStarLabel(group, star, pos);
            }
        });
    }

    renderModernLayer() {
        const group = this.layerGroups.modern;
        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }

        this.modernStars.forEach((star, index) => {
            const pos = this.raDecToXYZ(star.ra, star.dec, 100.5);
            const size = this.getStarSize(star.magnitude) * 0.7;
            const color = new THREE.Color(0x44dd88);

            const geometry = new THREE.SphereGeometry(size, 12, 12);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.6
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.userData = { star, index, layer: 'modern' };
            group.add(mesh);
        });
    }

    createStarLabel(group, star, pos) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = '16px Microsoft YaHei, SimHei, sans-serif';
        context.fillStyle = 'rgba(200, 220, 255, 0.8)';
        context.textAlign = 'center';
        context.fillText(star.name_chinese, 128, 35);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(pos.x * 1.08, pos.y * 1.08, pos.z * 1.08);
        sprite.scale.set(12, 3, 1);
        sprite.userData = { isLabel: true, starId: star.id };

        group.add(sprite);
    }

    renderConstellations() {
        this.constellationLines.forEach(line => this.layerGroups.ancient.remove(line));
        this.constellationLines = [];

        if (!this.showConstellations) return;

        this.constellations.forEach(constellation => {
            const starIndices = constellation.star_indices;
            if (starIndices.length < 2) return;

            const lineGeometry = new THREE.BufferGeometry();
            const linePoints = [];

            for (let i = 0; i < starIndices.length; i++) {
                const starIdx = starIndices[i] - 1;
                if (starIdx >= 0 && starIdx < this.stars.length) {
                    const star = this.stars[starIdx];
                    const pos = this.raDecToXYZ(star.ra, star.dec);
                    linePoints.push(pos.x, pos.y, pos.z);
                }
            }

            if (linePoints.length >= 6) {
                lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0x4488ff,
                    transparent: true,
                    opacity: 0.4
                });
                const line = new THREE.LineSegments(lineGeometry, lineMaterial);
                line.userData = { constellation };
                this.layerGroups.ancient.add(line);
                this.constellationLines.push(line);
            }
        });
    }

    setLayerVisibility(layer, visible) {
        this.layerVisibility[layer] = visible;
        this.layerGroups[layer].visible = visible;
        if (this.projectionMode === 'mercator') {
            this.renderMercatorProjection();
        }
    }

    highlightStar(starIndex) {
        this.clearHighlight();

        this.highlightedStar = starIndex;

        if (starIndex !== null && starIndex !== undefined) {
            const ancientGroup = this.layerGroups.ancient;
            ancientGroup.children.forEach(child => {
                if (child.userData.index === starIndex && !child.userData.isGlow && !child.userData.isLabel) {
                    child.material.emissive = new THREE.Color(0x00ff00);
                    child.material.emissiveIntensity = 0.5;
                }
            });

            const star = this.stars[starIndex];
            if (star) {
                const pos = this.raDecToXYZ(star.ra, star.dec);
                const targetPos = new THREE.Vector3(pos.x * 1.5, pos.y * 1.5, pos.z * 1.5);

                const startPos = this.camera.position.clone();
                const duration = 500;
                const startTime = Date.now();

                const animateCamera = () => {
                    const elapsed = Date.now() - startTime;
                    const t = Math.min(elapsed / duration, 1);
                    const easedT = 1 - Math.pow(1 - t, 3);

                    this.camera.position.lerpVectors(startPos, targetPos, easedT);
                    this.camera.lookAt(pos.x, pos.y, pos.z);

                    if (t < 1) {
                        requestAnimationFrame(animateCamera);
                    }
                };
                animateCamera();

                this.showStarInfo(star);
            }
        }
    }

    clearHighlight() {
        if (this.highlightedStar === null) return;
        const ancientGroup = this.layerGroups.ancient;
        ancientGroup.children.forEach(child => {
            if (child.userData.index === this.highlightedStar && !child.userData.isGlow && !child.userData.isLabel) {
                child.material.emissive = new THREE.Color(0x000000);
            }
        });
        this.highlightedStar = null;
    }

    showStarInfo(star) {
        const panel = document.getElementById('info-panel');
        panel.classList.add('visible');

        document.getElementById('star-name').textContent = `${star.name_chinese} (${star.name_greek})`;
        document.getElementById('star-ra').textContent = star.ra.toFixed(4) + '°';
        document.getElementById('star-dec').textContent = star.dec.toFixed(4) + '°';
        document.getElementById('star-mag').textContent = star.magnitude.toFixed(2);
        document.getElementById('star-constellation').textContent = star.constellation;
        document.getElementById('star-bayer').textContent = star.name_bayer;
    }

    async updateYear(year) {
        this.currentYear = year;
        try {
            const response = await fetch(`/api/stars?year=${year}`);
            this.stars = await response.json();
            this.renderAncientLayer();
            this.renderConstellations();
        } catch (error) {
            console.error('Error updating year:', error);
        }
    }

    async searchStars(query) {
        if (!query.trim()) {
            document.getElementById('search-results').classList.remove('visible');
            return;
        }

        try {
            const response = await fetch(`/api/stars/search?q=${encodeURIComponent(query)}&year=${this.currentYear}`);
            const results = await response.json();

            const container = document.getElementById('search-results');
            container.innerHTML = '';

            if (results.length > 0) {
                results.slice(0, 10).forEach(star => {
                    const div = document.createElement('div');
                    div.className = 'search-result';
                    div.innerHTML = `
                        <div class="name">${star.name_chinese}</div>
                        <div class="detail">${star.name_greek} · ${star.constellation} · ${star.magnitude.toFixed(2)}等</div>
                    `;
                    div.addEventListener('click', () => {
                        const index = this.stars.findIndex(s => s.id === star.id);
                        if (index !== -1) {
                            this.highlightStar(index);
                        }
                        container.classList.remove('visible');
                        document.getElementById('search-input').value = '';
                    });
                    container.appendChild(div);
                });
                container.classList.add('visible');
            } else {
                container.innerHTML = '<div class="search-result"><div class="name">未找到结果</div></div>';
                container.classList.add('visible');
            }
        } catch (error) {
            console.error('Error searching stars:', error);
        }
    }

    switchProjection(mode) {
        this.projectionMode = mode;

        const sphereContainer = document.getElementById('canvas-container');
        const mercatorContainer = document.getElementById('mercator-container');

        if (mode === 'sphere') {
            sphereContainer.style.display = 'block';
            mercatorContainer.classList.remove('visible');
        } else {
            sphereContainer.style.display = 'none';
            mercatorContainer.classList.add('visible');
            this.renderMercatorProjection();
        }
    }

    renderMercatorProjection() {
        const canvas = document.getElementById('mercator-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#000510';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(50, 80, 120, 0.3)';
        ctx.lineWidth = 1;

        for (let ra = 0; ra <= 360; ra += 30) {
            const x = (ra / 360) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let dec = -60; dec <= 60; dec += 30) {
            const y = this.mercatorY(dec, height);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
        ctx.lineWidth = 2;
        const equatorY = this.mercatorY(0, height);
        ctx.beginPath();
        ctx.moveTo(0, equatorY);
        ctx.lineTo(width, equatorY);
        ctx.stroke();

        if (this.layerVisibility.background) {
            this.backgroundStars.forEach(star => {
                const x = (star.ra / 360) * width;
                const y = this.mercatorY(star.dec, height);
                if (y >= 0 && y <= height) {
                    const brightness = Math.max(0.15, 0.6 - (star.magnitude - 4.5) / 3.5 * 0.45);
                    ctx.beginPath();
                    ctx.arc(x, y, 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${Math.floor(brightness*180)}, ${Math.floor(brightness*190)}, ${Math.floor(brightness*200)}, 0.5)`;
                    ctx.fill();
                }
            });
        }

        if (this.layerVisibility.modern) {
            this.modernStars.forEach(star => {
                const x = (star.ra / 360) * width;
                const y = this.mercatorY(star.dec, height);
                if (y >= 0 && y <= height) {
                    const size = Math.max(1.5, this.getStarSize(star.magnitude) * 1.5);
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(68, 221, 136, 0.5)';
                    ctx.fill();
                }
            });
        }

        if (this.layerVisibility.ancient) {
            this.stars.forEach(star => {
                const x = (star.ra / 360) * width;
                const y = this.mercatorY(star.dec, height);

                if (y >= 0 && y <= height) {
                    const size = Math.max(2, this.getStarSize(star.magnitude) * 2);
                    const color = this.getStarColor(star.magnitude);

                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
                    ctx.fill();

                    if (star.magnitude <= 3) {
                        ctx.beginPath();
                        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.2)`;
                        ctx.fill();
                    }

                    if (this.showLabels && star.magnitude <= 3.5) {
                        ctx.font = '12px Microsoft YaHei, SimHei, sans-serif';
                        ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
                        ctx.fillText(star.name_chinese, x + size + 5, y + 4);
                    }
                }
            });

            if (this.showConstellations) {
                ctx.strokeStyle = 'rgba(68, 136, 255, 0.4)';
                ctx.lineWidth = 1.5;

                this.constellations.forEach(constellation => {
                    const starIndices = constellation.star_indices;
                    if (starIndices.length < 2) return;

                    ctx.beginPath();
                    let first = true;

                    for (let i = 0; i < starIndices.length; i++) {
                        const starIdx = starIndices[i] - 1;
                        if (starIdx >= 0 && starIdx < this.stars.length) {
                            const star = this.stars[starIdx];
                            const x = (star.ra / 360) * width;
                            const y = this.mercatorY(star.dec, height);

                            if (y >= 0 && y <= height) {
                                if (first) {
                                    ctx.moveTo(x, y);
                                    first = false;
                                } else {
                                    ctx.lineTo(x, y);
                                }
                            }
                        }
                    }
                    ctx.stroke();
                });
            }
        }
    }

    mercatorY(dec, height) {
        const maxLat = 85;
        const clampedDec = Math.max(-maxLat, Math.min(maxLat, dec));
        const latRad = (clampedDec * Math.PI) / 180;
        const y = Math.log(Math.tan(latRad / 2 + Math.PI / 4));
        const maxY = Math.log(Math.tan((maxLat * Math.PI) / 360 + Math.PI / 4));
        return height / 2 - (y / maxY) * (height / 2);
    }

    exportCSV() {
        this.startBatchExport();
    }

    async startBatchExport() {
        const year = this.currentYear;
        let cancelled = false;

        const modal = document.getElementById('export-modal');
        const progressFill = document.getElementById('export-progress-fill');
        const progressText = document.getElementById('export-progress-text');
        const batchList = document.getElementById('batch-list');
        const cancelBtn = document.getElementById('export-cancel');
        const downloadAllBtn = document.getElementById('export-download-all');

        modal.classList.add('visible');
        progressFill.style.width = '0%';
        progressText.textContent = '获取星表元数据...';
        batchList.innerHTML = '';
        downloadAllBtn.disabled = true;

        const onCancel = () => { cancelled = true; };
        cancelBtn.addEventListener('click', onCancel, { once: true });

        try {
            const metaRes = await fetch(`/api/stars/csv/meta?year=${year}`);
            const meta = await metaRes.json();

            const { total, batchSize, totalBatches } = meta;
            const allCsvParts = [];

            batchList.innerHTML = '';
            for (let i = 0; i < totalBatches; i++) {
                const div = document.createElement('div');
                div.className = 'batch-item';
                div.id = `batch-item-${i}`;
                const start = i * batchSize + 1;
                const end = Math.min((i + 1) * batchSize, total);
                div.innerHTML = `
                    <span>批次 ${i + 1}: 第${start}-${end}颗</span>
                    <span class="status pending">等待中</span>
                `;
                batchList.appendChild(div);
            }

            for (let i = 0; i < totalBatches; i++) {
                if (cancelled) {
                    progressText.textContent = '已取消导出';
                    break;
                }

                const itemEl = document.getElementById(`batch-item-${i}`);
                const statusEl = itemEl.querySelector('.status');
                statusEl.className = 'status downloading';
                statusEl.textContent = '下载中';

                const offset = i * batchSize;
                const includeHeader = i === 0;
                const csvRes = await fetch(
                    `/api/stars/csv?year=${year}&offset=${offset}&limit=${batchSize}&header=${includeHeader ? '1' : '0'}`
                );
                const csvText = await csvRes.text();
                allCsvParts.push(csvText);

                statusEl.className = 'status done';
                statusEl.textContent = '完成';

                const progress = ((i + 1) / totalBatches * 100).toFixed(0);
                progressFill.style.width = progress + '%';
                progressText.textContent = `已完成 ${i + 1}/${totalBatches} 批次 (${progress}%)`;

                batchList.scrollTop = batchList.scrollHeight;
            }

            if (!cancelled) {
                progressFill.style.width = '100%';
                progressText.textContent = `全部完成！共 ${total} 颗恒星，${totalBatches} 个批次`;
                downloadAllBtn.disabled = false;

                const mergedCsv = allCsvParts.join('\n');
                const blob = new Blob([mergedCsv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                downloadAllBtn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `star_catalog_${year}_full.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
            }
        } catch (error) {
            console.error('Error exporting CSV:', error);
            progressText.textContent = '导出失败: ' + error.message;
        }

        cancelBtn.removeEventListener('click', onCancel);

        if (cancelled) {
            setTimeout(() => modal.classList.remove('visible'), 1500);
        }
    }

    setupEventListeners() {
        document.getElementById('year-select').addEventListener('change', (e) => {
            this.updateYear(parseInt(e.target.value));
        });

        document.getElementById('projection-select').addEventListener('change', (e) => {
            this.switchProjection(e.target.value);
        });

        let searchTimeout;
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchStars(e.target.value);
            }, 300);
        });

        document.getElementById('search-input').addEventListener('blur', () => {
            setTimeout(() => {
                document.getElementById('search-results').classList.remove('visible');
            }, 200);
        });

        document.getElementById('show-constellations').addEventListener('change', (e) => {
            this.showConstellations = e.target.checked;
            this.renderConstellations();
            if (this.projectionMode === 'mercator') {
                this.renderMercatorProjection();
            }
        });

        document.getElementById('show-labels').addEventListener('change', (e) => {
            this.showLabels = e.target.checked;
            this.renderAncientLayer();
            this.renderConstellations();
            if (this.projectionMode === 'mercator') {
                this.renderMercatorProjection();
            }
        });

        document.getElementById('show-layer-background').addEventListener('change', (e) => {
            this.setLayerVisibility('background', e.target.checked);
        });

        document.getElementById('show-layer-ancient').addEventListener('change', (e) => {
            this.setLayerVisibility('ancient', e.target.checked);
        });

        document.getElementById('show-layer-modern').addEventListener('change', (e) => {
            this.setLayerVisibility('modern', e.target.checked);
        });

        document.getElementById('reset-view').addEventListener('click', () => {
            this.camera.position.set(0, 0, 150);
            this.camera.lookAt(0, 0, 0);
            this.controls.reset();
            this.clearHighlight();
            document.getElementById('info-panel').classList.remove('visible');
        });

        document.getElementById('export-csv').addEventListener('click', () => {
            this.exportCSV();
        });

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        this.renderer.domElement.addEventListener('click', (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);

            const ancientChildren = this.layerGroups.ancient.children.filter(
                c => c.userData.index !== undefined && !c.userData.isGlow && !c.userData.isLabel
            );
            const intersects = raycaster.intersectObjects(ancientChildren);

            if (intersects.length > 0) {
                const mesh = intersects[0].object;
                if (mesh.userData.index !== undefined) {
                    this.highlightStar(mesh.userData.index);
                }
            }
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);

            const ancientChildren = this.layerGroups.ancient.children.filter(
                c => c.userData.index !== undefined && !c.userData.isGlow && !c.userData.isLabel
            );
            const intersects = raycaster.intersectObjects(ancientChildren);

            this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
        });
    }

    onWindowResize() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        if (this.projectionMode === 'mercator') {
            this.renderMercatorProjection();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StarCatalogApp();
});
