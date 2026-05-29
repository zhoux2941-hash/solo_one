const ChartRenderer = (function() {
    let canvas, ctx;
    let centerX, centerY;
    let radius;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;
        radius = Math.min(centerX, centerY) - 40;
    }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawCircle(cx, cy, r, color, lineWidth = 1, fill = false) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    function drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    function drawText(text, x, y, color, fontSize = 12, font = 'Arial') {
        ctx.font = `${fontSize}px ${font}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }

    function drawSymbol(symbol, x, y, color, fontSize = 24) {
        ctx.font = `${fontSize}px serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, x, y);
    }

    function degreeToRadian(degree) {
        return (degree - 90) * Math.PI / 180;
    }

    function getPosition(degree, r) {
        const rad = degreeToRadian(degree);
        return {
            x: centerX + r * Math.cos(rad),
            y: centerY + r * Math.sin(rad)
        };
    }

    function drawZodiacSigns() {
        const zodiacNames = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', 
                            '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
        const zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
        
        for (let i = 0; i < 12; i++) {
            const startDegree = i * 30;
            const midDegree = startDegree + 15;
            const position = getPosition(midDegree, radius + 25);
            
            drawText(zodiacSymbols[i], position.x, position.y - 15, '#ffd700', 18);
            drawText(zodiacNames[i], position.x, position.y + 10, '#ccc', 10);
        }
    }

    function drawHouseDivisions() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 12; i++) {
            const degree = i * 30;
            const position = getPosition(degree, radius);
            drawLine(centerX, centerY, position.x, position.y);
        }
    }

    function drawRings() {
        drawCircle(centerX, centerY, radius, 'rgba(255, 255, 255, 0.5)', 2);
        drawCircle(centerX, centerY, radius * 0.85, 'rgba(255, 255, 255, 0.3)', 1);
        drawCircle(centerX, centerY, radius * 0.7, 'rgba(255, 255, 255, 0.2)', 1);
        drawCircle(centerX, centerY, radius * 0.15, 'rgba(255, 215, 0, 0.5)', 2);
    }

    function drawPlanet(planet) {
        const position = getPosition(planet.longitude, radius * 0.75);
        
        drawCircle(position.x, position.y, 12, planet.color, 2, true);
        drawCircle(position.x, position.y, 14, planet.color, 1);
        
        drawSymbol(planet.symbol, position.x, position.y, '#fff', 20);
        
        const degreeInSign = (planet.longitude - planet.zodiac.start + 360) % 30;
        const posForLabel = getPosition(planet.longitude, radius * 0.55);
        drawText(planet.zodiac.symbol + ' ' + degreeInSign.toFixed(1) + '°', 
                 posForLabel.x, posForLabel.y, '#aaa', 10);
    }

    function drawAspects(planets, tolerances) {
        const defaultTolerances = {
            conjunction: 8,
            sextile: 5,
            square: 8,
            trine: 8,
            opposition: 8
        };
        
        const t = { ...defaultTolerances, ...tolerances };
        
        const aspectConfig = [
            { angle: 0, name: '合相', color: '#ffd700', tolerance: t.conjunction },
            { angle: 60, name: '六分相', color: '#4fd0e0', tolerance: t.sextile },
            { angle: 90, name: '四分相', color: '#ff4444', tolerance: t.square },
            { angle: 120, name: '三分相', color: '#8bcf5a', tolerance: t.trine },
            { angle: 180, name: '冲相', color: '#9966cc', tolerance: t.opposition }
        ];

        for (let i = 0; i < planets.length; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                const p1 = planets[i];
                const p2 = planets[j];
                const diff = Math.abs(p1.longitude - p2.longitude);
                const normalizedDiff = Math.min(diff, 360 - diff);

                for (const aspect of aspectConfig) {
                    if (Math.abs(normalizedDiff - aspect.angle) < aspect.tolerance) {
                        const pos1 = getPosition(p1.longitude, radius * 0.75);
                        const pos2 = getPosition(p2.longitude, radius * 0.75);
                        
                        ctx.beginPath();
                        ctx.moveTo(pos1.x, pos1.y);
                        ctx.lineTo(pos2.x, pos2.y);
                        ctx.strokeStyle = aspect.color;
                        ctx.lineWidth = 1.5;
                        ctx.setLineDash([5, 3]);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        
                        const midX = (pos1.x + pos2.x) / 2;
                        const midY = (pos1.y + pos2.y) / 2;
                        drawText(aspect.angle.toString(), midX, midY, aspect.color, 10);
                    }
                }
            }
        }
    }

    function drawChart(planets, tolerances = {}) {
        clear();
        
        drawRings();
        drawHouseDivisions();
        drawZodiacSigns();
        drawAspects(planets, tolerances);
        
        for (const planet of planets) {
            drawPlanet(planet);
        }
    }

    return {
        init,
        drawChart
    };
})();