<template>
  <div class="plant-card" :class="{ overdue: plant.isOverdue }">
    <div class="card-header">
      <h3>{{ plant.name }}</h3>
      <span class="species">{{ plant.species }}</span>
    </div>
    
    <div class="card-body">
      <div class="info-item">
        <span class="label">📍 位置:</span>
        <span>{{ plant.location }}</span>
      </div>
      <div class="info-item">
        <span class="label">⏰ 浇水周期:</span>
        <span>{{ plant.wateringIntervalDays }} 天</span>
      </div>
      <div class="info-item">
        <span class="label">🌱 上次浇水:</span>
        <span>{{ formatDate(plant.lastWateredAt) }}</span>
      </div>
      <div class="info-item">
        <span class="label">📅 下次浇水:</span>
        <span>{{ formatDate(plant.nextWateringDate) }}</span>
      </div>
      <div class="info-item status">
        <span class="label">状态:</span>
        <span class="status-badge" :class="getStatusClass()">
          {{ getStatusText() }}
        </span>
      </div>
    </div>
    
    <div class="card-actions">
      <button 
        class="water-btn" 
        @click="showWaterModal"
        :disabled="isWatering"
      >
        {{ isWatering ? '浇水中...' : '💧 已浇水' }}
      </button>
      <button class="logs-btn" @click="$emit('show-logs', plant.id)">
        📋 记录
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'PlantCard',
  props: {
    plant: {
      type: Object,
      required: true
    }
  },
  emits: ['watered', 'show-logs'],
  setup(props, { emit }) {
    const isWatering = ref(false)

    const formatDate = (date) => {
      if (!date) return '从未'
      const d = new Date(date)
      return d.toLocaleDateString('zh-CN')
    }

    const getStatusClass = () => {
      const days = props.plant.daysUntilNextWatering
      if (days === undefined || days === null) return 'normal'
      if (days < 0) return 'overdue'
      if (days <= 1) return 'warning'
      return 'normal'
    }

    const getStatusText = () => {
      const days = props.plant.daysUntilNextWatering
      if (days === undefined || days === null) return '待更新'
      if (days < 0) return `逾期 ${Math.abs(days)} 天`
      if (days === 0) return '今天需要浇水'
      if (days === 1) return '明天需要浇水'
      return `${days} 天后浇水`
    }

    const showWaterModal = () => {
      const username = prompt('请输入您的姓名:')
      if (username && username.trim()) {
        emit('watered', {
          plantId: props.plant.id,
          wateredBy: username.trim()
        })
      }
    }

    return {
      isWatering,
      formatDate,
      getStatusClass,
      getStatusText,
      showWaterModal
    }
  }
}
</script>

<style scoped>
.plant-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid #667eea;
}

.plant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.plant-card.overdue {
  border-left-color: #ef4444;
}

.card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
}

.species {
  color: #666;
  font-size: 0.9rem;
}

.card-body {
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  font-size: 0.9rem;
}

.label {
  color: #666;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.normal {
  background: #dcfce7;
  color: #166534;
}

.status-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.overdue {
  background: #fee2e2;
  color: #991b1b;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.water-btn,
.logs-btn {
  flex: 1;
  padding: 0.7rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.water-btn {
  background: #667eea;
  color: white;
}

.water-btn:hover {
  background: #5a67d8;
}

.water-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.logs-btn {
  background: #f3f4f6;
  color: #374151;
}

.logs-btn:hover {
  background: #e5e7eb;
}
</style>
