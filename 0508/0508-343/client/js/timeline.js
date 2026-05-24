let currentTimelineBatchId = null;

async function loadTimelineData() {
  const batchId = document.getElementById('timeline-batch-select').value;
  if (!batchId) {
    document.getElementById('timeline-container').innerHTML =
      '<div class="empty-state">请选择一个批次查看时间线</div>';
    currentTimelineBatchId = null;
    return;
  }

  currentTimelineBatchId = batchId;

  try {
    const result = await timelineAPI.getBatchTimeline(batchId);
    if (result.success) {
      renderTimeline(result.data);
    } else {
      document.getElementById('timeline-container').innerHTML =
        `<div class="empty-state">加载失败: ${result.message}</div>`;
    }
  } catch (error) {
    console.error('加载时间线失败:', error);
    document.getElementById('timeline-container').innerHTML =
      '<div class="empty-state">加载失败，请稍后重试</div>';
  }
}

function renderTimeline(data) {
  const container = document.getElementById('timeline-container');
  const { batch, timelineEvents, readings, remarks, segments } = data;

  let html = '';

  html += `<div class="batch-info">
    <div class="batch-info-item">
      <span class="batch-info-label">批次号</span>
      <span class="batch-info-value">${batch.batchNo}</span>
    </div>
    <div class="batch-info-item">
      <span class="batch-info-label">机台</span>
      <span class="batch-info-value">${batch.machineId}</span>
    </div>
    <div class="batch-info-item">
      <span class="batch-info-label">换浆类型</span>
      <span class="batch-info-value">${batch.oldPulpType} → ${batch.newPulpType}</span>
    </div>
    <div class="batch-info-item">
      <span class="batch-info-label">开始时间</span>
      <span class="batch-info-value">${formatDateTime(batch.startTime)}</span>
    </div>
  </div>`;

  html += '<div class="timeline">';

  timelineEvents.forEach(event => {
    const dotClass = event.type === 'remark' ? 'remark' : (event.type === 'segment' ? 'segment' : '');
    const contentClass = event.type === 'remark' ? 'remark' : (event.type === 'segment' ? 'segment' : '');

    html += `<div class="timeline-item">
      <div class="timeline-dot ${dotClass}"></div>
      <div class="timeline-time">${formatDateTime(event.time)}</div>
      <div class="timeline-content ${contentClass}">`;

    if (event.type === 'flow') {
      html += `<div class="timeline-title">流量计读数</div>
        <div class="timeline-desc">
          瞬时流量: ${event.data.flowRate} L/min | 
          累计流量: ${event.data.totalFlow} L | 
          浓度: ${event.data.concentration || '-'}%
        </div>`;
    } else if (event.type === 'remark') {
      html += `<div class="timeline-title">${getEventTypeText(event.eventType)}</div>
        <div class="timeline-desc">
          ${event.data.remark || '无备注'}
          ${event.data.operator ? `<br>记录人: ${event.data.operator}` : ''}
          ${event.data.duration ? `<br>持续时间: ${formatDuration(event.data.duration)}` : ''}
        </div>`;
    } else if (event.type === 'segment') {
      html += `<div class="timeline-title">${event.data.segmentName}</div>
        <div class="timeline-desc">
          开始时间: ${formatDateTime(event.time)}<br>
          结束时间: ${formatDateTime(event.endTime)}<br>
          持续时间: ${formatDuration(event.data.duration)}
          ${event.data.remark ? `<br>备注: ${event.data.remark}` : ''}
        </div>`;
    }

    html += '</div></div>';
  });

  html += '</div>';

  container.innerHTML = html;
}

function getEventTypeText(type) {
  const typeMap = {
    start: '开始',
    pause: '暂停',
    resume: '恢复',
    stop: '停止',
    note: '备注'
  };
  return typeMap[type] || type;
}

function refreshTimeline() {
  if (currentTimelineBatchId) {
    loadTimelineData();
    showToast('已刷新');
  }
}