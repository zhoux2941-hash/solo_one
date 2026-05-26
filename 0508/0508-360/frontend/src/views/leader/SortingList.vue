<template>
  <div>
    <div class="action-bar">
      <el-button @click="goBack">返回活动列表</el-button>
      <el-button type="primary" @click="generateSorting">生成分拣清单</el-button>
      <el-button type="success" @click="completeAll">一键完成分拣</el-button>
    </div>

    <el-card v-if="activityInfo" style="margin-bottom: 20px;">
      <div slot="header">
        <span>活动信息：{{ activityInfo.title }}</span>
      </div>
      <p>商品ID：{{ activityInfo.productId }} | 团购价：¥{{ activityInfo.groupPrice }} | 状态：{{ activityInfo.status === 'ACTIVE' ? '进行中' : '已结束' }}</p>
    </el-card>

    <el-table :data="sortingItems" border v-if="sortingItems.length > 0">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="productName" label="商品名称"></el-table-column>
      <el-table-column prop="productId" label="商品ID" width="100"></el-table-column>
      <el-table-column prop="totalQuantity" label="总需数量" width="120">
        <template slot-scope="scope">
          <span style="color: #f56c6c; font-weight: bold;">{{ scope.row.totalQuantity }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sortedQuantity" label="已分拣" width="120">
        <template slot-scope="scope">
          <span style="color: #67c23a; font-weight: bold;">{{ scope.row.sortedQuantity }}</span>
        </template>
      </el-table-column>
      <el-table-column label="完成进度" width="180">
        <template slot-scope="scope">
          <el-progress
            :percentage="Math.round(scope.row.sortedQuantity / scope.row.totalQuantity * 100)"
            :status="scope.row.sortedQuantity >= scope.row.totalQuantity ? 'success' : 'warning'"
          ></el-progress>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === 'COMPLETED'" type="success">已完成</el-tag>
          <el-tag v-else-if="scope.row.status === 'IN_PROGRESS'" type="warning">分拣中</el-tag>
          <el-tag v-else type="info">待分拣</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template slot-scope="scope">
          <el-input-number
            v-model="sortingQuantities[scope.row.id]"
            :min="0"
            :max="scope.row.totalQuantity"
            size="small"
          ></el-input-number>
          <el-button
            size="small"
            type="primary"
            @click="updateQuantity(scope.row.id)"
            :disabled="scope.row.status === 'COMPLETED'"
          >
            更新分拣
          </el-button>
          <el-button
            size="small"
            @click="viewOrders(scope.row)"
          >
            明细
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-else style="text-align: center; padding: 60px; color: #999;">
      暂无分拣数据，请先点击"生成分拣清单"按钮生成
    </div>

    <el-dialog title="订单明细" :visible.sync="orderDialogVisible" width="800px">
      <div v-if="currentProduct">
        <h4>商品：{{ currentProduct.productName }}（总需：{{ currentProduct.totalQuantity }}）</h4>
      </div>
      <el-table :data="productOrders" border v-if="productOrders.length > 0" style="margin-top: 15px;">
        <el-table-column prop="orderNo" label="订单号" width="200"></el-table-column>
        <el-table-column prop="memberId" label="团员ID" width="100"></el-table-column>
        <el-table-column prop="quantity" label="购买数量" width="120"></el-table-column>
        <el-table-column label="金额" width="120">
          <template slot-scope="scope">¥{{ scope.row.totalAmount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template slot-scope="scope">
            <el-tag :type="$orderStatus.getStatusTagType(scope.row.status)">
              {{ $orderStatus.getStatusDescription(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>
      <div v-else style="text-align: center; padding: 30px; color: #999;">暂无订单明细</div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'SortingList',
  data() {
    return {
      activityInfo: null,
      sortingItems: [],
      sortingQuantities: {},
      productOrders: [],
      currentProduct: null,
      orderDialogVisible: false
    }
  },
  created() {
    this.loadActivityInfo()
    this.loadSortingList()
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
    loadSortingList() {
      const activityId = this.$route.params.activityId
      this.$http.get(`/api/sorting/activity/${activityId}`).then(res => {
        if (res.data.code === 200) {
          this.sortingItems = res.data.data
          this.sortingItems.forEach(item => {
            this.sortingQuantities[item.id] = item.totalQuantity
          })
        }
      })
    },
    generateSorting() {
      const activityId = this.$route.params.activityId
      this.$http.post(`/api/sorting/activity/${activityId}/generate`).then(res => {
        if (res.data.code === 200) {
          this.$message.success('分拣清单已生成')
          this.loadSortingList()
        }
      })
    },
    updateQuantity(id) {
      const quantity = this.sortingQuantities[id]
      this.$http.post(`/api/sorting/${id}/quantity`, { quantity }).then(res => {
        if (res.data.code === 200) {
          this.$message.success('分拣数量已更新')
          this.loadSortingList()
        } else {
          this.$message.error(res.data.message)
        }
      })
    },
    completeAll() {
      this.$confirm('确定要一键完成所有商品的分拣吗？', '提示', {
        type: 'warning'
      }).then(() => {
        const activityId = this.$route.params.activityId
        this.$http.post(`/api/sorting/activity/${activityId}/complete`).then(res => {
          if (res.data.code === 200) {
            this.$message.success('分拣已全部完成')
            this.loadSortingList()
          }
        })
      }).catch(() => {})
    },
    viewOrders(sortingItem) {
      this.currentProduct = sortingItem
      this.$http.get(`/api/order/activity/${this.$route.params.activityId}`).then(res => {
        if (res.data.code === 200) {
          this.productOrders = res.data.data.filter(o => o.productId === sortingItem.productId)
          this.orderDialogVisible = true
        }
      })
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
</style>
