const Swisseph = (function() {
    const SE_SUN = 0;
    const SE_MOON = 1;
    const SE_MERCURY = 2;
    const SE_VENUS = 3;
    const SE_MARS = 4;
    const SE_JUPITER = 5;
    const SE_SATURN = 6;
    const SE_URANUS = 7;
    const SE_NEPTUNE = 8;
    const SE_PLUTO = 9;

    function toRad(deg) { return deg * Math.PI / 180; }
    function toDeg(rad) { return rad * 180 / Math.PI; }
    function mod(a, b) { return ((a % b) + b) % b; }

    function swe_julday(year, month, day, hour, gregflag) {
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
                  Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        const dayFraction = hour;
        return jdn + dayFraction - 0.5;
    }

    function swe_calc_ut(jd, planet, flags) {
        const T = (jd - 2451545.0) / 36525;
        let longitude = 0;
        let latitude = 0;
        let distance = 0;

        switch(planet) {
            case SE_SUN: {
                const L0 = mod(280.46646 + 36000.76983 * T + 0.0003032 * T * T, 360);
                const M = mod(357.52911 + 35999.05029 * T - 0.0001537 * T * T, 360);
                const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(toRad(M)) +
                          (0.019993 - 0.000101 * T) * Math.sin(toRad(2 * M)) +
                          0.000289 * Math.sin(toRad(3 * M));
                longitude = mod(L0 + C, 360);
                break;
            }
            case SE_MOON: {
                const D = mod(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + 
                             Math.pow(T, 3) / 545868 - Math.pow(T, 4) / 113065000, 360);
                const M = mod(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + 
                             Math.pow(T, 3) / 24490000, 360);
                const M_prime = mod(134.9634114 + 477198.8676313 * T + 0.0089970 * T * T + 
                                   Math.pow(T, 3) / 69699 - Math.pow(T, 4) / 14712000, 360);
                const F = mod(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - 
                              Math.pow(T, 3) / 3526000 + Math.pow(T, 4) / 863310000, 360);
                const Omega = mod(125.04452 - 1934.136261 * T + 0.0020708 * T * T + 
                                  Math.pow(T, 3) / 450000, 360);

                longitude = D +
                    6.283185307 * Math.sin(toRad(M_prime)) +
                    1.27395803 * Math.sin(toRad(2 * D - M_prime)) +
                    0.65833719 * Math.sin(toRad(2 * D - 2 * Omega)) +
                    0.21361504 * Math.sin(toRad(2 * M_prime)) +
                    0.1883686 * Math.sin(toRad(2 * D - 2 * Omega - 2 * M_prime)) +
                    0.11450466 * Math.sin(toRad(2 * D - M_prime - M)) +
                    0.058793 * Math.sin(toRad(2 * D - M_prime + M)) +
                    0.057066 * Math.sin(toRad(M_prime - M)) +
                    0.053324 * Math.sin(toRad(D)) +
                    0.045704 * Math.sin(toRad(D - M_prime + M)) +
                    0.041998 * Math.sin(toRad(D - M_prime - M)) +
                    0.034764 * Math.sin(toRad(2 * D - M_prime - M)) +
                    0.030463 * Math.sin(toRad(M_prime + M)) +
                    0.027385 * Math.sin(toRad(2 * D - Omega - M_prime - M)) +
                    0.026614 * Math.sin(toRad(2 * D - Omega - M_prime + M)) +
                    0.021431 * Math.sin(toRad(D - M)) +
                    0.017200 * Math.sin(toRad(D + M)) +
                    0.015352 * Math.sin(toRad(2 * M_prime + M)) +
                    0.012217 * Math.sin(toRad(3 * D - 2 * M_prime)) +
                    0.008548 * Math.sin(toRad(D - 2 * M_prime)) +
                    0.007918 * Math.sin(toRad(2 * D - 2 * M_prime)) +
                    0.006891 * Math.sin(toRad(D - Omega)) +
                    0.005986 * Math.sin(toRad(3 * D - 2 * Omega - 2 * M_prime)) +
                    0.005699 * Math.sin(toRad(D - 2 * Omega)) +
                    0.005383 * Math.sin(toRad(D + M_prime - M)) +
                    0.004987 * Math.sin(toRad(2 * D - 2 * Omega + M_prime)) +
                    0.004102 * Math.sin(toRad(2 * D - 3 * M_prime)) +
                    0.003995 * Math.sin(toRad(D + M_prime + M)) +
                    0.003861 * Math.sin(toRad(2 * D - M_prime - 2 * M)) +
                    0.003038 * Math.sin(toRad(3 * D - M_prime)) +
                    0.002571 * Math.sin(toRad(2 * M_prime - M)) +
                    0.002472 * Math.sin(toRad(2 * D - 2 * Omega - M_prime)) +
                    0.002218 * Math.sin(toRad(2 * D - Omega)) +
                    0.001939 * Math.sin(toRad(2 * D - M_prime - 2 * M)) +
                    0.001877 * Math.sin(toRad(2 * D - M_prime + 2 * M)) +
                    0.001828 * Math.sin(toRad(2 * D - M_prime + M)) +
                    0.001795 * Math.sin(toRad(2 * D - Omega - M_prime)) +
                    0.001491 * Math.sin(toRad(D + M)) +
                    0.001470 * Math.sin(toRad(D - M));
                longitude = mod(longitude, 360);
                
                latitude = 5.128122 * Math.sin(toRad(F)) +
                    0.280606 * Math.sin(toRad(F + 2 * D - 2 * Omega)) +
                    0.277693 * Math.sin(toRad(F - 2 * D + 2 * Omega)) +
                    0.173237 * Math.sin(toRad(2 * D - F - 2 * Omega)) +
                    0.055413 * Math.sin(toRad(2 * D + F - 2 * Omega)) +
                    0.046272 * Math.sin(toRad(2 * D + F)) +
                    0.032573 * Math.sin(toRad(2 * D - F)) +
                    0.017198 * Math.sin(toRad(4 * D - F - 2 * Omega)) +
                    0.009546 * Math.sin(toRad(F + 2 * M_prime)) +
                    0.008717 * Math.sin(toRad(F - 2 * M_prime)) +
                    0.008018 * Math.sin(toRad(2 * D + F - 2 * M_prime)) +
                    0.006329 * Math.sin(toRad(2 * D - F - 2 * Omega)) +
                    0.005165 * Math.sin(toRad(4 * D - F)) +
                    0.004982 * Math.sin(toRad(2 * D - 2 * Omega - F)) +
                    0.003862 * Math.sin(toRad(2 * D + F + 2 * Omega)) +
                    0.003666 * Math.sin(toRad(2 * D - F + 2 * M_prime)) +
                    0.002685 * Math.sin(toRad(2 * D - F - 2 * M_prime)) +
                    0.002602 * Math.sin(toRad(F + 2 * D)) +
                    0.002078 * Math.sin(toRad(F - 2 * D)) +
                    0.001874 * Math.sin(toRad(4 * D - F - 2 * Omega));
                break;
            }
            case SE_MERCURY: {
                const L0 = mod(252.250906 + 538101628.29 * T + 0.00015 * T * T, 360);
                const M = mod(174.79485 + 538102229.29 * T - 0.00014 * T * T, 360);
                const e = 0.205631 - 0.000020 * T;
                const w = mod(77.45771 + 157.1528 * T - 0.000007 * T * T, 360);
                const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
                const xv = Math.cos(toRad(E)) - e;
                const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
                longitude = mod(toDeg(Math.atan2(yv, xv)) + w + L0 - M + 0.005693 * Math.sin(toRad(2 * (toDeg(Math.atan2(yv, xv)) + w - w)) - M, 360);
                distance = Math.sqrt(xv * xv + yv * yv);
                break;
            }
            case SE_VENUS: {
                const L0 = mod(181.97980 + 210664136.08 * T + 0.00025 * T * T, 360);
                const M = mod(50.41610 + 210663988.07 * T - 0.00064 * T * T, 360);
                const e = 0.006764 - 0.000047 * T;
                const w = mod(131.56370 + 1.32708 * T + 0.000003 * T * T, 360);
                const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
                const xv = Math.cos(toRad(E)) - e;
                const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
                longitude = mod(toDeg(Math.atan2(yv, xv)) + w + L0 - M, 360);
                distance = Math.sqrt(xv * xv + yv * yv);
                break;
            }
            case SE_MARS: {
                const L0 = mod(355.43328 + 68905103.78 * T + 0.00013 * T * T, 360);
                const M = mod(19.38709 + 68905056.31 * T - 0.00031 * T * T, 360);
                const e = 0.09340 + 0.00009 * T;
                const w = mod(286.50163 + 1.84133 * T + 0.000015 * T * T, 360);
                const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
                const xv = Math.cos(toRad(E)) - e;
                const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
                longitude = mod(toDeg(Math.atan2(yv, xv)) + w + L0 - M + 0.00702 * Math.sin(toRad(2 * (toDeg(Math.atan2(yv, xv)) + w - w)) - M, 360);
                distance = Math.sqrt(xv * xv + yv * yv);
                break;
            }
            case SE_JUPITER: {
                const L0 = mod(20.02815 + 10925660.23 * T - 0.00113 * T * T, 360);
                const M = mod(20.02815 + 10925496.85 * T - 0.00113 * T * T, 360);
                const e = 0.048498 + 0.000163 * T;
                const w = mod(273.87772 + 0.16452 * T - 0.000026 * T * T, 360);
                const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
                const xv = Math.cos(toRad(E)) - e;
                const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
                longitude = mod(toDeg(Math.atan2(yv, xv)) + w + L0 - M + 0.00547 * Math.sin(toRad(2 * (toDeg(Math.atan2(yv, xv)) + w - w)) - M, 360);
                distance = Math.sqrt(xv * xv + yv * yv);
                break;
            }
            case SE_SATURN: {
                const L0 = mod(317.02066 + 4399609.88 * T + 0.00014 * T * T, 360);
                const M = mod(317.02066 + 4399589.38 * T + 0.00014 * T * T, 360);
                const e = 0.055546 - 0.000365 * T;
                const w = mod(339.94444 + 0.87711 * T + 0.000018 * T * T, 360);
                const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
                const xv = Math.cos(toRad(E)) - e;
                const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
                longitude = mod(toDeg(Math.atan2(yv, xv)) + w + L0 - M + 0.00636 * Math.sin(toRad(2 * (toDeg(Math.atan2(yv, xv)) + w - w)) - M, 360);
                distance = Math.sqrt(xv * xv + yv * yv);
                break;
            }
            case SE_URANUS: {
                const L0 = mod(141.04987 + 1542481.53 * T - 0.00109 * T * T, 360);
                const M = mod(141.04987 + 1542478.76 * T - 0.00109 * T * T, 360);
                const e = 0.046321 - 0.000019 * T;
                const w = mod(96.66124 + 0.00249 * T + 0.000009 * T * T, 360);
                const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
                const xv = Math.cos(toRad(E)) - e;
                const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
                longitude = mod(toDeg(Math.atan2(yv, xv)) + w + L0 - M, 360);
                distance = Math.sqrt(xv * xv + yv * yv);
                break;
            }
            case SE_NEPTUNE: {
                const L0 = mod(330.65245 + 786506.41 * T + 0.00045 * T * T, 360);
                const M = mod(330.65245 + 786503.95 * T + 0.00045 * T * T, 360);
                const e = 0.008986 + 0.000007 * T;
                const w = mod(276.34164 + 0.00031 * T - 0.000005 * T * T, 360);
                const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
                const xv = Math.cos(toRad(E)) - e;
                const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
                longitude = mod(toDeg(Math.atan2(yv, xv)) + w + L0 - M, 360);
                distance = Math.sqrt(xv * xv + yv * yv);
                break;
            }
            case SE_PLUTO: {
                const L0 = mod(238.92903 + 470016.38 * T + 0.00001 * T * T, 360);
                const M = mod(238.92903 + 470010.06 * T + 0.00001 * T * T, 360);
                const e = 0.24882 - 0.000061 * T;
                const w = mod(110.30347 + 3.81490 * T + 0.000042 * T * T, 360);
                const E = M + e * 180 / Math.PI * Math.sin(toRad(M)) * (1 + e * Math.cos(toRad(M)));
                const xv = Math.cos(toRad(E)) - e;
                const yv = Math.sqrt(1 - e * e) * Math.sin(toRad(E));
                longitude = mod(toDeg(Math.atan2(yv, xv)) + w + L0 - M, 360);
                distance = Math.sqrt(xv * xv + yv * yv);
                break;
            }
        }

        return [longitude, latitude, distance];
    }

    return {
        SE_SUN: SE_SUN,
        SE_MOON: SE_MOON,
        SE_MERCURY: SE_MERCURY,
        SE_VENUS: SE_VENUS,
        SE_MARS: SE_MARS,
        SE_JUPITER: SE_JUPITER,
        SE_SATURN: SE_SATURN,
        SE_URANUS: SE_URANUS,
        SE_NEPTUNE: SE_NEPTUNE,
        SE_PLUTO: SE_PLUTO,
        swe_julday: swe_julday,
        swe_calc_ut: swe_calc_ut
    };
})();