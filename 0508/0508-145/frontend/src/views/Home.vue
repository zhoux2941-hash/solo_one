<template>
  <div class="home">
    <div class="hero">
      <h1 class="hero-title">🎭 戏曲脸谱在线设计工具</h1>
      <p class="hero-subtitle">传承中华传统文化，创造独一无二的脸谱艺术</p>
      <div class="hero-actions">
        <router-link to="/design">
          <button class="btn btn-primary">开始设计</button>
        </router-link>
        <router-link to="/gallery">
          <button class="btn btn-outline">浏览作品</button>
        </router-link>
      </div>
    </div>

    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3 class="feature-title">自由配色</h3>
        <p class="feature-desc">为每个分区选择颜色和纹理，打造个性化脸谱</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🖼️</div>
        <h3 class="feature-title">预设模板</h3>
        <p class="feature-desc">提供经典京剧脸谱模板，快速开始创作</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📥</div>
        <h3 class="feature-title">导出分享</h3>
        <p class="feature-desc">一键导出为PNG，分享你的设计作品</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💬</div>
        <h3 class="feature-title">互动交流</h3>
        <p class="feature-desc">收藏和评论他人作品，交流设计心得</p>
      </div>
    </div>

    <div class="card" style="margin-top: 2rem;">
      <h2 class="section-title">✨ 快速开始</h2>
      <ol style="padding-left: 1.5rem; line-height: 2;">
        <li>选择一个脸谱模板开始设计</li>
        <li>点击脸谱上的分区进行选择</li>
        <li>在右侧面板选择颜色和纹理</li>
        <li>保存并分享你的作品</li>
      </ol>
    </div>

    <div class="card" style="margin-top: 2rem;">
      <h2 class="section-title">🎭 脸谱颜色寓意</h2>
      <div class="grid grid-3" style="margin-top: 1rem;">
        <div v-for="(meaning, color) in colorMeanings" :key="color" class="feature-card">
          <div style="width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 1rem; background-color: color; border: 2px solid #333;"></div>
          <h3>{{ meaning.name }}</h3>
          <p style="font-size: 0.9rem; color: #666;">{{ meaning.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const colorMeanings = {
  '#DC143C': { name: '红色', desc: '象征忠义、英勇，如关羽' },
  '#1a1a1a': { name: '黑色', desc: '象征正直、无私，如包拯' },
  '#FFFFFF': { name: '白色', desc: '象征奸诈、多疑，如曹操' },
  '#FFD700': { name: '金色', desc: '象征神圣、威严，如神仙' },
  '#4682B4': { name: '蓝色', desc: '象征刚强、骁勇，如窦尔敦' },
  '#228B22': { name: '绿色', desc: '象征鲁莽、暴躁，如程咬金' }
}
</script>
