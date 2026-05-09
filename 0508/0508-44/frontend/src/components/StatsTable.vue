<template>
  <div class="table-container">
    <table class="table">
      <thead>
        <tr>
          <th>洗车机编号</th>
          <th>总记录数</th>
          <th>超标次数</th>
          <th>超上限 (>5%)</th>
          <th>超下限 (<2%)</th>
          <th>超标率</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in statsData" :key="item.machineId">
          <td>
            <span :class="{ 'machine-highlight': item.machineId === 'C3' }">
              {{ item.machineId }}
            </span>
          </td>
          <td>{{ item.totalRecords }}</td>
          <td>
            <span :class="item.abnormalCount > 0 ? 'machine-highlight' : ''">
              {{ item.abnormalCount }}
            </span>
          </td>
          <td>{{ item.overLimitCount }}</td>
          <td>{{ item.underLimitCount }}</td>
          <td>
            <span :class="item.abnormalRate > 10 ? 'machine-highlight' : ''">
              {{ item.abnormalRate }}%
            </span>
          </td>
          <td>
            <span 
              class="badge" 
              :class="getStatusBadgeClass(item.abnormalRate)"
            >
              {{ getStatusText(item.abnormalRate) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  statsData: {
    type: Array,
    default: () => []
  }
})

const getStatusBadgeClass = (rate) => {
  if (rate === 0) return 'badge-normal'
  if (rate <= 10) return 'badge-info'
  return 'badge-warning'
}

const getStatusText = (rate) => {
  if (rate === 0) return '正常'
  if (rate <= 10) return '轻微异常'
  return '需要关注'
}
</script>
