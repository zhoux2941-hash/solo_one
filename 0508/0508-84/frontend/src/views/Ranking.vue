<template>
  <div class="ranking-container">
    <h2 class="page-title">社区时数排行榜</h2>
    
    <div class="top-three" v-if="rankingList.length >= 3">
      <div class="rank-card silver" v-if="rankingList[1]">
        <div class="rank-badge">2</div>
        <div class="rank-avatar">{{ rankingList[1].realName?.charAt(0) || '?' }}</div>
        <div class="rank-name">{{ rankingList[1].realName }}</div>
        <div class="rank-hours">{{ rankingList[1].totalHours }} 小时</div>
        <div class="rank-coins">{{ rankingList[1].timeCoins }} 时间币</div>
      </div>
      
      <div class="rank-card gold" v-if="rankingList[0]">
        <div class="rank-badge">1</div>
        <div class="rank-avatar">{{ rankingList[0].realName?.charAt(0) || '?' }}</div>
        <div class="rank-name">{{ rankingList[0].realName }}</div>
        <div class="rank-hours">{{ rankingList[0].totalHours }} 小时</div>
        <div class="rank-coins">{{ rankingList[0].timeCoins }} 时间币</div>
      </div>
      
      <div class="rank-card bronze" v-if="rankingList[2]">
        <div class="rank-badge">3</div>
        <div class="rank-avatar">{{ rankingList[2].realName?.charAt(0) || '?' }}</div>
        <div class="rank-name">{{ rankingList[2].realName }}</div>
        <div class="rank-hours">{{ rankingList[2].totalHours }} 小时</div>
        <div class="rank-coins">{{ rankingList[2].timeCoins }} 时间币</div>
      </div>
    </div>
    
    <el-card style="margin-top: 30px;">
      <el-table :data="rankingList.slice(3)" border>
        <el-table-column prop="rank" label="排名" width="100">
          <template #default="scope">
            <span class="rank-number">{{ scope.row.rank }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="志愿者" width="150"></el-table-column>
        <el-table-column label="累计服务时长" width="200">
          <template #default="scope">
            <span class="hours">{{ scope.row.totalHours }} 小时</span>
            <span class="minutes">({{ scope.row.totalMinutes }} 分钟)</span>
          </template>
        </el-table-column>
        <el-table-column label="累计时间币" width="150">
          <template #default="scope">
            <span class="coins">{{ scope.row.timeCoins }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-empty v-if="rankingList.length === 0" description="暂无排行榜数据"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRanking } from '../api/ranking'

const rankingList = ref([])

onMounted(async () => {
  const res = await getRanking()
  rankingList.value = res.data
})
</script>

<style scoped>
.ranking-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  margin-bottom: 40px;
  color: #333;
  font-size: 28px;
}

.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 30px;
  margin-bottom: 30px;
}

.rank-card {
  text-align: center;
  padding: 30px 40px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.rank-card.gold {
  transform: translateY(-20px);
  background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%);
  color: #8b6914;
}

.rank-card.silver {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  color: #666;
}

.rank-card.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
  color: #fff;
}

.rank-badge {
  width: 50px;
  height: 50px;
  line-height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 15px;
}

.rank-avatar {
  width: 80px;
  height: 80px;
  line-height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  font-size: 32px;
  font-weight: bold;
  margin: 0 auto 15px;
}

.rank-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.rank-hours {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 5px;
}

.rank-coins {
  font-size: 14px;
  opacity: 0.8;
}

.rank-number {
  font-size: 18px;
  font-weight: bold;
  color: #666;
}

.hours {
  font-size: 16px;
  font-weight: 500;
}

.minutes {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.coins {
  font-size: 18px;
  font-weight: bold;
  color: #E6A23C;
}
</style>
