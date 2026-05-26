<template>
  <div>
    <div class="action-bar">
      <el-button @click="refresh">刷新</el-button>
      <span style="float: right; color: #666;">正在进行的团购活动</span>
    </div>

    <div class="product-grid">
      <el-card v-for="activity in activities" :key="activity.id" class="product-card">
        <div class="product-header">
          <div class="product-info">
            <h3>{{ activity.title }}</h3>
            <p class="product-id">商品ID：{{ activity.productId }}</p>
          </div>
          <el-tag type="success" size="medium">团购中</el-tag>
        </div>
        <div class="product-content">
          <div class="price-row">
            <span class="price-label">团购价</span>
            <span class="price">¥{{ activity.groupPrice }}</span>
          </div>
          <div class="meta-row">
            <span>佣金比例：{{ (activity.commissionRate * 100).toFixed(0) }}%</span>
            <span>最小起团：{{ activity.minQuantity }}份</span>
          </div>
        </div>
        <div class="product-footer">
          <el-form :model="orderForms[activity.id]" @submit.native.prevent="submitOrder(activity.id)" inline>
            <el-form-item>
              <el-input-number
                v-model="orderForms[activity.id].quantity"
                :min="1"
                size="small"
                label="购买数量"
              ></el-input-number>
            </el-form-item>
            <el-form-item>
              <el-input
                v-model="orderForms[activity.id].remark"
                placeholder="备注（可选）"
                size="small"
              ></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" native-type="submit">立即下单</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>

    <div v-if="activities.length === 0" style="text-align: center; padding: 60px; color: #999;">
      暂无进行中的团购活动
    </div>

    <el-dialog title="确认支付" :visible.sync="payDialogVisible" width="500px">
      <div v-if="currentOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="商品">活动ID：{{ currentOrder.activityId }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ currentOrder.quantity }}份</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ currentOrder.unitPrice }}</el-descriptions-item>
          <el-descriptions-item label="总价">
            <span style="color: #f56c6c; font-size: 18px; font-weight: bold;">¥{{ currentOrder.totalAmount }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPay">确认支付（模拟）</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ProductList',
  data() {
    return {
      activities: [],
      orderForms: {},
      currentOrder: null,
      payDialogVisible: false
    }
  },
  created() {
    this.loadActivities()
  },
  methods: {
    loadActivities() {
      this.$http.get('/api/activity/active').then(res => {
        if (res.data.code === 200) {
          this.activities = res.data.data
          this.activities.forEach(activity => {
            this.orderForms[activity.id] = {
              quantity: 1,
              remark: ''
            }
          })
        }
      })
    },
    refresh() {
      this.loadActivities()
    },
    submitOrder(activityId) {
      const form = this.orderForms[activityId]
      if (!form.quantity || form.quantity < 1) {
        this.$message.warning('请填写正确的购买数量')
        return
      }
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      this.$http.post('/api/order', {
        memberId: user.id,
        activityId: activityId,
        quantity: form.quantity,
        remark: form.remark
      }).then(res => {
        if (res.data.code === 200) {
          this.currentOrder = res.data.data
          this.payDialogVisible = true
        } else {
          this.$message.error(res.data.message)
        }
      }).catch(() => {
        this.$message.error('下单失败，请稍后重试')
      })
    },
    confirmPay() {
      if (!this.currentOrder) return
      this.$http.post(`/api/order/${this.currentOrder.id}/pay`).then(res => {
        if (res.data.code === 200) {
          this.$message.success('支付成功')
          this.payDialogVisible = false
          this.currentOrder = null
          this.$router.push('/member/order')
        } else {
          this.$message.error(res.data.message)
        }
      }).catch(() => {
        this.$message.error('支付失败，请稍后重试')
      })
    }
  }
}
</script>

<style scoped>
.action-bar {
  margin-bottom: 20px;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
}
.product-card {
  border-radius: 8px;
}
.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}
.product-header h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
}
.product-id {
  margin: 0;
  color: #999;
  font-size: 13px;
}
.product-content {
  padding: 15px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}
.price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 10px;
}
.price-label {
  color: #666;
  margin-right: 10px;
}
.price {
  font-size: 28px;
  font-weight: bold;
  color: #f56c6c;
}
.meta-row {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
}
.product-footer {
  padding-top: 15px;
}
</style>
