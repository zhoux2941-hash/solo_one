function renderMap(slopes, lifts) {
    const slopesGroup = document.getElementById('slopesGroup');
    const liftsGroup = document.getElementById('liftsGroup');
    
    slopesGroup.innerHTML = '';
    liftsGroup.innerHTML = '';

    const sortedSlopes = [...slopes].sort((a, b) => b.visitorCount - a.visitorCount);
    const startX = 60;
    const spacingX = 150;

    sortedSlopes.forEach((slope, index) => {
        const slopeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        slopeGroup.classList.add('slope-group');
        slopeGroup.dataset.slopeId = slope.id;

        const x = startX + index * spacingX;
        const y = slope.mapY || 80;
        const width = 110;
        const height = slope.mapHeight || 280;

        let fillColor;
        switch (slope.difficulty) {
            case 'BEGINNER':
                fillColor = slope.status === 'OPEN' ? '#4CAF50' : '#81c784';
                break;
            case 'INTERMEDIATE':
                fillColor = slope.status === 'OPEN' ? '#2196F3' : '#64b5f6';
                break;
            case 'ADVANCED':
                fillColor = slope.status === 'OPEN' ? '#f44336' : '#e57373';
                break;
            default:
                fillColor = '#9e9e9e';
        }

        if (slope.status === 'CLOSED') {
            fillColor = '#9e9e9e';
        } else if (slope.status === 'GROOMING') {
            fillColor = '#ffc107';
        }

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('rx', 8);
        rect.setAttribute('fill', fillColor);
        rect.setAttribute('stroke', '#fff');
        rect.setAttribute('stroke-width', 2);
        rect.classList.add('slope-shape');

        const patternId = `pattern-${slope.id}`;
        if (slope.status === 'GROOMING') {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
            pattern.setAttribute('id', patternId);
            pattern.setAttribute('patternUnits', 'userSpaceOnUse');
            pattern.setAttribute('width', 10);
            pattern.setAttribute('height', 10);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 10);
            line.setAttribute('x2', 10);
            line.setAttribute('y2', 0);
            line.setAttribute('stroke', 'rgba(255,255,255,0.3)');
            line.setAttribute('stroke-width', 1);
            
            pattern.appendChild(line);
            defs.appendChild(pattern);
            slopesGroup.appendChild(defs);
            rect.setAttribute('fill', `url(#${patternId})`);
            rect.setAttribute('style', `fill: ${fillColor}`);
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + width / 2);
        text.setAttribute('y', y + height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.classList.add('slope-label');
        text.textContent = slope.name;

        const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        statusText.setAttribute('x', x + width / 2);
        statusText.setAttribute('y', y + height / 2 + 20);
        statusText.setAttribute('text-anchor', 'middle');
        statusText.setAttribute('font-size', '10px');
        statusText.setAttribute('fill', '#fff');
        statusText.textContent = getStatusText(slope.status);

        const visitorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        visitorText.setAttribute('x', x + width / 2);
        visitorText.setAttribute('y', y + height / 2 + 40);
        visitorText.setAttribute('text-anchor', 'middle');
        visitorText.setAttribute('font-size', '11px');
        visitorText.setAttribute('fill', '#fff');
        visitorText.setAttribute('font-weight', 'bold');
        visitorText.textContent = `${slope.visitorCount}人`;

        slopeGroup.appendChild(rect);
        slopeGroup.appendChild(text);
        slopeGroup.appendChild(statusText);
        slopeGroup.appendChild(visitorText);

        slopeGroup.addEventListener('click', () => showSlopeInfo(slope));

        slopesGroup.appendChild(slopeGroup);
    });

    lifts.forEach(lift => {
        if (!lift.isActive) return;
        
        const liftGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        liftGroup.classList.add('lift-group');
        liftGroup.dataset.liftId = lift.id;

        const x = lift.mapX || 100;
        const y = lift.mapY || 400;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 25);
        
        let liftColor;
        switch (lift.type) {
            case 'MAGIC_CARPET':
                liftColor = '#9c27b0';
                break;
            case 'CHAIRLIFT':
                liftColor = '#ff9800';
                break;
            case 'GONDOLA':
                liftColor = '#00bcd4';
                break;
            default:
                liftColor = '#607d8b';
        }
        
        circle.setAttribute('fill', liftColor);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', 3);
        circle.classList.add('lift-marker');

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', x);
        icon.setAttribute('y', y + 5);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('font-size', '20px');
        icon.setAttribute('fill', '#fff');
        icon.textContent = '🚠';

        const name = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        name.setAttribute('x', x);
        name.setAttribute('y', y + 45);
        name.setAttribute('text-anchor', 'middle');
        name.setAttribute('font-size', '11px');
        name.setAttribute('fill', '#333');
        name.setAttribute('font-weight', 'bold');
        name.textContent = lift.name;

        const waitTime = lift.estimatedWaitTimeMinutes || Math.ceil(lift.currentQueue / (lift.capacityPerHour / 60));
        const queueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        queueLabel.setAttribute('x', x);
        queueLabel.setAttribute('y', y - 35);
        queueLabel.setAttribute('text-anchor', 'middle');
        queueLabel.setAttribute('font-size', '11px');
        queueLabel.setAttribute('font-weight', 'bold');
        queueLabel.setAttribute('fill', waitTime > 10 ? '#f44336' : '#28a745');
        queueLabel.textContent = `等待 ${waitTime}分`;

        liftGroup.appendChild(circle);
        liftGroup.appendChild(icon);
        liftGroup.appendChild(name);
        liftGroup.appendChild(queueLabel);

        liftGroup.addEventListener('click', () => showLiftInfo(lift));

        liftsGroup.appendChild(liftGroup);
    });
}

function getStatusText(status) {
    const statusMap = {
        'OPEN': '开放',
        'CLOSED': '关闭',
        'GROOMING': '压雪中'
    };
    return statusMap[status] || status;
}

function getDifficultyText(difficulty) {
    const difficultyMap = {
        'BEGINNER': '初级',
        'INTERMEDIATE': '中级',
        'ADVANCED': '高级'
    };
    return difficultyMap[difficulty] || difficulty;
}

function showSlopeInfo(slope) {
    alert(`${slope.name}\n难度: ${getDifficultyText(slope.difficulty)}\n状态: ${getStatusText(slope.status)}\n今日客流量: ${slope.visitorCount}人`);
}

function showLiftInfo(lift) {
    const waitTime = lift.estimatedWaitTimeMinutes || Math.ceil(lift.currentQueue / (lift.capacityPerHour / 60));
    alert(`${lift.name}\n类型: ${getLiftTypeText(lift.type)}\n当前排队: ${lift.currentQueue}人\n预计等待: ${waitTime}分钟`);
}

function getLiftTypeText(type) {
    const typeMap = {
        'MAGIC_CARPET': '魔毯',
        'CHAIRLIFT': '缆车',
        'GONDOLA': '吊箱',
        'T_BAR': 'T型杆'
    };
    return typeMap[type] || type;
}

function renderLiftQueuePanel(lifts) {
    const container = document.getElementById('liftQueueList');
    container.innerHTML = '';

    lifts.forEach(lift => {
        if (!lift.isActive) return;
        
        const waitTime = lift.estimatedWaitTimeMinutes || Math.ceil(lift.currentQueue / (lift.capacityPerHour / 60));
        
        const item = document.createElement('div');
        item.classList.add('lift-queue-item');
        
        if (waitTime > 15) {
            item.classList.add('danger');
        } else if (waitTime > 10) {
            item.classList.add('warning');
        }

        item.innerHTML = `
            <div class="lift-queue-name">${lift.name}</div>
            <div class="lift-queue-info">
                <span>排队: ${lift.currentQueue}人</span>
                <span class="wait-time ${waitTime > 15 ? 'danger' : waitTime > 10 ? 'warning' : ''}">
                    等待 ${waitTime} 分
                </span>
            </div>
        `;

        container.appendChild(item);
    });
}
