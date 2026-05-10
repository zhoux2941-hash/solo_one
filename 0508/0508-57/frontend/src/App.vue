<template>
  <div class="container">
    <header class="header">
      <h1>🏭 工厂物料齐套率检查工具</h1>
      <p>实时计算物料齐套率，智能生成采购建议</p>
    </header>

    <div class="card">
      <div class="card-header">
        <h2>📋 订单数量输入</h2>
      </div>
      <div class="form-group">
        <label for="orderQuantity">计划生产数量：</label>
        <input
          id="orderQuantity"
          v-model.number="orderQuantity"
          type="number"
          min="1"
          step="1"
          placeholder="请输入订单数量（正整数）"
          @keyup.enter="handleCheck"
        />
        <button 
          class="btn btn-primary" 
          @click="handleCheck"
          :disabled="loading || !orderQuantity"
        >
          {{ loading ? '检查中...' : '开始检查' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else-if="result">
      <div class="card">
        <div class="card-header">
          <h2>📊 齐套率仪表盘</h2>
        </div>
        <div class="dashboard">
          <div :class="['stat-card', result.allSufficient ? 'success' : 'warning']">
            <svg class="progress-ring" viewBox="0 0 120 120">
              <circle
                stroke="rgba(255,255,255,0.3)"
                stroke-width="10"
                fill="transparent"
                r="50"
                cx="60"
                cy="60"
              />
              <circle
                class="progress-ring-circle"
                stroke="white"
                stroke-width="10"
                stroke-linecap="round"
                fill="transparent"
                r="50"
                cx="60"
                cy="60"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="strokeDashoffset"
              />
            </svg>
            <div class="stat-label">物料齐套率</div>
            <div class="stat-value">{{ result.kitRatePercent }}</div>
            <div class="stat-sub">{{ result.allSufficient ? '✅ 物料充足' : '⚠️ 物料不足' }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">计划产量</div>
            <div class="stat-value">{{ result.orderQuantity }}</div>
            <div class="stat-sub">单位：件</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">最大可生产</div>
            <div class="stat-value">{{ result.maxProducibleQuantity }}</div>
            <div class="stat-sub">单位：件</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">需采购物料</div>
            <div class="stat-value">{{ result.purchaseList.length }}</div>
            <div class="stat-sub">种</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>📦 物料详情</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>物料编码</th>
              <th>物料名称</th>
              <th>当前库存</th>
              <th>需求数量</th>
              <th>缺口数量</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="material in result.materials" :key="material.materialCode" :class="{ insufficient: !material.isSufficient }">
              <td>{{ material.materialCode }}</td>
              <td>{{ material.materialName }}</td>
              <td>{{ material.currentStock }} {{ material.unit }}</td>
              <td>{{ material.requiredQuantity }} {{ material.unit }}</td>
              <td>{{ material.shortage }} {{ material.unit }}</td>
              <td>
                <span :class="['status-badge', material.isSufficient ? 'sufficient' : 'insufficient']">
                  {{ material.isSufficient ? '充足' : '不足' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card" v-if="result.purchaseList.length > 0">
        <div class="card-header">
          <h2>🛒 建议采购清单</h2>
        </div>
        <div class="purchase-list">
          <div v-for="item in result.purchaseList" :key="item.materialCode" class="purchase-item">
            <div class="purchase-item-info">
              <span class="purchase-item-code">[{{ item.materialCode }}]</span>
              <span class="purchase-item-name">{{ item.materialName }}</span>
            </div>
            <div class="purchase-item-qty">
              需采购 {{ item.purchaseQuantity }} {{ item.unit }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="card empty-state">
      <div class="empty-state-icon">📝</div>
      <h3>请输入订单数量开始检查</h3>
      <p>系统将自动计算物料齐套率并生成采购建议</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { checkKitRate } from './api/material.js'

const orderQuantity = ref(null)
const result = ref(null)
const loading = ref(false)
const error = ref(null)

const circumference = 2 * Math.PI * 50

const strokeDashoffset = computed(() => {
  if (!result.value) return circumference
  return circumference - (result.value.kitRate * circumference)
})

const isPositiveInteger = (num) => {
  return Number.isInteger(num) && num > 0
}

const handleCheck = async () => {
  if (!orderQuantity.value || !isPositiveInteger(orderQuantity.value)) {
    error.value = '请输入有效的订单数量（正整数）'
    return
  }

  error.value = null
  loading.value = true

  try {
    const response = await checkKitRate(orderQuantity.value)
    result.value = response.data
  } catch (err) {
    error.value = err.response?.data || '检查失败，请稍后重试'
    console.error('检查失败:', err)
  } finally {
    loading.value = false
  }
}
</script>
