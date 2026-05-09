<template>
  <div class="container">
    <nav class="nav-bar">
      <router-link to="/customer" class="nav-link">
        📱 顾客端
      </router-link>
      <router-link to="/merchant" class="nav-link">
        🏪 商家端
      </router-link>
      <router-link to="/analytics" class="nav-link">
        📊 数据分析
      </router-link>
      <router-link to="/correlation" class="nav-link">
        🔗 菜品关联
      </router-link>
      <div class="restaurant-selector">
        <label>🏠 餐厅:</label>
        <select v-model="selectedRestaurantId" @change="handleRestaurantChange">
          <option v-for="id in availableRestaurants" :key="id" :value="id">
            餐厅 {{ id }}
          </option>
        </select>
      </div>
    </nav>
    <router-view :key="selectedRestaurantId" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { restaurantApi } from './api'

const selectedRestaurantId = ref(restaurantApi.getCurrent())
const availableRestaurants = [1, 2, 3, 4, 5]

const handleRestaurantChange = () => {
  restaurantApi.setCurrent(selectedRestaurantId.value)
  window.location.reload()
}

onMounted(() => {
  selectedRestaurantId.value = restaurantApi.getCurrent()
})
</script>

<style scoped>
.restaurant-selector {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 8px;
  color: white;
}

.restaurant-selector label {
  font-weight: 600;
}

.restaurant-selector select {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: white;
  color: #333;
  font-weight: 600;
  cursor: pointer;
}
</style>
