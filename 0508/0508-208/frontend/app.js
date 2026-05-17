const API_BASE = 'http://localhost:8080/api';

let selectedPhotoBase64 = null;

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('foundDate').value = today;
    document.getElementById('lostDate').value = today;
    document.getElementById('appointment-date').value = today;

    document.getElementById('found-item-form').addEventListener('submit', submitFoundItem);
    document.getElementById('lost-claim-form').addEventListener('submit', submitLostClaim);
    document.getElementById('appointment-form').addEventListener('submit', submitAppointment);
});

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(section + '-section').style.display = 'block';
    event.target.classList.add('active');

    if (section === 'staff') {
        loadFoundItems();
        loadLostClaims();
        loadClaimSelect();
        loadAppointments();
    } else {
        loadPassengerClaimSelect();
    }
}

function showStaffTab(tab) {
    document.querySelectorAll('#staff-section .tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('#staff-section .sub-nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById('staff-' + tab).style.display = 'block';
    event.target.classList.add('active');

    if (tab === 'items') loadFoundItems();
    if (tab === 'claims') loadLostClaims();
    if (tab === 'matches') loadClaimSelect();
    if (tab === 'appointments') loadAppointments();
}

function showPassengerTab(tab) {
    document.querySelectorAll('#passenger-section .tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('#passenger-section .sub-nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById('passenger-' + tab).style.display = 'block';
    event.target.classList.add('active');

    if (tab === 'appointment') loadPassengerClaimSelect();
}

function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedPhotoBase64 = e.target.result;
            const preview = document.getElementById('photo-preview-container');
            preview.innerHTML = `<img src="${selectedPhotoBase64}" alt="预览">`;
        };
        reader.readAsDataURL(file);
    }
}

async function submitFoundItem(event) {
    event.preventDefault();

    const data = {
        itemName: document.getElementById('itemName').value,
        brand: document.getElementById('brand').value,
        color: document.getElementById('color').value,
        foundLocation: document.getElementById('foundLocation').value,
        foundDate: document.getElementById('foundDate').value,
        description: document.getElementById('description').value,
        photoBase64: selectedPhotoBase64
    };

    try {
        const response = await fetch(`${API_BASE}/found-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('物品登记成功！');
            document.getElementById('found-item-form').reset();
            document.getElementById('photo-preview-container').innerHTML = '';
            selectedPhotoBase64 = null;
            document.getElementById('foundDate').value = new Date().toISOString().split('T')[0];
        }
    } catch (error) {
        showToast('登记失败，请重试', true);
    }
}

async function submitLostClaim(event) {
    event.preventDefault();

    const data = {
        passengerName: document.getElementById('passengerName').value,
        contactInfo: document.getElementById('contactInfo').value,
        itemDescription: document.getElementById('itemDescription').value,
        lostLocation: document.getElementById('lostLocation').value,
        lostDate: document.getElementById('lostDate').value
    };

    try {
        const response = await fetch(`${API_BASE}/lost-claims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('申报提交成功！');
            document.getElementById('lost-claim-form').reset();
            document.getElementById('lostDate').value = new Date().toISOString().split('T')[0];
        }
    } catch (error) {
        showToast('提交失败，请重试', true);
    }
}

async function loadFoundItems() {
    try {
        const response = await fetch(`${API_BASE}/found-items`);
        const items = await response.json();
        const container = document.getElementById('items-list');

        if (items.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">暂无物品记录</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-name">${item.itemName}</span>
                    <span class="item-status status-${item.status}">${item.status}</span>
                </div>
                <div class="item-details">
                    <p><strong>品牌：</strong>${item.brand || '-'}</p>
                    <p><strong>颜色：</strong>${item.color || '-'}</p>
                    <p><strong>拾到地点：</strong>${item.foundLocation}</p>
                    <p><strong>拾到日期：</strong>${item.foundDate}</p>
                    <p><strong>描述：</strong>${item.description || '-'}</p>
                    ${item.photoBase64 ? `<img src="${item.photoBase64}" class="item-photo" alt="物品照片">` : ''}
                </div>
                ${item.status === '待认领' ? `
                <div class="item-actions">
                    <button class="btn-sm btn-success" onclick="updateItemStatus(${item.id}, '已认领')">标记已认领</button>
                </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('加载失败', error);
    }
}

async function updateItemStatus(id, status) {
    try {
        await fetch(`${API_BASE}/found-items/${id}/status?status=${status}`, { method: 'PUT' });
        showToast('状态更新成功！');
        loadFoundItems();
    } catch (error) {
        showToast('更新失败', true);
    }
}

async function loadLostClaims() {
    try {
        const response = await fetch(`${API_BASE}/lost-claims`);
        const claims = await response.json();
        const container = document.getElementById('claims-list');

        if (claims.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">暂无申报记录</p>';
            return;
        }

        container.innerHTML = claims.map(claim => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-name">${claim.passengerName}</span>
                    <span class="item-status status-${claim.status}">${claim.status}</span>
                </div>
                <div class="item-details">
                    <p><strong>联系方式：</strong>${claim.contactInfo}</p>
                    <p><strong>遗失地点：</strong>${claim.lostLocation}</p>
                    <p><strong>遗失日期：</strong>${claim.lostDate || '-'}</p>
                    <p><strong>物品描述：</strong>${claim.itemDescription}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-sm btn-info" onclick="viewMatches(${claim.id})">查看匹配</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载失败', error);
    }
}

async function loadClaimSelect() {
    try {
        const response = await fetch(`${API_BASE}/lost-claims`);
        const claims = await response.json();
        const select = document.getElementById('match-claim-select');

        select.innerHTML = '<option value="">请选择申报记录</option>' +
            claims.map(c => `<option value="${c.id}">${c.passengerName} - ${c.itemDescription.substring(0, 20)}...</option>`).join('');
    } catch (error) {
        console.error('加载失败', error);
    }
}

async function loadMatches() {
    const claimId = document.getElementById('match-claim-select').value;
    if (!claimId) return;

    try {
        const [matchesResponse, appointmentsResponse] = await Promise.all([
            fetch(`${API_BASE}/lost-claims/${claimId}/matches`),
            fetch(`${API_BASE}/appointments`)
        ]);
        const matches = await matchesResponse.json();
        const appointments = await appointmentsResponse.json();
        const container = document.getElementById('matches-results');

        if (!matches || matches.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">暂无匹配结果</p>';
            return;
        }

        const reservedItemMap = new Map();
        appointments.forEach(apt => {
            if (apt.status === '待核验' || apt.status === '已完成') {
                reservedItemMap.set(apt.foundItemId, apt.status);
            }
        });

        container.innerHTML = matches.map(match => {
            const itemStatus = reservedItemMap.get(match.foundItem.id) || match.foundItem.status;
            const statusLabel = itemStatus === '待核验' ? '已预约' : itemStatus;
            const score = Math.round(match.matchScore);
            let scoreClass = 'score-low';
            if (score >= 70) scoreClass = 'score-high';
            else if (score >= 50) scoreClass = 'score-medium';
            return `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-name">${match.foundItem.itemName}</span>
                    <span class="item-status status-${itemStatus}">${statusLabel}</span>
                    <span class="match-score ${scoreClass}">${score}分</span>
                </div>
                <div class="item-details">
                    <p><strong>品牌：</strong>${match.foundItem.brand || '-'}</p>
                    <p><strong>颜色：</strong>${match.foundItem.color || '-'}</p>
                    <p><strong>拾到地点：</strong>${match.foundItem.foundLocation}</p>
                    <p><strong>拾到日期：</strong>${match.foundItem.foundDate}</p>
                    <p><strong>描述：</strong>${match.foundItem.description || '-'}</p>
                </div>
                <div class="match-reason">
                    <strong>匹配原因：</strong>${match.matchReason}
                </div>
                ${match.foundItem.photoBase64 ? `<img src="${match.foundItem.photoBase64}" class="item-photo" alt="物品照片">` : ''}
            </div>
        `}).join('');
    } catch (error) {
        console.error('加载失败', error);
    }
}

function viewMatches(claimId) {
    document.querySelectorAll('#staff-section .sub-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#staff-section .tab-content').forEach(t => t.style.display = 'none');
    document.getElementById('staff-matches').style.display = 'block';

    loadClaimSelect().then(() => {
        document.getElementById('match-claim-select').value = claimId;
        loadMatches();
    });
}

async function loadAppointments() {
    try {
        const response = await fetch(`${API_BASE}/appointments`);
        const appointments = await response.json();
        const container = document.getElementById('appointments-list');

        if (appointments.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">暂无预约记录</p>';
            return;
        }

        container.innerHTML = appointments.map(apt => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-name">${apt.passengerName}</span>
                    <span class="item-status status-${apt.status}">${apt.status}</span>
                </div>
                <div class="item-details">
                    <p><strong>身份证号：</strong>${apt.idCardNumber}</p>
                    <p><strong>联系电话：</strong>${apt.contactInfo}</p>
                    <p><strong>预约日期：</strong>${apt.appointmentDate}</p>
                    <p><strong>预约时间：</strong>${apt.appointmentTime}</p>
                </div>
                ${apt.status === '待核验' ? `
                <div class="item-actions">
                    <button class="btn-sm btn-success" onclick="updateAppointmentStatus(${apt.id}, '已完成')">核验完成</button>
                </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('加载失败', error);
    }
}

async function updateAppointmentStatus(id, status) {
    try {
        await fetch(`${API_BASE}/appointments/${id}/status?status=${status}`, { method: 'PUT' });
        if (status === '已完成') {
            showToast('核验完成！物品状态已同步更新为"已认领"');
        } else {
            showToast('状态更新成功！');
        }
        loadAppointments();
    } catch (error) {
        showToast('更新失败', true);
    }
}

async function loadPassengerClaimSelect() {
    try {
        const response = await fetch(`${API_BASE}/lost-claims`);
        const claims = await response.json();
        const select = document.getElementById('appointment-claim-select');

        select.innerHTML = '<option value="">请选择您的申报记录</option>' +
            claims.map(c => `<option value="${c.id}">${c.passengerName} - ${c.itemDescription.substring(0, 20)}...</option>`).join('');
    } catch (error) {
        console.error('加载失败', error);
    }
}

async function loadClaimMatchesForAppointment() {
    const claimId = document.getElementById('appointment-claim-select').value;
    if (!claimId) return;

    try {
        const [matchesResponse, appointmentsResponse] = await Promise.all([
            fetch(`${API_BASE}/lost-claims/${claimId}/matches`),
            fetch(`${API_BASE}/appointments`)
        ]);
        const matches = await matchesResponse.json();
        const appointments = await appointmentsResponse.json();
        const container = document.getElementById('claim-matches-for-appointment');

        if (!matches || matches.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">暂无匹配物品</p>';
            return;
        }

        const reservedItemIds = new Set();
        appointments.forEach(apt => {
            if (apt.status === '待核验' || apt.status === '已完成') {
                reservedItemIds.add(apt.foundItemId);
            }
        });

        const availableMatches = matches.filter(match => !reservedItemIds.has(match.foundItem.id));

        if (availableMatches.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">所有匹配物品已被预约或认领</p>';
            return;
        }

        container.innerHTML = availableMatches.map(match => {
            const score = Math.round(match.matchScore);
            let scoreClass = 'score-low';
            if (score >= 70) scoreClass = 'score-high';
            else if (score >= 50) scoreClass = 'score-medium';
            return `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-name">${match.foundItem.itemName}</span>
                    <span class="match-score ${scoreClass}">${score}分</span>
                </div>
                <div class="item-details">
                    <p><strong>品牌：</strong>${match.foundItem.brand || '-'}</p>
                    <p><strong>颜色：</strong>${match.foundItem.color || '-'}</p>
                    <p><strong>拾到地点：</strong>${match.foundItem.foundLocation}</p>
                    <p><strong>拾到日期：</strong>${match.foundItem.foundDate}</p>
                    <p><strong>物品状态：</strong>${match.foundItem.status}</p>
                </div>
                <div class="match-reason">
                    <strong>匹配原因：</strong>${match.matchReason}
                </div>
                ${match.foundItem.photoBase64 ? `<img src="${match.foundItem.photoBase64}" class="item-photo" alt="物品照片">` : ''}
                <div class="item-actions">
                    <button class="btn-sm btn-info" onclick="openAppointmentModal(${match.foundItem.id}, ${match.lostClaim.id})">预约认领</button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('加载失败', error);
    }
}

function openAppointmentModal(foundItemId, lostClaimId) {
    document.getElementById('appointment-foundItemId').value = foundItemId;
    document.getElementById('appointment-lostClaimId').value = lostClaimId;
    document.getElementById('appointment-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('appointment-modal').style.display = 'none';
}

async function submitAppointment(event) {
    event.preventDefault();

    const data = {
        foundItemId: parseInt(document.getElementById('appointment-foundItemId').value),
        lostClaimId: parseInt(document.getElementById('appointment-lostClaimId').value),
        passengerName: document.getElementById('appointment-passengerName').value,
        idCardNumber: document.getElementById('appointment-idCardNumber').value,
        contactInfo: document.getElementById('appointment-contactInfo').value,
        appointmentDate: document.getElementById('appointment-date').value,
        appointmentTime: document.getElementById('appointment-time').value
    };

    try {
        const response = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('预约成功！');
            closeModal();
            document.getElementById('appointment-form').reset();
            loadClaimMatchesForAppointment();
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg || '预约失败，请重试', true);
        }
    } catch (error) {
        showToast('预约失败，请重试', true);
    }
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = isError ? '#f44336' : '#4caf50';
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

window.onclick = function(event) {
    const modal = document.getElementById('appointment-modal');
    if (event.target === modal) {
        closeModal();
    }
};
