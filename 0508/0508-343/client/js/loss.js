let currentLossBatchId = null;

async function loadLossData() {
  const batchId = document.getElementById('loss-batch-select').value;
  if (!batchId) {
    document.getElementById('loss-summary').innerHTML = '';
    document.getElementById('loss-segments').innerHTML =
      '<div class="empty-state">请选择一个批次查看损耗分析</div>';
    currentLossBatchId = null;
    return;
  }

  currentLossBatchId = batchId;

  try {
    const [lossResult, segmentsResult] = await Promise.all([
      lossAPI.getBatchLoss(batchId),
      lossAPI.getSegments(batchId)
    ]);

    if (lossResult.success && segmentsResult.success) {
      renderLossSummary(lossResult.data);
      renderLossSegments(segmentsResult.data);
    } else {
      showToast('加载失败', 'error');
    }
  } catch (error) {
    console.error('加载损耗数据失败:', error);
    showToast('加载失败', 'error');
  }
}

function renderLossSummary(data) {
  const { batch, stages, remarks } = data;
  const totalLoss = stages.reduce((sum, s) => sum + parseFloat(s.lossAmount || 0), 0);

  const html = `<div class="summary-cards">
    <div class="summary-card">
      <div class="summary-card-label">总损耗量</div>
      <div class="summary-card-value">${totalLoss.toFixed(2)} kg</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">总损耗率</div>
      <div class="summary-card-value">${batch.totalLossRate || '0.00'}%</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">阶段数</div>
      <div class="summary-card-value">${stages.length}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">备注数</div>
      <div class="summary-card-value">${remarks.length}</div>
    </div>
  </div>

  <div class="batch-info" style="margin-top: 20px;">
    <div class="batch-info-item">
      <span class="batch-info-label">批次号</span>
      <span class="batch-info-value">${batch.batchNo}</span>
    </div>
    <div class="batch-info-item">
      <span class="batch-info-label">机台</span>
      <span class="batch-info-value">${batch.machineId}</span>
    </div>
    <div class="batch-info-item">
      <span class="batch-info-label">原浆→新浆</span>
      <span class="batch-info-value">${batch.oldPulpType} → ${batch.newPulpType}</span>
    </div>
    <div class="batch-info-item">
      <span class="batch-info-label">操作员</span>
      <span class="batch-info-value">${batch.operator || '-'}</span>
    </div>
    <div class="batch-info-item">
      <span class="batch-info-label">状态</span>
      <span class="batch-info-value"><span class="status-badge status-${batch.status}">${getStatusText(batch.status)}</span></span>
    </div>
  </div>`;

  document.getElementById('loss-summary').innerHTML = html;
}

function renderLossSegments(segments) {
  const container = document.getElementById('loss-segments');

  if (segments.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无损耗分段数据，请先进行计算</div>';
    return;
  }

  let html = '';

  segments.forEach((segment, index) => {
    const typeClass = `segment-${segment.segmentType}`;
    const detailClass = index === 0 ? 'show' : '';

    html += `<div class="segment-item">
      <div class="segment-header" onclick="toggleSegmentDetail(${segment.id})">
        <div class="segment-title">
          <span class="segment-type-badge ${typeClass}">${getSegmentTypeText(segment.segmentType)}</span>
          <strong>${segment.segmentName}</strong>
        </div>
        <div class="segment-stats">
          <span>损耗:<strong>${segment.segmentLoss} kg</strong></span>
          <span>时长:<strong>${formatDuration(segment.duration)}</strong></span>
          <span>▼</span>
        </div>
      </div>
      <div class="segment-detail ${detailClass}" id="segment-detail-${segment.id}">`;

    if (segment.calculations && segment.calculations.length > 0) {
      html += `<table class="stage-table">
        <thead>
          <tr>
            <th>阶段名称</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>时长(秒)</th>
            <th>流量差(L)</th>
            <th>平均浓度(%)</th>
            <th>理论产出(kg)</th>
            <th>实际产出(kg)</th>
            <th>损耗量(kg)</th>
            <th>损耗率(%)</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>`;

      segment.calculations.forEach(calc => {
        html += `<tr>
          <td>${calc.stageName}</td>
          <td>${formatDateTime(calc.startTime)}</td>
          <td>${formatDateTime(calc.endTime)}</td>
          <td>${calc.duration || '-'}</td>
          <td>${calc.flowDifference || '-'}</td>
          <td>${calc.avgConcentration || '-'}</td>
          <td>${calc.theoreticalOutput || '-'}</td>
          <td>${calc.actualOutput || '-'}</td>
          <td><strong>${calc.lossAmount || '-'}</strong></td>
          <td><strong>${calc.lossRate || '-'}%</strong></td>
          <td>${calc.remark || '-'}</td>
        </tr>`;
      });

      html += '</tbody></table>';
    } else {
      html += '<div style="padding: 20px; color: #9ca3af; text-align: center;">暂无计算数据</div>';
    }

    html += '</div></div>';
  });

  container.innerHTML = html;
}

function toggleSegmentDetail(segmentId) {
  const detail = document.getElementById(`segment-detail-${segmentId}`);
  if (detail) {
    detail.classList.toggle('show');
  }
}

function getSegmentTypeText(type) {
  const typeMap = {
    preparation: '准备',
    switching: '切换',
    stabilization: '稳定',
    completion: '完成',
    downtime: '停机'
  };
  return typeMap[type] || type;
}

async function recalculateLoss() {
  if (!currentLossBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }

  try {
    const result = await lossAPI.recalculate(currentLossBatchId);
    if (result.success) {
      showToast('重新计算成功');
      loadLossData();
    } else {
      showToast(result.message || '计算失败', 'error');
    }
  } catch (error) {
    showToast('计算失败', 'error');
  }
}

function exportLossReport() {
  if (!currentLossBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }
  reportsAPI.exportReport(currentLossBatchId);
  showToast('正在导出完整报告...');
}

function exportBriefReport() {
  if (!currentLossBatchId) {
    showToast('请先选择批次', 'error');
    return;
  }
  reportsAPI.exportBrief(currentLossBatchId);
  showToast('正在导出简报...');
}