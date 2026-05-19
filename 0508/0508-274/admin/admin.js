class AdminPanel {
  constructor() {
    this.apiBase = '/api';
    this.resources = [];
    this.stats = null;
    this.prepushStatus = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.fetchStats();
    this.fetchResources();
    this.fetchPrepushStatus();
    this.startAutoRefresh();
  }

  bindEvents() {
    document.getElementById('uploadBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.uploadFile(e.target.files[0]);
    });

    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('uploadModal').style.display = 'none';
      document.getElementById('fileInput').value = '';
    });

    document.getElementById('statsFilter').addEventListener('change', (e) => {
      this.renderStatsTable(e.target.value);
    });

    document.getElementById('scheduleTrendingBtn').addEventListener('click', () => {
      this.scheduleTrendingPrepush();
    });
  }

  startAutoRefresh() {
    setInterval(() => {
      this.fetchStats();
      this.fetchResources();
      this.fetchPrepushStatus();
    }, 5000);
  }

  async fetchPrepushStatus() {
    try {
      const response = await fetch(`${this.apiBase}/prepush/status`);
      this.prepushStatus = await response.json();
      this.renderPrepushStatus();
    } catch (error) {
      console.error('Failed to fetch prepush status:', error);
    }
  }

  async scheduleTrendingPrepush() {
    try {
      const btn = document.getElementById('scheduleTrendingBtn');
      btn.textContent = '调度中...';
      btn.disabled = true;

      const response = await fetch(`${this.apiBase}/prepush/schedule-trending`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`已成功调度 ${result.scheduled} 个热门资源进行预推送`);
        this.fetchPrepushStatus();
      }
    } catch (error) {
      console.error('Failed to schedule trending prepush:', error);
      alert('调度失败: ' + error.message);
    } finally {
      const btn = document.getElementById('scheduleTrendingBtn');
      btn.textContent = '推送热门资源';
      btn.disabled = false;
    }
  }

  async fetchStats() {
    try {
      const response = await fetch(`${this.apiBase}/stats`);
      this.stats = await response.json();
      this.renderStats();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async fetchResources() {
    try {
      const response = await fetch(`${this.apiBase}/resources`);
      this.resources = await response.json();
      this.renderResources();
      this.updateStatsFilter();
      this.renderStatsTable();
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  renderStats() {
    if (!this.stats) return;

    document.getElementById('p2pHitRate').textContent = `${this.stats.p2pHitRate}%`;
    document.getElementById('hitRateBar').style.width = `${this.stats.p2pHitRate}%`;
    
    document.getElementById('p2pDownloaded').textContent = this.formatBytes(this.stats.totalP2PDownloaded);
    document.getElementById('cdnDownloaded').textContent = this.formatBytes(this.stats.totalCDNDownloaded);
    
    document.getElementById('totalUploaded').textContent = this.formatBytes(this.stats.totalUploaded);
    document.getElementById('activePeers').textContent = this.stats.activePeers;
    document.getElementById('totalResources').textContent = Object.keys(this.stats.resources || {}).length;
  }

  renderPrepushStatus() {
    if (!this.prepushStatus) return;

    document.getElementById('queueCount').textContent = this.prepushStatus.queue?.length || 0;
    document.getElementById('activeCount').textContent = this.prepushStatus.active?.length || 0;
    document.getElementById('completedCount').textContent = this.prepushStatus.completed?.length || 0;
    document.getElementById('edgePeerCount').textContent = this.prepushStatus.edgePeers?.length || 0;

    const queueList = document.getElementById('queueList');
    const allItems = [
      ...(this.prepushStatus.active || []).map(item => ({ ...item, _status: 'active' })),
      ...(this.prepushStatus.queue || []).map(item => ({ ...item, _status: 'pending' })),
      ...(this.prepushStatus.completed || []).slice(-5).map(item => ({ ...item, _status: 'completed' }))
    ];

    if (allItems.length === 0) {
      queueList.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <p>暂无推送任务</p>
        </div>
      `;
      return;
    }

    queueList.innerHTML = allItems.map(item => {
      const resource = this.resources.find(r => r.infoHash === item.infoHash);
      const name = resource ? resource.name : item.infoHash?.substring(0, 16) + '...' || 'Unknown';
      const priorityLabel = this.getPriorityLabel(item.priority);
      
      return `
        <div class="queue-item">
          <span class="queue-status ${item._status}"></span>
          <div class="queue-info">
            <div class="queue-name">${name}</div>
            <div class="queue-reason">${this.getPrepushReasonLabel(item.reason)}</div>
          </div>
          <span class="queue-priority ${priorityLabel.class}">${priorityLabel.text}</span>
        </div>
      `;
    }).join('');
  }

  getPriorityLabel(priority) {
    switch (priority) {
      case 0: return { text: '高', class: 'high' };
      case 1: return { text: '中', class: 'medium' };
      default: return { text: '低', class: 'low' };
    }
  }

  getPrepushReasonLabel(reason) {
    const reasons = {
      'new_upload': '新上传资源',
      'trending': '热门资源',
      'user_favorite': '用户偏好',
      'active_hour_trending': '活跃时段预测',
      'recent_access': '近期访问',
      'manual': '手动调度'
    };
    return reasons[reason] || reason || '自动调度';
  }

  renderResources() {
    const container = document.getElementById('resourceList');
    
    if (this.resources.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>暂无资源，点击上方按钮上传</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.resources.map(resource => {
      const resourceStats = this.stats?.resources?.[resource.infoHash] || {};
      return `
        <div class="resource-item">
          <div class="resource-header">
            <span class="resource-name">📄 ${resource.name}</span>
            <span class="resource-size">${this.formatBytes(resource.size)}</span>
          </div>
          <div class="resource-meta">
            <span class="resource-hash">${resource.infoHash.substring(0, 20)}...</span>
            <span>${resource.pieces} 分片 × ${this.formatBytes(resource.pieceLength)}</span>
            <span class="text-success">${resourceStats.peers || 0} 节点</span>
          </div>
        </div>
      `;
    }).join('');
  }

  updateStatsFilter() {
    const select = document.getElementById('statsFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="all">所有资源</option>';
    
    this.resources.forEach(resource => {
      const option = document.createElement('option');
      option.value = resource.infoHash;
      option.textContent = resource.name;
      select.appendChild(option);
    });

    if (currentValue !== 'all') {
      select.value = currentValue;
    }
  }

  renderStatsTable(filter = 'all') {
    const tbody = document.getElementById('statsTableBody');
    const resourcesData = this.stats?.resources || {};
    
    let filteredResources = Object.entries(resourcesData);
    if (filter !== 'all') {
      filteredResources = filteredResources.filter(([hash]) => hash === filter);
    }

    if (filteredResources.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: #94a3b8;">暂无统计数据</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredResources.map(([infoHash, data]) => {
      const resource = this.resources.find(r => r.infoHash === infoHash);
      const name = resource ? resource.name : infoHash.substring(0, 16) + '...';
      const total = data.p2pHits + data.p2pMisses;
      const hitRate = total > 0 ? ((data.p2pHits / total) * 100).toFixed(1) : 0;

      return `
        <tr>
          <td>${name}</td>
          <td class="text-success">${data.p2pHits}</td>
          <td class="text-warning">${data.p2pMisses}</td>
          <td>${this.formatBytes(data.p2pDownloaded)}</td>
          <td>${this.formatBytes(data.uploaded)}</td>
          <td class="text-info">${data.peers || 0}</td>
        </tr>
      `;
    }).join('');
  }

  async uploadFile(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const progressContainer = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadBar');
    const progressText = document.getElementById('uploadText');

    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '上传中...';

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          progressBar.style.width = `${percent}%`;
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          progressText.textContent = '处理中...';
          
          setTimeout(() => {
            progressContainer.style.display = 'none';
            this.showUploadResult(result);
            this.fetchResources();
            this.fetchStats();
          }, 500);
        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed');
      });

      xhr.open('POST', `${this.apiBase}/upload`);
      xhr.send(formData);

    } catch (error) {
      progressContainer.style.display = 'none';
      alert('上传失败: ' + error.message);
    }
  }

  showUploadResult(result) {
    const modal = document.getElementById('uploadModal');
    const resultContainer = document.getElementById('uploadResult');

    resultContainer.innerHTML = `
      <p><strong>文件名:</strong> ${result.name}</p>
      <p><strong>大小:</strong> ${this.formatBytes(result.size)}</p>
      <p><strong>InfoHash:</strong> <code>${result.infoHash}</code></p>
      <p><strong>分片数:</strong> ${result.pieces} × ${this.formatBytes(result.pieceLength)}</p>
      <p><strong>Magnet URI:</strong></p>
      <p><code style="word-break: break-all;">${result.magnetURI}</code></p>
    `;

    modal.style.display = 'flex';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
