let currentDynasty = 'sui';
let selectedSegment = null;
let compareMode = false;
let compareDynasty = 'tang';

document.addEventListener('DOMContentLoaded', function() {
    initDynastyButtons();
    initCompareMode();
    initCalculator();
    loadDynasty('sui');
});

function initDynastyButtons() {
    const buttons = document.querySelectorAll('.dynasty-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const dynasty = this.dataset.dynasty;
            loadDynasty(dynasty);
        });
    });
}

function initCompareMode() {
    const compareToggle = document.getElementById('compareMode');
    const compareDynastySelect = document.getElementById('compareDynastySelect');
    const compareDynastyDropdown = document.getElementById('compareDynasty');

    compareToggle.addEventListener('change', function() {
        compareMode = this.checked;
        if (compareMode) {
            compareDynastySelect.classList.remove('hidden');
            document.getElementById('compareSection').classList.remove('hidden');
            updateComparison();
        } else {
            compareDynastySelect.classList.add('hidden');
            document.getElementById('compareSection').classList.add('hidden');
        }
    });

    compareDynastyDropdown.addEventListener('change', function() {
        compareDynasty = this.value;
        updateComparison();
    });
}

function initCalculator() {
    const inputVolume = document.getElementById('inputVolume');
    inputVolume.addEventListener('input', calculateLoss);
}

function loadDynasty(dynasty) {
    currentDynasty = dynasty;
    
    document.querySelectorAll('.dynasty-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.dynasty === dynasty) {
            btn.classList.add('active');
        }
    });

    renderCanals(dynasty);
    renderCities(dynasty);
    
    selectedSegment = null;
    document.getElementById('segmentInfo').classList.add('hidden');
    document.getElementById('calcResult').classList.add('hidden');
    
    if (compareMode) {
        updateComparison();
    }
}

function renderCanals(dynasty) {
    const canalsGroup = document.getElementById('canals');
    canalsGroup.innerHTML = '';
    
    const data = canalData[dynasty];
    if (!data) return;

    data.segments.forEach(segment => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', segment.path);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', data.color);
        path.setAttribute('stroke-width', '5');
        path.setAttribute('class', 'canal-segment');
        path.setAttribute('data-id', segment.id);
        path.setAttribute('data-dynasty', dynasty);
        
        if (segment.id.includes('sea')) {
            path.setAttribute('stroke-dasharray', '10, 5');
        }
        
        path.addEventListener('click', function() {
            selectSegment(segment, dynasty);
        });
        
        canalsGroup.appendChild(path);
    });
}

function renderCities(dynasty) {
    const citiesGroup = document.getElementById('cities');
    citiesGroup.innerHTML = '';
    
    const data = canalData[dynasty];
    if (!data) return;

    const usedCities = new Set();
    data.segments.forEach(segment => {
        usedCities.add(segment.from);
        usedCities.add(segment.to);
    });

    usedCities.forEach(cityKey => {
        const city = cities[cityKey];
        if (!city) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', city.x);
        circle.setAttribute('cy', city.y);
        circle.setAttribute('r', '6');
        circle.setAttribute('class', 'city-dot');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', city.x + 10);
        text.setAttribute('y', city.y + 4);
        text.setAttribute('class', 'city-label');
        text.textContent = city.name;
        
        g.appendChild(circle);
        g.appendChild(text);
        citiesGroup.appendChild(g);
    });
}

function selectSegment(segment, dynasty) {
    document.querySelectorAll('.canal-segment').forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.id === segment.id) {
            el.classList.add('selected');
        }
    });

    selectedSegment = segment;
    showSegmentInfo(segment, dynasty);
}

function showSegmentInfo(segment, dynasty) {
    const segmentInfo = document.getElementById('segmentInfo');
    segmentInfo.classList.remove('hidden');

    document.getElementById('segmentTitle').textContent = segment.name + ' (' + segment.route + ')';
    document.getElementById('infoDynasty').textContent = dynastyNames[dynasty];
    document.getElementById('infoLength').textContent = segment.length;
    document.getElementById('infoVolume').textContent = segment.volume;
    document.getElementById('infoTime').textContent = segment.time;
    document.getElementById('infoLossRate').textContent = (segment.lossRate * 100).toFixed(1) + '%';

    calculateLoss();
    
    if (compareMode) {
        updateComparison();
    }
}

function calculateLoss() {
    const inputValue = document.getElementById('inputVolume').value.trim();
    
    if (!selectedSegment || inputValue === '') {
        document.getElementById('calcResult').classList.add('hidden');
        return;
    }

    const inputVolume = parseFloat(inputValue);
    if (isNaN(inputVolume) || inputVolume <= 0) {
        document.getElementById('calcResult').classList.add('hidden');
        return;
    }

    const lossRate = selectedSegment.lossRate;
    const lossAmount = inputVolume * lossRate;
    const arrivalAmount = inputVolume - lossAmount;

    document.getElementById('resultInput').textContent = inputVolume.toFixed(2) + ' 万石';
    document.getElementById('resultLoss').textContent = lossAmount.toFixed(2) + ' 万石';
    document.getElementById('resultArrival').textContent = arrivalAmount.toFixed(2) + ' 万石';

    document.getElementById('calcResult').classList.remove('hidden');
}

function updateComparison() {
    if (!compareMode) {
        document.getElementById('compareSection').classList.add('hidden');
        return;
    }

    const compareSection = document.getElementById('compareSection');
    compareSection.classList.remove('hidden');

    document.getElementById('compareName1').textContent = dynastyNames[currentDynasty];
    document.getElementById('compareName2').textContent = dynastyNames[compareDynasty];

    if (!selectedSegment) {
        const noDataText = '请先选择河段';
        document.getElementById('compareRate1').textContent = noDataText;
        document.getElementById('compareRate1').className = 'no-data';
        document.getElementById('compareVolume1').textContent = noDataText;
        document.getElementById('compareVolume1').className = 'no-data';
        document.getElementById('compareTime1').textContent = noDataText;
        document.getElementById('compareTime1').className = 'no-data';
        document.getElementById('compareRate2').textContent = noDataText;
        document.getElementById('compareRate2').className = 'no-data';
        document.getElementById('compareVolume2').textContent = noDataText;
        document.getElementById('compareVolume2').className = 'no-data';
        document.getElementById('compareTime2').textContent = noDataText;
        document.getElementById('compareTime2').className = 'no-data';
        document.getElementById('compareConclusion').textContent = '请在地图上点击选择一个漕运河段，然后进行对比。';
        document.getElementById('compareConclusion').className = 'conclusion warning';
        return;
    } else {
        document.getElementById('compareRate1').className = '';
        document.getElementById('compareVolume1').className = '';
        document.getElementById('compareTime1').className = '';
    }

    const segment1 = selectedSegment;
    const segment2 = findSimilarSegment(selectedSegment, compareDynasty);

    document.getElementById('compareRate1').textContent = (segment1.lossRate * 100).toFixed(1) + '%';
    document.getElementById('compareVolume1').textContent = segment1.volume;
    document.getElementById('compareTime1').textContent = segment1.time;

    if (segment2) {
        document.getElementById('compareRate2').textContent = (segment2.lossRate * 100).toFixed(1) + '%';
        document.getElementById('compareRate2').className = '';
        document.getElementById('compareVolume2').textContent = segment2.volume;
        document.getElementById('compareVolume2').className = '';
        document.getElementById('compareTime2').textContent = segment2.time;
        document.getElementById('compareTime2').className = '';

        const rateDiff = ((segment2.lossRate - segment1.lossRate) * 100).toFixed(1);
        let conclusion = '';
        
        if (segment1.lossRate < segment2.lossRate) {
            conclusion = `${dynastyNames[currentDynasty]}的${segment1.name}损耗率比${dynastyNames[compareDynasty]}低${Math.abs(rateDiff)}%，运输效率更高。`;
        } else if (segment1.lossRate > segment2.lossRate) {
            conclusion = `${dynastyNames[currentDynasty]}的${segment1.name}损耗率比${dynastyNames[compareDynasty]}高${Math.abs(rateDiff)}%，运输效率较低。`;
        } else {
            conclusion = `两个朝代的${segment1.name}损耗率相同。`;
        }
        
        document.getElementById('compareConclusion').textContent = conclusion;
        document.getElementById('compareConclusion').className = 'conclusion';
    } else {
        const noRouteText = '该朝代无此漕运路线';
        document.getElementById('compareRate2').textContent = noRouteText;
        document.getElementById('compareRate2').className = 'no-data';
        document.getElementById('compareVolume2').textContent = noRouteText;
        document.getElementById('compareVolume2').className = 'no-data';
        document.getElementById('compareTime2').textContent = noRouteText;
        document.getElementById('compareTime2').className = 'no-data';
        document.getElementById('compareConclusion').textContent = `⚠️ ${dynastyNames[compareDynasty]}时期没有"${segment1.name}"这条漕运路线，无法进行对比。`;
        document.getElementById('compareConclusion').className = 'conclusion error';
    }
}

function findSimilarSegment(segment, targetDynasty) {
    const targetData = canalData[targetDynasty];
    if (!targetData) return null;

    const baseName = segment.id.split('_').pop();
    
    for (const seg of targetData.segments) {
        if (seg.id.includes(baseName) || seg.name === segment.name) {
            return seg;
        }
    }

    return null;
}