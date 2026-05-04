<template>
  <div class="params-panel">
    <h3>武器参数配置</h3>
    
    <el-form label-width="120px">
      <el-form-item label="枪支类型">
        <el-select 
          v-model="localParams.weapon_type" 
          placeholder="请选择枪支类型"
          @change="onWeaponTypeChange"
          style="width: 100%"
        >
          <el-option label="手枪" value="pistol" />
          <el-option label="步枪" value="rifle" />
          <el-option label="霰弹枪" value="shotgun" />
          <el-option label="冲锋枪" value="smg" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">弹道参数</el-divider>

      <el-form-item label="最小初速 (m/s)">
        <el-input-number 
          v-model="localParams.initial_velocity_min"
          :min="0"
          :max="2000"
          :step="10"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="最大初速 (m/s)">
        <el-input-number 
          v-model="localParams.initial_velocity_max"
          :min="0"
          :max="2000"
          :step="10"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="子弹质量 (g)">
        <el-input-number 
          v-model="localParams.bullet_mass"
          :min="0"
          :max="100"
          :step="0.1"
          :precision="2"
          style="width: 100%"
          placeholder="可选"
        />
      </el-form-item>

      <el-form-item label="阻力系数">
        <el-input-number 
          v-model="localParams.drag_coefficient"
          :min="0"
          :max="1"
          :step="0.01"
          :precision="3"
          style="width: 100%"
          placeholder="可选"
        />
      </el-form-item>
    </el-form>

    <div class="params-tips">
      <el-alert
        title="参数说明"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <div class="tips-content">
            <p><strong>初速范围：</strong>子弹离开枪口时的速度范围</p>
            <p><strong>子弹质量：</strong>影响弹道下坠程度</p>
            <p><strong>阻力系数：</strong>空气阻力的影响因子</p>
          </div>
        </template>
      </el-alert>
    </div>

    <div class="preset-params" v-if="showPresets">
      <h4>常用参数预设</h4>
      <el-tag 
        v-for="preset in weaponPresets" 
        :key="preset.value"
        class="preset-tag"
        effect="plain"
        @click="applyPreset(preset)"
      >
        {{ preset.label }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const localParams = ref({
  weapon_type: 'pistol',
  initial_velocity_min: 300,
  initial_velocity_max: 400,
  bullet_mass: null,
  drag_coefficient: null
})

const showPresets = ref(true)

const weaponPresets = [
  { label: '9mm手枪', value: 'pistol_9mm', data: { weapon_type: 'pistol', initial_velocity_min: 350, initial_velocity_max: 380, bullet_mass: 8.0, drag_coefficient: 0.2 } },
  { label: 'AK47步枪', value: 'rifle_ak47', data: { weapon_type: 'rifle', initial_velocity_min: 710, initial_velocity_max: 750, bullet_mass: 7.9, drag_coefficient: 0.15 } },
  { label: 'M4卡宾枪', value: 'rifle_m4', data: { weapon_type: 'rifle', initial_velocity_min: 880, initial_velocity_max: 940, bullet_mass: 4.0, drag_coefficient: 0.15 } },
  { label: '12号霰弹', value: 'shotgun_12', data: { weapon_type: 'shotgun', initial_velocity_min: 380, initial_velocity_max: 420, bullet_mass: 35.0, drag_coefficient: 0.25 } }
]

const weaponDefaults = {
  pistol: { initial_velocity_min: 300, initial_velocity_max: 400, bullet_mass: 8.0, drag_coefficient: 0.2 },
  rifle: { initial_velocity_min: 700, initial_velocity_max: 950, bullet_mass: 10.0, drag_coefficient: 0.15 },
  shotgun: { initial_velocity_min: 350, initial_velocity_max: 450, bullet_mass: 30.0, drag_coefficient: 0.25 },
  smg: { initial_velocity_min: 350, initial_velocity_max: 500, bullet_mass: 6.0, drag_coefficient: 0.2 }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    localParams.value = { ...localParams.value, ...newVal }
  }
}, { immediate: true, deep: true })

watch(localParams.value, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })

function onWeaponTypeChange(type) {
  const defaults = weaponDefaults[type]
  if (defaults) {
    localParams.value.initial_velocity_min = defaults.initial_velocity_min
    localParams.value.initial_velocity_max = defaults.initial_velocity_max
    localParams.value.bullet_mass = defaults.bullet_mass
    localParams.value.drag_coefficient = defaults.drag_coefficient
  }
}

function applyPreset(preset) {
  localParams.value = { ...preset.data }
}
</script>

<style scoped>
.params-panel {
  padding: 8px;
}

.params-panel h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.params-tips {
  margin-top: 16px;
}

.tips-content p {
  margin: 4px 0;
  font-size: 12px;
  line-height: 1.6;
}

.preset-params {
  margin-top: 16px;
}

.preset-params h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.preset-tag {
  margin: 4px 8px 4px 0;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-tag:hover {
  background: #409eff;
  color: white;
}
</style>
