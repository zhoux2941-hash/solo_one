const API_BASE = 'http://localhost:8080/api';
let selectedPackageId = null;
let selectedTimeSlot = null;

document.addEventListener('DOMContentLoaded', function() {
    loadPackages();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reservationDate').min = today;
});

function showTab(tab, element) {
    document.querySelectorAll('.nav button').forEach(btn => btn.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }
    
    document.getElementById('reservation-tab').classList.add('hidden');
    document.getElementById('query-tab').classList.add('hidden');
    document.getElementById(tab + '-tab').classList.remove('hidden');
}

async function loadPackages() {
    try {
        const response = await fetch(`${API_BASE}/packages`);
        const packages = await response.json();
        const container = document.getElementById('packages');
        
        packages.forEach(pkg => {
            const card = document.createElement('div');
            card.className = 'package-card';
            card.onclick = () => selectPackage(pkg.id, card);
            card.innerHTML = `
                <h3>${pkg.name}</h3>
                <p class="price">¥${pkg.price}</p>
                <p class="desc">${pkg.description}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('加载套餐失败:', error);
    }
}

function selectPackage(id, element) {
    selectedPackageId = id;
    document.querySelectorAll('.package-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
}

function selectTime(element) {
    if (element.classList.contains('disabled')) return;
    selectedTimeSlot = element.dataset.time;
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    element.classList.add('selected');
}

async function checkSlots() {
    const date = document.getElementById('reservationDate').value;
    if (!date) return;
    
    try {
        const response = await fetch(`${API_BASE}/reservations/slots?date=${date}`);
        const data = await response.json();
        
        const slotsInfo = document.getElementById('slotsInfo');
        slotsInfo.innerHTML = `📊 ${date} 剩余名额：<strong>${data.available}</strong> / ${data.total}`;
        
        const slots = document.querySelectorAll('.time-slot');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        slots.forEach(slot => {
            if (data.available <= 0) {
                slot.classList.add('disabled');
            } else {
                if (date === today) {
                    const timeStart = slot.dataset.time.split('-')[0];
                    const [hour, minute] = timeStart.split(':').map(Number);
                    if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
                        slot.classList.add('disabled');
                    } else {
                        slot.classList.remove('disabled');
                    }
                } else {
                    slot.classList.remove('disabled');
                }
            }
        });
    } catch (error) {
        console.error('查询名额失败:', error);
    }
}

async function submitReservation() {
    if (!selectedPackageId) {
        alert('请选择体检套餐');
        return;
    }
    
    const userName = document.getElementById('userName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const idCard = document.getElementById('idCard').value.trim();
    const reservationDate = document.getElementById('reservationDate').value;
    
    if (!userName || !phone || !idCard || !reservationDate || !selectedTimeSlot) {
        alert('请填写完整信息');
        return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        alert('请输入正确的手机号');
        return;
    }
    
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
        alert('请输入正确的18位身份证号码');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (reservationDate === today && selectedTimeSlot) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timeStart = selectedTimeSlot.split('-')[0];
        const [hour, minute] = timeStart.split(':').map(Number);
        if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
            alert('所选时段已过期，请选择其他时段');
            return;
        }
    }
    
    try {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';
        
        const response = await fetch(`${API_BASE}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName, phone, idCard,
                packageId: selectedPackageId,
                reservationDate,
                timeSlot: selectedTimeSlot
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        const result = await response.json();
        document.getElementById('smsMessage').textContent = result.smsMessage;
        document.getElementById('successModal').classList.add('show');
        
    } catch (error) {
        alert(error.message || '预约失败，请重试');
    } finally {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = false;
        submitBtn.textContent = '提交预约';
    }
}

function closeModal() {
    document.getElementById('successModal').classList.remove('show');
    document.getElementById('userName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('idCard').value = '';
    document.getElementById('reservationDate').value = '';
    document.querySelectorAll('.package-card').forEach(card => card.classList.remove('selected'));
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    document.getElementById('slotsInfo').textContent = '请选择日期查看剩余名额';
    selectedPackageId = null;
    selectedTimeSlot = null;
}

async function queryReservations() {
    const phone = document.getElementById('queryPhone').value.trim();
    if (!phone) {
        alert('请输入手机号');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/reservations/phone/${phone}`);
        const reservations = await response.json();
        const container = document.getElementById('reservationList');
        
        if (reservations.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">暂无预约记录</p>';
            return;
        }
        
        container.innerHTML = reservations.map(r => `
            <div class="reservation-item">
                <h4>${r.packageName}</h4>
                <p>📅 预约日期：${r.reservationDate}</p>
                <p>⏰ 预约时段：${r.timeSlot}</p>
                <p>👤 姓名：${r.userName}</p>
                <p>📱 手机：${r.phone}</p>
                <span class="status ${r.reportUploaded ? 'reported' : 'confirmed'}">
                    ${r.reportUploaded ? '✅ 报告已出' : '⏳ 待体检'}
                </span>
                ${r.reportUploaded ? `
                    <button class="view-report-btn" onclick="viewReport(${r.id})">查看报告</button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('查询失败:', error);
        alert('查询失败，请重试');
    }
}

function viewReport(reservationId) {
    window.location.href = `report.html?id=${reservationId}`;
}
