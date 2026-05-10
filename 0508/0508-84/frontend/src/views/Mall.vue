<template>
  <div class="mall-container">
    <h2 class="page-title">兑换商城</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部物品" name="all">
        <div class="goods-grid">
          <el-card v-for="goods in allGoods" :key="goods.id" class="goods-card" shadow="hover">
            <div class="goods-image">
              <el-image :src="goods.imageUrl || 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'" fit="cover" />
              <el-tag v-if="goods.isHot" type="danger" class="hot-tag">热门</el-tag>
            </div>
            <div class="goods-content">
              <h3>{{ goods.name }}</h3>
              <p class="goods-desc">{{ goods.description }}</p>
              <div class="goods-footer">
                <div class="goods-price">
                  <span class="coins">{{ goods.coinsRequired }}</span>
                  <span class="coins-label">时间币</span>
                </div>
                <div class="goods-stock">库存: {{ goods.stock }}</div>
              </div>
              <el-button 
                type="primary" 
                style="width: 100%; margin-top: 10px;"
                :disabled="goods.stock <= 0"
                @click="openExchangeDialog(goods)"
              >
                立即兑换
              </el-button>
            </div>
          </el-card>
        </div>
        <el-empty v-if="allGoods.length === 0" description="暂无物品"></el-empty>
      </el-tab-pane>
      
      <el-tab-pane label="热门兑换" name="hot">
        <div class="goods-grid">
          <el-card v-for="goods in hotGoods" :key="goods.id" class="goods-card" shadow="hover">
            <div class="goods-image">
              <el-image :src="goods.imageUrl || 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'" fit="cover" />
              <el-tag type="danger" class="hot-tag">热门</el-tag>
            </div>
            <div class="goods-content">
              <h3>{{ goods.name }}</h3>
              <p class="goods-desc">{{ goods.description }}</p>
              <div class="goods-footer">
                <div class="goods-price">
                  <span class="coins">{{ goods.coinsRequired }}</span>
                  <span class="coins-label">时间币</span>
                </div>
                <div class="goods-stock">库存: {{ goods.stock }}</div>
              </div>
              <el-button 
                type="primary" 
                style="width: 100%; margin-top: 10px;"
                :disabled="goods.stock <= 0"
                @click="openExchangeDialog(goods)"
              >
                立即兑换
              </el-button>
            </div>
          </el-card>
        </div>
        <el-empty v-if="hotGoods.length === 0" description="暂无热门物品"></el-empty>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="exchangeDialogVisible" title="兑换物品" width="400px">
      <div class="exchange-info" v-if="selectedGoods">
        <div class="goods-info-row">
          <span class="label">物品名称:</span>
          <span>{{ selectedGoods.name }}</span>
        </div>
        <div class="goods-info-row">
          <span class="label">单价:</span>
          <span>{{ selectedGoods.coinsRequired }} 时间币</span>
        </div>
        <div class="goods-info-row">
          <span class="label">库存:</span>
          <span>{{ selectedGoods.stock }}</span>
        </div>
        <div class="goods-info-row">
          <span class="label">我的时间币:</span>
          <span class="my-coins">{{ userStore.user?.timeCoins || 0 }}</span>
        </div>
        <el-form label-width="80px" style="margin-top: 20px;">
          <el-form-item label="兑换数量">
            <el-input-number v-model="exchangeQuantity" :min="1" :max="selectedGoods.stock" />
          </el-form-item>
          <el-form-item label="总花费">
            <span class="total-coins">{{ exchangeQuantity * selectedGoods.coinsRequired }} 时间币</span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="exchangeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExchange" :loading="exchanging">确认兑换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import { getGoodsList, getHotGoods } from '../api/goods'
import { createOrder } from '../api/order'

const userStore = useUserStore()
const activeTab = ref('all')
const allGoods = ref([])
const hotGoods = ref([])
const exchangeDialogVisible = ref(false)
const selectedGoods = ref(null)
const exchangeQuantity = ref(1)
const exchanging = ref(false)

const loadData = async () => {
  const [allRes, hotRes] = await Promise.all([
    getGoodsList(),
    getHotGoods()
  ])
  allGoods.value = allRes.data
  hotGoods.value = hotRes.data
}

const openExchangeDialog = (goods) => {
  selectedGoods.value = goods
  exchangeQuantity.value = 1
  exchangeDialogVisible.value = true
}

const handleExchange = async () => {
  if (exchangeQuantity.value * selectedGoods.value.coinsRequired > (userStore.user?.timeCoins || 0)) {
    ElMessage.error('时间币不足')
    return
  }
  
  exchanging.value = true
  try {
    await createOrder(userStore.user.id, selectedGoods.value.id, exchangeQuantity.value)
    ElMessage.success('兑换成功，请等待管理员发放')
    exchangeDialogVisible.value = false
    await loadData()
    await userStore.refreshUser()
  } catch (error) {
    console.error(error)
  } finally {
    exchanging.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.mall-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 20px;
  color: #333;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.goods-card {
  overflow: hidden;
}

.goods-image {
  position: relative;
  height: 180px;
  margin: -20px -20px 15px;
  overflow: hidden;
}

.goods-image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.hot-tag {
  position: absolute;
  top: 10px;
  right: 10px;
}

.goods-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.goods-desc {
  margin: 0 0 12px;
  color: #909399;
  font-size: 13px;
  height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.goods-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-price {
  display: flex;
  align-items: baseline;
}

.coins {
  font-size: 24px;
  font-weight: bold;
  color: #E6A23C;
}

.coins-label {
  font-size: 12px;
  color: #909399;
  margin-left: 2px;
}

.goods-stock {
  font-size: 13px;
  color: #909399;
}

.exchange-info .goods-info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.exchange-info .label {
  color: #909399;
}

.my-coins {
  color: #67C23A;
  font-weight: 500;
}

.total-coins {
  font-size: 18px;
  font-weight: bold;
  color: #E6A23C;
}
</style>
