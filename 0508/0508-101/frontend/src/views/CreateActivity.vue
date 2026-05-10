<template>
  <div class="create-activity-page">
    <div class="page-header">
      <h2>创建新活动</h2>
    </div>
    
    <el-card>
      <el-form 
        :model="activityForm" 
        :rules="rules" 
        ref="activityFormRef"
        label-width="120px"
        style="max-width: 800px;"
      >
        <el-form-item label="活动名称" prop="name">
          <el-input 
            v-model="activityForm.name" 
            placeholder="请输入活动名称"
            style="width: 400px;"
          />
        </el-form-item>
        
        <el-form-item label="申请部门" prop="department">
          <el-select 
            v-model="activityForm.department" 
            placeholder="请选择或输入部门"
            allow-create
            filterable
            style="width: 400px;"
          >
            <el-option
              v-for="dept in departments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </el-form-item>
        
        <el-divider content-position="left">预算细项</el-divider>
        
        <div class="budget-items">
          <div 
            v-for="(item, index) in activityForm.budgetItems" 
            :key="index" 
            class="budget-item"
          >
            <el-form-item 
              :prop="`budgetItems[${index}].itemName`"
              :rules="{ required: true, message: '请输入项目名称', trigger: 'blur' }"
              style="margin-bottom: 10px;"
            >
              <el-input 
                v-model="item.itemName" 
                placeholder="项目名称（如：宣传、物资）" 
                style="width: 200px; margin-right: 10px;"
              />
            </el-form-item>
            <el-form-item 
              :prop="`budgetItems[${index}].amount`"
              :rules="{ 
                required: true, 
                type: 'number',
                message: '请输入有效金额', 
                trigger: 'blur' 
              }"
              style="margin-bottom: 10px;"
            >
              <el-input-number
                v-model="item.amount"
                :min="0"
                :precision="2"
                placeholder="金额"
                style="width: 150px;"
              />
            </el-form-item>
            <el-button 
              type="danger" 
              size="small" 
              @click="removeBudgetItem(index)"
              :disabled="activityForm.budgetItems.length <= 1"
              style="margin-left: 10px;"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <el-form-item>
          <el-button type="primary" size="small" @click="addBudgetItem">
            <el-icon><Plus /></el-icon>
            添加预算细项
          </el-button>
        </el-form-item>
        
        <el-divider content-position="left">预算汇总</el-divider>
        
        <el-form-item label="预算总额">
          <el-input 
            v-model="totalBudget" 
            disabled
            style="width: 200px;"
          >
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            创建活动
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'

export default {
  name: 'CreateActivity',
  components: { Plus },
  data() {
    return {
      submitting: false,
      activityFormRef: null,
      activityForm: {
        name: '',
        department: '',
        budgetItems: [
          { itemName: '', amount: 0 }
        ]
      },
      rules: {
        name: [
          { required: true, message: '请输入活动名称', trigger: 'blur' }
        ],
        department: [
          { required: true, message: '请选择申请部门', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    departments() {
      return this.$store.state.departments
    },
    totalBudget() {
      return this.activityForm.budgetItems
        .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
        .toFixed(2)
    }
  },
  async mounted() {
    if (this.departments.length === 0) {
      await this.$store.dispatch('fetchDepartments')
    }
  },
  methods: {
    addBudgetItem() {
      this.activityForm.budgetItems.push({ itemName: '', amount: 0 })
    },
    
    removeBudgetItem(index) {
      if (this.activityForm.budgetItems.length > 1) {
        this.activityForm.budgetItems.splice(index, 1)
      }
    },
    
    async submitForm() {
      try {
        await this.$refs.activityFormRef.validate()
        
        if (parseFloat(this.totalBudget) <= 0) {
          this.$message.warning('预算总额必须大于0')
          return
        }
        
        const validItems = this.activityForm.budgetItems.filter(
          item => item.itemName && item.amount > 0
        )
        
        if (validItems.length === 0) {
          this.$message.warning('请至少添加一个有效的预算细项')
          return
        }
        
        this.submitting = true
        
        const data = {
          ...this.activityForm,
          budgetTotal: parseFloat(this.totalBudget),
          budgetItems: validItems
        }
        
        await this.$store.dispatch('createActivity', data)
        this.$message.success('活动创建成功')
        this.$router.push('/activities')
      } catch (error) {
        if (error !== false) {
          this.$message.error('创建失败：' + (error.response?.data?.message || error.message))
        }
      } finally {
        this.submitting = false
      }
    },
    
    resetForm() {
      this.$refs.activityFormRef.resetFields()
      this.activityForm.budgetItems = [{ itemName: '', amount: 0 }]
    }
  }
}
</script>

<style scoped>
.create-activity-page {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.budget-items {
  padding-left: 120px;
}

.budget-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>
