<template>
  <div>
    <el-card>
      <div slot="header">
        <span>创建团购活动</span>
      </div>
      <el-form :model="form" label-width="120px" @submit.native.prevent="handleSubmit">
        <el-form-item label="选择商品">
          <el-select v-model="form.productId" placeholder="请选择商品" style="width: 300px;">
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="product.name + ' (原价: ¥' + product.price + ')'"
              :value="product.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="活动标题">
          <el-input v-model="form.title" placeholder="请输入活动标题" style="width: 400px;"></el-input>
        </el-form-item>
        <el-form-item label="团购价格">
          <el-input-number v-model="form.groupPrice" :min="0" :precision="2" :step="0.1"></el-input-number>
          <span style="margin-left: 10px; color: #999;">元</span>
        </el-form-item>
        <el-form-item label="佣金比例">
          <el-input-number v-model="form.commissionRate" :min="0" :max="1" :precision="2" :step="0.01"></el-input-number>
          <span style="margin-left: 10px; color: #999;">（如0.1表示10%佣金）</span>
        </el-form-item>
        <el-form-item label="最小起团数量">
          <el-input-number v-model="form.minQuantity" :min="1"></el-input-number>
          <span style="margin-left: 10px; color: #999;">份</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">创建活动</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'CreateActivity',
  data() {
    return {
      products: [],
      form: {
        productId: null,
        title: '',
        groupPrice: 0,
        commissionRate: 0.1,
        minQuantity: 10
      }
    }
  },
  created() {
    this.loadProducts()
  },
  methods: {
    loadProducts() {
      this.$http.get('/api/product').then(res => {
        if (res.data.code === 200) {
          this.products = res.data.data
        }
      })
    },
    handleSubmit() {
      if (!this.form.productId || !this.form.title || this.form.groupPrice <= 0) {
        this.$message.warning('请填写完整的活动信息')
        return
      }
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const data = {
        ...this.form,
        leaderId: user.id
      }
      this.$http.post('/api/activity', data).then(res => {
        if (res.data.code === 200) {
          this.$message.success('活动创建成功')
          this.$router.push('/leader/activity')
        } else {
          this.$message.error(res.data.message)
        }
      }).catch(() => {
        this.$message.error('创建失败，请稍后重试')
      })
    },
    goBack() {
      this.$router.push('/leader/activity')
    }
  }
}
</script>
