<template>
  <div class="container">
    <div class="header">
      <h1>🏪 快递驿站包裹体积预估与货架分配系统</h1>
      <p>3 排货架 × 10 个格子 × 0.1 m³ 每格 | 首次适应算法 | 取件码功能 | Vue 3 + Java</p>
    </div>

    <div class="grid-2 mb-4">
      <ParcelInput @allocated="handleAllocated" />
      <ShelfGrid ref="shelfGrid" :allocationResult="allocationResult" :key="shelfKey" />
    </div>

    <AllocationResult :result="allocationResult" @pickedUp="handlePickedUp" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ParcelInput from './components/ParcelInput.vue'
import ShelfGrid from './components/ShelfGrid.vue'
import AllocationResult from './components/AllocationResult.vue'

const allocationResult = ref(null)
const shelfGrid = ref(null)
const shelfKey = ref(0)

function handleAllocated(result) {
  allocationResult.value = result
  shelfKey.value++
}

function handlePickedUp() {
  shelfKey.value++
}
</script>
