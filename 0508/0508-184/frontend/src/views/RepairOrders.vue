<template>
  <div>
    <el-card>
      <div slot="header" class="clearfix">
        <span style="font-size: 18px; font-weight: bold;">维修工单管理</span>
        <el-button style="float: right; padding: 3px 0" type="primary" @click="showCreateDialog">新建报修</el-button>
      </div>

      <el-table :data="orders" border stripe>
        <el-table-column prop="orderNo" label="工单编号" width="150"></el-table-column>
        <el-table-column prop="repairType" label="维修类型" width="120"></el-table-column>
        <el-table-column prop="description" label="故障描述" min-width="200"></el-table-column>
        <el-table-column prop="address" label="地址" width="150"></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template slot-scope="scope">
            <el-button v-if="scope.row.status === 'PENDING'" size="mini" type="primary" @click="showAssignDialog(scope.row)">分配</el-button>
            <el-button v-if="scope.row.status === 'ASSIGNED'" size="mini" type="success" @click="pickupSparePart(scope.row)">领取备件</el-button>
            <el-button v-if="scope.row.status === 'IN_PROGRESS'" size="mini" type="success" @click="completeOrder(scope.row)">完成</el-button>
            <el-button size="mini" type="danger" @click="cancelOrder(scope.row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="新建报修" :visible.sync="createDialogVisible" width="500px">
      <el-form :model="orderForm" label-width="100px">
        <el-form-item label="业主ID">
          <el-input v-model="orderForm.ownerId"></el-input>
        </el-form-item>
        <el-form-item label="维修类型">
          <el-input v-model="orderForm.repairType"></el-input>
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input type="textarea" v-model="orderForm.description"></el-input>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="orderForm.address"></el-input>
        </el-form-item>
        <el-form-item label="所需备件">
          <el-select v-model="orderForm.sparePartId" placeholder="请选择备件" style="width: 100%">
            <el-option v-for="part in spareParts" :key="part.id" :label="part.name + ' (' + part.specification + ')'" :value="part.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备件数量">
          <el-input-number v-model="orderForm.sparePartQuantity" :min="1"></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="createDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="createOrder">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="分配维修工" :visible.sync="assignDialogVisible" width="400px">
      <el-form label-width="100px">
        <el-form-item label="选择维修工">
          <el-select v-model="selectedRepairmanId" placeholder="请选择维修工" style="width: 100%">
            <el-option v-for="man in repairmen" :key="man.id" :label="man.name + ' - ' + man.skillType" :value="man.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="assignDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="assignOrder">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      orders: [],
      spareParts: [],
      repairmen: [],
      createDialogVisible: false,
      assignDialogVisible: false,
      orderForm: {
        ownerId: 1,
        repairType: '',
        description: '',
        address: '',
        sparePartId: null,
        sparePartQuantity: 1
      },
      selectedOrder: null,
      selectedRepairmanId: null
    }
  },
  mounted() {
    this.loadOrders()
    this.loadSpareParts()
    this.loadRepairmen()
  },
  methods: {
    async loadOrders() {
      const res = await this.$http.get('/orders')
      this.orders = res.data
    },
    async loadSpareParts() {
      const res = await this.$http.get('/spare-parts')
      this.spareParts = res.data
    },
    async loadRepairmen() {
      const res = await this.$http.get('/repairmen')
      this.repairmen = res.data
    },
    showCreateDialog() {
      this.createDialogVisible = true
    },
    async createOrder() {
      await this.$http.post('/orders', this.orderForm)
      this.createDialogVisible = false
      this.$message.success('工单创建成功，备件已锁定30分钟')
      this.loadOrders()
    },
    showAssignDialog(order) {
      this.selectedOrder = order
      this.assignDialogVisible = true
    },
    async assignOrder() {
      await this.$http.put(`/orders/${this.selectedOrder.id}/assign?repairmanId=${this.selectedRepairmanId}`)
      this.assignDialogVisible = false
      this.$message.success('分配成功')
      this.loadOrders()
    },
    async pickupSparePart(order) {
      await this.$http.put(`/orders/${order.id}/pickup?repairmanId=${order.repairmanId}`)
      this.$message.success('备件领取成功，库存已扣除')
      this.loadOrders()
    },
    async completeOrder(order) {
      await this.$http.put(`/orders/${order.id}/complete`)
      this.$message.success('工单完成')
      this.loadOrders()
    },
    async cancelOrder(order) {
      await this.$http.put(`/orders/${order.id}/cancel`)
      this.$message.success('工单已取消，库存锁定已释放')
      this.loadOrders()
    },
    getStatusText(status) {
      const map = {
        'PENDING': '待分配',
        'ASSIGNED': '已分配',
        'IN_PROGRESS': '维修中',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
      }
      return map[status] || status
    },
    getStatusType(status) {
      const map = {
        'PENDING': 'warning',
        'ASSIGNED': 'primary',
        'IN_PROGRESS': 'info',
        'COMPLETED': 'success',
        'CANCELLED': 'danger'
      }
      return map[status] || ''
    }
  }
}
</script>
