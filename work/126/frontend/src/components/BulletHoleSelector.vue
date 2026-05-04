<template>
  <div class="hole-selector">
    <div class="selector-header">
      <h3>弹孔标记</h3>
      <el-tag :type="holes.length >= 2 ? 'success' : 'warning'">
        {{ holes.length }} / 2 个标记
      </el-tag>
    </div>

    <el-alert 
      v-if="holes.length < 2"
      title="需要至少2个弹孔点才能进行弹道分析"
      type="warning"
      :closable="false"
      show-icon
      class="alert"
    />

    <div class="hole-list">
      <div 
        v-for="(hole, index) in holes" 
        :key="hole.id"
        class="hole-item"
        :class="{ active: selectedIndex === index }"
        @click="selectHole(index)"
      >
        <div class="hole-number">
          <el-tag :type="hole.hole_type === 'entrance' ? 'primary' : hole.hole_type === 'exit' ? 'danger' : 'info'">
            {{ index + 1 }}
          </el-tag>
        </div>
        <div class="hole-info">
          <div class="hole-coords">
            ({{ hole.position.x.toFixed(3) }}, 
            {{ hole.position.y.toFixed(3) }}, 
            {{ hole.position.z.toFixed(3) }})
          </div>
          <div class="hole-meta">
            <span class="meta-item">{{ hole.is_manual ? '手动标记' : '自动检测' }}</span>
            <span class="meta-item">置信度: {{ (hole.confidence * 100).toFixed(1) }}%</span>
          </div>
        </div>
        <div class="hole-actions">
          <el-select 
            v-model="hole.hole_type" 
            size="small" 
            placeholder="类型"
            @change="updateHoleType(index, $event)"
          >
            <el-option label="射入口" value="entrance" />
            <el-option label="射出口" value="exit" />
            <el-option label="不确定" value="uncertain" />
          </el-select>
          <el-button 
            type="danger" 
            size="small" 
            :icon="Delete"
            @click.stop="removeHole(index)"
          />
        </div>
      </div>
    </div>

    <div class="selector-footer">
      <el-button 
        type="warning" 
        :disabled="holes.length === 0"
        @click="clearAll"
        plain
      >
        清除所有
      </el-button>
      <div class="tips">
        <el-text type="info" size="small">
          提示: 在点云视图中点击添加弹孔标记
        </el-text>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Delete } from '@element-plus/icons-vue'

const props = defineProps({
  holes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['remove', 'update', 'select', 'clear'])

const selectedIndex = ref(-1)

function selectHole(index) {
  selectedIndex.value = index
  emit('select', index)
}

function removeHole(index) {
  emit('remove', index)
  if (selectedIndex.value === index) {
    selectedIndex.value = -1
  } else if (selectedIndex.value > index) {
    selectedIndex.value--
  }
}

function updateHoleType(index, type) {
  emit('update', { index, updates: { hole_type: type } })
}

function clearAll() {
  emit('clear')
  selectedIndex.value = -1
}
</script>

<style scoped>
.hole-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selector-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.alert {
  margin-bottom: 12px;
}

.hole-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
  padding-right: 4px;
}

.hole-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.hole-item:hover {
  background: #ecf5ff;
}

.hole-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.hole-number {
  flex-shrink: 0;
}

.hole-info {
  flex: 1;
  min-width: 0;
}

.hole-coords {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  word-break: break-all;
}

.hole-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #909399;
}

.meta-item {
  display: inline-block;
}

.hole-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.selector-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tips {
  flex: 1;
  text-align: right;
}
</style>
