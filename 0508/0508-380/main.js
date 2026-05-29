document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('chartCanvas');
    ChartRenderer.init(canvas);

    const birthForm = document.getElementById('birthForm');
    birthForm.addEventListener('submit', function(e) {
        e.preventDefault();
        generateChart();
    });

    initToleranceSliders();
});

function initToleranceSliders() {
    const sliders = [
        { id: 'conjunctionTolerance', valueId: 'conjunctionValue' },
        { id: 'sextileTolerance', valueId: 'sextileValue' },
        { id: 'squareTolerance', valueId: 'squareValue' },
        { id: 'trineTolerance', valueId: 'trineValue' },
        { id: 'oppositionTolerance', valueId: 'oppositionValue' }
    ];

    sliders.forEach(slider => {
        const input = document.getElementById(slider.id);
        const display = document.getElementById(slider.valueId);
        
        input.addEventListener('input', function() {
            display.textContent = this.value + '°';
        });
    });
}

function resetTolerances() {
    document.getElementById('conjunctionTolerance').value = 8;
    document.getElementById('conjunctionValue').textContent = '8.0°';
    
    document.getElementById('sextileTolerance').value = 5;
    document.getElementById('sextileValue').textContent = '5.0°';
    
    document.getElementById('squareTolerance').value = 8;
    document.getElementById('squareValue').textContent = '8.0°';
    
    document.getElementById('trineTolerance').value = 8;
    document.getElementById('trineValue').textContent = '8.0°';
    
    document.getElementById('oppositionTolerance').value = 8;
    document.getElementById('oppositionValue').textContent = '8.0°';
}

function setLocation(name, longitude, latitude) {
    document.getElementById('location').value = name;
    document.getElementById('longitude').value = longitude;
    document.getElementById('latitude').value = latitude;
}

function getTolerances() {
    return {
        conjunction: parseFloat(document.getElementById('conjunctionTolerance').value),
        sextile: parseFloat(document.getElementById('sextileTolerance').value),
        square: parseFloat(document.getElementById('squareTolerance').value),
        trine: parseFloat(document.getElementById('trineTolerance').value),
        opposition: parseFloat(document.getElementById('oppositionTolerance').value)
    };
}

function calculateAllPlanets(year, month, day, hour, minute) {
    const hourFloat = hour + minute / 60;
    const jd = Swisseph.swe_julday(year, month, day, hourFloat, 1);
    
    const planetMapping = [
        { id: 'sun', name: '太阳', symbol: '☉', color: '#ffd700', code: Swisseph.SE_SUN },
        { id: 'moon', name: '月亮', symbol: '☽', color: '#c0c0c0', code: Swisseph.SE_MOON },
        { id: 'mercury', name: '水星', symbol: '☿', color: '#a0a0a0', code: Swisseph.SE_MERCURY },
        { id: 'venus', name: '金星', symbol: '♀', color: '#ffb6c1', code: Swisseph.SE_VENUS },
        { id: 'mars', name: '火星', symbol: '♂', color: '#ff4444', code: Swisseph.SE_MARS },
        { id: 'jupiter', name: '木星', symbol: '♃', color: '#8bcf5a', code: Swisseph.SE_JUPITER },
        { id: 'saturn', name: '土星', symbol: '♄', color: '#cd853f', code: Swisseph.SE_SATURN },
        { id: 'uranus', name: '天王星', symbol: '⛢', color: '#4fd0e0', code: Swisseph.SE_URANUS },
        { id: 'neptune', name: '海王星', symbol: '♆', color: '#9966cc', code: Swisseph.SE_NEPTUNE },
        { id: 'pluto', name: '冥王星', symbol: '♇', color: '#b06649', code: Swisseph.SE_PLUTO }
    ];

    const positions = [];
    
    planetMapping.forEach(planet => {
        const result = Swisseph.swe_calc_ut(jd, planet.code, 0);
        const longitude = result[0];
        
        positions.push({
            ...planet,
            longitude: longitude,
            latitude: result[1],
            distance: result[2],
            zodiac: getZodiacSign(longitude)
        });
    });
    
    return positions;
}

function getZodiacSign(degree) {
    const ZODIAC_SIGNS = [
        { name: '白羊座', symbol: '♈', start: 0 },
        { name: '金牛座', symbol: '♉', start: 30 },
        { name: '双子座', symbol: '♊', start: 60 },
        { name: '巨蟹座', symbol: '♋', start: 90 },
        { name: '狮子座', symbol: '♌', start: 120 },
        { name: '处女座', symbol: '♍', start: 150 },
        { name: '天秤座', symbol: '♎', start: 180 },
        { name: '天蝎座', symbol: '♏', start: 210 },
        { name: '射手座', symbol: '♐', start: 240 },
        { name: '摩羯座', symbol: '♑', start: 270 },
        { name: '水瓶座', symbol: '♒', start: 300 },
        { name: '双鱼座', symbol: '♓', start: 330 }
    ];
    
    const deg = ((degree % 360) + 360) % 360;
    for (let i = ZODIAC_SIGNS.length - 1; i >= 0; i--) {
        if (deg >= ZODIAC_SIGNS[i].start) {
            return ZODIAC_SIGNS[i];
        }
    }
    return ZODIAC_SIGNS[0];
}

function formatDegree(degree) {
    const deg = ((degree % 360) + 360) % 360;
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    const s = ((deg - d - m / 60) * 3600).toFixed(1);
    return `${d}°${m}'${s}"`;
}

function generateChart() {
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const day = parseInt(document.getElementById('day').value);
    const hour = parseInt(document.getElementById('hour').value);
    const minute = parseInt(document.getElementById('minute').value);

    const planets = calculateAllPlanets(year, month, day, hour, minute);
    const tolerances = getTolerances();
    
    ChartRenderer.drawChart(planets, tolerances);
    
    displayPlanets(planets);
    displayAspects(planets, tolerances);
}

function displayPlanets(planets) {
    const display = document.getElementById('planetsDisplay');
    display.innerHTML = '';
    
    planets.forEach(planet => {
        const degreeInSign = (planet.longitude - planet.zodiac.start + 360) % 30;
        const item = document.createElement('div');
        item.className = 'planet-item';
        item.innerHTML = `
            <span class="planet-name">${planet.symbol} ${planet.name}</span>
            <span class="planet-position">${planet.zodiac.symbol} ${planet.zodiac.name} ${degreeInSign.toFixed(2)}°</span>
            <span class="planet-position">黄经: ${formatDegree(planet.longitude)}</span>
            <span class="planet-position">黄纬: ${planet.latitude.toFixed(4)}°</span>
        `;
        display.appendChild(item);
    });
}

function displayAspects(planets, tolerances) {
    const display = document.getElementById('aspectsDisplay');
    display.innerHTML = '';
    
    const aspectConfig = [
        { angle: 0, name: '合相', color: '#ffd700', tolerance: tolerances.conjunction },
        { angle: 60, name: '六分相', color: '#4fd0e0', tolerance: tolerances.sextile },
        { angle: 90, name: '四分相', color: '#ff4444', tolerance: tolerances.square },
        { angle: 120, name: '三分相', color: '#8bcf5a', tolerance: tolerances.trine },
        { angle: 180, name: '冲相', color: '#9966cc', tolerance: tolerances.opposition }
    ];

    const aspects = [];

    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];
            const diff = Math.abs(p1.longitude - p2.longitude);
            const normalizedDiff = Math.min(diff, 360 - diff);

            for (const aspect of aspectConfig) {
                const diffToAspect = Math.abs(normalizedDiff - aspect.angle);
                if (diffToAspect < aspect.tolerance) {
                    aspects.push({
                        p1: p1,
                        p2: p2,
                        aspect: aspect,
                        actualAngle: normalizedDiff.toFixed(1),
                        orb: diffToAspect.toFixed(1)
                    });
                }
            }
        }
    }

    aspects.sort((a, b) => parseFloat(a.orb) - parseFloat(b.orb));

    if (aspects.length === 0) {
        display.innerHTML = '<p style="color: #aaa;">未检测到主要相位</p>';
        return;
    }

    aspects.forEach(aspect => {
        const item = document.createElement('div');
        item.className = 'aspect-item';
        item.innerHTML = `
            <span class="aspect-name">${aspect.p1.symbol} ${aspect.p1.name} - ${aspect.p2.symbol} ${aspect.p2.name}</span>
            <span class="aspect-degree">${aspect.aspect.name} (${aspect.aspect.angle}°)</span>
            <span class="aspect-degree">实际角度: ${aspect.actualAngle}° | 容许度: ${aspect.orb}° / ${aspect.aspect.tolerance}°</span>
        `;
        item.style.borderLeftColor = aspect.aspect.color;
        display.appendChild(item);
    });
}