<template>
  <div class="risk-list">
    <div v-if="students.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="empty-text">暂无数据</div>
    </div>
    
    <div 
      v-for="(student, index) in students" 
      :key="student.userId" 
      class="risk-item"
    >
      <div :class="['rank-badge', index < 3 ? `top-${index + 1}` : 'other']">
        {{ index + 1 }}
      </div>
      <div class="risk-info">
        <div class="risk-name">{{ student.userName }}</div>
        <div class="risk-counts">
          <span v-for="(count, type) in student.typeCounts" :key="type" style="margin-right: 12px;">
            {{ getActionLabel(type) }}: {{ count }}
          </span>
          <span v-if="Object.keys(student.typeCounts || {}).length === 0">
            总次数: {{ student.totalCount }}
          </span>
        </div>
      </div>
      <div class="risk-score">
        <div class="score-value">{{ student.riskScore }}</div>
        <div class="score-label">风险分数</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  students: {
    type: Array,
    default: () => []
  }
})

const actionLabels = {
  'VISIBILITY_CHANGE': '切出窗口',
  'MOUSE_LEAVE': '鼠标离开',
  'COPY': '复制',
  'PASTE': '粘贴',
  'RIGHT_CLICK': '右键',
  'KEYBOARD_SHORTCUT': '快捷键'
}

function getActionLabel(type) {
  return actionLabels[type] || type
}
</script>
