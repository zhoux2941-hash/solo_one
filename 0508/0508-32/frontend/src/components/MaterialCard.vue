<template>
  <div class="material-card" :style="{ '--card-color': color }">
    <div class="card-icon">
      <span>{{ icon }}</span>
    </div>
    <div class="card-content">
      <div class="card-name">{{ name }}</div>
      <div class="card-value">
        <span class="amount">{{ amount }}</span>
        <span class="unit">{{ unit }}</span>
      </div>
      <div class="card-percentage">
        占比 <span class="percentage-value">{{ percentage }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    default: ''
  },
  amount: {
    type: [Number, String],
    default: 0
  },
  unit: {
    type: String,
    default: ''
  },
  percentage: {
    type: [Number, String],
    default: 0
  },
  color: {
    type: String,
    default: '#5470c6'
  },
  icon: {
    type: String,
    default: '📦'
  }
})
</script>

<style scoped>
.material-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid var(--card-color);
  transition: transform 0.2s, box-shadow 0.2s;
}

.material-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--card-color) 15%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.card-content {
  flex: 1;
}

.card-name {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
}

.card-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.amount {
  font-size: 26px;
  font-weight: 700;
  color: #333;
}

.unit {
  font-size: 13px;
  color: #888;
}

.card-percentage {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.percentage-value {
  font-weight: 600;
  color: var(--card-color);
}
</style>
