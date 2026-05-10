<template>
  <div class="ranking-page">
    <div class="ranking-header">
      <h1>🏆 表情包大赛排行榜</h1>
      <p>谁是最受欢迎的表情包？快来为你喜欢的作品投票吧！</p>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      <el-radio-group v-model="activeTab" size="large">
        <el-radio-button label="votes">👍 投票榜</el-radio-button>
        <el-radio-button label="pk">⚔️ PK胜率榜</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="activeTab === 'votes'">
      <div class="top3-section" v-if="ranking.top3 && ranking.top3.length > 0">
        <h2 class="page-title" style="text-align: center; margin-bottom: 30px;">🥇 前三名</h2>
        <div class="top3-container">
          <div 
            v-if="ranking.top3[1]" 
            class="rank-item"
            @click="goToDetail(ranking.top3[1].id)"
          >
            <div class="rank-badge rank-2">2</div>
            <div class="meme-card">
              <img :src="ranking.top3[1].imageUrl" class="meme-image" />
              <div class="meme-info">
                <div class="meme-title">{{ ranking.top3[1].title }}</div>
                <div class="vote-count" style="margin-top: 10px;">
                  👍 {{ ranking.top3[1].voteCount }} 票
                </div>
              </div>
            </div>
          </div>
          
          <div 
            v-if="ranking.top3[0]" 
            class="rank-item"
            @click="goToDetail(ranking.top3[0].id)"
          >
            <div class="rank-badge rank-1">1</div>
            <div class="meme-card" style="transform: scale(1.1);">
              <img :src="ranking.top3[0].imageUrl" class="meme-image" />
              <div class="meme-info">
                <div class="meme-title">{{ ranking.top3[0].title }}</div>
                <div class="vote-count" style="margin-top: 10px;">
                  👍 {{ ranking.top3[0].voteCount }} 票
                </div>
              </div>
            </div>
          </div>
          
          <div 
            v-if="ranking.top3[2]" 
            class="rank-item"
            @click="goToDetail(ranking.top3[2].id)"
          >
            <div class="rank-badge rank-3">3</div>
            <div class="meme-card">
              <img :src="ranking.top3[2].imageUrl" class="meme-image" />
              <div class="meme-info">
                <div class="meme-title">{{ ranking.top3[2].title }}</div>
                <div class="vote-count" style="margin-top: 10px;">
                  👍 {{ ranking.top3[2].voteCount }} 票
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="awards-section">
        <div class="award-card" v-if="ranking.magicAward">
          <div class="award-title magic">🎭 最魔性奖</div>
          <div class="meme-card" @click="goToDetail(ranking.magicAward.id)">
            <img :src="ranking.magicAward.imageUrl" class="meme-image" />
            <div class="meme-info">
              <div class="meme-title">{{ ranking.magicAward.title }}</div>
            </div>
          </div>
        </div>
        
        <div class="award-card" v-if="ranking.carelessAward">
          <div class="award-title careless">🤪 最草率奖</div>
          <div class="meme-card" @click="goToDetail(ranking.carelessAward.id)">
            <img :src="ranking.carelessAward.imageUrl" class="meme-image" />
            <div class="meme-info">
              <div class="meme-title">{{ ranking.carelessAward.title }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="pk-ranking-section">
      <div class="pk-ranking-list" style="max-width: 800px; margin: 0 auto;">
        <div 
          v-for="(meme, index) in pkRanking" 
          :key="meme.id"
          class="pk-rank-item"
          style="display: flex; align-items: center; gap: 20px; padding: 15px; margin-bottom: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer;"
          @click="goToDetail(meme.id)"
        >
          <div 
            class="pk-rank-number"
            :style="{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
              background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ffec8b)' : 
                         index === 1 ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)' : 
                         index === 2 ? 'linear-gradient(135deg, #cd7f32, #daa06d)' : '#f0f0f0',
              color: index < 3 ? '#fff' : '#666'
            }"
          >
            {{ index + 1 }}
          </div>
          <img 
            :src="meme.imageUrl" 
            :alt="meme.title"
            style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
          />
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">{{ meme.title }}</div>
            <div style="color: #999; font-size: 13px;">
              <span style="margin-right: 15px;">{{ (meme.pkWins || 0) + (meme.pkLosses || 0) }} 场</span>
              <span style="color: #67c23a; margin-right: 8px;">{{ meme.pkWins || 0 }}胜</span>
              <span style="color: #f56c6c;">{{ meme.pkLosses || 0 }}负</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div 
              :style="{
                fontSize: '24px',
                fontWeight: 'bold',
                color: getRateColor(meme)
              }"
            >
              {{ getRate(meme) }}%
            </div>
            <div style="color: #999; font-size: 12px;">胜率</div>
          </div>
        </div>
      </div>

      <div v-if="pkRanking.length === 0" style="text-align: center; padding: 60px; color: #999;">
        暂无PK数据，快来参与<router-link to="/pk" style="color: #667eea;">随机PK</router-link>吧！
      </div>
    </div>

    <div v-if="activeTab === 'votes' && (!ranking.top3 || ranking.top3.length === 0)" style="text-align: center; padding: 60px; color: #999;">
      暂无排名数据，快来上传作品参与评选吧！
    </div>
  </div>
</template>

<script>
import api from '../api'

export default {
  name: 'Ranking',
  data() {
    return {
      activeTab: 'votes',
      ranking: {
        top3: [],
        magicAward: null,
        carelessAward: null
      },
      pkRanking: []
    }
  },
  created() {
    this.fetchRanking()
  },
  watch: {
    activeTab(newVal) {
      if (newVal === 'pk') {
        this.fetchPkRanking()
      }
    }
  },
  methods: {
    async fetchRanking() {
      try {
        const response = await api.get('/ranking')
        if (response.data.code === 200) {
          this.ranking = response.data.data
        }
      } catch (e) {
        console.error('获取排行榜失败:', e)
      }
    },
    async fetchPkRanking() {
      if (this.pkRanking.length > 0) return
      
      try {
        const response = await api.get('/memes/pk-ranking', {
          params: { limit: 20 }
        })
        if (response.data.code === 200) {
          this.pkRanking = response.data.data
        }
      } catch (e) {
        console.error('获取PK排行榜失败:', e)
      }
    },
    getRate(meme) {
      const wins = meme.pkWins || 0
      const losses = meme.pkLosses || 0
      const total = wins + losses
      if (total === 0) return 0
      return ((wins / total) * 100).toFixed(1)
    },
    getRateColor(meme) {
      const wins = meme.pkWins || 0
      const losses = meme.pkLosses || 0
      const total = wins + losses
      if (total === 0) return '#909399'
      const rate = (wins / total) * 100
      if (rate >= 70) return '#67c23a'
      if (rate >= 50) return '#e6a23c'
      return '#f56c6c'
    },
    goToDetail(id) {
      this.$router.push(`/meme/${id}`)
    }
  }
}
</script>
