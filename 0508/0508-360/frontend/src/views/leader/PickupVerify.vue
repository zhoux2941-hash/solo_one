<template>
  <div>
    <div class="action-bar">
      <el-button @click="goBack">返回活动列表</el-button>
    </div>

    <el-card v-if="activityInfo" style="margin-bottom: 20px;">
      <div slot="header">
        <span>活动信息：{{ activityInfo.title }}</span>
      </div>
      <p>商品ID：{{ activityInfo.productId }} | 团购价：¥{{ activityInfo.groupPrice }} | 状态：{{ activityInfo.status === 'ACTIVE' ? '进行中' : '已结束' }}</p>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>手动输入取货码</span>
          </div>
          <el-form @submit.native.prevent="verifyCode" inline>
            <el-form-item>
              <el-input
                v-model="inputCode"
                placeholder="请输入6位取货码"
                maxlength="6"
                style="width: 250px;"
                size="large"
                clearable
              ></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" native-type="submit">核销取货</el-button>
            </el-form-item>
          </el-form>

          <div v-if="verifyResult" class="verify-result" :class="verifyResult.success ? 'success' : 'error'">
            <i :class="verifyResult.success ? 'el-icon-circle-check' : 'el-icon-circle-close'"></i>
            <span>{{ verifyResult.message }}</span>
          </div>

          <div v-if="verifyResult && verifyResult.success && verifyResult.order" class="verify-detail">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="订单号">{{ verifyResult.order.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="团员姓名">{{ verifyResult.member ? verifyResult.member.name : '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ verifyResult.member ? verifyResult.member.phone : '-' }}</el-descriptions-item>
              <el-descriptions-item label="商品数量">{{ verifyResult.order.quantity }}份</el-descriptions-item>
              <el-descriptions-item label="订单金额">¥{{ verifyResult.order.totalAmount }}</el-descriptions-item>
              <el-descriptions-item label="备注">{{ verifyResult.order.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>待核销订单列表</span>
            <el-button size="small" type="primary" @click="refreshPending" style="float: right;">刷新</el-button>
          </div>
          <el-table :data="pendingOrders" border v-if="pendingOrders.length > 0" size="small">
            <el-table-column prop="orderNo" label="订单号" width="180"></el-table-column>
            <el-table-column label="取货码" width="120">
              <template slot-scope="scope">
                <span class="pending-code">{{ scope.row.pickupCode }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="memberId" label="团员ID" width="80"></el-table-column>
            <el-table-column prop="quantity" label="数量" width="70"></el-table-column>
            <el-table-column label="金额" width="90">
              <template slot-scope="scope">¥{{ scope.row.totalAmount }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="primary"
                  @click="quickVerify(scope.row.pickupCode)"
                >快速核销</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else style="text-align: center; padding: 40px; color: #999;">
            暂无待核销订单
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'PickupVerify',
  data() {
    return {
      activityInfo: null,
      inputCode: '',
      verifyResult: null,
      pendingOrders: []
    }
  },
  created() {
    this.loadActivityInfo()
    this.loadPendingOrders()
  },
  methods: {
    loadActivityInfo() {
      const activityId = this.$route.params.activityId
      this.$http.get(`/api/activity/${activityId}`).then(res => {
        if (res.data.code === 200) {
          this.activityInfo = res.data.data
        }
      })
    },
    loadPendingOrders() {
      const activityId = this.$route.params.activityId
      this.$http.get(`/api/pickup/list/${activityId}`).then(res => {
        if (res.data.code === 200) {
          this.pendingOrders = res.data.data.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        }
      })
    },
    refreshPending() {
      this.loadPendingOrders()
    },
    verifyCode() {
      if (!this.inputCode || this.inputCode.length !== 6) {
        this.$message.warning('请输入6位取货码')
        return
      }
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      this.$http.post('/api/pickup/verify', {
        pickupCode: this.inputCode,
        leaderId: user.id
      }).then(res => {
        if (res.data.code === 200) {
          this.verifyResult = res.data.data
          this.$message.success('核销成功')
          this.inputCode = ''
          this.loadPendingOrders()
        } else {
          this.verifyResult = {
            success: false,
            message: res.data.message
          }
          this.$message.error(res.data.message)
        }
      }).catch(() => {
        this.verifyResult = {
          success: false,
          message: '核销失败，请稍后重试'
        }
      })
    },
    quickVerify(code) {
      this.inputCode = code
      this.verifyCode()
    },
    goBack() {
      this.$router.push('/leader/activity')
    }
  }
}
</script>

<style scoped>
.action-bar {
  margin-bottom: 20px;
}
.verify-result {
  margin: 20px 0;
  padding: 15px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}
.verify-result.success {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}
.verify-result.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}
.verify-result i {
  font-size: 24px;
}
.verify-detail {
  margin-top: 20px;
}
.pending-code {
  font-weight: bold;
  color: #409EFF;
  letter-spacing: 1px;
}
</style>
