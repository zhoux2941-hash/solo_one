<template>
  <div>
    <el-card>
      <div slot="header" class="clearfix">
        <span style="font-size: 18px; font-weight: bold;">采购申请管理</span>
      </div>

      <el-table :data="requests" border stripe>
        <el-table-column prop="requestNo" label="申请单号" width="150"></el-table-column>
        <el-table-column prop="sparePartId" label="备件ID" width="100"></el-table-column>
        <el-table-column prop="quantity" label="采购数量" width="100"></el-table-column>
        <el-table-column prop="reason" label="原因" min-width="200"></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="180">
          <template slot-scope="scope">
            <el-button v-if="scope.row.status === 'PENDING'" size="mini" type="success" @click="approve(scope.row)">审批通过</el-button>
            <el-button v-if="scope.row.status === 'PENDING'" size="mini" type="danger" @click="reject(scope.row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      requests: []
    }
  },
  mounted() {
    this.loadRequests()
  },
  methods: {
    async loadRequests() {
      const res = await this.$http.get('/purchase-requests/pending')
      this.requests = res.data
    },
    async approve(request) {
      await this.$http.put(`/purchase-requests/${request.id}/approve?approverId=1`)
      this.$message.success('审批通过')
      this.loadRequests()
    },
    async reject(request) {
      await this.$http.put(`/purchase-requests/${request.id}/reject?approverId=1`)
      this.$message.success('已拒绝')
      this.loadRequests()
    },
    getStatusText(status) {
      const map = {
        'PENDING': '待审批',
        'APPROVED': '已审批',
        'REJECTED': '已拒绝',
        'COMPLETED': '已完成'
      }
      return map[status] || status
    },
    getStatusType(status) {
      const map = {
        'PENDING': 'warning',
        'APPROVED': 'success',
        'REJECTED': 'danger',
        'COMPLETED': 'info'
      }
      return map[status] || ''
    }
  }
}
</script>
