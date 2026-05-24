let currentPage = 'batches';

const FilterStore = {
  STORAGE_KEY: 'pulp_mill_filter_prefs',

  getFilters() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        machineId: '',
        status: '',
        startDate: '',
        endDate: ''
      };
    } catch {
      return { machineId: '', status: '', startDate: '', endDate: '' };
    }
  },

  saveFilters(filters) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filters));
      window.dispatchEvent(new CustomEvent('filterChanged', { detail: filters }));
    } catch {
      console.warn('无法保存筛选条件到本地存储');
    }
  },

  updateFilter(key, value) {
    const filters = this.getFilters();
    filters[key] = value;
    this.saveFilters(filters);
    return filters;
  },

  clearFilters() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFilterListeners();
  restoreFilters();
  initBatchList();
  loadMachines();
  loadBatchSelects();

  window.addEventListener('filterChanged', (e) => {
    syncFiltersAcrossPages(e.detail);
  });
});

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      switchPage(page);
    });
  });
}

function switchPage(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });

  currentPage = page;

  const filters = FilterStore.getFilters();
  if (page === 'timeline') {
    loadBatchSelects(filters.machineId);
  } else if (page === 'loss') {
    loadBatchSelects(filters.machineId);
  }
}

function initFilterListeners() {
  const filterInputs = ['filter-machine', 'filter-status', 'filter-start-date', 'filter-end-date'];

  filterInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        const keyMap = {
          'filter-machine': 'machineId',
          'filter-status': 'status',
          'filter-start-date': 'startDate',
          'filter-end-date': 'endDate'
        };
        FilterStore.updateFilter(keyMap[id], el.value);
      });
    }
  });
}

function restoreFilters() {
  const filters = FilterStore.getFilters();

  if (document.getElementById('filter-machine')) {
    document.getElementById('filter-machine').value = filters.machineId || '';
  }
  if (document.getElementById('filter-status')) {
    document.getElementById('filter-status').value = filters.status || '';
  }
  if (document.getElementById('filter-start-date')) {
    document.getElementById('filter-start-date').value = filters.startDate || '';
  }
  if (document.getElementById('filter-end-date')) {
    document.getElementById('filter-end-date').value = filters.endDate || '';
  }

  return filters;
}

function syncFiltersAcrossPages(filters) {
  if (currentPage === 'batches') {
    applyFiltersFromStore();
  }
  if (currentPage === 'timeline' || currentPage === 'loss') {
    loadBatchSelects(filters.machineId);
  }
}

async function loadMachines() {
  try {
    const result = await batchesAPI.getMachines();
    if (result.success) {
      const select = document.getElementById('filter-machine');
      const currentValue = select ? select.value : '';
      if (select) {
        select.innerHTML = '<option value="">全部机台</option>';
        result.data.forEach(machine => {
          const option = document.createElement('option');
          option.value = machine;
          option.textContent = machine;
          select.appendChild(option);
        });
        const filters = FilterStore.getFilters();
        select.value = filters.machineId || currentValue;
      }
    }
  } catch (error) {
    console.error('加载机台列表失败:', error);
  }
}

async function loadBatchSelects(machineFilter = '') {
  try {
    const params = { pageSize: 100 };
    if (machineFilter) {
      params.machineId = machineFilter;
    }

    const result = await batchesAPI.getList(params);
    if (result.success) {
      const batches = result.data.list;

      const timelineSelect = document.getElementById('timeline-batch-select');
      const lossSelect = document.getElementById('loss-batch-select');

      let optionsHtml = '<option value="">选择批次</option>';
      if (machineFilter) {
        optionsHtml = `<option value="">${machineFilter} - 选择批次</option>`;
      }

      optionsHtml += batches.map(b =>
        `<option value="${b.id}">${b.batchNo} - ${b.oldPulpType}→${b.newPulpType}</option>`
      ).join('');

      if (timelineSelect) {
        const currentVal = timelineSelect.value;
        timelineSelect.innerHTML = optionsHtml;
        timelineSelect.value = currentVal;
      }
      if (lossSelect) {
        const currentVal = lossSelect.value;
        lossSelect.innerHTML = optionsHtml;
        lossSelect.value = currentVal;
      }
    }
  } catch (error) {
    console.error('加载批次列表失败:', error);
  }
}

function clearSavedFilters() {
  FilterStore.clearFilters();
  restoreFilters();
  applyFiltersFromStore();
  showToast('已清除筛选记忆');
}
