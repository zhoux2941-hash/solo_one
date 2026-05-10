<template>
  <div class="activities-page">
    <div class="page-header">
      <h2>活动列表</h2>
      <div class="header-actions">
        <el-select 
          v-model="selectedDepartment" 
          placeholder="选择部门筛选" 
          clearable
          style="width: 200px; margin-right: 20px;"
          @change="handleDepartmentChange"
        >
          <el-option
            v-for="dept in departments"
            :key="dept"
            :label="dept"
            :value="dept"
          />
        </el-select>
        <el-button type="primary" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          创建活动
        </el-button>
      </div>
    </div>

    <el-table 
      :data="activities" 
      v-loading="loading"
      border
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="活动名称" min-width="180" />
      <el-table-column prop="department" label="申请部门" width="120" />
      <el-table-column label="预算金额" width="120">
        <template #default="scope">
          ¥{{ scope.row.budgetTotal }}
        </template>
      </el-table-column>
      <el-table-column label="决算金额" width="120">
        <template #default="scope">
          <span :class="{ 'text-danger': isExceeded(scope.row) }">
            ¥{{ scope.row.actualTotal || 0 }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="350" fixed="right">
        <template #default="scope">
          <el-button 
            size="small" 
            type="primary" 
            @click="viewDetail(scope.row)"
          >
            详情
          </el-button>
          <el-button 
            v-if="canSubmitActual(scope.row)"
            size="small" 
            type="success" 
            @click="submitActual(scope.row)"
          >
            提交决算
          </el-button>
          <el-button 
            v-if="canApprove(scope.row)"
            size="small" 
            type="warning" 
            @click="approveActivity(scope.row)"
          >
            审批
          </el-button>
          <el-button 
            v-if="canChangeBudget(scope.row)"
            size="small" 
            type="info" 
            @click="openChangeBudgetDialog(scope.row)"
          >
            变更预算
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteActivity(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="actualDialogVisible"
      title="提交决算"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="actualForm" label-width="120px">
        <el-form-item label="活动名称">
          {{ currentActivity?.name }}
        </el-form-item>
        <el-form-item label="预算总额">
          ¥{{ currentActivity?.budgetTotal }}
        </el-form-item>
        
        <el-divider content-position="left">决算细项</el-divider>
        
        <div v-for="(item, index) in actualForm.actualItems" :key="index" class="actual-item">
          <el-input 
            v-model="item.itemName" 
            placeholder="项目名称" 
            style="width: 200px; margin-right: 10px;"
          />
          <el-input-number
            v-model="item.amount"
            :min="0"
            :precision="2"
            placeholder="金额"
            style="width: 150px;"
          />
          <el-button 
            type="danger" 
            size="small" 
            @click="removeActualItem(index)"
            style="margin-left: 10px;"
          >
            删除
          </el-button>
        </div>
        
        <el-button type="primary" size="small" @click="addActualItem">
          <el-icon><Plus /></el-icon>
          添加细项
        </el-button>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="actualDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitActualForm" :loading="submitting">
            提交
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="changeBudgetDialogVisible"
      title="预算变更申请"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="changeBudgetForm" 
        :rules="changeBudgetRules"
        ref="changeBudgetFormRef"
        label-width="120px"
      >
        <el-form-item label="活动名称">
          {{ currentActivity?.name }}
        </el-form-item>
        <el-form-item label="当前预算">
          <strong>¥{{ currentActivity?.budgetTotal }}</strong>
        </el-form-item>
        <el-form-item label="新预算" prop="newBudget">
          <el-input-number
            v-model="changeBudgetForm.newBudget"
            :min="0"
            :precision="2"
            placeholder="请输入新预算金额"
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="变更金额">
          <span :class="{ 
            'text-success': parseFloat(changeBudgetForm.changeAmount) > 0,
            'text-danger': parseFloat(changeBudgetForm.changeAmount) < 0
          }">
            {{ parseFloat(changeBudgetForm.changeAmount) >= 0 ? '+' : '' }}{{ changeBudgetForm.changeAmount }}
          </span>
        </el-form-item>
        <el-form-item label="变更理由" prop="reason">
          <el-input
            v-model="changeBudgetForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请详细说明预算变更的理由（如：活动规模扩大、物资涨价等）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="changeBudgetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitChangeBudget" :loading="submittingChange">
            提交申请
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'
import api from '../api'

export default {
  name: 'Activities',
  components: { Plus },
  data() {
    return {
      selectedDepartment: null,
      actualDialogVisible: false,
      submitting: false,
      currentActivity: null,
      actualForm: {
        actualItems: [
          { itemName: '', amount: 0 }
        ]
      },
      changeBudgetDialogVisible: false,
      submittingChange: false,
      changeBudgetFormRef: null,
      changeBudgetForm: {
        newBudget: 0,
        reason: ''
      },
      changeBudgetRules: {
        newBudget: [
          { required: true, message: '请输入新预算金额', trigger: 'blur' },
          { type: 'number', min: 0, message: '预算金额不能为负数', trigger: 'blur' }
        ],
        reason: [
          { required: true, message: '请输入变更理由', trigger: 'blur' },
          { min: 10, message: '变更理由至少10个字符', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    activities() {
      return this.$store.state.activities
    },
    departments() {
      return this.$store.state.departments
    },
    loading() {
      return this.$store.state.loading
    },
    changeBudgetForm: {
      get() {
        return this.$data.changeBudgetForm
      },
      set(val) {
        this.$data.changeBudgetForm = val
      }
    },
    changeAmount() {
      if (!this.currentActivity) return '0.00'
      const newBudget = parseFloat(this.changeBudgetForm.newBudget || 0)
      const originalBudget = parseFloat(this.currentActivity.budgetTotal || 0)
      return (newBudget - originalBudget).toFixed(2)
    }
  },
  watch: {
    'changeBudgetForm.newBudget'() {
      this.$set(this.changeBudgetForm, 'changeAmount', this.changeAmount)
    },
    currentActivity() {
      if (this.currentActivity) {
        this.$set(this.changeBudgetForm, 'changeAmount', this.changeAmount)
      }
    }
  },
  async mounted() {
    await this.$store.dispatch('fetchDepartments')
    await this.$store.dispatch('fetchActivities')
  },
  methods: {
    handleDepartmentChange(value) {
      this.$store.dispatch('setCurrentDepartment', value)
    },
    
    goToCreate() {
      this.$router.push('/create')
    },
    
    viewDetail(row) {
      this.$router.push(`/activity/${row.id}`)
    },
    
    isExceeded(row) {
      const actual = parseFloat(row.actualTotal || 0)
      const budget = parseFloat(row.budgetTotal || 0)
      return actual > budget
    },
    
    getStatusType(status) {
      const map = {
        'CREATED': 'info',
        'SUBMITTED': 'warning',
        'APPROVED': 'success',
        'REJECTED': 'danger',
        'CLOSED': 'success'
      }
      return map[status] || 'info'
    },
    
    getStatusText(status) {
      const map = {
        'CREATED': '已创建',
        'SUBMITTED': '待审批',
        'APPROVED': '已批准',
        'REJECTED': '已拒绝',
        'CLOSED': '已关闭'
      }
      return map[status] || status
    },
    
    canSubmitActual(row) {
      return row.status === 'CREATED' || row.status === 'REJECTED'
    },
    
    canApprove(row) {
      return row.status === 'SUBMITTED'
    },
    
    canChangeBudget(row) {
      return row.status === 'CREATED' || row.status === 'REJECTED'
    },
    
    openChangeBudgetDialog(row) {
      this.currentActivity = row
      this.changeBudgetForm.newBudget = parseFloat(row.budgetTotal)
      this.changeBudgetForm.reason = ''
      this.changeBudgetForm.changeAmount = '0.00'
      this.changeBudgetDialogVisible = true
    },
    
    async submitChangeBudget() {
      try {
        await this.$refs.changeBudgetFormRef.validate()
        
        if (parseFloat(this.changeBudgetForm.changeAmount) === 0) {
          this.$message.warning('新预算金额与原预算相同，无需变更')
          return
        }
        
        this.submittingChange = true
        
        const data = {
          newBudget: parseFloat(this.changeBudgetForm.newBudget),
          reason: this.changeBudgetForm.reason
        }
        
        await this.$store.dispatch('createBudgetChange', {
          activityId: this.currentActivity.id,
          data: data
        })
        
        this.$message.success('预算变更申请已提交，请等待管理员审批')
        this.changeBudgetDialogVisible = false
      } catch (error) {
        if (error !== false) {
          this.$message.error('提交失败：' + (error.response?.data?.message || error.message))
        }
      } finally {
        this.submittingChange = false
      }
    },
    
    submitActual(row) {
      this.currentActivity = row
      this.actualForm.actualItems = [{ itemName: '', amount: 0 }]
      this.actualDialogVisible = true
    },
    
    addActualItem() {
      this.actualForm.actualItems.push({ itemName: '', amount: 0 })
    },
    
    removeActualItem(index) {
      if (this.actualForm.actualItems.length > 1) {
        this.actualForm.actualItems.splice(index, 1)
      }
    },
    
    async submitActualForm() {
      const validItems = this.actualForm.actualItems.filter(
        item => item.itemName && item.amount > 0
      )
      
      if (validItems.length === 0) {
        this.$message.warning('请至少添加一个有效的决算细项')
        return
      }
      
      this.submitting = true
      try {
        await this.$store.dispatch('submitActual', {
          id: this.currentActivity.id,
          data: { actualItems: validItems }
        })
        this.$message.success('决算提交成功')
        this.actualDialogVisible = false
      } catch (error) {
        this.$message.error('提交失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.submitting = false
      }
    },
    
    async approveActivity(row) {
      try {
        await this.$confirm('确定要审批通过该活动的决算吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await this.$store.dispatch('approveActivity', row.id)
        this.$message.success('审批通过，活动已关闭')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('审批失败：' + (error.response?.data?.message || error.message))
        }
      }
    },
    
    async deleteActivity(row) {
      try {
        await this.$confirm('确定要删除该活动吗？此操作不可恢复。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await this.$store.dispatch('deleteActivity', row.id)
        this.$message.success('删除成功')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败：' + (error.response?.data?.message || error.message))
        }
      }
    }
  }
}
</script>

<style scoped>
.activities-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.actual-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
