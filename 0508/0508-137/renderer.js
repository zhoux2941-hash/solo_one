const { ipcRenderer } = require('electron');

let allSpecimens = [];
let selectedSpecimens = [];
let currentTemplate = null;
let selectedField = null;
let editingId = null;
let map = null;
let mapMarkers = [];
let speciesColors = {};
let visibleSpecies = new Set();

const colorPalette = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#00bcd4',
    '#8bc34a', '#ff9800', '#673ab7', '#009688', '#ff5722',
    '#795548', '#607d8b', '#cddc39', '#03a9f4', '#f44336'
];

document.addEventListener('DOMContentLoaded', async () => {
    await loadSpecimens();
    await loadTemplate();
    setupNavigation();
    setupForm();
    setupSelectAll();
    setupSearch();
    setupMapFilter();
});

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            showPage(page);
        });
    });
}

function showPage(pageName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === pageName);
    });

    if (pageName === 'template') {
        updateTemplatePreview();
    } else if (pageName === 'print') {
        renderPrintList();
    } else if (pageName === 'map') {
        initMap();
    }
}

function setupForm() {
    const form = document.getElementById('specimen-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const specimen = {
            scientific_name: formData.get('scientific_name'),
            collection_loc: formData.get('collection_loc'),
            lat: formData.get('lat') || null,
            lon: formData.get('lon') || null,
            elevation: formData.get('elevation') || null,
            collector: formData.get('collector') || '',
            date: formData.get('date') || '',
            identifier: formData.get('identifier') || ''
        };

        if (editingId) {
            specimen.id = editingId;
            await ipcRenderer.invoke('update-specimen', specimen);
            alert('标本更新成功！');
        } else {
            await ipcRenderer.invoke('add-specimen', specimen);
            alert('标本保存成功！');
        }

        resetForm();
        await loadSpecimens();
    });
}

function resetForm() {
    document.getElementById('specimen-form').reset();
    editingId = null;
}

async function loadSpecimens() {
    allSpecimens = await ipcRenderer.invoke('get-all-specimens');
    renderSpecimenList();
}

function renderSpecimenList() {
    const container = document.getElementById('specimen-list');

    if (allSpecimens.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无标本记录，请添加或导入数据</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th width="40"></th>
                    <th>ID</th>
                    <th>学名</th>
                    <th>采集地</th>
                    <th>经纬度</th>
                    <th>采集人</th>
                    <th>日期</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;

    allSpecimens.forEach(specimen => {
        const isSelected = selectedSpecimens.includes(specimen.id);
        const coords = [specimen.lat, specimen.lon].filter(v => v != null).join(', ');

        html += `
            <tr>
                <td><input type="checkbox" class="specimen-checkbox" data-id="${specimen.id}" ${isSelected ? 'checked' : ''} onchange="toggleSelection(${specimen.id})"></td>
                <td>${specimen.id}</td>
                <td>${specimen.scientific_name || '-'}</td>
                <td>${specimen.collection_loc || '-'}</td>
                <td>${coords || '-'}</td>
                <td>${specimen.collector || '-'}</td>
                <td>${specimen.date || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-primary" onclick="viewDetail(${specimen.id})">详情</button>
                        <button class="btn btn-secondary" onclick="editSpecimen(${specimen.id})">编辑</button>
                        <button class="btn btn-danger" onclick="deleteSpecimen(${specimen.id})">删除</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

async function searchSpecimens() {
    const keyword = document.getElementById('search-keyword').value;
    const type = document.getElementById('search-type').value;

    if (!keyword) {
        await loadSpecimens();
        return;
    }

    allSpecimens = await ipcRenderer.invoke('search-specimens', { keyword, type });
    renderSpecimenList();
}

function setupSearch() {
    const input = document.getElementById('search-keyword');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSpecimens();
        }
    });
}

async function viewDetail(id) {
    const specimen = await ipcRenderer.invoke('get-specimen', id);
    const qrDataUrl = await ipcRenderer.invoke('generate-qr', {
        id: specimen.id,
        scientific_name: specimen.scientific_name,
        collection_loc: specimen.collection_loc,
        lat: specimen.lat,
        lon: specimen.lon,
        elevation: specimen.elevation,
        collector: specimen.collector,
        date: specimen.date,
        identifier: specimen.identifier
    });

    const html = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">ID</div>
                <div class="detail-value">${specimen.id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">学名</div>
                <div class="detail-value">${specimen.scientific_name || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">采集地</div>
                <div class="detail-value">${specimen.collection_loc || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">经纬度</div>
                <div class="detail-value">${[specimen.lat, specimen.lon].filter(v => v != null).join(', ') || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">海拔</div>
                <div class="detail-value">${specimen.elevation != null ? specimen.elevation + 'm' : '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">采集人</div>
                <div class="detail-value">${specimen.collector || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">采集日期</div>
                <div class="detail-value">${specimen.date || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">鉴定人</div>
                <div class="detail-value">${specimen.identifier || '-'}</div>
            </div>
        </div>
        <div class="qr-preview">
            <img src="${qrDataUrl}" alt="QR Code">
            <p style="margin-top: 10px; color: #666;">扫描二维码查看标本详情</p>
        </div>
    `;

    document.getElementById('detail-content').innerHTML = html;
    openModal('detail-modal');
}

async function editSpecimen(id) {
    const specimen = await ipcRenderer.invoke('get-specimen', id);
    
    const form = document.getElementById('specimen-form');
    form.querySelector('[name="scientific_name"]').value = specimen.scientific_name || '';
    form.querySelector('[name="collection_loc"]').value = specimen.collection_loc || '';
    form.querySelector('[name="lat"]').value = specimen.lat || '';
    form.querySelector('[name="lon"]').value = specimen.lon || '';
    form.querySelector('[name="elevation"]').value = specimen.elevation || '';
    form.querySelector('[name="collector"]').value = specimen.collector || '';
    form.querySelector('[name="date"]').value = specimen.date || '';
    form.querySelector('[name="identifier"]').value = specimen.identifier || '';
    
    editingId = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteSpecimen(id) {
    if (confirm('确定要删除该标本记录吗？')) {
        await ipcRenderer.invoke('delete-specimen', id);
        await loadSpecimens();
        selectedSpecimens = selectedSpecimens.filter(sid => sid !== id);
    }
}

function setupSelectAll() {
    document.getElementById('select-all').addEventListener('change', (e) => {
        if (e.target.checked) {
            selectedSpecimens = allSpecimens.map(s => s.id);
        } else {
            selectedSpecimens = [];
        }
        document.querySelectorAll('.specimen-checkbox').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });
}

function toggleSelection(id) {
    const index = selectedSpecimens.indexOf(id);
    if (index === -1) {
        selectedSpecimens.push(id);
    } else {
        selectedSpecimens.splice(index, 1);
    }
}

function goToPrint() {
    if (selectedSpecimens.length === 0) {
        alert('请先选择要打印的标本');
        return;
    }
    showPage('print');
}

function renderPrintList() {
    const container = document.getElementById('print-list');
    const specimens = allSpecimens.filter(s => selectedSpecimens.includes(s.id));

    if (specimens.length === 0) {
        container.innerHTML = '<div class="empty-state">请先在标本管理页面选择要打印的标本</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>学名</th>
                    <th>采集地</th>
                    <th>采集人</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;

    specimens.forEach(specimen => {
        html += `
            <tr>
                <td>${specimen.id}</td>
                <td>${specimen.scientific_name || '-'}</td>
                <td>${specimen.collection_loc || '-'}</td>
                <td>${specimen.collector || '-'}</td>
                <td>
                    <button class="btn btn-danger" onclick="removeFromPrint(${specimen.id})">移除</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function removeFromPrint(id) {
    selectedSpecimens = selectedSpecimens.filter(sid => sid !== id);
    renderPrintList();
    renderSpecimenList();
}

async function importExcel() {
    const result = await ipcRenderer.invoke('import-excel');
    if (result.success) {
        alert(`成功导入 ${result.count} 条标本记录`);
        await loadSpecimens();
    }
}

async function loadTemplate() {
    currentTemplate = await ipcRenderer.invoke('get-template', 'default');
    if (!currentTemplate) {
        currentTemplate = {
            labelsPerPage: 8,
            labelWidth: 90,
            labelHeight: 50,
            pageMargins: { top: 10, bottom: 10, left: 15, right: 15 },
            labelMargins: { top: 2, bottom: 2, left: 3, right: 3 },
            fields: [
                { key: 'scientific_name', label: '学名', x: 5, y: 5, width: 80, height: 10, fontSize: 12, visible: true },
                { key: 'collection_loc', label: '采集地', x: 5, y: 17, width: 80, height: 8, fontSize: 9, visible: true },
                { key: 'coord_elevation', label: '经纬度/海拔', x: 5, y: 27, width: 80, height: 8, fontSize: 8, visible: true },
                { key: 'collector_date', label: '采集人/日期', x: 5, y: 37, width: 80, height: 8, fontSize: 8, visible: true },
                { key: 'identifier', label: '鉴定人', x: 5, y: 45, width: 80, height: 5, fontSize: 8, visible: true },
                { key: 'qr', label: '二维码', x: 70, y: 5, width: 18, height: 18, visible: true }
            ]
        };
    }

    document.getElementById('labels-per-page').value = currentTemplate.labelsPerPage;
    document.getElementById('label-width').value = currentTemplate.labelWidth;
    document.getElementById('label-height').value = currentTemplate.labelHeight;
    
    renderFieldConfigs();
    updateTemplatePreview();
}

function renderFieldConfigs() {
    const container = document.getElementById('field-configs');
    let html = '';

    currentTemplate.fields.forEach((field, index) => {
        html += `
            <div class="field-config" data-index="${index}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0;">${field.label}</h4>
                    <label>
                        <input type="checkbox" ${field.visible ? 'checked' : ''} onchange="toggleFieldVisibility(${index})"> 显示
                    </label>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>X (mm)</label>
                        <input type="number" value="${field.x}" step="1" onchange="updateFieldValue(${index}, 'x', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Y (mm)</label>
                        <input type="number" value="${field.y}" step="1" onchange="updateFieldValue(${index}, 'y', this.value)">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>宽度 (mm)</label>
                        <input type="number" value="${field.width}" step="1" onchange="updateFieldValue(${index}, 'width', this.value)">
                    </div>
                    <div class="form-group">
                        <label>高度 (mm)</label>
                        <input type="number" value="${field.height}" step="1" onchange="updateFieldValue(${index}, 'height', this.value)">
                    </div>
                </div>
                ${field.key !== 'qr' ? `
                    <div class="form-group">
                        <label>字号</label>
                        <input type="number" value="${field.fontSize}" step="1" onchange="updateFieldValue(${index}, 'fontSize', this.value)">
                    </div>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

function toggleFieldVisibility(index) {
    currentTemplate.fields[index].visible = !currentTemplate.fields[index].visible;
    updateTemplatePreview();
}

function updateFieldValue(index, key, value) {
    currentTemplate.fields[index][key] = parseFloat(value);
    updateTemplatePreview();
}

function updateTemplatePreview() {
    currentTemplate.labelsPerPage = parseInt(document.getElementById('labels-per-page').value) || 8;
    currentTemplate.labelWidth = parseInt(document.getElementById('label-width').value) || 90;
    currentTemplate.labelHeight = parseInt(document.getElementById('label-height').value) || 50;

    const labelGrid = document.getElementById('label-grid');
    labelGrid.innerHTML = '';

    for (let i = 0; i < currentTemplate.labelsPerPage; i++) {
        const label = document.createElement('div');
        label.className = 'label';
        label.style.width = `${currentTemplate.labelWidth}mm`;
        label.style.height = `${currentTemplate.labelHeight}mm`;

        currentTemplate.fields.forEach((field, fieldIndex) => {
            if (!field.visible) return;

            const fieldEl = document.createElement('div');
            fieldEl.className = `label-field ${field.key === 'qr' ? 'qr-field' : ''}`;
            fieldEl.style.left = `${field.x}mm`;
            fieldEl.style.top = `${field.y}mm`;
            fieldEl.style.width = `${field.width}mm`;
            fieldEl.style.height = `${field.height}mm`;
            fieldEl.style.fontSize = `${field.fontSize || 10}pt`;
            fieldEl.dataset.fieldIndex = fieldIndex;

            if (field.key === 'qr') {
                fieldEl.textContent = 'QR';
                fieldEl.style.textAlign = 'center';
                fieldEl.style.display = 'flex';
                fieldEl.style.alignItems = 'center';
                fieldEl.style.justifyContent = 'center';
                fieldEl.style.fontSize = '8pt';
            } else {
                fieldEl.textContent = field.label;
            }

            fieldEl.addEventListener('click', () => selectField(fieldEl, fieldIndex));
            
            if (i === 0) {
                setupDrag(fieldEl, fieldIndex);
            }

            label.appendChild(fieldEl);
        });

        labelGrid.appendChild(label);
    }
}

function selectField(element, fieldIndex) {
    document.querySelectorAll('.label-field').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.label-field[data-field-index="' + fieldIndex + '"]').forEach(el => el.classList.add('selected'));
    selectedField = fieldIndex;
    
    const configs = document.querySelectorAll('.field-config');
    configs.forEach(config => config.style.outline = '');
    configs[fieldIndex].style.outline = '2px solid #e74c3c';
    configs[fieldIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setupDrag(element, fieldIndex) {
    let isDragging = false;
    let startX, startY, startFieldX, startFieldY;
    const label = element.parentElement;

    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startFieldX = currentTemplate.fields[fieldIndex].x;
        startFieldY = currentTemplate.fields[fieldIndex].y;
        selectField(element, fieldIndex);
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = (e.clientX - startX) / 4.5;
        const dy = (e.clientY - startY) / 4.5;

        let newX = Math.max(0, Math.min(currentTemplate.labelWidth - currentTemplate.fields[fieldIndex].width, startFieldX + dx));
        let newY = Math.max(0, Math.min(currentTemplate.labelHeight - currentTemplate.fields[fieldIndex].height, startFieldY + dy));

        currentTemplate.fields[fieldIndex].x = Math.round(newX);
        currentTemplate.fields[fieldIndex].y = Math.round(newY);

        updateTemplatePreview();
        renderFieldConfigs();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

async function saveTemplate() {
    await ipcRenderer.invoke('save-template', { name: 'default', config: currentTemplate });
    alert('模板保存成功！');
}

async function resetTemplate() {
    if (confirm('确定要重置为默认模板吗？')) {
        const defaultConfig = {
            labelsPerPage: 8,
            labelWidth: 90,
            labelHeight: 50,
            pageMargins: { top: 10, bottom: 10, left: 15, right: 15 },
            labelMargins: { top: 2, bottom: 2, left: 3, right: 3 },
            fields: [
                { key: 'scientific_name', label: '学名', x: 5, y: 5, width: 80, height: 10, fontSize: 12, visible: true },
                { key: 'collection_loc', label: '采集地', x: 5, y: 17, width: 80, height: 8, fontSize: 9, visible: true },
                { key: 'coord_elevation', label: '经纬度/海拔', x: 5, y: 27, width: 80, height: 8, fontSize: 8, visible: true },
                { key: 'collector_date', label: '采集人/日期', x: 5, y: 37, width: 80, height: 8, fontSize: 8, visible: true },
                { key: 'identifier', label: '鉴定人', x: 5, y: 45, width: 80, height: 5, fontSize: 8, visible: true },
                { key: 'qr', label: '二维码', x: 70, y: 5, width: 18, height: 18, visible: true }
            ]
        };
        currentTemplate = defaultConfig;
        await ipcRenderer.invoke('save-template', { name: 'default', config: currentTemplate });
        document.getElementById('labels-per-page').value = currentTemplate.labelsPerPage;
        document.getElementById('label-width').value = currentTemplate.labelWidth;
        document.getElementById('label-height').value = currentTemplate.labelHeight;
        renderFieldConfigs();
        updateTemplatePreview();
        alert('模板已重置为默认');
    }
}

async function generatePDF() {
    if (selectedSpecimens.length === 0) {
        alert('请先选择要打印的标本');
        return;
    }

    const specimens = allSpecimens.filter(s => selectedSpecimens.includes(s.id));
    const result = await ipcRenderer.invoke('generate-pdf', { specimens, template: currentTemplate });

    if (result.success) {
        alert(`PDF已生成：${result.path}`);
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function setupMapFilter() {
    const filterSelect = document.getElementById('map-filter-species');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            refreshMap();
        });
    }
}

function initMap() {
    if (map) {
        map.invalidateSize();
        refreshMap();
        return;
    }

    setTimeout(() => {
        map = L.map('map-container').setView([35, 105], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        refreshMap();
    }, 100);
}

function refreshMap() {
    if (!map) {
        initMap();
        return;
    }

    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    const specimensWithCoords = allSpecimens.filter(s => 
        s.lat != null && s.lon != null && 
        !isNaN(parseFloat(s.lat)) && !isNaN(parseFloat(s.lon))
    );

    const filterSelect = document.getElementById('map-filter-species');
    const filterValue = filterSelect ? filterSelect.value : 'all';

    assignSpeciesColors();
    updateSpeciesFilter();
    updateMapStats();
    renderLegend();

    let filteredSpecimens = specimensWithCoords;
    if (filterValue !== 'all') {
        filteredSpecimens = specimensWithCoords.filter(s => 
            (s.scientific_name || '未鉴定') === filterValue
        );
    }

    filteredSpecimens = filteredSpecimens.filter(s => 
        visibleSpecies.has(s.scientific_name || '未鉴定')
    );

    const bounds = [];

    filteredSpecimens.forEach(specimen => {
        const speciesName = specimen.scientific_name || '未鉴定';
        const color = speciesColors[speciesName] || '#999';

        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 24px;
                height: 24px;
                background: ${color};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                cursor: pointer;
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });

        const coords = [parseFloat(specimen.lat), parseFloat(specimen.lon)];
        const marker = L.marker(coords, { icon }).addTo(map);

        const popupContent = `
            <div class="custom-popup">
                <div class="popup-title">${speciesName}</div>
                <div class="popup-detail">
                    <span class="popup-detail-label">采集地：</span>${specimen.collection_loc || '-'}
                </div>
                <div class="popup-detail">
                    <span class="popup-detail-label">经纬度：</span>${specimen.lat?.toFixed(4) || '-'}, ${specimen.lon?.toFixed(4) || '-'}
                </div>
                ${specimen.elevation ? `<div class="popup-detail"><span class="popup-detail-label">海拔：</span>${specimen.elevation}m</div>` : ''}
                <div class="popup-detail">
                    <span class="popup-detail-label">采集人：</span>${specimen.collector || '-'}
                </div>
                <div class="popup-detail">
                    <span class="popup-detail-label">采集日期：</span>${specimen.date || '-'}
                </div>
                ${specimen.identifier ? `<div class="popup-detail"><span class="popup-detail-label">鉴定人：</span>${specimen.identifier}</div>` : ''}
            </div>
        `;

        marker.bindPopup(popupContent);
        mapMarkers.push(marker);
        bounds.push(coords);
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

function assignSpeciesColors() {
    const speciesMap = {};
    allSpecimens.forEach(s => {
        const name = s.scientific_name || '未鉴定';
        if (!speciesMap[name]) {
            speciesMap[name] = 0;
        }
        speciesMap[name]++;
    });

    const sortedSpecies = Object.entries(speciesMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);

    speciesColors = {};
    visibleSpecies = new Set();

    sortedSpecies.forEach((name, index) => {
        speciesColors[name] = colorPalette[index % colorPalette.length];
        visibleSpecies.add(name);
    });
}

function updateSpeciesFilter() {
    const filterSelect = document.getElementById('map-filter-species');
    if (!filterSelect) return;

    const currentValue = filterSelect.value;

    filterSelect.innerHTML = '<option value="all">全部物种</option>';

    Object.keys(speciesColors).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        filterSelect.appendChild(option);
    });

    if (currentValue && Object.keys(speciesColors).includes(currentValue)) {
        filterSelect.value = currentValue;
    }
}

function updateMapStats() {
    const total = allSpecimens.length;
    const withCoords = allSpecimens.filter(s => 
        s.lat != null && s.lon != null && 
        !isNaN(parseFloat(s.lat)) && !isNaN(parseFloat(s.lon))
    ).length;
    const speciesCount = Object.keys(speciesColors).length;

    const totalEl = document.getElementById('stat-total');
    const withCoordEl = document.getElementById('stat-with-coord');
    const speciesEl = document.getElementById('stat-species');

    if (totalEl) totalEl.textContent = total;
    if (withCoordEl) withCoordEl.textContent = withCoords;
    if (speciesEl) speciesEl.textContent = speciesCount;
}

function renderLegend() {
    const legendContainer = document.getElementById('species-legend');
    if (!legendContainer) return;

    if (Object.keys(speciesColors).length === 0) {
        legendContainer.innerHTML = '<div class="empty-state" style="padding: 20px; color: #999;">暂无标本数据</div>';
        return;
    }

    let html = '';

    Object.entries(speciesColors).forEach(([name, color]) => {
        const count = allSpecimens.filter(s => 
            (s.scientific_name || '未鉴定') === name
        ).length;

        const isVisible = visibleSpecies.has(name);

        html += `
            <div class="legend-item ${isVisible ? '' : 'hidden'}" 
                 onclick="toggleSpeciesVisibility('${name}')"
                 title="点击显示/隐藏该物种">
                <div class="legend-color" style="background: ${color};"></div>
                <div class="legend-name">${name}</div>
                <div class="legend-count">${count}</div>
            </div>
        `;
    });

    legendContainer.innerHTML = html;
}

function toggleSpeciesVisibility(speciesName) {
    if (visibleSpecies.has(speciesName)) {
        visibleSpecies.delete(speciesName);
    } else {
        visibleSpecies.add(speciesName);
    }
    refreshMap();
}

function loadMapData() {
    refreshMap();
}
