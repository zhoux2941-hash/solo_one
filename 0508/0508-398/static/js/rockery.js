let scene, camera, renderer, rockeryGroup;
let isWireframe = false;
let isAutoRotating = false;
let animationId;
let audioContext = null;
let noiseNode = null;
let gainNode = null;
let filterNode = null;
let isPlaying = false;

const stoneColors = {
    hushi: { color: 0xc4b7a8, roughness: 0.8, detail: 0.6 },
    huangshi: { color: 0x8b7355, roughness: 0.9, detail: 0.3 },
    qingshi: { color: 0x6b7b8c, roughness: 0.7, detail: 0.4 }
};

const stoneDescriptions = {
    hushi: '湖石：太湖石，又名窟窿石，以造型取胜，具有瘦、皱、漏、透的特点',
    huangshi: '黄石：质地坚硬，棱角分明，色泽沉稳，多用于大型假山堆叠',
    qingshi: '青石：质地细腻，色泽青灰，常用于园林叠山和步道铺设'
};

const stonePorosity = {
    hushi: 0.65,
    huangshi: 0.45,
    qingshi: 0.40
};

const revetmentConfig = {
    taihu_revetment: {
        name: '太湖石驳岸',
        description: '瘦皱漏透，曲岸回环，以湖石错落叠砌，石间留有水口洞穴，尽显江南水乡韵味',
        color: 0xc4b7a8,
        roughness: 0.8,
        stonePricePerM: 850,
        heightRatio: 0.6,
        stoneCountPerMeter: 4,
        geometryType: 'dodecahedron'
    },
    huangshi_revetment: {
        name: '黄石驳岸',
        description: '棱角分明，刚劲有力，以黄石整块叠压，层层收分，体现北方园林雄浑气势',
        color: 0x8b7355,
        roughness: 0.9,
        stonePricePerM: 620,
        heightRatio: 0.7,
        stoneCountPerMeter: 3,
        geometryType: 'box'
    },
    natural_slope: {
        name: '自然土坡',
        description: '草坡入水，野趣天然，以土方塑形，植草护坡，营造自然湿地景观',
        color: 0x5a7a3a,
        roughness: 1.0,
        stonePricePerM: 180,
        heightRatio: 0.35,
        stoneCountPerMeter: 0,
        geometryType: 'slope'
    }
};

let currentResult = null;
let currentSpectrum = null;
let stonesData = [];

document.addEventListener('DOMContentLoaded', function() {
    initThreeJS();
    bindEvents();
    generateRockery();
    loadStones();
});

function loadStones() {
    fetch('/api/stones')
        .then(res => res.json())
        .then(stones => {
            stonesData = stones;
            const select = document.getElementById('stoneType');
            select.innerHTML = '';
            stones.forEach(stone => {
                const option = document.createElement('option');
                option.value = stone.stone_type;
                option.textContent = `${stone.name} - ${stone.description.substring(0, 20)}...`;
                select.appendChild(option);
                stonePorosity[stone.stone_type] = stone.porosity;
            });
            console.log('从SQLite加载石料孔隙率:', stonePorosity);
            generateRockery();
        })
        .catch(err => console.error('加载石料列表失败:', err));
}

function initThreeJS() {
    const container = document.getElementById('threejs-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 50);

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(12, 8, 12);
    camera.lookAt(0, 2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4a7c59,
        roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    const waterGeometry = new THREE.PlaneGeometry(8, 6);
    const waterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4da6ff,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.1
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(4, 0.01, -2);
    water.receiveShadow = true;
    scene.add(water);

    rockeryGroup = new THREE.Group();
    scene.add(rockeryGroup);

    initControls();
    animate();
    window.addEventListener('resize', onWindowResize);
}

function initControls() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };

    const container = document.getElementById('threejs-container');

    container.addEventListener('mousedown', function(e) {
        isDragging = true;
        isAutoRotating = false;
        document.getElementById('autoRotateBtn').textContent = '自动旋转';
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    container.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        targetRotation.y += deltaX * 0.01;
        targetRotation.x += deltaY * 0.01;
        targetRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotation.x));
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    container.addEventListener('mouseup', function() {
        isDragging = false;
    });

    container.addEventListener('mouseleave', function() {
        isDragging = false;
    });

    container.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY * 0.01;
        camera.position.multiplyScalar(1 + delta * 0.1);
        camera.position.clampLength(5, 40);
    });

    function updateCameraRotation() {
        currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
        currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;

        const radius = camera.position.length();
        camera.position.x = radius * Math.sin(currentRotation.y) * Math.cos(currentRotation.x);
        camera.position.y = radius * Math.sin(currentRotation.x) + 5;
        camera.position.z = radius * Math.cos(currentRotation.y) * Math.cos(currentRotation.x);
        camera.lookAt(0, 2, 0);
    }

    function animateControls() {
        if (!isAutoRotating) {
            updateCameraRotation();
        }
        requestAnimationFrame(animateControls);
    }
    animateControls();
}

function generateRockery() {
    const stoneType = document.getElementById('stoneType').value;
    const area = parseFloat(document.getElementById('area').value) || 20;
    const height = parseFloat(document.getElementById('height').value) || 3;
    const stoneStyle = stoneColors[stoneType];
    const porosity = stonePorosity[stoneType] || 0.5;

    rockeryGroup.clear();

    const scale = Math.sqrt(area) / 5;
    const heightScale = height / 3;

    const densityFactor = (1 - porosity) / 0.6;
    const numStones = Math.floor((area * 0.8 + height * 5) * (0.5 + densityFactor * 0.5));

    const stoneSizeBase = 0.3 + (porosity - 0.4) * 1.5;

    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: stoneStyle.color,
        roughness: stoneStyle.roughness,
        metalness: 0.1
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: stoneStyle.color,
        wireframe: true
    });

    const positions = [];
    const usedPositions = new Set();

    const positionGridScale = 0.5 + porosity * 2.5;

    function getPositionKey(x, z) {
        return `${Math.floor(x * positionGridScale)}_${Math.floor(z * positionGridScale)}`;
    }

    for (let i = 0; i < numStones; i++) {
        let x, z, attempts = 0;
        do {
            x = (Math.random() - 0.5) * 8 * scale;
            z = (Math.random() - 0.5) * 6 * scale;
            attempts++;
        } while (usedPositions.has(getPositionKey(x, z)) && attempts < 20);
        
        usedPositions.add(getPositionKey(x, z));

        const distFromCenter = Math.sqrt(x * x + z * z);
        const maxDist = 5 * scale;
        const heightFactor = Math.max(0, 1 - distFromCenter / maxDist);
        
        const y = Math.pow(heightFactor, 1.5) * heightScale * 4 * Math.random() + heightFactor * 0.5;

        const stoneSize = stoneSizeBase + Math.random() * 0.8 + heightFactor * 0.5;
        const width = stoneSize * (0.8 + Math.random() * 0.4);
        const depth = stoneSize * (0.8 + Math.random() * 0.4);
        const stoneHeight = stoneSize * (1 + Math.random() * 0.5);

        let geometry;
        if (stoneType === 'hushi') {
            geometry = createLakeStoneGeometry(width, stoneHeight, depth);
        } else if (stoneType === 'huangshi') {
            geometry = createYellowStoneGeometry(width, stoneHeight, depth);
        } else {
            geometry = createBlueStoneGeometry(width, stoneHeight, depth);
        }

        const material = isWireframe ? wireframeMaterial : stoneMaterial;
        const stone = new THREE.Mesh(geometry, material);
        stone.position.set(x, y + stoneHeight / 2, z);
        stone.rotation.y = Math.random() * Math.PI * 2;
        stone.rotation.x = (Math.random() - 0.5) * 0.3;
        stone.rotation.z = (Math.random() - 0.5) * 0.3;
        stone.castShadow = true;
        stone.receiveShadow = true;
        
        rockeryGroup.add(stone);
        positions.push({ x, y, z, stone });
    }

    addPlatforms(positions, isWireframe ? wireframeMaterial : stoneMaterial, scale, heightScale);
    addWaterfall(scale, heightScale);
    addRevetment(scale);

    console.log(`生成假山: ${stoneType}, 孔隙率=${porosity}, 石块数量=${numStones}, 密度系数=${densityFactor.toFixed(2)}`);
}

function createLakeStoneGeometry(w, h, d) {
    const geometry = new THREE.DodecahedronGeometry(1, 1);
    geometry.scale(w * 0.6, h * 0.6, d * 0.6);
    
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        const noise = (Math.random() - 0.5) * 0.3;
        positions.setX(i, x + x * noise);
        positions.setY(i, y + y * noise);
        positions.setZ(i, z + z * noise);
    }
    
    geometry.computeVertexNormals();
    return geometry;
}

function createYellowStoneGeometry(w, h, d) {
    const geometry = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
    
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        const noise = (Math.random() - 0.5) * 0.15;
        positions.setX(i, x + Math.sign(x) * noise * w);
        positions.setY(i, y + Math.sign(y) * noise * h);
        positions.setZ(i, z + Math.sign(z) * noise * d);
    }
    
    geometry.computeVertexNormals();
    return geometry;
}

function createBlueStoneGeometry(w, h, d) {
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    geometry.scale(w * 0.55, h * 0.65, d * 0.55);
    
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        const noise = (Math.random() - 0.5) * 0.2;
        positions.setX(i, x + x * noise);
        positions.setY(i, y + y * noise * 0.5);
        positions.setZ(i, z + z * noise);
    }
    
    geometry.computeVertexNormals();
    return geometry;
}

function addPlatforms(stones, material, scale, heightScale) {
    const sortedStones = [...stones].sort((a, b) => b.y - a.y);
    
    if (sortedStones.length > 3) {
        for (let i = 0; i < 2; i++) {
            const stone = sortedStones[i];
            const platformGeo = new THREE.CylinderGeometry(0.8 * scale, 1 * scale, 0.15, 8);
            const platform = new THREE.Mesh(platformGeo, material);
            platform.position.set(
                stone.x + (Math.random() - 0.5) * scale,
                stone.y + 0.3,
                stone.z + (Math.random() - 0.5) * scale
            );
            platform.castShadow = true;
            platform.receiveShadow = true;
            rockeryGroup.add(platform);
        }
    }
}

function addWaterfall(scale, heightScale) {
    const waterfallGroup = new THREE.Group();
    
    const topPoolGeo = new THREE.BoxGeometry(2 * scale, 0.2, 1.5 * scale);
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x4da6ff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1
    });
    const topPool = new THREE.Mesh(topPoolGeo, waterMat);
    topPool.position.set(-1.5 * scale, 2.5 * heightScale, 0);
    topPool.castShadow = true;
    waterfallGroup.add(topPool);
    
    const fallHeight = 2.5 * heightScale;
    const waterfallGeo = new THREE.PlaneGeometry(1.5 * scale, fallHeight, 10, 20);
    const waterfallMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const waterfall = new THREE.Mesh(waterfallGeo, waterfallMat);
    waterfall.position.set(-1.5 * scale, 2.5 * heightScale - fallHeight / 2, 0);
    waterfall.rotation.y = Math.PI / 6;
    waterfallGroup.add(waterfall);
    
    rockeryGroup.add(waterfallGroup);
}

function addRevetment(scale) {
    const revetmentType = document.getElementById('revetmentType').value;
    const config = revetmentConfig[revetmentType];
    const revetmentGroup = new THREE.Group();

    const waterCenterX = 4;
    const waterCenterZ = -2;
    const waterHalfW = 4;
    const waterHalfD = 3;
    const bankHeight = config.heightRatio;
    const bankWidth = 0.8 * scale;

    const revetmentMaterial = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: config.roughness,
        metalness: 0.05
    });

    const wireframeMat = new THREE.MeshBasicMaterial({
        color: config.color,
        wireframe: true
    });

    const mat = isWireframe ? wireframeMat : revetmentMaterial;

    if (config.geometryType === 'slope') {
        addNaturalSlopeRevetment(revetmentGroup, mat, waterCenterX, waterCenterZ, waterHalfW, waterHalfD, bankHeight, bankWidth, scale);
    } else {
        addStoneRevetment(revetmentGroup, mat, config, waterCenterX, waterCenterZ, waterHalfW, waterHalfD, bankHeight, bankWidth, scale);
    }

    rockeryGroup.add(revetmentGroup);
}

function addStoneRevetment(group, mat, config, cx, cz, hw, hd, bh, bw, scale) {
    const perimeter = 2 * (hw * 2 + hd * 2);
    const totalStones = Math.floor(perimeter * config.stoneCountPerMeter);

    const segments = generateRevetmentPath(cx, cz, hw, hd, totalStones);

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];

        const layers = Math.ceil(bh / 0.3) + 1;
        for (let layer = 0; layer < layers; layer++) {
            const layerY = layer * 0.25 * scale;
            const layerOffset = layer * 0.05 * scale;

            const stoneW = (0.3 + Math.random() * 0.5) * scale;
            const stoneH = (0.2 + Math.random() * 0.15) * scale;
            const stoneD = (0.25 + Math.random() * 0.3) * scale;

            let geometry;
            if (config.geometryType === 'dodecahedron') {
                geometry = createRevetmentLakeStone(stoneW, stoneH, stoneD);
            } else {
                geometry = createRevetmentYellowStone(stoneW, stoneH, stoneD);
            }

            const stone = new THREE.Mesh(geometry, mat);
            const outwardOffset = bw / 2 + layerOffset;
            stone.position.set(
                seg.x + seg.nx * outwardOffset + (Math.random() - 0.5) * 0.1 * scale,
                layerY,
                seg.z + seg.nz * outwardOffset + (Math.random() - 0.5) * 0.1 * scale
            );
            stone.rotation.y = seg.angle + (Math.random() - 0.5) * 0.4;
            stone.rotation.x = (Math.random() - 0.5) * 0.15;
            stone.rotation.z = (Math.random() - 0.5) * 0.1;
            stone.castShadow = true;
            stone.receiveShadow = true;
            group.add(stone);
        }
    }

    const footingGeom = new THREE.BoxGeometry(hw * 2.4, 0.1, bw * 1.2);
    const footing = new THREE.Mesh(footingGeom, mat);
    footing.position.set(cx, -0.05, cz - hd);
    footing.receiveShadow = true;
    group.add(footing);

    const footingGeom2 = new THREE.BoxGeometry(hw * 2.4, 0.1, bw * 1.2);
    const footing2 = new THREE.Mesh(footingGeom2, mat);
    footing2.position.set(cx, -0.05, cz + hd);
    footing2.receiveShadow = true;
    group.add(footing2);

    const footingGeom3 = new THREE.BoxGeometry(bw * 1.2, 0.1, hd * 2.4);
    const footing3 = new THREE.Mesh(footingGeom3, mat);
    footing3.position.set(cx - hw, -0.05, cz);
    footing3.receiveShadow = true;
    group.add(footing3);

    const footingGeom4 = new THREE.BoxGeometry(bw * 1.2, 0.1, hd * 2.4);
    const footing4 = new THREE.Mesh(footingGeom4, mat);
    footing4.position.set(cx + hw, -0.05, cz);
    footing4.receiveShadow = true;
    group.add(footing4);
}

function addNaturalSlopeRevetment(group, mat, cx, cz, hw, hd, bh, bw, scale) {
    const slopeMat = new THREE.MeshStandardMaterial({
        color: 0x5a7a3a,
        roughness: 1.0,
        metalness: 0.0
    });

    if (isWireframe) {
        slopeMat = new THREE.MeshBasicMaterial({ color: 0x5a7a3a, wireframe: true });
    }

    const slopeWidth = bw * 2.5;
    const slopeDepth = 0.3 * scale;
    const numSegments = 40;

    for (let side = 0; side < 4; side++) {
        for (let i = 0; i < numSegments; i++) {
            const t = i / numSegments;
            let x, z, rotY;

            if (side === 0) {
                x = cx - hw + t * hw * 2;
                z = cz - hd;
                rotY = 0;
            } else if (side === 1) {
                x = cx - hw + t * hw * 2;
                z = cz + hd;
                rotY = Math.PI;
            } else if (side === 2) {
                x = cx - hw;
                z = cz - hd + t * hd * 2;
                rotY = Math.PI / 2;
            } else {
                x = cx + hw;
                z = cz - hd + t * hd * 2;
                rotY = -Math.PI / 2;
            }

            const slopeGeo = new THREE.BoxGeometry(slopeDepth, bh * scale * 0.5, slopeWidth / numSegments * 1.1);
            const slope = new THREE.Mesh(slopeGeo, slopeMat);
            slope.position.set(x, bh * scale * 0.25, z);
            slope.rotation.y = rotY;
            slope.rotation.x = -0.4;
            slope.receiveShadow = true;
            slope.castShadow = true;
            group.add(slope);
        }
    }

    const grassColor = 0x4a8c2a;
    const grassMat = new THREE.MeshStandardMaterial({
        color: grassColor,
        roughness: 1.0
    });
    if (isWireframe) {
        grassMat = new THREE.MeshBasicMaterial({ color: grassColor, wireframe: true });
    }

    for (let i = 0; i < 60; i++) {
        const side = Math.floor(Math.random() * 4);
        let x, z;
        if (side === 0) { x = cx - hw + Math.random() * hw * 2; z = cz - hd - Math.random() * bw * 1.5; }
        else if (side === 1) { x = cx - hw + Math.random() * hw * 2; z = cz + hd + Math.random() * bw * 1.5; }
        else if (side === 2) { x = cx - hw - Math.random() * bw * 1.5; z = cz - hd + Math.random() * hd * 2; }
        else { x = cx + hw + Math.random() * bw * 1.5; z = cz - hd + Math.random() * hd * 2; }

        const grassH = 0.1 + Math.random() * 0.2;
        const grassGeo = new THREE.ConeGeometry(0.05 * scale, grassH * scale, 4);
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.position.set(x, grassH * scale * 0.5, z);
        group.add(grass);
    }

    for (let i = 0; i < 12; i++) {
        const side = Math.floor(Math.random() * 4);
        let x, z;
        if (side === 0) { x = cx - hw + Math.random() * hw * 2; z = cz - hd - Math.random() * bw * 1.2; }
        else if (side === 1) { x = cx - hw + Math.random() * hw * 2; z = cz + hd + Math.random() * bw * 1.2; }
        else if (side === 2) { x = cx - hw - Math.random() * bw * 1.2; z = cz - hd + Math.random() * hd * 2; }
        else { x = cx + hw + Math.random() * bw * 1.2; z = cz - hd + Math.random() * hd * 2; }

        const bushGeo = new THREE.SphereGeometry((0.15 + Math.random() * 0.2) * scale, 6, 5);
        const bush = new THREE.Mesh(bushGeo, grassMat);
        bush.position.set(x, 0.15 * scale, z);
        bush.castShadow = true;
        group.add(bush);
    }
}

function generateRevetmentPath(cx, cz, hw, hd, count) {
    const points = [];
    const perimeter = 2 * (hw * 2 + hd * 2);
    const corners = [
        { x: cx - hw, z: cz - hd },
        { x: cx + hw, z: cz - hd },
        { x: cx + hw, z: cz + hd },
        { x: cx - hw, z: cz + hd }
    ];

    for (let i = 0; i < count; i++) {
        const dist = (i / count) * perimeter;
        let x, z, angle, nx, nz;

        if (dist < hw * 2) {
            const t = dist / (hw * 2);
            x = corners[0].x + t * (corners[1].x - corners[0].x);
            z = corners[0].z;
            angle = 0;
            nx = 0; nz = -1;
        } else if (dist < hw * 2 + hd * 2) {
            const t = (dist - hw * 2) / (hd * 2);
            x = corners[1].x;
            z = corners[1].z + t * (corners[2].z - corners[1].z);
            angle = Math.PI / 2;
            nx = 1; nz = 0;
        } else if (dist < hw * 2 + hd * 2 + hw * 2) {
            const t = (dist - hw * 2 - hd * 2) / (hw * 2);
            x = corners[2].x + t * (corners[3].x - corners[2].x);
            z = corners[2].z;
            angle = Math.PI;
            nx = 0; nz = 1;
        } else {
            const t = (dist - hw * 2 - hd * 2 - hw * 2) / (hd * 2);
            x = corners[3].x;
            z = corners[3].z + t * (corners[0].z - corners[3].z);
            angle = -Math.PI / 2;
            nx = -1; nz = 0;
        }

        points.push({ x, z, angle, nx, nz });
    }
    return points;
}

function createRevetmentLakeStone(w, h, d) {
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    geometry.scale(w * 0.5, h * 0.5, d * 0.5);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const noise = (Math.random() - 0.5) * 0.25;
        positions.setX(i, x + x * noise);
        positions.setY(i, y + y * noise);
        positions.setZ(i, z + z * noise);
    }
    geometry.computeVertexNormals();
    return geometry;
}

function createRevetmentYellowStone(w, h, d) {
    const geometry = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const noise = (Math.random() - 0.5) * 0.12;
        positions.setX(i, x + Math.sign(x) * noise * w);
        positions.setY(i, y + Math.sign(y) * noise * h);
        positions.setZ(i, z + Math.sign(z) * noise * d);
    }
    geometry.computeVertexNormals();
    return geometry;
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (isAutoRotating) {
        rockeryGroup.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('threejs-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function bindEvents() {
    document.getElementById('calculateBtn').addEventListener('click', calculateRockery);
    document.getElementById('stoneType').addEventListener('change', function() {
        const type = this.value;
        document.getElementById('stoneDescription').textContent = stoneDescriptions[type];
        generateRockery();
    });
    
    document.getElementById('revetmentType').addEventListener('change', function() {
        generateRockery();
    });
    
    document.getElementById('regenerateBtn').addEventListener('click', generateRockery);
    
    document.getElementById('toggleWireframeBtn').addEventListener('click', function() {
        isWireframe = !isWireframe;
        this.textContent = isWireframe ? '实体模式' : '线框模式';
        generateRockery();
    });
    
    document.getElementById('autoRotateBtn').addEventListener('click', function() {
        isAutoRotating = !isAutoRotating;
        this.textContent = isAutoRotating ? '停止旋转' : '自动旋转';
    });
    
    document.getElementById('shapeFactor').addEventListener('input', function() {
        document.getElementById('shapeFactorValue').textContent = parseFloat(this.value).toFixed(1);
    });
    
    document.getElementById('flowRate').addEventListener('input', function() {
        document.getElementById('flowRateValue').textContent = parseFloat(this.value).toFixed(1);
    });
    
    document.getElementById('dropHeight').addEventListener('input', function() {
        document.getElementById('dropHeightValue').textContent = parseFloat(this.value).toFixed(1);
    });
    
    document.getElementById('calcSpectrumBtn').addEventListener('click', calculateSpectrum);
    document.getElementById('playSoundBtn').addEventListener('click', toggleSound);
    document.getElementById('stopSoundBtn').addEventListener('click', stopSound);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
}

function calculateRockery() {
    const stoneType = document.getElementById('stoneType').value;
    const area = parseFloat(document.getElementById('area').value);
    const height = parseFloat(document.getElementById('height').value);
    const shapeFactor = parseFloat(document.getElementById('shapeFactor').value);
    
    if (!area || !height || area <= 0 || height <= 0) {
        alert('请输入有效的面积和高度');
        return;
    }
    
    fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            stone_type: stoneType, 
            area, 
            height, 
            revetment_type: document.getElementById('revetmentType').value,
            shape_factor: shapeFactor
        })
    })
    .then(res => res.json())
    .then(data => {
        currentResult = data;
        displayResults(data);
        generateRockery();
    })
    .catch(err => {
        console.error('计算失败:', err);
        alert('计算失败，请重试');
    });
}

function displayResults(data) {
    document.getElementById('resultCard').style.display = 'block';
    
    document.getElementById('calculationMethod').textContent = data.calculation.formula;
    document.getElementById('formulaDetail').textContent = data.calculation.formula_detail;
    
    if (data.calculation.comparison) {
        document.getElementById('comparisonBox').style.display = 'block';
        document.getElementById('simpleVolume').textContent = data.calculation.comparison.simple_method_volume;
        document.getElementById('integrationVolume').textContent = data.calculation.comparison.integration_method_volume;
        const diff = data.calculation.comparison.difference_percent;
        const diffEl = document.getElementById('volumeDiff');
        diffEl.textContent = (diff > 0 ? '+' : '') + diff + '%';
        diffEl.style.color = Math.abs(diff) < 5 ? '#27ae60' : '#e67e22';
    } else {
        document.getElementById('comparisonBox').style.display = 'none';
    }
    
    document.getElementById('solidVolume').textContent = data.calculation.solid_volume + ' m³';
    document.getElementById('grossVolume').textContent = data.calculation.gross_volume + ' m³';
    document.getElementById('stoneWeight').textContent = data.calculation.stone_weight + ' kg';
    document.getElementById('porosity').textContent = data.calculation.porosity;
    
    document.getElementById('pricePerCubic').textContent = data.cost.price_per_cubic + ' 元/m³';
    document.getElementById('materialCost').textContent = data.cost.material_cost.toLocaleString() + ' 元';
    document.getElementById('laborCost').textContent = data.cost.labor_cost.toLocaleString() + ' 元';
    document.getElementById('transportCost').textContent = data.cost.transportation_cost.toLocaleString() + ' 元';
    document.getElementById('totalCost').textContent = data.cost.total_cost.toLocaleString() + ' 元';

    if (data.revetment) {
        document.getElementById('revetmentSection').style.display = 'block';
        document.getElementById('revetmentName').textContent = data.revetment.name;
        document.getElementById('revetmentLength').textContent = data.revetment.length + ' m';
        document.getElementById('revetmentVolume').textContent = data.revetment.volume + ' m³';
        document.getElementById('revetmentCost').textContent = data.revetment.cost.toLocaleString() + ' 元';
    } else {
        document.getElementById('revetmentSection').style.display = 'none';
    }
}

function calculateSpectrum() {
    const flowRate = parseFloat(document.getElementById('flowRate').value);
    const dropHeight = parseFloat(document.getElementById('dropHeight').value);
    
    fetch('/api/waterfall/spectrum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_rate: flowRate, drop_height: dropHeight })
    })
    .then(res => res.json())
    .then(data => {
        currentSpectrum = data;
        displaySpectrum(data);
    })
    .catch(err => {
        console.error('频谱计算失败:', err);
        alert('频谱计算失败，请重试');
    });
}

function displaySpectrum(data) {
    document.getElementById('spectrumCard').style.display = 'block';
    
    const bands = data.bands;
    
    setTimeout(() => {
        document.getElementById('barLow').style.height = bands[0].energy_ratio + '%';
        document.getElementById('barMid').style.height = bands[1].energy_ratio + '%';
        document.getElementById('barHigh').style.height = bands[2].energy_ratio + '%';
    }, 100);
    
    document.getElementById('barLowValue').textContent = bands[0].energy_ratio + '%';
    document.getElementById('barMidValue').textContent = bands[1].energy_ratio + '%';
    document.getElementById('barHighValue').textContent = bands[2].energy_ratio + '%';
    
    document.getElementById('impactVelocity').textContent = data.spectrum.impact_velocity;
    document.getElementById('totalSpl').textContent = data.spectrum.total_spl;
    document.getElementById('centerFreq').textContent = data.spectrum.center_frequency;
}

function toggleSound() {
    if (isPlaying) {
        stopSound();
    } else {
        playWaterfallSound();
    }
}

function playWaterfallSound() {
    const flowRate = parseFloat(document.getElementById('flowRate').value);
    const dropHeight = parseFloat(document.getElementById('dropHeight').value);
    
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    stopSound();
    
    const lowFreqRatio = 0.35 + 0.25 * (flowRate / 10.0) + 0.15 * (dropHeight / 10.0);
    const cutoffFreq = 250 + (1 - lowFreqRatio) * 1500;
    const volume = 0.1 + (flowRate / 20) * 0.3;
    
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    noiseNode = audioContext.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(cutoffFreq, audioContext.currentTime);
    filterNode.Q.setValueAtTime(0.5, audioContext.currentTime);
    
    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.5);
    
    const lowGain = audioContext.createGain();
    lowGain.gain.setValueAtTime(lowFreqRatio * 1.5, audioContext.currentTime);
    
    const midGain = audioContext.createGain();
    midGain.gain.setValueAtTime((1 - lowFreqRatio) * 0.8, audioContext.currentTime);
    
    const lowFilter = audioContext.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(250, audioContext.currentTime);
    
    const midFilter = audioContext.createBiquadFilter();
    midFilter.type = 'bandpass';
    midFilter.frequency.setValueAtTime(500, audioContext.currentTime);
    midFilter.Q.setValueAtTime(0.5, audioContext.currentTime);
    
    noiseNode.connect(filterNode);
    filterNode.connect(lowFilter);
    filterNode.connect(midFilter);
    lowFilter.connect(lowGain);
    midFilter.connect(midGain);
    lowGain.connect(gainNode);
    midGain.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    noiseNode.start();
    
    isPlaying = true;
    document.getElementById('playSoundBtn').style.display = 'none';
    document.getElementById('stopSoundBtn').style.display = 'inline-block';
}

function stopSound() {
    if (noiseNode) {
        if (gainNode) {
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        }
        setTimeout(() => {
            try {
                noiseNode.stop();
            } catch(e) {}
            noiseNode = null;
            filterNode = null;
            gainNode = null;
        }, 350);
    }
    
    isPlaying = false;
    document.getElementById('playSoundBtn').style.display = 'inline-block';
    document.getElementById('stopSoundBtn').style.display = 'none';
}

function exportPdf() {
    const stoneType = document.getElementById('stoneType').value;
    const area = parseFloat(document.getElementById('area').value) || 0;
    const height = parseFloat(document.getElementById('height').value) || 0;
    const flowRate = parseFloat(document.getElementById('flowRate').value) || 0;
    const dropHeight = parseFloat(document.getElementById('dropHeight').value) || 0;
    const shapeFactor = parseFloat(document.getElementById('shapeFactor').value) || 2.0;
    
    if (area <= 0 || height <= 0) {
        alert('请先计算假山参数');
        return;
    }
    
    fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            stone_type: stoneType,
            area,
            height,
            flow_rate: flowRate,
            drop_height: dropHeight,
            revetment_type: document.getElementById('revetmentType').value,
            shape_factor: shapeFactor
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('导出失败');
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `苏州园林假山设计方案_${stoneType}_${area}m².pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    })
    .catch(err => {
        console.error('PDF导出失败:', err);
        alert('PDF导出失败，请重试');
    });
}
