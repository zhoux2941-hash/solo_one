<template>
  <div>
    <div class="action-bar">
      <el-button @click="refresh">立即刷新</el-button>
      <el-switch
        v-model="autoRefresh"
        active-text="自动刷新"
        inactive-text="手动刷新"
        @change="handleAutoRefreshChange"
        style="margin-left: 20px;"
      ></el-switch>
      <span v-if="lastRefreshTime" class="refresh-time">
        最后刷新：{{ formatTime(lastRefreshTime) }}
      </span>
      <el-select v-model="filterStatus" @change="loadOrders" style="float: right; width: 150px;">
        <el-option label="全部订单" value=""></el-option>
        <el-option label="待支付" value="PENDING_PAYMENT"></el-option>
        <el-option label="已支付" value="PENDING_SORTING"></el-option>
        <el-option label="待提货" value="PENDING_RECEIVE"></el-option>
        <el-option label="已完成" value="COMPLETED"></el-option>
      </el-select>
    </div>

    <el-table :data="filteredOrders" border v-if="orders.length > 0">
      <el-table-column prop="orderNo" label="订单号" width="200"></el-table-column>
      <el-table-column prop="activityId" label="活动ID" width="100"></el-table-column>
      <el-table-column prop="productId" label="商品ID" width="100"></el-table-column>
      <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
      <el-table-column label="单价" width="100">
        <template slot-scope="scope">¥{{ scope.row.unitPrice }}</template>
      </el-table-column>
      <el-table-column label="总价" width="100">
        <template slot-scope="scope">
          <span style="color: #f56c6c; font-weight: bold;">¥{{ scope.row.totalAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" width="120">
        <template slot-scope="scope">
          <el-tag :type="$orderStatus.getStatusTagType(scope.row.status)">
            {{ $orderStatus.getStatusDescription(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分拣状态" width="100">
        <template slot-scope="scope">
          <el-tag v-if="$orderStatus.canReceive(scope.row.status)" type="success">已分拣</el-tag>
          <el-tag v-else-if="$orderStatus.canSort(scope.row.status)" type="info">待分拣</el-tag>
          <el-tag v-else type="info">-</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="取货码" width="180">
        <template slot-scope="scope">
          <template v-if="scope.row.pickupCode">
            <div class="pickup-code-display">
              <span class="pickup-code">{{ scope.row.pickupCode }}</span>
              <el-button
                size="mini"
                type="text"
                @click="copyPickupCode(scope.row.pickupCode)"
              >复制</el-button>
            </div>
          </template>
          <span v-else style="color: #999;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="payTime" label="支付时间" width="180">
        <template slot-scope="scope">{{ scope.row.payTime || '-' }}</template>
      </el-table-column>
      <el-table-column prop="verifyTime" label="核销时间" width="180">
        <template slot-scope="scope">{{ scope.row.verifyTime || '-' }}</template>
      </el-table-column>
      <el-table-column prop="remark" label="备注"></el-table-column>
      <el-table-column label="操作" width="200">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="primary"
            @click="payOrder(scope.row)"
            v-if="$orderStatus.canPay(scope.row.status)"
          >
            去支付
          </el-button>
          <el-button
            size="small"
            type="success"
            @click="showPickupCode(scope.row)"
            v-if="$orderStatus.canReceive(scope.row.status)"
          >
            查看取货码
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-else style="text-align: center; padding: 60px; color: #999;">暂无订单</div>

    <el-dialog title="确认支付" :visible.sync="payDialogVisible" width="500px">
      <div v-if="currentOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ currentOrder.quantity }}份</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ currentOrder.unitPrice }}</el-descriptions-item>
          <el-descriptions-item label="总价">
            <span style="color: #f56c6c; font-size: 18px; font-weight: bold;">¥{{ currentOrder.totalAmount }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doPay">确认支付（模拟）</el-button>
      </span>
    </el-dialog>

    <el-dialog title="取货码" :visible.sync="pickupCodeDialogVisible" width="450px" custom-class="pickup-code-dialog">
      <div v-if="currentOrder" class="pickup-code-container">
        <p class="pickup-tip">请向团长出示此取货码</p>
        <div class="pickup-code-large">
          <span v-for="(digit, index) in currentOrder.pickupCode" :key="index" class="code-digit">{{ digit }}</span>
        </div>
        <p class="order-info">
          订单号：{{ currentOrder.orderNo }}<br/>
          商品数量：{{ currentOrder.quantity }}份
        </p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="pickupCodeDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyPickupCode(currentOrder.pickupCode)">复制取货码</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'OrderList',
  data() {
    return {
      orders: [],
      filterStatus: '',
      currentOrder: null,
      payDialogVisible: false,
      pickupCodeDialogVisible: false,
      pollingTimer: null,
      lastRefreshTime: null,
      autoRefresh: true
    }
  },
  computed: {
    filteredOrders() {
      if (!this.filterStatus) {
        return this.orders
      }
      return this.orders.filter(o => o.status === this.filterStatus)
    }
  },
  created() {
    this.loadOrders(true)
    this.startPolling()
  },
  beforeDestroy() {
    this.stopPolling()
  },
  methods: {
    startPolling() {
      this.stopPolling()
      if (this.autoRefresh) {
        this.pollingTimer = setInterval(() => {
          this.loadOrders(false)
        }, 5000)
      }
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
    },
    loadOrders(isInitial) {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      this.$http.get(`/api/order/member/${user.id}`).then(res => {
        if (res.data.code === 200) {
          const newOrders = res.data.data.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          this.detectStatusChanges(this.orders, newOrders)
          this.orders = newOrders
          this.lastRefreshTime = new Date()
        }
      })
    },
    detectStatusChanges(oldOrders, newOrders) {
      if (!oldOrders || oldOrders.length === 0) return
      const oldMap = {}
      oldOrders.forEach(o => {
        oldMap[o.id] = { status: o.status, pickupCode: o.pickupCode }
      })
      newOrders.forEach(newOrder => {
        const old = oldMap[newOrder.id]
        if (old) {
          if (old.status !== newOrder.status && this.$orderStatus.canReceive(newOrder.status)) {
            this.$notify({
              title: '分拣完成通知',
              message: `订单 ${newOrder.orderNo} 已分拣完成，待提货！取货码：${newOrder.pickupCode}`,
              type: 'success',
              duration: 4000
            })
          }
          if (!old.pickupCode && newOrder.pickupCode) {
            this.$notify({
              title: '取货码已生成',
              message: `订单 ${newOrder.orderNo} 取货码：${newOrder.pickupCode}`,
              type: 'success',
              duration: 5000
            })
          }
          if (old.status !== newOrder.status && newOrder.status === 'COMPLETED') {
            this.$notify({
              title: '订单完成',
              message: `订单 ${newOrder.orderNo} 已完成，团长佣金已结算`,
              type: 'info',
              duration: 3000
            })
          }
          if (old.status !== newOrder.status && newOrder.status === 'PENDING_SORTING') {
            this.$notify({
              title: '支付成功',
              message: `订单 ${newOrder.orderNo} 支付成功，等待团长分拣`,
              type: 'success',
              duration: 3000
            })
          }
        }
      })
    },
    refresh() {
      this.loadOrders(true)
    },
    handleAutoRefreshChange(val) {
      if (val) {
        this.startPolling()
      } else {
        this.stopPolling()
      }
    },
    formatTime(date) {
      if (!date) return ''
      const d = new Date(date)
      const pad = n => n.toString().padStart(2, '0')
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    },
    payOrder(order) {
      this.currentOrder = order
      this.payDialogVisible = true
    },
    doPay() {
      if (!this.currentOrder) return
      this.$http.post(`/api/order/${this.currentOrder.id}/pay`).then(res => {
        if (res.data.code === 200) {
          this.$message.success('支付成功')
          this.payDialogVisible = false
          this.currentOrder = null
          this.loadOrders()
        } else {
          this.$message.error(res.data.message)
        }
      }).catch(() => {
        this.$message.error('支付失败，请稍后重试')
      })
    },
    showPickupCode(order) {
      this.currentOrder = order
      this.pickupCodeDialogVisible = true
    },
    copyPickupCode(code) {
      const input = document.createElement('input')
      input.value = code
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      this.$message.success('取货码已复制到剪贴板')
    }
  }
}
</script>

<style scoped>
.action-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
.action-bar .el-button {
  margin-right: 0;
}
.refresh-time {
  color: #909399;
  font-size: 13px;
  margin-left: 15px;
}
.pickup-code-display {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pickup-code {
  font-weight: bold;
  color: #409EFF;
  font-size: 16px;
  letter-spacing: 2px;
}
.pickup-code-dialog >>> .el-dialog__body {
  padding: 30px 20px;
}
.pickup-code-container {
  text-align: center;
}
.pickup-tip {
  font-size: 16px;
  color: #606266;
  margin-bottom: 25px;
}
.pickup-code-large {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 25px;
}
.code-digit {
  width: 50px;
  height: 65px;
  line-height: 65px;
  background: #ecf5ff;
  border: 2px solid #409EFF;
  border-radius: 8px;
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  letter-spacing: 0;
}
.order-info {
  color: #909399;
  font-size: 14px;
  line-height: 1.8;
}
</style>
