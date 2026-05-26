<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-title">待结算佣金</div>
          <div class="stat-value pending">¥{{ summary.pending }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-title">已结算佣金</div>
          <div class="stat-value success">¥{{ summary.settled }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-title">累计佣金</div>
          <div class="stat-value primary">¥{{ summary.total }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div slot="header">
        <span>佣金明细</span>
        <el-select v-model="filterStatus" @change="loadCommissions" style="float: right; width: 150px;">
          <el-option label="全部" value=""></el-option>
          <el-option label="待结算" value="PENDING"></el-option>
          <el-option label="已结算" value="SETTLED"></el-option>
        </el-select>
      </div>
      <el-table :data="commissions" border v-if="commissions.length > 0">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="activityId" label="活动ID" width="100"></el-table-column>
        <el-table-column prop="orderId" label="订单ID" width="100"></el-table-column>
        <el-table-column label="订单金额" width="120">
          <template slot-scope="scope">¥{{ scope.row.orderAmount }}</template>
        </el-table-column>
        <el-table-column label="佣金比例" width="120">
          <template slot-scope="scope">{{ (scope.row.commissionRate * 100).toFixed(0) }}%</template>
        </el-table-column>
        <el-table-column label="佣金金额" width="120">
          <template slot-scope="scope">
            <span style="color: #67c23a; font-weight: bold;">¥{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 'SETTLED'" type="success">已结算</el-tag>
            <el-tag v-else type="warning">待结算</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="settleTime" label="结算时间" width="180">
          <template slot-scope="scope">{{ scope.row.settleTime || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
      </el-table>
      <div v-else style="text-align: center; padding: 60px; color: #999;">暂无佣金记录</div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'CommissionList',
  data() {
    return {
      commissions: [],
      summary: {
        pending: '0.00',
        settled: '0.00',
        total: '0.00'
      },
      filterStatus: ''
    }
  },
  created() {
    this.loadSummary()
    this.loadCommissions()
  },
  methods: {
    loadSummary() {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      this.$http.get(`/api/commission/leader/${user.id}/summary`).then(res => {
        if (res.data.code === 200) {
          this.summary = {
            pending: Number(res.data.data.pending).toFixed(2),
            settled: Number(res.data.data.settled).toFixed(2),
            total: Number(res.data.data.total).toFixed(2)
          }
        }
      })
    },
    loadCommissions() {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      let url = `/api/commission/leader/${user.id}`
      if (this.filterStatus) {
        url = `/api/commission/leader/${user.id}/status/${this.filterStatus}`
      }
      this.$http.get(url).then(res => {
        if (res.data.code === 200) {
          this.commissions = res.data.data
        }
      })
    }
  }
}
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
}
.stat-value.pending {
  color: #e6a23c;
}
.stat-value.success {
  color: #67c23a;
}
.stat-value.primary {
  color: #409EFF;
}
</style>
