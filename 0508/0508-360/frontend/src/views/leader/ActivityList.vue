<template>
  <div>
    <div class="action-bar">
      <el-button type="primary" @click="goCreate">创建团购活动</el-button>
      <el-button @click="refresh">刷新</el-button>
    </div>
    <el-table :data="activities" border style="width: 100%; margin-top: 20px;">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="title" label="活动标题"></el-table-column>
      <el-table-column prop="groupId" label="商品ID" width="100">
        <template slot-scope="scope">{{ scope.row.productId }}</template>
      </el-table-column>
      <el-table-column label="团购价格" width="120">
        <template slot-scope="scope">¥{{ scope.row.groupPrice }}</template>
      </el-table-column>
      <el-table-column prop="minQuantity" label="最小起团" width="100"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'info'">
            {{ scope.row.status === 'ACTIVE' ? '进行中' : '已结束' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
      <el-table-column label="操作" width="380">
        <template slot-scope="scope">
          <el-button size="small" type="primary" @click="goSorting(scope.row.id)" v-if="scope.row.status === 'ACTIVE'">
            分拣清单
          </el-button>
          <el-button size="small" type="success" @click="goVerify(scope.row.id)" v-if="scope.row.status === 'ACTIVE'">
            核销取货
          </el-button>
          <el-button size="small" @click="viewOrders(scope.row.id)">
            查看订单
          </el-button>
          <el-button size="small" type="danger" @click="endActivity(scope.row.id)" v-if="scope.row.status === 'ACTIVE'">
            结束活动
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="订单列表" :visible.sync="orderDialogVisible" width="900px">
      <el-table :data="orders" border v-if="orders.length > 0">
        <el-table-column prop="orderNo" label="订单号" width="200"></el-table-column>
        <el-table-column prop="memberId" label="团员ID" width="100"></el-table-column>
        <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
        <el-table-column label="单价" width="100">
          <template slot-scope="scope">¥{{ scope.row.unitPrice }}</template>
        </el-table-column>
        <el-table-column label="总价" width="100">
          <template slot-scope="scope">¥{{ scope.row.totalAmount }}</template>
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
        <el-table-column prop="createTime" label="下单时间" width="180"></el-table-column>
      </el-table>
      <div v-else style="text-align: center; padding: 40px; color: #999;">暂无订单</div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ActivityList',
  data() {
    return {
      activities: [],
      orders: [],
      orderDialogVisible: false
    }
  },
  created() {
    this.loadActivities()
  },
  methods: {
    loadActivities() {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      this.$http.get(`/api/activity/leader/${user.id}`).then(res => {
        if (res.data.code === 200) {
          this.activities = res.data.data
        }
      })
    },
    goCreate() {
      this.$router.push('/leader/activity/create')
    },
    refresh() {
      this.loadActivities()
    },
    goSorting(activityId) {
      this.$router.push(`/leader/sorting/${activityId}`)
    },
    goVerify(activityId) {
      this.$router.push(`/leader/verify/${activityId}`)
    },
    viewOrders(activityId) {
      this.$http.get(`/api/order/activity/${activityId}`).then(res => {
        if (res.data.code === 200) {
          this.orders = res.data.data
          this.orderDialogVisible = true
        }
      })
    },
    endActivity(id) {
      this.$confirm('确定要结束这个团购活动吗？', '提示', {
        type: 'warning'
      }).then(() => {
        this.$http.post(`/api/activity/${id}/end`).then(res => {
          if (res.data.code === 200) {
            this.$message.success('活动已结束')
            this.loadActivities()
          }
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.action-bar {
  margin-bottom: 20px;
}
</style>
