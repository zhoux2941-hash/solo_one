const API_BASE_URL = 'http://localhost:8080/api';

let calculationHistory = JSON.parse(localStorage.getItem('ballisticHistory') || '[]');

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    if (tabName === 'history') {
        loadHistory();
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateSlope() {
    const shooterLon = parseFloat(document.getElementById('shooterLon').value);
    const shooterLat = parseFloat(document.getElementById('shooterLat').value);
    const shooterAlt = parseFloat(document.getElementById('shooterAlt').value);
    const targetLon = parseFloat(document.getElementById('targetLon').value);
    const targetLat = parseFloat(document.getElementById('targetLat').value);
    const targetAlt = parseFloat(document.getElementById('targetAlt').value);
    const terrainSlope = parseFloat(document.getElementById('terrainSlope').value);

    if (isNaN(shooterLon) || isNaN(shooterLat) || isNaN(targetLon) || isNaN(targetLat)) {
        alert('请输入完整的坐标信息');
        return;
    }

    const horizontalDist = calculateDistance(shooterLat, shooterLon, targetLat, targetLon);
    const altitudeDiff = targetAlt - shooterAlt;
    const straightDist = Math.sqrt(horizontalDist * horizontalDist + altitudeDiff * altitudeDiff);
    const shootAngle = Math.atan2(altitudeDiff, horizontalDist) * 180 / Math.PI;

    document.getElementById('horizontalDist').textContent = horizontalDist.toFixed(2);
    document.getElementById('altitudeDiff').textContent = altitudeDiff.toFixed(2);
    document.getElementById('straightDist').textContent = straightDist.toFixed(2);
    document.getElementById('shootAngle').textContent = shootAngle.toFixed(2);
    
    document.getElementById('slopeResult').style.display = 'block';
    
    document.getElementById('shootDistance').value = Math.round(straightDist);
}

function saveSlopeData() {
    const data = {
        timestamp: new Date().toISOString(),
        type: 'slope',
        shooterLon: document.getElementById('shooterLon').value,
        shooterLat: document.getElementById('shooterLat').value,
        shooterAlt: document.getElementById('shooterAlt').value,
        targetLon: document.getElementById('targetLon').value,
        targetLat: document.getElementById('targetLat').value,
        targetAlt: document.getElementById('targetAlt').value,
        terrainSlope: document.getElementById('terrainSlope').value,
        shootDirection: document.getElementById('shootDirection').value
    };
    
    calculationHistory.push(data);
    localStorage.setItem('ballisticHistory', JSON.stringify(calculationHistory));
    alert('坡度数据已保存！');
}

function calculateDistance() {
    const method = document.getElementById('measureMethod').value;
    let result = {};
    
    if (method === 'laser') {
        const laserDist = parseFloat(document.getElementById('laserDistance').value) || 0;
        const angle = parseFloat(document.getElementById('rangefinderAngle').value) || 0;
        const angleRad = angle * Math.PI / 180;
        
        result.horizontalDistance = laserDist * Math.cos(angleRad);
        result.verticalDistance = laserDist * Math.sin(angleRad);
        result.straightDistance = laserDist;
    } else {
        result.message = '请使用坐标计算或手动输入方式';
    }
    
    console.log('测距结果:', result);
    alert('测距计算完成，请查看控制台');
}

function calibrateSensor() {
    alert('传感器校准功能模拟执行中...');
}

const AMMO_DATA = {
    '7.62x51': { velocity: 835, mass: 10.9, bc: 0.4, drag: 0.295 },
    '5.56x45': { velocity: 945, mass: 4.02, bc: 0.304, drag: 0.29 },
    '.338': { velocity: 880, mass: 16.2, bc: 0.675, drag: 0.27 },
    '.50BMG': { velocity: 850, mass: 42.0, bc: 1.05, drag: 0.25 }
};

function calculateBallisticTrajectory(params) {
    const { velocity, mass, bc, distance, angle, windSpeed, windDir, altitude, temperature, pressure } = params;
    
    const g = 9.81;
    const rho0 = 1.225;
    const tempFactor = (273.15 + 15) / (273.15 + (temperature || 15));
    const pressFactor = (pressure || 1013) / 1013;
    const altitudeFactor = Math.exp(-(altitude || 0) / 8500);
    const rho = rho0 * tempFactor * pressFactor * altitudeFactor;
    
    const bulletArea = Math.PI * Math.pow(0.00356, 2) / 4;
    const Cd = 0.295;
    
    const angleRad = (angle || 0) * Math.PI / 180;
    let vx = velocity * Math.cos(angleRad);
    let vy = velocity * Math.sin(angleRad);
    let x = 0;
    let y = 0;
    let t = 0;
    const dt = 0.001;
    
    const windAngleRad = (windDir || 0) * Math.PI / 180;
    const windX = (windSpeed || 0) * Math.cos(windAngleRad);
    const windZ = (windSpeed || 0) * Math.sin(windAngleRad);
    
    let z = 0;
    const trajectory = [];
    
    while (x < distance) {
        const vRelativeX = vx - windX;
        const vRelativeZ = z - windZ * t;
        const vMag = Math.sqrt(vRelativeX * vRelativeX + vy * vy);
        
        if (vMag > 0) {
            const dragForce = 0.5 * rho * vMag * vMag * Cd * bulletArea;
            const ax = -(dragForce / (mass / 1000)) * (vRelativeX / vMag);
            const ay = -g - (dragForce / (mass / 1000)) * (vy / vMag);
            
            vx += ax * dt;
            vy += ay * dt;
        }
        
        x += vx * dt;
        y += vy * dt;
        z += windZ * dt * 0.3;
        t += dt;
        
        if (Math.floor(x) % 10 === 0 && trajectory.length < 100) {
            trajectory.push({ x: x, y: y, z: z, vx: vx, vy: vy, t: t });
        }
    }
    
    const finalVelocity = Math.sqrt(vx * vx + vy * vy);
    const finalEnergy = 0.5 * (mass / 1000) * finalVelocity * finalVelocity;
    
    return {
        flightTime: t,
        dropAmount: -y * 100,
        windageAmount: Math.abs(z) * 100,
        remainingVelocity: finalVelocity,
        remainingEnergy: finalEnergy,
        trajectory: trajectory
    };
}

function metersToMOA(cm, distanceM) {
    const inches = cm / 2.54;
    const yards = distanceM * 1.09361;
    return (inches / yards) * 100 / 1.047;
}

function calculateDrop() {
    const ammoType = document.getElementById('ammoType').value;
    let velocity = parseFloat(document.getElementById('muzzleVelocity').value);
    let mass = parseFloat(document.getElementById('bulletMass').value);
    let bc = parseFloat(document.getElementById('ballisticCoeff').value);
    const distance = parseFloat(document.getElementById('shootDistance').value);
    const windSpeed = parseFloat(document.getElementById('windSpeed').value);
    const windDir = parseFloat(document.getElementById('windDirection').value);

    if (isNaN(distance)) {
        alert('请输入射击距离');
        return;
    }

    if (ammoType !== 'custom' && AMMO_DATA[ammoType]) {
        const ammo = AMMO_DATA[ammoType];
        velocity = ammo.velocity;
        mass = ammo.mass;
        bc = ammo.bc;
    }

    const elevation = calculateElevation(velocity, distance);
    
    const result = calculateBallisticTrajectory({
        velocity: velocity,
        mass: mass,
        bc: bc,
        distance: distance,
        angle: elevation,
        windSpeed: windSpeed,
        windDir: windDir
    });

    const elevationMOA = metersToMOA(result.dropAmount / 100, distance);
    const windageMOA = metersToMOA(result.windageAmount / 100, distance);

    document.getElementById('flightTime').textContent = result.flightTime.toFixed(3);
    document.getElementById('dropAmount').textContent = result.dropAmount.toFixed(2);
    document.getElementById('elevationAdjust').textContent = elevationMOA.toFixed(2);
    document.getElementById('windageAdjust').textContent = windageMOA.toFixed(2);
    document.getElementById('remainingVelocity').textContent = result.remainingVelocity.toFixed(1);
    document.getElementById('remainingEnergy').textContent = result.remainingEnergy.toFixed(1);

    document.getElementById('dropResult').style.display = 'block';

    drawTrajectory(result.trajectory, distance);
}

function calculateElevation(velocity, distance) {
    const g = 9.81;
    const time = distance / velocity;
    const drop = 0.5 * g * time * time;
    const angleRad = Math.atan2(drop, distance);
    return angleRad * 180 / Math.PI;
}

function drawTrajectory(trajectory, maxDistance) {
    const canvas = document.getElementById('trajectoryCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = 300;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * height / 10);
        ctx.lineTo(width, i * height / 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i * width / 10, 0);
        ctx.lineTo(i * width / 10, height);
        ctx.stroke();
    }

    if (trajectory.length < 2) return;

    const maxY = Math.max(...trajectory.map(p => p.y));
    const minY = Math.min(...trajectory.map(p => p.y));
    const yRange = maxY - minY || 1;

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();

    trajectory.forEach((point, i) => {
        const x = (point.x / maxDistance) * width;
        const y = height - 50 - ((point.y - minY) / yRange) * (height - 100);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    ctx.fillStyle = '#ff6b6b';
    trajectory.forEach((point, i) => {
        if (i % 5 === 0) {
            const x = (point.x / maxDistance) * width;
            const y = height - 50 - ((point.y - minY) / yRange) * (height - 100);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('起点', 10, height - 20);
    ctx.fillText(`终点 (${maxDistance}m)`, width - 70, height - 20);
}

function saveBallisticData() {
    const data = {
        timestamp: new Date().toISOString(),
        type: 'ballistic',
        ammoType: document.getElementById('ammoType').value,
        muzzleVelocity: document.getElementById('muzzleVelocity').value,
        bulletMass: document.getElementById('bulletMass').value,
        ballisticCoeff: document.getElementById('ballisticCoeff').value,
        shootDistance: document.getElementById('shootDistance').value,
        windSpeed: document.getElementById('windSpeed').value,
        windDirection: document.getElementById('windDirection').value
    };
    
    calculationHistory.push(data);
    localStorage.setItem('ballisticHistory', JSON.stringify(calculationHistory));
    alert('弹道数据已保存！');
}

function calculateWindCorrection() {
    const terrainType = document.getElementById('terrainType').value;
    const valleyWidth = parseFloat(document.getElementById('valleyWidth').value) || 100;
    const valleyDepth = parseFloat(document.getElementById('valleyDepth').value) || 50;
    const valleyOrientation = parseFloat(document.getElementById('valleyOrientation').value) || 0;
    const shootDirectionAngle = parseFloat(document.getElementById('shootDirectionAngle').value) || 0;
    const mainWindDir = parseFloat(document.getElementById('mainWindDir').value) || 90;
    const mainWindSpeed = parseFloat(document.getElementById('mainWindSpeed').value) || 5;
    const turbulence = parseFloat(document.getElementById('turbulence').value) || 15;

    const distance = parseFloat(document.getElementById('shootDistance').value) || 500;
    const velocity = 850;
    const flightTime = distance / velocity * 1.2;

    let effectiveWindSpeed = mainWindSpeed;
    let crosswindComponent = 0;
    let windDeflectionAngle = 0;
    let terrainFactor = 1.0;

    switch (terrainType) {
        case 'valley':
            const aspectRatio = valleyDepth / valleyWidth;
            terrainFactor = 1.0 + aspectRatio * 0.5;

            const windToValleyAngle = normalizeAngle(mainWindDir - valleyOrientation);
            const shootToValleyAngle = normalizeAngle(shootDirectionAngle - valleyOrientation);

            windDeflectionAngle = calculateValleyWindDeflection(windToValleyAngle, aspectRatio);
            const effectiveWindDir = valleyOrientation + windDeflectionAngle;

            const windToShootAngle = normalizeAngle(effectiveWindDir - shootDirectionAngle);
            crosswindComponent = mainWindSpeed * terrainFactor * Math.sin(windToShootAngle * Math.PI / 180);

            const channelingFactor = Math.abs(Math.cos(windToValleyAngle * Math.PI / 180));
            effectiveWindSpeed = mainWindSpeed * (1.0 + channelingFactor * aspectRatio * 0.6);
            break;

        case 'ridge':
            terrainFactor = 1.25;
            const ridgeWindAngle = normalizeAngle(mainWindDir - shootDirectionAngle);
            crosswindComponent = mainWindSpeed * terrainFactor * Math.sin(ridgeWindAngle * Math.PI / 180);
            effectiveWindSpeed = mainWindSpeed * terrainFactor;
            break;

        case 'slope':
            terrainFactor = 1.1;
            const slopeWindAngle = normalizeAngle(mainWindDir - shootDirectionAngle);
            crosswindComponent = mainWindSpeed * terrainFactor * Math.sin(slopeWindAngle * Math.PI / 180);
            effectiveWindSpeed = mainWindSpeed * terrainFactor;
            break;

        default:
            const plainWindAngle = normalizeAngle(mainWindDir - shootDirectionAngle);
            crosswindComponent = mainWindSpeed * Math.sin(plainWindAngle * Math.PI / 180);
            effectiveWindSpeed = mainWindSpeed;
    }

    const actualCrosswind = Math.abs(crosswindComponent);
    const totalWindage = actualCrosswind * flightTime * 100 * 0.85;
    const windageMOA = metersToMOA(totalWindage / 100, distance);
    const estimatedSpread = totalWindage * (turbulence / 100) * terrainFactor;

    document.getElementById('totalWindage').textContent = totalWindage.toFixed(2);
    document.getElementById('windageMOA').textContent = windageMOA.toFixed(2);
    document.getElementById('effectiveCrosswind').textContent = actualCrosswind.toFixed(2);
    document.getElementById('windDeflection').textContent = windDeflectionAngle.toFixed(1);
    document.getElementById('terrainFactor').textContent = terrainFactor.toFixed(3);
    document.getElementById('estimatedSpread').textContent = estimatedSpread.toFixed(2);

    document.getElementById('windResult').style.display = 'block';
}

function generateComparison() {
    const dist1 = parseFloat(document.getElementById('compareDist1').value) || 500;
    const dist2 = parseFloat(document.getElementById('compareDist2').value) || 800;
    const dist3 = parseFloat(document.getElementById('compareDist3').value) || 1000;
    const slope = parseFloat(document.getElementById('compareSlope').value) || 20;

    const distances = [dist1, dist2, dist3];
    const velocity = 850;

    const levelBody = document.getElementById('levelDataBody');
    const mountainBody = document.getElementById('mountainDataBody');
    const diffBody = document.getElementById('diffDataBody');

    levelBody.innerHTML = '';
    mountainBody.innerHTML = '';
    diffBody.innerHTML = '';

    distances.forEach(dist => {
        const levelResult = calculateBallisticTrajectory({
            velocity: velocity,
            mass: 10.9,
            bc: 0.4,
            distance: dist,
            angle: 0
        });

        const mountainAngle = slope;
        const mountainResult = calculateBallisticTrajectory({
            velocity: velocity,
            mass: 10.9,
            bc: 0.4,
            distance: dist / Math.cos(mountainAngle * Math.PI / 180),
            angle: mountainAngle
        });

        levelBody.innerHTML += `
            <tr>
                <td>${dist}</td>
                <td>${levelResult.dropAmount.toFixed(2)}</td>
                <td>${levelResult.flightTime.toFixed(3)}</td>
                <td>${levelResult.windageAmount.toFixed(2)}</td>
            </tr>
        `;

        mountainBody.innerHTML += `
            <tr>
                <td>${dist}</td>
                <td>${mountainResult.dropAmount.toFixed(2)}</td>
                <td>${mountainResult.flightTime.toFixed(3)}</td>
                <td>${mountainResult.windageAmount.toFixed(2)}</td>
            </tr>
        `;

        const dropDiff = mountainResult.dropAmount - levelResult.dropAmount;
        const timeDiff = mountainResult.flightTime - levelResult.flightTime;
        const moaDiff = metersToMOA(dropDiff / 100, dist);
        const impactLevel = Math.abs(moaDiff) > 5 ? '显著' : Math.abs(moaDiff) > 2 ? '中等' : '轻微';

        diffBody.innerHTML += `
            <tr>
                <td>${dist}</td>
                <td>${dropDiff.toFixed(2)}</td>
                <td>${timeDiff.toFixed(3)}</td>
                <td>${moaDiff.toFixed(2)}</td>
                <td><span class="status-badge status-${impactLevel === '显著' ? 'uphill' : impactLevel === '中等' ? 'crosswind' : 'downhill'}">${impactLevel}</span></td>
            </tr>
        `;
    });
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('ballisticHistory') || '[]');
    const tbody = document.getElementById('historyBody');
    tbody.innerHTML = '';

    history.forEach((item, index) => {
        const time = new Date(item.timestamp).toLocaleString();
        const type = item.type === 'slope' ? '坡度测量' : '弹道计算';
        tbody.innerHTML += `
            <tr>
                <td>${time}</td>
                <td>${type}</td>
                <td>${item.shootDistance || '-'}</td>
                <td>${item.terrainSlope || '-'}</td>
                <td>-</td>
                <td>-</td>
                <td>
                    <button onclick="deleteHistory(${index})" style="padding: 5px 10px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
                </td>
            </tr>
        `;
    });

    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">暂无历史记录</td></tr>';
    }
}

function deleteHistory(index) {
    if (confirm('确定要删除这条记录吗？')) {
        calculationHistory.splice(index, 1);
        localStorage.setItem('ballisticHistory', JSON.stringify(calculationHistory));
        loadHistory();
    }
}

function exportHistory() {
    const dataStr = JSON.stringify(calculationHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ballistic_history_' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
}

function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
        localStorage.removeItem('ballisticHistory');
        calculationHistory = [];
        loadHistory();
    }
}

async function syncWithBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('后端服务连接成功');
        }
    } catch (error) {
        console.log('后端服务未运行，使用本地存储模式');
    }
}

function normalizeAngle(angle) {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle > 180 ? angle - 360 : angle;
}

function calculateValleyWindDeflection(windToValleyAngle, aspectRatio) {
    const angleRad = windToValleyAngle * Math.PI / 180;
    const deflectionFactor = aspectRatio * 0.4;
    const deflection = -Math.sin(angleRad) * deflectionFactor * 45;
    return Math.max(-30, Math.min(30, deflection));
}

const PENETRATION_DATA = {
    ammo: {
        '5.56x45': { mass: 4.0, diameter: 5.7, velocity: 945, kFactor: 0.85 },
        '7.62x39': { mass: 7.9, diameter: 7.92, velocity: 710, kFactor: 0.78 },
        '7.62x51': { mass: 9.5, diameter: 7.82, velocity: 840, kFactor: 0.88 },
        '.338': { mass: 16.2, diameter: 8.6, velocity: 880, kFactor: 0.92 },
        '12.7x99': { mass: 42.0, diameter: 12.7, velocity: 850, kFactor: 0.95 }
    },
    bulletTypeFactors: {
        'fmj': 1.0,
        'ap': 1.4,
        'hp': 0.7,
        'sp': 0.85
    },
    covers: {
        'leaf': { density: 0.3, name: '树叶/灌木', thickness: 20 },
        'branch': { density: 0.5, name: '细树枝', thickness: 10 },
        'trunk_small': { density: 0.7, name: '树干(15cm)', thickness: 15 },
        'trunk_medium': { density: 0.75, name: '树干(30cm)', thickness: 30 },
        'trunk_large': { density: 0.8, name: '粗树干(50cm)', thickness: 50 },
        'dirt': { density: 1.5, name: '泥土/沙袋', thickness: 30 },
        'wood': { density: 0.6, name: '木板', thickness: 2.5 },
        'steel': { density: 7.8, name: '钢板', thickness: 0.3 },
        'concrete': { density: 2.4, name: '混凝土', thickness: 15 }
    }
};

function updateAmmoParams() {
    const ammoType = document.getElementById('penAmmoType').value;
    if (ammoType !== 'custom' && PENETRATION_DATA.ammo[ammoType]) {
        const ammo = PENETRATION_DATA.ammo[ammoType];
        document.getElementById('penBulletMass').value = ammo.mass;
        document.getElementById('penBulletDiameter').value = ammo.diameter;
        document.getElementById('penMuzzleVelocity').value = ammo.velocity;
    }
}

function updateCoverThickness(selectElement) {
    const coverType = selectElement.value;
    const formGrid = selectElement.closest('.form-grid');
    const thicknessInput = formGrid.querySelector('.coverThickness');
    
    if (coverType !== 'custom' && PENETRATION_DATA.covers[coverType]) {
        thicknessInput.value = PENETRATION_DATA.covers[coverType].thickness;
    }
}

function addCoverLayer() {
    const container = document.getElementById('coverLayers');
    const firstLayer = container.querySelector('.form-grid');
    const newLayer = firstLayer.cloneNode(true);
    
    newLayer.querySelectorAll('input').forEach(input => {
        if (input.classList.contains('coverThickness')) {
            input.value = 20;
        } else if (input.classList.contains('coverLayersNum')) {
            input.value = 1;
        }
    });
    
    container.appendChild(newLayer);
}

function removeCoverLayer(button) {
    const container = document.getElementById('coverLayers');
    const layers = container.querySelectorAll('.form-grid');
    
    if (layers.length > 1) {
        const layerToRemove = button.closest('.form-grid');
        layerToRemove.remove();
    } else {
        alert('至少保留一层掩体');
    }
}

function calculateVelocityAtDistance(muzzleVelocity, distance, bulletMass, diameter) {
    const dragCoefficient = 0.295;
    const airDensity = 1.225;
    const crossSection = Math.PI * Math.pow(diameter / 1000 / 2, 2);
    const massKg = bulletMass / 1000;
    
    const decayFactor = (0.5 * airDensity * crossSection * dragCoefficient * distance) / massKg;
    const velocity = muzzleVelocity * Math.exp(-decayFactor);
    
    return Math.max(velocity, 50);
}

function calculatePenetrationThroughLayer(velocity, bulletMass, diameter, bulletTypeFactor, coverType, thicknessCm) {
    const massKg = bulletMass / 1000;
    const diameterM = diameter / 1000;
    const energy = 0.5 * massKg * velocity * velocity;
    
    let coverDensity = 0.5;
    if (PENETRATION_DATA.covers[coverType]) {
        coverDensity = PENETRATION_DATA.covers[coverType].density;
    }
    
    const thicknessM = thicknessCm / 100;
    const sectionalDensity = bulletMass / (diameter * diameter);
    
    const basePenetration = Math.sqrt(energy * sectionalDensity * bulletTypeFactor) / 50;
    const penetrationCapacity = basePenetration / coverDensity;
    
    if (thicknessM > penetrationCapacity) {
        const penetrationRatio = thicknessM / penetrationCapacity;
        const remainingEnergyRatio = Math.pow(1 - 1/penetrationRatio, 2);
        const remainingEnergy = energy * Math.max(0, remainingEnergyRatio);
        const remainingVelocity = Math.sqrt(2 * remainingEnergy / massKg);
        
        return {
            penetrated: false,
            entryVelocity: velocity,
            exitVelocity: 0,
            energyLoss: energy - remainingEnergy,
            energyLossPercent: 100,
            penetrationDepth: penetrationCapacity * 100
        };
    }
    
    const thicknessRatio = thicknessM / penetrationCapacity;
    const energyLossFactor = thicknessRatio * (2 - thicknessRatio) * 0.7;
    const remainingEnergy = energy * (1 - energyLossFactor);
    const remainingVelocity = Math.sqrt(2 * Math.max(remainingEnergy, 0) / massKg);
    
    return {
        penetrated: true,
        entryVelocity: velocity,
        exitVelocity: remainingVelocity,
        energyLoss: energy - remainingEnergy,
        energyLossPercent: energyLossFactor * 100,
        penetrationDepth: thicknessCm
    };
}

function calculateLethality(velocity, bulletMass) {
    const massKg = bulletMass / 1000;
    const energy = 0.5 * massKg * velocity * velocity;
    
    const lethalityThreshold = 78;
    const seriousThreshold = 150;
    const lethalThreshold = 300;
    
    let probability = 0;
    let threatLevel = '无威胁';
    
    if (energy >= lethalThreshold) {
        probability = 95;
        threatLevel = '致命威胁';
    } else if (energy >= seriousThreshold) {
        probability = 70 + (energy - seriousThreshold) / (lethalThreshold - seriousThreshold) * 25;
        threatLevel = '严重威胁';
    } else if (energy >= lethalityThreshold) {
        probability = 30 + (energy - lethalityThreshold) / (seriousThreshold - lethalityThreshold) * 40;
        threatLevel = '轻度威胁';
    } else if (energy >= 40) {
        probability = (energy - 40) / (lethalityThreshold - 40) * 30;
        threatLevel = '微弱威胁';
    }
    
    return {
        energy: energy,
        probability: Math.min(probability, 99),
        threatLevel: threatLevel
    };
}

function calculatePenetration() {
    const ammoType = document.getElementById('penAmmoType').value;
    const bulletMass = parseFloat(document.getElementById('penBulletMass').value);
    const bulletDiameter = parseFloat(document.getElementById('penBulletDiameter').value);
    const muzzleVelocity = parseFloat(document.getElementById('penMuzzleVelocity').value);
    const bulletType = document.getElementById('penBulletType').value;
    const shootDistance = parseFloat(document.getElementById('penShootDistance').value);
    
    const bulletTypeFactor = PENETRATION_DATA.bulletTypeFactors[bulletType];
    
    const impactVelocity = calculateVelocityAtDistance(muzzleVelocity, shootDistance, bulletMass, bulletDiameter);
    const massKg = bulletMass / 1000;
    const impactEnergy = 0.5 * massKg * impactVelocity * impactVelocity;
    
    const layers = document.querySelectorAll('#coverLayers .form-grid');
    const penetrationDetails = [];
    let currentVelocity = impactVelocity;
    let allPenetrated = true;
    let stoppedAtLayer = -1;
    
    layers.forEach((layer, index) => {
        if (stoppedAtLayer >= 0) return;
        
        const coverType = layer.querySelector('.coverType').value;
        const thickness = parseFloat(layer.querySelector('.coverThickness').value);
        const layerCount = parseInt(layer.querySelector('.coverLayersNum').value);
        
        for (let i = 0; i < layerCount; i++) {
            const result = calculatePenetrationThroughLayer(
                currentVelocity, bulletMass, bulletDiameter, bulletTypeFactor,
                coverType, thickness
            );
            
            const coverName = PENETRATION_DATA.covers[coverType]?.name || coverType;
            penetrationDetails.push({
                layer: index + 1,
                subLayer: layerCount > 1 ? `(${i + 1}/${layerCount})` : '',
                coverType: coverName,
                thickness: thickness,
                ...result
            });
            
            if (!result.penetrated) {
                allPenetrated = false;
                stoppedAtLayer = index;
                currentVelocity = 0;
                break;
            }
            
            currentVelocity = result.exitVelocity;
        }
    });
    
    const remainingEnergy = 0.5 * massKg * currentVelocity * currentVelocity;
    const energyLossPercent = impactEnergy > 0 ? ((impactEnergy - remainingEnergy) / impactEnergy * 100) : 0;
    const velocityLossPercent = impactVelocity > 0 ? ((impactVelocity - currentVelocity) / impactVelocity * 100) : 0;
    
    const lethality = calculateLethality(currentVelocity, bulletMass);
    
    document.getElementById('impactVelocity').textContent = impactVelocity.toFixed(1);
    document.getElementById('impactEnergy').textContent = impactEnergy.toFixed(1);
    document.getElementById('remainingVel').textContent = currentVelocity.toFixed(1);
    document.getElementById('remainingEnergyAfter').textContent = remainingEnergy.toFixed(1);
    document.getElementById('energyLoss').textContent = energyLossPercent.toFixed(1);
    document.getElementById('velocityLoss').textContent = velocityLossPercent.toFixed(1);
    
    document.getElementById('penetrationSuccess').textContent = allPenetrated ? '全部穿透' : '被阻挡';
    document.getElementById('penetrationSuccess').style.color = allPenetrated ? '#4ecdc4' : '#ff6b6b';
    
    document.getElementById('lethalityEnergy').textContent = lethality.energy.toFixed(1);
    document.getElementById('killProbability').textContent = lethality.probability.toFixed(1);
    document.getElementById('threatLevel').textContent = lethality.threatLevel;
    
    const detailBody = document.getElementById('penetrationDetailBody');
    detailBody.innerHTML = '';
    penetrationDetails.forEach((detail, idx) => {
        const statusColor = detail.penetrated ? '#4ecdc4' : '#ff6b6b';
        const statusText = detail.penetrated ? '穿透' : '被阻挡';
        
        detailBody.innerHTML += `
            <tr>
                <td>${detail.layer}${detail.subLayer}</td>
                <td>${detail.coverType}</td>
                <td>${detail.thickness} cm</td>
                <td>${detail.entryVelocity.toFixed(1)} m/s</td>
                <td>${detail.exitVelocity.toFixed(1)} m/s</td>
                <td>${detail.energyLossPercent.toFixed(1)}%</td>
                <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
            </tr>
        `;
    });
    
    document.getElementById('penetrationResult').style.display = 'block';
}

function resetPenetration() {
    document.getElementById('penAmmoType').value = '5.56x45';
    document.getElementById('penBulletType').value = 'fmj';
    document.getElementById('penShootDistance').value = '100';
    updateAmmoParams();
    
    const container = document.getElementById('coverLayers');
    const layers = container.querySelectorAll('.form-grid');
    layers.forEach((layer, idx) => {
        if (idx > 0) {
            layer.remove();
        } else {
            layer.querySelector('.coverType').value = 'leaf';
            layer.querySelector('.coverThickness').value = 20;
            layer.querySelector('.coverLayersNum').value = 1;
        }
    });
    
    document.getElementById('penetrationResult').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    syncWithBackend();
    loadHistory();
    updateAmmoParams();
});
