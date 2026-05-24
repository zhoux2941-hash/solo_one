let batchCurrentPage = 1;
let batchPageSize = 10;
let batchFilters = {};
let selectedBatchIds = new Set();

function initBatchList() {
  const filters = FilterStore.getFilters();
  batchFilters = { ...filters };
  loadBatchList();
}

function applyFiltersFromStore() {
  const filters = FilterStore.getFilters();
  batchFilters = { ...filters };
  batchCurrentPage = 1;
  selectedBatchIds.clear();
  loadBatchList();
}

async function loadBatchList() {
  try {
    const params = {
      page: batchCurrentPage,
      pageSize: batchPageSize,
      ...batchFilters
    };

    const result = await batchesAPI.getList(params);
    if (result.success) {
      renderBatchTable(result.data.list);
      renderPagination(result.data.total, result.data.page, result.data.pageSize);
      updateBatchActions();
    }
  } catch (error) {
    console.error('加载批次列表失败:', error);
    showToast('加载失败', 'error');
  }
}

function renderBatchTable(batches) {
  const tbody = document.getElementById('batch-table-body');

  if (batches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty-state">暂无数据</td></tr>`;
    return;
  }

  tbody.innerHTML = batches.map(batch => {
    const isChecked = selectedBatchIds.has(batch.id);
    return `
    <tr class="${isChecked ? 'batch-selected' : ''}">
      <td>
        <input type="checkbox" class="batch-checkbox" 
               data-batch-id="${batch.id}"
               ${isChecked ? 'checked' : ''}
               onchange="toggleBatchSelection(${batch.id}, this.checked)">
      </td>
      <td><strong>${batch.batchNo}</strong></td>
      <td>${batch.machineId}</td>
      <td>${batch.oldPulpType}</td>
      <td>${batch.newPulpType}</td>
      <td>${formatDateTime(batch.startTime)}</td>
      <td>${formatDateTime(batch.endTime)}</td>
      <td><span class="status-badge status-${batch.status}">${getStatusText(batch.status)}</span></td>
      <td>${batch.totalLoss || '-'}</td>
      <td>${batch.totalLossRate || '-'}</td>
      <td>
        <div class="action-links">
          <span class="action-link" onclick="viewBatchTimeline(${batch.id})">时间线</span>
          <span class="action-link" onclick="viewBatchLoss(${batch.id})">损耗</span>
          <span class="action-link" onclick="startBatchCalculation(${batch.id})">计算</span>
        </div>
      </td>
    </tr>
  `}).join('');
}

function toggleBatchSelection(batchId, checked) {
  if (checked) {
    selectedBatchIds.add(batchId);
  } else {
    selectedBatchIds.delete(batchId);
  }
  updateBatchActions();
  updateRowHighlight(batchId, checked);
}

function toggleSelectAll(checked) {
  const checkboxes = document.querySelectorAll('.batch-checkbox');
  checkboxes.forEach(cb => {
    const batchId = parseInt(cb.dataset.batchId);
    cb.checked = checked;
    if (checked) {
      selectedBatchIds.add(batchId);
    } else {
      selectedBatchIds.delete(batchId);
    }
    updateRowHighlight(batchId, checked);
  });
  updateBatchActions();
}

function updateRowHighlight(batchId, highlight) {
  const checkbox = document.querySelector(`.batch-checkbox[data-batch-id="${batchId}"]`);
  if (checkbox) {
    const row = checkbox.closest('tr');
    if (row) {
      row.classList.toggle('batch-selected', highlight);
    }
  }
}

function updateBatchActions() {
  const count = selectedBatchIds.size;
  const actionBtn = document.getElementById('batch-export-btn');
  const selectAllCheckbox = document.getElementById('select-all-batches');

  if (actionBtn) {
    actionBtn.textContent = count > 0 ? `批量导出简报 (${count})` : '批量导出简报';
    actionBtn.disabled = count === 0;
    actionBtn.classList.toggle('btn-primary', count > 0);
  }

  if (selectAllCheckbox) {
    const visibleCheckboxes = document.querySelectorAll('.batch-checkbox');
    const allChecked = visibleCheckboxes.length > 0 &&
      Array.from(visibleCheckboxes).every(cb => selectedBatchIds.has(parseInt(cb.dataset.batchId)));
    selectAllCheckbox.checked = allChecked;
  }
}

async function exportSelectedBatches() {
  if (selectedBatchIds.size === 0) {
    showToast('请先选择要导出的批次', 'error');
    return;
  }

  showToast(`正在导出 ${selectedBatchIds.size} 个批次的简报...`);

  const batchIds = Array.from(selectedBatchIds);

  try {
    await reportsAPI.exportBatchBriefList(batchIds);
    showToast(`已导出 ${batchIds.length} 个批次的简报`);
  } catch (error) {
    console.error('批量导出失败:', error);
    showToast('导出失败', 'error');
  }
}

function renderPagination(total, page, pageSize) {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = `<button onclick="goToPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>上一页</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      html += `<button class="${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<span>...</span>`;
    }
  }

  html += `<button onclick="goToPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>下一页</button>`;

  pagination.innerHTML = html;
}

function goToPage(page) {
  batchCurrentPage = page;
  loadBatchList();
}

function applyFilters() {
  batchFilters = {
    machineId: document.getElementById('filter-machine').value,
    status: document.getElementById('filter-status').value,
    startDate: document.getElementById('filter-start-date').value,
    endDate: document.getElementById('filter-end-date').value
  };
  FilterStore.saveFilters(batchFilters);
  batchCurrentPage = 1;
  selectedBatchIds.clear();
  loadBatchList();
}

function refreshBatchList() {
  loadBatchList();
  loadMachines();
  selectedBatchIds.clear();
  showToast('已刷新');
}

function showCreateBatchModal() {
  document.getElementById('create-batch-modal').classList.add('show');
}

function closeCreateBatchModal() {
  document.getElementById('create-batch-modal').classList.remove('show');
  document.getElementById('create-batch-form').reset();
}

async function submitCreateBatch() {
  const form = document.getElementById('create-batch-form');
  const formData = new FormData(form);
  const data = {
    batchNo: formData.get('batchNo'),
    machineId: formData.get('machineId'),
    oldPulpType: formData.get('oldPulpType'),
    newPulpType: formData.get('newPulpType'),
    operator: formData.get('operator'),
    startTime: new Date().toISOString(),
    status: 'pending'
  };

  try {
    const result = await batchesAPI.create(data);
    if (result.success) {
      showToast('创建成功');
      closeCreateBatchModal();
      loadBatchList();
      loadBatchSelects();
    } else {
      showToast(result.message || '创建失败', 'error');
    }
  } catch (error) {
    showToast('创建失败', 'error');
  }
}

function viewBatchTimeline(batchId) {
  document.getElementById('timeline-batch-select').value = batchId;
  switchPage('timeline');
  loadTimelineData();
}

function viewBatchLoss(batchId) {
  document.getElementById('loss-batch-select').value = batchId;
  switchPage('loss');
  loadLossData();
}

async function startBatchCalculation(batchId) {
  try {
    const result = await batchesAPI.startCalculation(batchId);
    if (result.success) {
      showToast('计算任务已提交');
      setTimeout(() => loadBatchList(), 2000);
    } else {
      showToast(result.message || '提交失败', 'error');
    }
  } catch (error) {
    showToast('提交失败', 'error');
  }
}
