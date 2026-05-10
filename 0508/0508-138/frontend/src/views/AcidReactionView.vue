<template>
  <div class="page-container">
    <div class="hero-section">
      <h1>🧪 矿物酸碱反应模拟</h1>
      <p>选择矿物，观察滴加稀盐酸后的起泡现象</p>
    </div>

    <div class="nav-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="矿物鉴定" name="identification">
          <template #label>
            <span class="tab-label">
              <el-icon><Search /></el-icon>
              矿物鉴定
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="酸碱反应" name="acid-reaction">
          <template #label>
            <span class="tab-label">
              <el-icon><Experiment /></el-icon>
              酸碱反应模拟
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :md="8">
        <div class="card-container" style="padding: 24px;">
          <h3 class="section-title">选择矿物</h3>
          
          <el-select
            v-model="selectedMineralId"
            placeholder="请选择要测试的矿物"
            style="width: 100%;"
            size="large"
            filterable
          >
            <el-option
              v-for="mineral in allMinerals"
              :key="mineral.id"
              :label="`${mineral.nameCn} (${mineral.name})`"
              :value="mineral.id"
            />
          </el-select>

          <div v-if="selectedMineral" style="margin-top: 20px;">
            <el-card shadow="hover">
              <el-image
                class="mineral-image"
                :src="selectedMineral.imageUrl"
                fit="cover"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon :size="30"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div style="margin-top: 12px;">
                <h4 style="margin: 0 0 8px 0;">{{ selectedMineral.nameCn }}</h4>
                <p style="font-size: 12px; color: #909399; margin: 0 0 8px 0;">
                  {{ selectedMineral.name }}
                </p>
                <p style="font-size: 13px; color: #606266; margin: 0;">
                  {{ selectedMineral.description }}
                </p>
              </div>
            </el-card>
          </div>

          <el-button
            type="danger"
            size="large"
            @click="startReaction"
            :disabled="!selectedMineral || isReacting"
            :loading="isReacting"
            style="width: 100%; margin-top: 20px;"
          >
            <el-icon style="margin-right: 5px;"><Droplet /></el-icon>
            {{ isReacting ? '反应中...' : '滴加稀盐酸' }}
          </el-button>

          <el-button
            @click="resetSimulation"
            :disabled="!selectedMineral"
            style="width: 100%; margin-top: 10px;"
          >
            <el-icon style="margin-right: 5px;"><Refresh /></el-icon>
            重置
          </el-button>
        </div>

        <div class="card-container" style="padding: 24px; margin-top: 20px;">
          <h3 class="section-title">反应强度说明</h3>
          
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="🔴 强烈反应">
              碳酸盐矿物（如方解石、孔雀石），滴酸后剧烈起泡，产生大量二氧化碳气泡
            </el-descriptions-item>
            <el-descriptions-item label="🟠 中等反应">
              磷酸盐、氧化物等，需要较浓的酸或加热才能明显反应
            </el-descriptions-item>
            <el-descriptions-item label="🟡 微弱反应">
              部分硫化物、硅酸盐，反应缓慢且不明显
            </el-descriptions-item>
            <el-descriptions-item label="⚪ 不反应">
              石英、硅酸盐、氧化物等，与稀盐酸不发生反应
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>

      <el-col :xs="24" :md="16">
        <div class="card-container" style="padding: 24px; min-height: 600px;">
          <h3 class="section-title">反应模拟</h3>
          
          <div class="reaction-container">
            <div class="test-tube-container">
              <div class="test-tube">
                <div class="mineral-sample" :class="{ 'reacting': isReacting }">
                  <div v-if="selectedMineral" class="mineral-text">
                    {{ selectedMineral.nameCn }}
                  </div>
                  <div v-else class="mineral-text placeholder">
                    选择矿物开始
                  </div>
                </div>
                
                <div class="acid-liquid" :class="{ 'added': acidAdded }">
                  <div class="liquid-surface"></div>
                </div>
                
                <div v-if="isReacting" class="bubbles-container">
                  <div
                    v-for="bubble in bubbles"
                    :key="bubble.id"
                    class="bubble"
                    :style="{
                      left: bubble.left + '%',
                      animationDuration: bubble.duration + 's',
                      animationDelay: bubble.delay + 's',
                      width: bubble.size + 'px',
                      height: bubble.size + 'px'
                    }"
                  ></div>
                </div>
              </div>
              
              <div class="dropper-container" :class="{ 'dropping': isDropping }">
                <div class="dropper">
                  <div class="dropper-bulb"></div>
                  <div class="dropper-tube"></div>
                </div>
                <div v-if="isDropping" class="drop"></div>
              </div>
            </div>
            
            <div class="reaction-info">
              <el-alert
                v-if="reactionResult"
                :title="reactionResult.title"
                :type="reactionResult.type"
                show-icon
                :closable="false"
                style="margin-bottom: 16px;"
              >
                <template #default>
                  {{ reactionResult.description }}
                </template>
              </el-alert>
              
              <el-card v-if="reactionResult" shadow="never" style="background: #f5f7fa;">
                <template #header>
                  <div class="card-header">
                    <span>🧬 化学反应方程式</span>
                  </div>
                </template>
                <div class="chemical-equation">
                  {{ reactionResult.equation }}
                </div>
              </el-card>
              
              <div v-if="!selectedMineral" class="empty-state">
                <el-icon :size="60" style="color: #c0c4cc; margin-bottom: 16px;">
                  <Experiment />
                </el-icon>
                <p style="color: #909399; margin: 0;">
                  从左侧选择一个矿物，然后点击"滴加稀盐酸"
                </p>
                <p style="color: #c0c4cc; font-size: 12px; margin: 8px 0 0 0;">
                  观察矿物与盐酸的反应现象
                </p>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-float-button
      icon="QuestionFilled"
      @click="showTips = true"
      style="right: 20px; bottom: 20px;"
      type="primary"
    />

    <el-dialog v-model="showTips" title="酸碱反应原理" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="反应原理">
          稀盐酸（HCl）与碳酸盐矿物反应，产生二氧化碳（CO₂）气体，表现为起泡现象。
          <br><br>
          这是鉴定碳酸盐矿物的重要方法之一。方解石（CaCO₃）遇冷稀盐酸会剧烈起泡，
          而白云石需要加热或磨成粉末才能明显反应。
        </el-descriptions-item>
        <el-descriptions-item label="常见反应矿物">
          <strong>强烈反应：</strong>方解石、文石、孔雀石、蓝铜矿、菱锰矿等
          <br>
          <strong>中等反应：</strong>磷灰石、萤石、闪锌矿、绿松石等
          <br>
          <strong>不反应：</strong>石英、长石、云母、黄铁矿、刚玉等
        </el-descriptions-item>
        <el-descriptions-item label="安全提示">
          盐酸具有腐蚀性，实验时请佩戴护目镜和手套。
          <br>
          如不慎接触皮肤或眼睛，请立即用大量清水冲洗。
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="showTips = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mineralApi } from '../api'

const router = useRouter()

const activeTab = ref('acid-reaction')
const showTips = ref(false)

const handleTabChange = (tabName) => {
  if (tabName === 'identification') {
    router.push('/')
  }
}
const allMinerals = ref([])
const selectedMineralId = ref(null)
const isReacting = ref(false)
const isDropping = ref(false)
const acidAdded = ref(false)
const bubbles = ref([])
const reactionResult = ref(null)

const selectedMineral = computed(() => {
  return allMinerals.value.find(m => m.id === selectedMineralId.value)
})

const acidReactionInfo = {
  strong: {
    title: '🔴 剧烈反应！',
    type: 'error',
    description: '矿物与稀盐酸剧烈反应，产生大量气泡。这是碳酸盐矿物的典型特征。',
    equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑'
  },
  moderate: {
    title: '🟠 中等反应',
    type: 'warning',
    description: '矿物与稀盐酸发生中等程度反应，有明显气泡产生。可能需要加热或使用浓酸。',
    equation: '视矿物成分而定，部分磷酸盐和氧化物可与酸反应'
  },
  weak: {
    title: '🟡 微弱反应',
    type: 'info',
    description: '矿物与稀盐酸反应非常缓慢，气泡细小且不明显。可能需要更长时间观察。',
    equation: '反应缓慢且不完全，建议使用热盐酸或浓盐酸'
  },
  none: {
    title: '⚪ 无反应',
    type: 'success',
    description: '矿物与稀盐酸不发生反应。这是硅酸盐、氧化物等矿物的特征。',
    equation: '不反应（该矿物化学性质稳定）'
  }
}

const getAcidReaction = (mineral) => {
  if (!mineral || !mineral.features) return 'none'
  const reactionFeature = mineral.features.find(f => f.featureType === 'acid_reaction')
  return reactionFeature ? reactionFeature.featureValue : 'none'
}

const generateBubbles = (reactionType) => {
  const bubbleCount = {
    strong: 30,
    moderate: 15,
    weak: 5,
    none: 0
  }[reactionType] || 0

  const newBubbles = []
  for (let i = 0; i < bubbleCount; i++) {
    newBubbles.push({
      id: i,
      left: 10 + Math.random() * 80,
      duration: 1 + Math.random() * 2,
      delay: Math.random() * 0.5,
      size: reactionType === 'strong' ? 8 + Math.random() * 12 : 4 + Math.random() * 6
    })
  }
  bubbles.value = newBubbles
}

const startReaction = async () => {
  if (!selectedMineral.value) {
    ElMessage.warning('请先选择一个矿物')
    return
  }

  isReacting.value = true
  reactionResult.value = null
  bubbles.value = []

  isDropping.value = true

  setTimeout(() => {
    isDropping.value = false
    acidAdded.value = true

    const reactionType = getAcidReaction(selectedMineral.value)
    generateBubbles(reactionType)

    setTimeout(() => {
      reactionResult.value = acidReactionInfo[reactionType] || acidReactionInfo.none
    }, 500)

    setTimeout(() => {
      isReacting.value = false
      bubbles.value = []
    }, 3000)
  }, 800)
}

const resetSimulation = () => {
  isReacting.value = false
  isDropping.value = false
  acidAdded.value = false
  bubbles.value = []
  reactionResult.value = null
}

onMounted(async () => {
  try {
    const res = await mineralApi.getAllMinerals()
    allMinerals.value = res.data
  } catch (error) {
    console.error('加载矿物列表失败:', error)
    ElMessage.error('加载矿物列表失败')
  }
})
</script>

<style scoped lang="scss">
.reaction-container {
  display: flex;
  gap: 24px;
  margin-top: 20px;
}

.test-tube-container {
  position: relative;
  width: 300px;
  height: 450px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.test-tube {
  position: relative;
  width: 120px;
  height: 350px;
  background: linear-gradient(to bottom, rgba(200, 230, 255, 0.3), rgba(180, 220, 255, 0.1));
  border: 3px solid rgba(150, 200, 230, 0.8);
  border-radius: 0 0 60px 60px;
  border-top: none;
  overflow: hidden;
  box-shadow: 
    inset 0 0 30px rgba(255, 255, 255, 0.3),
    0 10px 30px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -10px;
    right: -10px;
    height: 20px;
    background: linear-gradient(to bottom, rgba(150, 200, 230, 0.9), rgba(150, 200, 230, 0.6));
    border-radius: 5px 5px 0 0;
    border: 2px solid rgba(150, 200, 230, 0.8);
    border-bottom: none;
  }
}

.mineral-sample {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #a8a8a8, #787878);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 10;

  &.reacting {
    animation: shake 0.1s infinite;
  }

  .mineral-text {
    color: white;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

    &.placeholder {
      color: #bbb;
    }
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(-50%) rotate(-1deg); }
  50% { transform: translateX(-50%) rotate(1deg); }
}

.acid-liquid {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0;
  background: linear-gradient(to top, rgba(255, 200, 200, 0.6), rgba(255, 180, 180, 0.3));
  border-radius: 0 0 57px 57px;
  transition: height 0.5s ease;
  opacity: 0;

  &.added {
    height: 200px;
    opacity: 1;
  }

  .liquid-surface {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 10px;
    background: linear-gradient(to bottom, rgba(255, 150, 150, 0.8), rgba(255, 180, 180, 0.3));
  }
}

.bubbles-container {
  position: absolute;
  bottom: 30px;
  left: 10px;
  right: 10px;
  height: 200px;
  pointer-events: none;
}

.bubble {
  position: absolute;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(200, 230, 255, 0.6));
  border-radius: 50%;
  animation: rise linear infinite;
  box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes rise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-100px) scale(1.1);
    opacity: 0.6;
  }
  100% {
    transform: translateY(-200px) scale(0.8);
    opacity: 0;
  }
}

.dropper-container {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(-100px);
  transition: transform 0.5s ease;

  &.dropping {
    transform: translateX(-50%) translateY(0);
  }
}

.dropper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dropper-bulb {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dropper-tube {
  width: 8px;
  height: 60px;
  background: linear-gradient(to right, rgba(200, 230, 255, 0.8), rgba(150, 200, 230, 0.6));
  border: 2px solid rgba(150, 200, 230, 0.8);
  border-radius: 0 0 4px 4px;
}

.drop {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 14px;
  background: linear-gradient(135deg, #ff9999, #ff6666);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: dropFall 0.8s ease-in forwards;
}

@keyframes dropFall {
  0% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(250px);
    opacity: 0;
  }
}

.reaction-info {
  flex: 1;
  min-width: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.chemical-equation {
  font-family: 'Times New Roman', serif;
  font-size: 18px;
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 150px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  border-radius: 8px;
}

.mineral-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
