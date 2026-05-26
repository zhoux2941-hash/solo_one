const API_BASE = '/api';
let pageSize = 20;
let currentKeyword = '';
let editingRecordId = null;
let examItems = [];
let medicines = [];
let selectedMedicines = [];
let cursorStack = [];
let currentCursor = null;
let hasMore = false;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 2500);
}

async function apiRequest(url, method = 'GET', body = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(API_BASE + url, options);
  return await res.json();
}

async function loadExamItems() {
  const res = await apiRequest('/exam-items');
  if (res.success) {
    examItems = res.data;
    renderExamCheckboxes();
  }
}

async function loadMedicines() {
  const res = await apiRequest('/medicines');
  if (res.success) {
    medicines = res.data;
    renderMedicineSelect();
  }
}

function renderMedicineSelect() {
  const select = document.getElementById('medicineSelect');
  if (!select) return;
  
  const categories = {};
  medicines.forEach(m => {
    const cat = m.category || '其他';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(m);
  });

  let html = '<option value="">-- 选择药品 --</option>';
  for (const [cat, items] of Object.entries(categories)) {
    html += `<optgroup label="${cat}">`;
    items.forEach(m => {
      const stockStatus = m.stock <= 0 ? '（缺货）' : m.stock < m.min_stock ? `（仅剩${m.stock}）` : '';
      html += `<option value="${m.id}" data-price="${m.price}" data-spec="${m.specification || ''}" data-unit="${m.unit}" data-stock="${m.stock}">
        ${m.name}${stockStatus} - ¥${m.price}/${m.unit}
      </option>`;
    });
    html += '</optgroup>';
  }
  select.innerHTML = html;
}

function addMedicine() {
  const select = document.getElementById('medicineSelect');
  const quantityInput = document.getElementById('medicineQuantity');
  const usageInput = document.getElementById('medicineUsage');
  
  const medicineId = parseInt(select.value);
  if (!medicineId) {
    showToast('请选择药品', 'error');
    return;
  }
  
  const option = select.options[select.selectedIndex];
  const medicine = medicines.find(m => m.id === medicineId);
  const quantity = parseInt(quantityInput.value) || 1;
  const usage = usageInput.value.trim();
  
  if (medicine.stock < quantity) {
    showToast(`【${medicine.name}】库存不足！当前库存：${medicine.stock}`, 'error');
    return;
  }
  
  const existing = selectedMedicines.find(m => m.medicine_id === medicineId);
  if (existing) {
    existing.quantity += quantity;
    if (medicine.stock < existing.quantity) {
      existing.quantity = medicine.stock;
      showToast(`【${medicine.name}】库存不足，已调整为最大可用数量：${medicine.stock}`, 'error');
    }
    if (usage) existing.usage = usage;
  } else {
    selectedMedicines.push({
      medicine_id: medicineId,
      medicine_name: medicine.name,
      specification: medicine.specification || '',
      unit: medicine.unit,
      unit_price: medicine.price,
      quantity: Math.min(quantity, medicine.stock),
      usage: usage
    });
  }
  
  select.value = '';
  quantityInput.value = '1';
  usageInput.value = '';
  renderMedicineList();
  checkStockWarnings();
}

function removeMedicine(medicineId) {
  selectedMedicines = selectedMedicines.filter(m => m.medicine_id !== medicineId);
  renderMedicineList();
  checkStockWarnings();
}

function updateMedicineQuantity(medicineId, quantity) {
  const med = selectedMedicines.find(m => m.medicine_id === medicineId);
  const medicine = medicines.find(m => m.id === medicineId);
  if (med && medicine) {
    const newQty = Math.max(1, Math.min(quantity, medicine.stock));
    if (quantity > medicine.stock) {
      showToast(`【${medicine.name}】库存不足！最大可用：${medicine.stock}`, 'error');
    }
    med.quantity = newQty;
    renderMedicineList();
    checkStockWarnings();
  }
}

function renderMedicineList() {
  const container = document.getElementById('medicineList');
  if (!container) return;
  
  if (selectedMedicines.length === 0) {
    container.innerHTML = '<div style="color:#999;padding:12px;text-align:center;">暂无用药</div>';
  } else {
    container.innerHTML = selectedMedicines.map(med => {
      const medicine = medicines.find(m => m.id === med.medicine_id);
      const stock = medicine ? medicine.stock : 0;
      const minStock = medicine ? medicine.min_stock : 10;
      const stockClass = stock <= 0 ? 'stock-out' : stock < minStock ? 'stock-low' : 'stock-normal';
      const stockText = stock <= 0 ? '缺货' : `库存:${stock}`;
      const subtotal = (med.unit_price * med.quantity).toFixed(2);
      
      return `
        <div class="medicine-item">
          <div class="medicine-item-info">
            <strong>${med.medicine_name}</strong>
            <span class="spec">${med.specification || ''} ${med.unit}</span>
            <span class="usage">${med.usage || '无用法说明'}</span>
          </div>
          <input type="number" min="1" max="${stock}" value="${med.quantity}" 
            style="width:60px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;"
            onchange="updateMedicineQuantity(${med.medicine_id}, parseInt(this.value))">
          <span class="medicine-item-stock ${stockClass}">${stockText}</span>
          <span class="medicine-item-price">¥${subtotal}</span>
          <button class="medicine-item-remove" onclick="removeMedicine(${med.medicine_id})" title="删除">✕</button>
        </div>
      `;
    }).join('');
  }
  
  calculateMedicineFee();
}

function calculateMedicineFee() {
  const total = selectedMedicines.reduce((sum, med) => sum + (med.unit_price * med.quantity), 0);
  const el = document.getElementById('medicineFeeTotal');
  if (el) el.textContent = `¥ ${total.toFixed(2)}`;
  return total;
}

function checkStockWarnings() {
  const warnings = [];
  for (const med of selectedMedicines) {
    const medicine = medicines.find(m => m.id === med.medicine_id);
    if (medicine) {
      if (medicine.stock < med.quantity) {
        warnings.push(`【${medicine.name}】库存不足，当前库存：${medicine.stock}，需要：${med.quantity}`);
      } else if (medicine.stock < medicine.min_stock) {
        warnings.push(`【${medicine.name}】库存偏低，当前库存：${medicine.stock}`);
      }
    }
  }
  
  const container = document.getElementById('medicineList');
  let warningEl = document.getElementById('stockWarning');
  if (warnings.length > 0) {
    if (!warningEl) {
      warningEl = document.createElement('div');
      warningEl.id = 'stockWarning';
      warningEl.className = 'stock-warning';
      container.parentNode.insertBefore(warningEl, container);
    }
    warningEl.innerHTML = '⚠️ ' + warnings.join('<br>⚠️ ');
  } else if (warningEl) {
    warningEl.remove();
  }
  
  return warnings.length === 0 || warnings.every(w => w.includes('库存偏低'));
}

function getSelectedMedicines() {
  return selectedMedicines.map(m => ({
    medicine_id: m.medicine_id,
    medicine_name: m.medicine_name,
    specification: m.specification,
    unit: m.unit,
    unit_price: m.unit_price,
    quantity: m.quantity,
    usage: m.usage || ''
  }));
}

function renderExamCheckboxes(selectedItems = []) {
  const container = document.getElementById('examCheckboxes');
  container.innerHTML = examItems.map(item => `
    <label>
      <input type="checkbox" value="${item.id}" data-price="${item.price}" 
        data-name="${item.name}" ${selectedItems.includes(item.name) ? 'checked' : ''}>
      ${item.name}
      <span class="exam-price">¥${item.price}</span>
    </label>
  `).join('');

  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', calculateExamFee);
  });
  calculateExamFee();
}

function calculateExamFee() {
  const container = document.getElementById('examCheckboxes');
  let total = 0;
  container.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    const price = parseFloat(cb.dataset.price);
    total += isNaN(price) ? 0 : price;
  });
  document.getElementById('examFeeTotal').textContent = `¥ ${total.toFixed(2)}`;
}

function getSelectedExams() {
  const container = document.getElementById('examCheckboxes');
  const exams = [];
  container.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    const price = parseFloat(cb.dataset.price);
    exams.push({
      exam_item_id: parseInt(cb.value) || 0,
      exam_name: cb.dataset.name || '',
      exam_price: isNaN(price) ? 0 : price,
      result: ''
    });
  });
  return exams;
}

async function loadRecords() {
  let url = `/records?pageSize=${pageSize}&keyword=${currentKeyword}`;
  if (currentCursor) {
    url += `&cursor=${currentCursor}`;
  }
  
  const res = await apiRequest(url);
  if (res.success) {
    renderRecords(res.data);
    hasMore = res.hasMore;
    currentCursor = res.nextCursor;
    
    document.getElementById('totalCount').textContent = `共 ${res.total} 份病历`;
    document.getElementById('pageInfo').textContent = cursorStack.length > 0 
      ? `已加载 ${(cursorStack.length + 1) * pageSize} 条 / 共 ${res.total} 条`
      : `最新 ${pageSize} 条 / 共 ${res.total} 条`;
    document.getElementById('queryTime').textContent = `查询耗时: ${res.queryTime}`;
    document.getElementById('prevBtn').disabled = cursorStack.length === 0;
    document.getElementById('nextBtn').disabled = !hasMore;
  }
}

function renderRecords(records) {
  const tbody = document.getElementById('recordsTableBody');
  if (!records || records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state">📭 暂无病历数据</div></td></tr>`;
    return;
  }
  tbody.innerHTML = records.map(r => `
    <tr>
      <td>${r.id}</td>
      <td><strong>${r.pet_name || '-'}</strong></td>
      <td>${r.owner_name || '-'}</td>
      <td>${r.pet_type || '-'}</td>
      <td>${r.weight || '-'}</td>
      <td>${r.temperature || '-'}</td>
      <td>${r.diagnosis || '-'}</td>
      <td class="fee">¥${(r.total_fee || 0).toFixed(2)}</td>
      <td class="date">${formatDate(r.created_at)}</td>
      <td>
        <button class="action-btn btn-secondary" onclick="viewRecord(${r.id})">查看</button>
        <button class="action-btn btn-secondary" onclick="editRecord(${r.id})">编辑</button>
      </td>
    </tr>
  `).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

async function viewRecord(id) {
  const res = await apiRequest(`/records/${id}`);
  if (res.success) {
    renderDetail(res.data);
    switchView('detail');
  }
}

function renderDetail(record) {
  const container = document.getElementById('detailContainer');
  const template = document.getElementById('detailTemplate');
  container.innerHTML = template.innerHTML;

  container.querySelector('#d-id').textContent = `#${record.id}`;
  container.querySelector('#d-created_at').textContent = formatDate(record.created_at);
  container.querySelector('#d-pet_name').textContent = record.pet_name || '-';
  container.querySelector('#d-owner_name').textContent = record.owner_name || '-';
  container.querySelector('#d-owner_phone').textContent = record.owner_phone || '-';
  container.querySelector('#d-pet_type').textContent = record.pet_type || '-';
  container.querySelector('#d-breed').textContent = record.breed || '-';
  container.querySelector('#d-age').textContent = record.age || '-';
  container.querySelector('#d-gender').textContent = record.gender || '-';
  container.querySelector('#d-weight').textContent = record.weight ? `${record.weight} kg` : '-';
  container.querySelector('#d-temperature').textContent = record.temperature ? `${record.temperature} ℃` : '-';
  container.querySelector('#d-doctor_name').textContent = record.doctor_name || '-';
  container.querySelector('#d-chief_complaint').textContent = record.chief_complaint || '无';
  container.querySelector('#d-clinical_findings').textContent = record.clinical_findings || '无';
  container.querySelector('#d-diagnosis').textContent = record.diagnosis || '无';
  container.querySelector('#d-treatment_plan').textContent = record.treatment_plan || '无';
  container.querySelector('#d-prescription').textContent = record.prescription || '无';
  container.querySelector('#d-total_fee').textContent = `¥${(record.total_fee || 0).toFixed(2)}`;
  container.querySelector('#printTime').textContent = formatDate(new Date());

  const examsHtml = (record.exams || []).map(e => `
    <tr>
      <td>${e.exam_name}</td>
      <td>¥${(e.exam_price || 0).toFixed(2)}</td>
      <td>${e.result || '-'}</td>
    </tr>
  `).join('');
  container.querySelector('#d-exams').innerHTML = examsHtml || '<tr><td colspan="3">无检查项目</td></tr>';

  const medsHtml = (record.medicines || []).map(m => {
    const subtotal = (m.unit_price * m.quantity).toFixed(2);
    return `
      <tr>
        <td>${m.medicine_name}</td>
        <td>${m.specification || '-'}</td>
        <td>¥${(m.unit_price || 0).toFixed(2)}</td>
        <td>${m.quantity} ${m.unit}</td>
        <td>${m.usage || '-'}</td>
        <td>¥${subtotal}</td>
      </tr>
    `;
  }).join('');
  const medicineTotal = (record.medicines || []).reduce((sum, m) => sum + (m.unit_price * m.quantity), 0);
  container.querySelector('#d-medicines').innerHTML = medsHtml || '<tr><td colspan="6">无用药</td></tr>';
  container.querySelector('#d-medicine-total').textContent = `¥${medicineTotal.toFixed(2)}`;

  container.querySelector('#deleteBtn').onclick = () => deleteRecord(record.id);
  container.querySelector('#editBtn').onclick = () => editRecord(record.id);
  container.querySelector('#printBtn').onclick = () => printPDF();
  container.querySelector('#backToListBtn').onclick = () => { switchView('list'); loadRecords(); };
}

async function editRecord(id) {
  editingRecordId = id;
  const res = await apiRequest(`/records/${id}`);
  if (!res.success) return;

  const record = res.data;
  document.getElementById('formTitle').textContent = '编辑病历';
  document.getElementById('pet_name').value = record.pet_name || '';
  document.getElementById('owner_name').value = record.owner_name || '';
  document.getElementById('owner_phone').value = record.owner_phone || '';
  document.getElementById('pet_type').value = record.pet_type || '犬';
  document.getElementById('breed').value = record.breed || '';
  document.getElementById('age').value = record.age || '';
  document.getElementById('gender').value = record.gender || '';
  document.getElementById('weight').value = record.weight || '';
  document.getElementById('temperature').value = record.temperature || '';
  document.getElementById('doctor_name').value = record.doctor_name || '';
  document.getElementById('chief_complaint').value = record.chief_complaint || '';
  document.getElementById('clinical_findings').value = record.clinical_findings || '';
  document.getElementById('diagnosis').value = record.diagnosis || '';
  document.getElementById('treatment_plan').value = record.treatment_plan || '';
  document.getElementById('prescription').value = record.prescription || '';

  const selectedNames = (record.exams || []).map(e => e.exam_name);
  renderExamCheckboxes(selectedNames);

  selectedMedicines = (record.medicines || []).map(m => ({
    medicine_id: m.medicine_id,
    medicine_name: m.medicine_name,
    specification: m.specification || '',
    unit: m.unit,
    unit_price: m.unit_price,
    quantity: m.quantity,
    usage: m.usage || ''
  }));
  renderMedicineList();

  switchView('create');
}

async function deleteRecord(id) {
  if (!confirm('确定要删除这份病历吗？此操作不可恢复。')) return;
  const res = await apiRequest(`/records/${id}`, 'DELETE');
  if (res.success) {
    showToast('删除成功');
    switchView('list');
    loadRecords();
  } else {
    showToast(res.message || '删除失败', 'error');
  }
}

async function applyTemplate(templateId) {
  if (!templateId) return;
  const res = await apiRequest(`/templates/${templateId}`);
  if (!res.success) return;

  const t = res.data;
  document.getElementById('pet_type').value = t.pet_type;
  document.getElementById('chief_complaint').value = t.symptoms || '';
  document.getElementById('diagnosis').value = t.diagnosis || '';
  document.getElementById('treatment_plan').value = t.treatment_plan || '';
  document.getElementById('prescription').value = t.prescription || '';
  renderExamCheckboxes(t.exam_checklist || []);
  showToast(`已应用模板: ${t.name}`, 'info');
}

function collectFormData() {
  return {
    pet_name: document.getElementById('pet_name').value.trim(),
    owner_name: document.getElementById('owner_name').value.trim(),
    owner_phone: document.getElementById('owner_phone').value.trim(),
    pet_type: document.getElementById('pet_type').value,
    breed: document.getElementById('breed').value.trim(),
    age: document.getElementById('age').value.trim(),
    gender: document.getElementById('gender').value,
    weight: parseFloat(document.getElementById('weight').value) || null,
    temperature: parseFloat(document.getElementById('temperature').value) || null,
    doctor_name: document.getElementById('doctor_name').value.trim(),
    chief_complaint: document.getElementById('chief_complaint').value.trim(),
    clinical_findings: document.getElementById('clinical_findings').value.trim(),
    diagnosis: document.getElementById('diagnosis').value.trim(),
    treatment_plan: document.getElementById('treatment_plan').value.trim(),
    prescription: document.getElementById('prescription').value.trim(),
    exams: getSelectedExams(),
    medicines: getSelectedMedicines()
  };
}

function resetForm() {
  editingRecordId = null;
  selectedMedicines = [];
  document.getElementById('formTitle').textContent = '新建病历';
  document.getElementById('recordForm').reset();
  document.getElementById('templateSelect').value = '';
  document.getElementById('pet_type').value = '犬';
  renderExamCheckboxes();
  renderMedicineList();
  const warningEl = document.getElementById('stockWarning');
  if (warningEl) warningEl.remove();
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const data = collectFormData();
  if (!data.pet_name || !data.owner_name) {
    showToast('请填写宠物名和主人姓名', 'error');
    return;
  }

  let res;
  if (editingRecordId) {
    res = await apiRequest(`/records/${editingRecordId}`, 'PUT', data);
  } else {
    res = await apiRequest('/records', 'POST', data);
  }

  if (res.success) {
    showToast(editingRecordId ? '病历已更新' : '病历已创建');
    resetForm();
    switchView('list');
    loadRecords();
  } else {
    showToast(res.message || '保存失败', 'error');
  }
}

function printPDF() {
  const element = document.getElementById('printContent');
  const opt = {
    margin: 10,
    filename: `病历_${document.getElementById('d-pet_name').textContent}_${new Date().toLocaleDateString('zh-CN')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  showToast('正在生成PDF...', 'info');
  html2pdf().set(opt).from(element).save().then(() => {
    showToast('PDF已下载');
  });
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewName);
  });
}

async function runPerformanceTest() {
  showToast('正在进行性能测试...', 'info');
  const res = await apiRequest('/performance-test');
  if (res.success) {
    const msg = `总记录: ${res.totalRecords}条, 全量查询: ${res.queryAllTime}, 深分页: ${res.deepPaginationTime}, ${res.meetsRequirement ? '✅ 满足<1秒要求' : '❌ 不满足要求'}`;
    showToast(msg, res.meetsRequirement ? 'success' : 'error');
    alert(`性能测试结果:\n\n总记录数: ${res.totalRecords} 条\n全量查询耗时: ${res.queryAllTime}\n平均每条: ${res.avgPerRecord}\n深分页查询: ${res.deepPaginationTime}\n\n${res.meetsRequirement ? '✅ 满足查询<1秒要求' : '❌ 不满足要求'}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadExamItems();
  loadMedicines();
  loadRecords();

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === 'create') {
        resetForm();
      } else if (view === 'list') {
        loadRecords();
      }
      if (view) switchView(view);
    });
  });

  document.getElementById('perfTestBtn').addEventListener('click', runPerformanceTest);
  document.getElementById('recordForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('cancelBtn').addEventListener('click', () => {
    resetForm();
    switchView('list');
  });

  document.getElementById('addMedicineBtn').addEventListener('click', addMedicine);
  document.getElementById('medicineQuantity').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addMedicine();
  });

  document.getElementById('templateSelect').addEventListener('change', (e) => {
    applyTemplate(e.target.value);
  });

  document.getElementById('searchBtn').addEventListener('click', () => {
    currentKeyword = document.getElementById('searchInput').value.trim();
    cursorStack = [];
    currentCursor = null;
    loadRecords();
  });

  document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      currentKeyword = e.target.value.trim();
      cursorStack = [];
      currentCursor = null;
      loadRecords();
    }
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (cursorStack.length > 0) {
      const prevState = cursorStack.pop();
      currentCursor = prevState.cursor;
      loadRecords();
    }
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (hasMore) {
      cursorStack.push({ cursor: currentCursor });
      loadRecords();
    }
  });
});

window.viewRecord = viewRecord;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.printPDF = printPDF;
window.addMedicine = addMedicine;
window.removeMedicine = removeMedicine;
window.updateMedicineQuantity = updateMedicineQuantity;
