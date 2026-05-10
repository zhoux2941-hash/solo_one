<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h3>参数设置</h3>
      <p class="desc">调整参数实时预览榫卯结构</p>
    </div>
    <div class="sidebar-content">
      <div class="form-section">
        <div class="section-title">榫卯类型</div>
        <div class="join-type-grid">
          <div 
            v-for="type in joinTypes" 
            :key="type.code"
            class="join-type-card"
            :class="{ selected: currentType === type.code }"
            @click="onTypeChange(type.code)"
          >
            <div class="icon">{{ getTypeIcon(type.code) }}</div>
            <div class="name">{{ type.name }}</div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">木料尺寸 (mm)</div>
        <el-form label-width="80px" :model="woodParams" label-position="top">
          <el-form-item label="长度">
            <el-input-number 
              v-model="woodParams.length" 
              :min="10" 
              :max="2000" 
              :step="10"
              @change="debouncedCalculate"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="宽度">
            <el-input-number 
              v-model="woodParams.width" 
              :min="10" 
              :max="500" 
              :step="5"
              @change="debouncedCalculate"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="高度">
            <el-input-number 
              v-model="woodParams.height" 
              :min="10" 
              :max="300" 
              :step="5"
              @change="debouncedCalculate"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="form-section">
        <div class="section-title">榫头尺寸 (mm)</div>
        <el-form label-width="80px" :model="tenonParams" label-position="top">
          <el-form-item label="长度">
            <el-input-number 
              v-model="tenonParams.length" 
              :min="5" 
              :max="200" 
              :step="1"
              @change="debouncedCalculate"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="宽度">
            <el-input-number 
              v-model="tenonParams.width" 
              :min="5" 
              :max="200" 
              :step="1"
              @change="debouncedCalculate"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="高度">
            <el-input-number 
              v-model="tenonParams.height" 
              :min="5" 
              :max="200" 
              :step="1"
              @change="debouncedCalculate"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="form-section">
        <div class="section-title">加工余量 (mm)</div>
        <el-slider 
          v-model="margin" 
          :min="0" 
          :max="20" 
          :step="0.5"
          show-input
          @change="debouncedCalculate"
        />
      </div>

      <div class="form-section" v-if="calculationResult">
        <div class="section-title">计算结果</div>
        <div class="calc-result">
          <div class="result-item">
            <span class="label">榫卯类型</span>
            <span class="value">{{ calculationResult.joinTypeName }}</span>
          </div>
          <template v-if="calculationResult.tailCount">
            <div class="result-item">
              <span class="label">燕尾数量</span>
              <span class="value">{{ calculationResult.tailCount }}</span>
            </div>
            <div class="result-item">
              <span class="label">顶部宽度</span>
              <span class="value">{{ calculationResult.tailWidth?.toFixed(2) }} mm</span>
            </div>
            <div class="result-item" v-if="calculationResult.tailBottomWidth">
              <span class="label">底部宽度</span>
              <span class="value">{{ calculationResult.tailBottomWidth?.toFixed(2) }} mm</span>
            </div>
            <div class="result-item">
              <span class="label">燕尾角度</span>
              <span class="value">{{ calculationResult.tailAngle }}°</span>
            </div>
            <div class="result-item" v-if="calculationResult.tailOffset">
              <span class="label">侧向偏移</span>
              <span class="value">{{ calculationResult.tailOffset?.toFixed(2) }} mm</span>
            </div>
          </template>
          <template v-if="calculationResult.fingerCount">
            <div class="result-item">
              <span class="label">指接数量</span>
              <span class="value">{{ calculationResult.fingerCount }}</span>
            </div>
            <div class="result-item">
              <span class="label">指接宽度</span>
              <span class="value">{{ calculationResult.fingerWidth?.toFixed(2) }} mm</span>
            </div>
          </template>
          <div class="result-item" v-if="calculationResult.fit">
            <span class="label">配合类型</span>
            <span class="value">{{ calculationResult.fit }}</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">快捷收藏</div>
        <div class="quick-favorites">
          <div v-if="favorites.length === 0" style="color: #909399; font-size: 12px; text-align: center;">
            暂无收藏记录
          </div>
          <div 
            v-for="fav in favorites.slice(0, 3)" 
            :key="fav.id"
            class="favorite-item"
            @click="applyFavorite(fav)"
          >
            <div class="info">
              <div class="name">{{ fav.name }}</div>
              <div class="type">{{ getJoinTypeName(fav.joinType) }}</div>
            </div>
            <el-icon><Pointer /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useJoinStore } from '@/stores/join'
import { getJoinTypes } from '@/api/join'
import { storeToRefs } from 'pinia'

const emit = defineEmits(['calculate'])

const store = useJoinStore()
const { 
  currentType, 
  woodParams, 
  tenonParams, 
  margin, 
  calculationResult,
  favorites,
  currentParams
} = storeToRefs(store)

const joinTypes = ref([])
let debounceTimer = null

const getTypeIcon = (code) => {
  const icons = {
    DOVETAIL: '🦅',
    STRAIGHT: '⬛',
    CLAMP: '🔧',
    BOX: '📦',
    LAP: '🔗'
  }
  return icons[code] || '🔷'
}

const getJoinTypeName = (code) => {
  const type = joinTypes.value.find(t => t.code === code)
  return type?.name || code
}

const onTypeChange = (code) => {
  store.setJoinType(code)
  debouncedCalculate()
}

const debouncedCalculate = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('calculate', currentParams.value)
  }, 300)
}

const applyFavorite = (fav) => {
  store.applyFavorite(fav)
  setTimeout(() => debouncedCalculate(), 100)
}

onMounted(async () => {
  try {
    joinTypes.value = await getJoinTypes()
  } catch (e) {
    console.error('获取榫卯类型失败:', e)
  }
  
  await store.loadFavorites()
  debouncedCalculate()
})
</script>