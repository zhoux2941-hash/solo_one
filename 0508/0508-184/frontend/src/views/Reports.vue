<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span style="font-size: 18px; font-weight: bold;">维修工平均维修时长</span>
          </div>
          <el-table :data="durationData" border stripe>
            <el-table-column prop="repairmanName" label="维修工" width="120"></el-table-column>
            <el-table-column prop="totalOrders" label="完成工单数" width="120"></el-table-column>
            <el-table-column prop="averageDurationFormatted" label="平均时长"></el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span style="font-size: 18px; font-weight: bold;">备件消耗排行</span>
          </div>
          <el-table :data="consumptionData" border stripe>
            <el-table-column prop="rank" label="排名" width="80">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.rank === 1" type="danger">第{{ scope.row.rank }}名</el-tag>
                <el-tag v-else-if="scope.row.rank === 2" type="warning">第{{ scope.row.rank }}名</el-tag>
                <el-tag v-else-if="scope.row.rank === 3" type="success">第{{ scope.row.rank }}名</el-tag>
                <span v-else>第{{ scope.row.rank }}名</span>
              </template>
            </el-table-column>
            <el-table-column prop="repairmanName" label="维修工" width="120"></el-table-column>
            <el-table-column prop="totalQuantity" label="消耗备件数量"></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  data() {
    return {
      durationData: [],
      consumptionData: []
    }
  },
  mounted() {
    this.loadDurationData()
    this.loadConsumptionData()
  },
  methods: {
    async loadDurationData() {
      const res = await this.$http.get('/reports/average-repair-duration')
      this.durationData = res.data
    },
    async loadConsumptionData() {
      const res = await this.$http.get('/reports/spare-part-consumption-ranking')
      this.consumptionData = res.data
    }
  }
}
</script>
