const Ephemeris = (function() {
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

    const PLANETS = [
        { id: 'sun', name: '太阳', symbol: '☉', color: '#ffd700' },
        { id: 'moon', name: '月亮', symbol: '☽', color: '#c0c0c0' },
        { id: 'mercury', name: '水星', symbol: '☿', color: '#a0a0a0' },
        { id: 'venus', name: '金星', symbol: '♀', color: '#ffb6c1' },
        { id: 'mars', name: '火星', symbol: '♂', color: '#ff4444' },
        { id: 'jupiter', name: '木星', symbol: '♃', color: '#8bcf5a' },
        { id: 'saturn', name: '土星', symbol: '♄', color: '#cd853f' },
        { id: 'uranus', name: '天王星', symbol: '⛢', color: '#4fd0e0' },
        { id: 'neptune', name: '海王星', symbol: '♆', color: '#9966cc' },
        { id: 'pluto', name: '冥王星', symbol: '♇', color: '#b06649' }
    ];

    function toRad(deg) { return deg * Math.PI / 180; }
    function toDeg(rad) { return rad * 180 / Math.PI; }
    function mod(a, b) { return ((a % b) + b) % b; }

    function julianDay(year, month, day, hour, minute) {
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        const dayFraction = (hour + minute / 60) / 24;
        return jdn + dayFraction - 0.5;
    }

    function calculateSunPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(280.46646 + 36000.76983 * T + 0.0003032 * T * T, 360);
        const M = mod(357.52911 + 35999.05029 * T - 0.0001537 * T * T, 360);
        const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(toRad(M)) +
                  (0.019993 - 0.000101 * T) * Math.sin(toRad(2 * M)) +
                  0.000289 * Math.sin(toRad(3 * M));
        const trueLongitude = mod(L0 + C, 360);
        return trueLongitude;
    }

    function calculateMoonPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        
        const D = mod(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000, 360);
        const M = mod(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000, 360);
        const M_prime = mod(134.9634114 + 477198.8676313 * T + 0.0089970 * T * T + T * T * T / 69699 - T * T * T * T / 14712000, 360);
        const F = mod(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000, 360);
        const Omega = mod(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000, 360);
        
        const A1 = mod(D - Omega, 360);
        const A2 = mod(2 * D - 2 * Omega - M_prime, 360);
        const A3 = mod(2 * D - 2 * Omega, 360);
        const A4 = mod(2 * D - M_prime, 360);
        const A5 = mod(2 * D - 2 * Omega - 2 * M_prime, 360);
        const A6 = mod(D, 360);
        const A7 = mod(2 * D - M_prime - M, 360);
        const A8 = mod(M_prime, 360);
        const A9 = mod(2 * D - 2 * Omega - M, 360);
        const A10 = mod(2 * D - Omega - M_prime, 360);
        const A11 = mod(D - M_prime, 360);
        const A12 = mod(2 * D - Omega - M, 360);
        const A13 = mod(2 * D - 2 * Omega - M_prime + M, 360);
        const A14 = mod(2 * D - Omega, 360);
        const A15 = mod(D + M_prime, 360);
        const A16 = mod(D - M, 360);
        const A17 = mod(D + M, 360);
        const A18 = mod(2 * M_prime, 360);
        const A19 = mod(2 * D - M_prime + M, 360);
        const A20 = mod(3 * D - 2 * M_prime, 360);
        const A21 = mod(D - 2 * M_prime, 360);
        const A22 = mod(2 * D - 2 * M_prime, 360);
        const A23 = mod(3 * D - 2 * Omega - 2 * M_prime, 360);
        const A24 = mod(D - 2 * Omega, 360);
        const A25 = mod(D + M_prime - M, 360);
        const A26 = mod(2 * D - 2 * Omega + M_prime, 360);
        const A27 = mod(2 * D - 3 * M_prime, 360);
        const A28 = mod(D + M_prime + M, 360);
        const A29 = mod(2 * D - M_prime - 2 * M, 360);
        const A30 = mod(3 * D - M_prime, 360);
        
        let longitude = D +
            6.283185307 * Math.sin(toRad(A8)) +
            1.27395803 * Math.sin(toRad(A4)) +
            0.65833719 * Math.sin(toRad(A3)) +
            0.21361504 * Math.sin(toRad(A18)) +
            0.1883686 * Math.sin(toRad(A5)) +
            0.11450466 * Math.sin(toRad(A7)) +
            0.058793 * Math.sin(toRad(A19)) +
            0.057066 * Math.sin(toRad(A8 - M)) +
            0.053324 * Math.sin(toRad(A6)) +
            0.045704 * Math.sin(toRad(A11 + M)) +
            0.041998 * Math.sin(toRad(A11 - M)) +
            0.034764 * Math.sin(toRad(A4 - M)) +
            0.030463 * Math.sin(toRad(A8 + M)) +
            0.027385 * Math.sin(toRad(A10 - M)) +
            0.026614 * Math.sin(toRad(A10 + M)) +
            0.021431 * Math.sin(toRad(A16)) +
            0.017200 * Math.sin(toRad(A17)) +
            0.015352 * Math.sin(toRad(A18 + M)) +
            0.012217 * Math.sin(toRad(A20)) +
            0.008548 * Math.sin(toRad(A21)) +
            0.007918 * Math.sin(toRad(A22)) +
            0.006891 * Math.sin(toRad(A1)) +
            0.005986 * Math.sin(toRad(A23)) +
            0.005699 * Math.sin(toRad(A24)) +
            0.005383 * Math.sin(toRad(A25)) +
            0.004987 * Math.sin(toRad(A26)) +
            0.004102 * Math.sin(toRad(A27)) +
            0.003995 * Math.sin(toRad(A28)) +
            0.003861 * Math.sin(toRad(A29)) +
            0.003038 * Math.sin(toRad(A30)) +
            0.002571 * Math.sin(toRad(A18 - M)) +
            0.002472 * Math.sin(toRad(A2)) +
            0.002218 * Math.sin(toRad(A14)) +
            0.001939 * Math.sin(toRad(A7 - M)) +
            0.001877 * Math.sin(toRad(A19 + M)) +
            0.001828 * Math.sin(toRad(A4 + M)) +
            0.001795 * Math.sin(toRad(A10)) +
            0.001491 * Math.sin(toRad(A6 + M)) +
            0.001470 * Math.sin(toRad(A6 - M));
        
        return mod(longitude, 360);
    }

    function calculateMercuryPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(252.250906 + 538101628.29 * T + 0.00015 * T * T, 360);
        const M = mod(174.79485 + 538102229.29 * T - 0.00014 * T * T, 360);
        const e = 0.205631 - 0.000020 * T;
        const w = mod(77.45771 + 157.1528 * T - 0.000007 * T * T, 360);
        
        const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
        const xv = Math.cos(toRad(E)) - e;
        const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
        const v = toDeg(Math.atan2(yv, xv));
        const r = Math.sqrt(xv * xv + yv * yv);
        
        let longitude = mod(v + w + L0 - M, 360);
        longitude += 0.005693 * Math.sin(toRad(2 * (longitude - w)));
        
        return mod(longitude, 360);
    }

    function calculateVenusPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(181.97980 + 210664136.08 * T + 0.00025 * T * T, 360);
        const M = mod(50.41610 + 210663988.07 * T - 0.00064 * T * T, 360);
        const e = 0.006764 - 0.000047 * T;
        const w = mod(131.56370 + 1.32708 * T + 0.000003 * T * T, 360);
        
        const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
        const xv = Math.cos(toRad(E)) - e;
        const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
        const v = toDeg(Math.atan2(yv, xv));
        
        let longitude = mod(v + w + L0 - M, 360);
        longitude += 0.00042 * Math.sin(toRad(2 * (longitude - w)));
        
        return mod(longitude, 360);
    }

    function calculateMarsPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(355.43328 + 68905103.78 * T + 0.00013 * T * T, 360);
        const M = mod(19.38709 + 68905056.31 * T - 0.00031 * T * T, 360);
        const e = 0.09340 + 0.00009 * T;
        const w = mod(286.50163 + 1.84133 * T + 0.000015 * T * T, 360);
        
        const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
        const xv = Math.cos(toRad(E)) - e;
        const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
        const v = toDeg(Math.atan2(yv, xv));
        
        let longitude = mod(v + w + L0 - M, 360);
        longitude += 0.00702 * Math.sin(toRad(2 * (longitude - w)));
        
        return mod(longitude, 360);
    }

    function calculateJupiterPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(20.02815 + 10925660.23 * T - 0.00113 * T * T, 360);
        const M = mod(20.02815 + 10925496.85 * T - 0.00113 * T * T, 360);
        const e = 0.048498 + 0.000163 * T;
        const w = mod(273.87772 + 0.16452 * T - 0.000026 * T * T, 360);
        
        const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
        const xv = Math.cos(toRad(E)) - e;
        const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
        const v = toDeg(Math.atan2(yv, xv));
        
        let longitude = mod(v + w + L0 - M, 360);
        longitude += 0.00547 * Math.sin(toRad(2 * (longitude - w)));
        
        return mod(longitude, 360);
    }

    function calculateSaturnPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(317.02066 + 4399609.88 * T + 0.00014 * T * T, 360);
        const M = mod(317.02066 + 4399589.38 * T + 0.00014 * T * T, 360);
        const e = 0.055546 - 0.000365 * T;
        const w = mod(339.94444 + 0.87711 * T + 0.000018 * T * T, 360);
        
        const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
        const xv = Math.cos(toRad(E)) - e;
        const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
        const v = toDeg(Math.atan2(yv, xv));
        
        let longitude = mod(v + w + L0 - M, 360);
        longitude += 0.00636 * Math.sin(toRad(2 * (longitude - w)));
        
        return mod(longitude, 360);
    }

    function calculateUranusPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(141.04987 + 1542481.53 * T - 0.00109 * T * T, 360);
        const M = mod(141.04987 + 1542478.76 * T - 0.00109 * T * T, 360);
        const e = 0.046321 - 0.000019 * T;
        const w = mod(96.66124 + 0.00249 * T + 0.000009 * T * T, 360);
        
        const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
        const xv = Math.cos(toRad(E)) - e;
        const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
        const v = toDeg(Math.atan2(yv, xv));
        
        let longitude = mod(v + w + L0 - M, 360);
        
        return mod(longitude, 360);
    }

    function calculateNeptunePosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(330.65245 + 786506.41 * T + 0.00045 * T * T, 360);
        const M = mod(330.65245 + 786503.95 * T + 0.00045 * T * T, 360);
        const e = 0.008986 + 0.000007 * T;
        const w = mod(276.34164 + 0.00031 * T - 0.000005 * T * T, 360);
        
        const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
        const xv = Math.cos(toRad(E)) - e;
        const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
        const v = toDeg(Math.atan2(yv, xv));
        
        let longitude = mod(v + w + L0 - M, 360);
        
        return mod(longitude, 360);
    }

    function calculatePlutoPosition(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = mod(238.92903 + 470016.38 * T + 0.00001 * T * T, 360);
        const M = mod(238.92903 + 470010.06 * T + 0.00001 * T * T, 360);
        const e = 0.24882 - 0.000061 * T;
        const w = mod(110.30347 + 3.81490 * T + 0.000042 * T * T, 360);
        
        const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
        const xv = Math.cos(toRad(E)) - e;
        const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
        const v = toDeg(Math.atan2(yv, xv));
        
        let longitude = mod(v + w + L0 - M, 360);
        
        return mod(longitude, 360);
    }

    function getZodiacSign(degree) {
        const deg = mod(degree, 360);
        for (let i = ZODIAC_SIGNS.length - 1; i >= 0; i--) {
            if (deg >= ZODIAC_SIGNS[i].start) {
                return ZODIAC_SIGNS[i];
            }
        }
        return ZODIAC_SIGNS[0];
    }

    function formatDegree(degree) {
        const deg = mod(degree, 360);
        const d = Math.floor(deg);
        const m = Math.floor((deg - d) * 60);
        const s = ((deg - d - m / 60) * 3600).toFixed(1);
        return `${d}°${m}'${s}"`;
    }

    function calculateAllPlanets(year, month, day, hour, minute) {
        const jd = julianDay(year, month, day, hour, minute);
        
        const positions = [];
        
        positions.push({
            ...PLANETS[0],
            longitude: calculateSunPosition(jd),
            zodiac: getZodiacSign(calculateSunPosition(jd))
        });
        
        positions.push({
            ...PLANETS[1],
            longitude: calculateMoonPosition(jd),
            zodiac: getZodiacSign(calculateMoonPosition(jd))
        });
        
        positions.push({
            ...PLANETS[2],
            longitude: calculateMercuryPosition(jd),
            zodiac: getZodiacSign(calculateMercuryPosition(jd))
        });
        
        positions.push({
            ...PLANETS[3],
            longitude: calculateVenusPosition(jd),
            zodiac: getZodiacSign(calculateVenusPosition(jd))
        });
        
        positions.push({
            ...PLANETS[4],
            longitude: calculateMarsPosition(jd),
            zodiac: getZodiacSign(calculateMarsPosition(jd))
        });
        
        positions.push({
            ...PLANETS[5],
            longitude: calculateJupiterPosition(jd),
            zodiac: getZodiacSign(calculateJupiterPosition(jd))
        });
        
        positions.push({
            ...PLANETS[6],
            longitude: calculateSaturnPosition(jd),
            zodiac: getZodiacSign(calculateSaturnPosition(jd))
        });
        
        positions.push({
            ...PLANETS[7],
            longitude: calculateUranusPosition(jd),
            zodiac: getZodiacSign(calculateUranusPosition(jd))
        });
        
        positions.push({
            ...PLANETS[8],
            longitude: calculateNeptunePosition(jd),
            zodiac: getZodiacSign(calculateNeptunePosition(jd))
        });
        
        positions.push({
            ...PLANETS[9],
            longitude: calculatePlutoPosition(jd),
            zodiac: getZodiacSign(calculatePlutoPosition(jd))
        });
        
        return positions;
    }

    return {
        PLANETS,
        ZODIAC_SIGNS,
        calculateAllPlanets,
        formatDegree,
        getZodiacSign
    };
})();