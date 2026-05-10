<template>
  <div class="custom-formula-form">
    <div class="form-header">
      <div class="header-left">
        <el-icon><Edit /></el-icon>
        <span class="title">自定义配方（配方 D）</span>
      </div>
      <div class="header-right">
        <el-tag v-if="hasExisting" type="success" effect="light" size="small">
          已配置
        </el-tag>
        <el-button 
          v-if="hasExisting" 
          type="danger" 
          size="small" 
          link
          @click="handleDelete"
          :loading="deleting"
        >
          清除
        </el-button>
      </div>
    </div>

    <el-divider style="margin: 15px 0;" />

    <el-form :model="form" label-position="top" :rules="rules" ref="formRef">
      <el-form-item label="配方名称" prop="formulaName">
        <el-input 
          v-model="form.formulaName" 
          placeholder="例如：我的超级保鲜配方"
          size="large"
        />
      </el-form-item>

      <el-form-item label="成分比例（每升水）">
        <div class="ingredients-grid">
          <div class="ingredient-item">
            <div class="ingredient-label">
              <el-icon><Food /></el-icon>
              <span>白糖（克）</span>
            </div>
            <el-input-number 
              v-model="form.sugarRatio" 
              :min="0" 
              :max="50" 
              :step="0.5"
              :controls="false"
              placeholder="0"
              style="width: 100%;"
              size="large"
            />
            <div class="ingredient-hint">推荐：10-30g，最佳20g</div>
          </div>

          <div class="ingredient-item">
            <div class="ingredient-label">
              <el-icon><Warning /></el-icon>
              <span>84消毒液（毫升）</span>
            </div>
            <el-input-number 
              v-model="form.bleachRatio" 
              :min="0" 
              :max="10" 
              :step="0.1"
              :controls="false"
              placeholder="0"
              style="width: 100%;"
              size="large"
            />
            <div class="ingredient-hint">推荐：0.5-1ml，最佳0.5ml</div>
          </div>

          <div class="ingredient-item">
            <div class="ingredient-label">
              <el-icon><Cpu /></el-icon>
              <span>柠檬酸（克）</span>
            </div>
            <el-input-number 
              v-model="form.citricAcidRatio" 
              :min="0" 
              :max="10" 
              :step="0.1"
              :controls="false"
              placeholder="0"
              style="width: 100%;"
              size="large"
            />
            <div class="ingredient-hint">推荐：0.2-2g，最佳1g</div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="其他成分（可选）">
        <el-input 
          v-model="form.otherIngredients" 
          type="textarea"
          :rows="2"
          placeholder="例如：阿司匹林1片、维生素C半片等"
        />
      </el-form-item>

      <el-form-item label="配方描述（可选）">
        <el-input 
          v-model="form.description" 
          type="textarea"
          :rows="2"
          placeholder="描述这个配方的特点..."
        />
      </el-form-item>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="calc-info"
      >
        <template #title>
          <span>系统将根据您输入的成分自动计算：保鲜天数、成本、易用性评分</span>
        </template>
      </el-alert>

      <div class="form-actions">
        <el-button 
          type="primary" 
          size="large" 
          @click="handleSave"
          :loading="saving"
        >
          <el-icon><Check /></el-icon>
          <span>保存配方 D</span>
        </el-button>
        <el-button size="large" @click="resetForm">
          重置
        </el-button>
      </div>
    </el-form>

    <el-divider style="margin: 20px 0;" />

    <div class="tips-section">
      <h4 class="tips-title"><el-icon><InfoFilled /></el-icon> 配方推荐比例（每升水）</h4>
      <div class="tips-content">
        <div class="tip-item">
          <span class="tip-label">普通鲜花：</span>
          <span>白糖 20g + 84消毒液 0.5ml + 柠檬酸 1g</span>
        </div>
        <div class="tip-item">
          <span class="tip-label">娇嫩鲜花：</span>
          <span>白糖 15g + 84消毒液 0.3ml + 柠檬酸 0.5g</span>
        </div>
        <div class="tip-item">
          <span class="tip-label">经济型配方：</span>
          <span>白糖 20g + 84消毒液 0.5ml</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { flowerService } from '../api/flowerService'

const emit = defineEmits(['saved', 'deleted'])

const formRef = ref(null)
const hasExisting = ref(false)
const saving = ref(false)
const deleting = ref(false)

const rules = {
  formulaName: [
    { required: true, message: '请输入配方名称', trigger: 'blur' },
    { min: 2, max: 30, message: '名称长度在 2 到 30 个字符', trigger: 'blur' }
  ]
}

const initialForm = {
  formulaName: '',
  sugarRatio: null,
  bleachRatio: null,
  citricAcidRatio: null,
  otherIngredients: '',
  description: ''
}

const form = reactive({ ...initialForm })

const loadExisting = async () => {
  try {
    const response = await flowerService.getCustomFormula()
    if (response.data) {
      const data = response.data
      form.formulaName = data.formulaName || ''
      form.sugarRatio = data.sugarRatio ?? null
      form.bleachRatio = data.bleachRatio ?? null
      form.citricAcidRatio = data.citricAcidRatio ?? null
      form.otherIngredients = data.otherIngredients || ''
      form.description = data.description || ''
      hasExisting.value = true
    }
  } catch (error) {
    console.error('Load custom formula error:', error)
  }
}

const resetForm = () => {
  Object.assign(form, initialForm)
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  saving.value = true
  try {
    const response = await flowerService.saveCustomFormula({
      formulaCode: 'D',
      formulaName: form.formulaName,
      sugarRatio: form.sugarRatio || 0,
      bleachRatio: form.bleachRatio || 0,
      citricAcidRatio: form.citricAcidRatio || 0,
      otherIngredients: form.otherIngredients,
      description: form.description
    })
    
    hasExisting.value = true
    ElMessage.success('自定义配方已保存！雷达图和模拟实验将包含配方 D')
    emit('saved', response.data)
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除自定义配方吗？清除后雷达图和模拟实验将不再包含配方 D。',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    deleting.value = true
    const response = await flowerService.deleteCustomFormula()
    if (response.success) {
      hasExisting.value = false
      resetForm()
      ElMessage.success('自定义配方已清除')
      emit('deleted')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '清除失败')
    }
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadExisting()
})
</script>

<style scoped>
.custom-formula-form {
  width: 100%;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.ingredient-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ingredient-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.ingredient-hint {
  font-size: 11px;
  color: #909399;
  line-height: 1.4;
}

.calc-info {
  margin-bottom: 15px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.tips-section {
  background: #fafafa;
  padding: 15px;
  border-radius: 8px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  font-size: 13px;
  color: #606266;
}

.tip-label {
  color: #409eff;
  font-weight: 500;
}
</style>
