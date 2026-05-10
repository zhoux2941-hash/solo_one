<template>
  <div class="velocity-container">
    <el-card class="tool-card">
      <template #header>
        <div class="card-header">
          <span>流星速度估算工具</span>
          <el-tag type="info">基于像素距离和相机参数</el-tag>
        </div>
      </template>
      
      <div class="tool-content">
        <el-form :model="form" label-width="140px" class="velocity-form">
          <el-divider content-position="left">图片信息</el-divider>
          
          <el-form-item label="图片尺寸">
            <el-input-number 
              v-model="form.imageWidth" 
              :min="100" 
              :max="10000"
              placeholder="宽度"
              :controls="false"
              style="width: 120px"
            />
            <span class="dimension-separator">×</span>
            <el-input-number 
              v-model="form.imageHeight" 
              :min="100" 
              :max="10000"
              placeholder="高度"
              :controls="false"
              style="width: 120px"
            />
            <span class="unit">像素</span>
          </el-form-item>
          
          <el-form-item label="视场角 (对角线)">
            <el-select v-model="form.fieldOfViewDegrees" placeholder="选择或输入" clearable style="width: 200px">
              <el-option label="30° (广角镜头)" :value="30"></el-option>
              <el-option label="50° (标准镜头)" :value="50"></el-option>
              <el-option label="60°" :value="60"></el-option>
              <el-option label="90° (鱼眼镜头)" :value="90"></el-option>
              <el-option label="120° (超广角)" :value="120"></el-option>
            </el-select>
            <el-input-number 
              v-if="!form.fieldOfViewDegrees"
              v-model="form.fieldOfViewDegrees" 
              :min="1" 
              :max="180"
              :step="1"
              :controls="false"
              style="width: 100px; margin-left: 10px"
              placeholder="度"
            />
            <span class="unit" v-if="form.fieldOfViewDegrees">°</span>
          </el-form-item>
          
          <el-divider content-position="left">流星轨迹</el-divider>
          
          <el-form-item label="输入方式">
            <el-radio-group v-model="inputMode">
              <el-radio value="distance">直接输入像素距离</el-radio>
              <el-radio value="coords">输入起止坐标</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item v-if="inputMode === 'distance'" label="像素距离">
            <el-input-number 
              v-model="form.pixelDistance" 
              :min="1" 
              :max="10000"
              :step="1"
              :controls="false"
              style="width: 150px"
              placeholder="像素"
            />
            <span class="unit">px</span>
          </el-form-item>
          
          <template v-if="inputMode === 'coords'">
            <el-form-item label="起点坐标">
              <span class="coord-label">X:</span>
              <el-input-number 
                v-model="form.startPixelX" 
                :min="0"
                :controls="false"
                style="width: 100px"
              />
              <span class="coord-label" style="margin-left: 20px">Y:</span>
              <el-input-number 
                v-model="form.startPixelY" 
                :min="0"
                :controls="false"
                style="width: 100px"
              />
            </el-form-item>
            
            <el-form-item label="终点坐标">
              <span class="coord-label">X:</span>
              <el-input-number 
                v-model="form.endPixelX" 
                :min="0"
                :controls="false"
                style="width: 100px"
              />
              <span class="coord-label" style="margin-left: 20px">Y:</span>
              <el-input-number 
                v-model="form.endPixelY" 
                :min="0"
                :controls="false"
                style="width: 100px"
              />
            </el-form-item>
            
            <el-form-item label="计算距离">
              <el-tag v-if="calculatedDistance > 0" type="success">
                {{ calculatedDistance.toFixed(1) }} 像素
              </el-tag>
              <span v-else class="hint-text">输入坐标后自动计算</span>
            </el-form-item>
          </template>
          
          <el-divider content-position="left">时间参数</el-divider>
          
          <el-form-item label="跨越帧数">
            <el-input-number 
              v-model="form.frames" 
              :min="1" 
              :max="1000"
              :step="1"
              :controls="false"
              style="width: 100px"
              placeholder="帧"
            />
            <span class="unit">帧</span>
          </el-form-item>
          
          <el-form-item label="相机帧率">
            <el-select v-model="form.fps" placeholder="选择或输入" clearable style="width: 180px">
              <el-option label="25 FPS (PAL)" :value="25"></el-option>
              <el-option label="30 FPS (NTSC)" :value="30"></el-option>
              <el-option label="50 FPS" :value="50"></el-option>
              <el-option label="60 FPS" :value="60"></el-option>
              <el-option label="100 FPS" :value="100"></el-option>
              <el-option label="200 FPS" :value="200"></el-option>
            </el-select>
            <el-input-number 
              v-if="!form.fps"
              v-model="form.fps" 
              :min="1" 
              :max="10000"
              :step="1"
              :controls="false"
              style="width: 100px; margin-left: 10px"
              placeholder="FPS"
            />
            <span class="unit" v-if="form.fps">FPS</span>
          </el-form-item>
          
          <el-divider content-position="left">高度假设</el-divider>
          
          <el-form-item label="流星高度">
            <el-slider 
              v-model="form.meteorHeightKm" 
              :min="70" 
              :max="130" 
              :step="1"
              :show-tooltip="true"
              style="width: 300px"
            />
            <span class="height-value">{{ form.meteorHeightKm }} km</span>
          </el-form-item>
          
          <el-alert 
            title="流星通常出现在70-130公里高度，默认假设100公里。速度会随高度变化。" 
            type="info" 
            :closable="false"
            show-icon
            class="info-alert"
          />
          
          <el-form-item class="action-buttons">
            <el-button type="primary" @click="calculateVelocity" :loading="calculating" size="large">
              <el-icon><Calculator /></el-icon>
              计算速度
            </el-button>
            <el-button @click="resetForm" size="large">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    
    <el-card v-if="result" class="result-card">
      <template #header>
        <div class="card-header">
          <span>计算结果</span>
          <el-tag type="success">已完成</el-tag>
        </div>
      </template>
      
      <div class="result-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="result-section">
              <h3>
                <el-icon><Compass /></el-icon>
                角速度
              </h3>
              <div class="result-grid">
                <div class="result-item">
                  <span class="label">角距离</span>
                  <span class="value">{{ result.angular.distanceDegrees.toFixed(4) }}°</span>
                  <span class="sub-value">({{ result.angular.distanceArcminutes.toFixed(2) }} 弧分)</span>
                </div>
                <div class="result-item">
                  <span class="label">角速度</span>
                  <span class="value primary">{{ result.angular.velocityDegreesPerSec.toFixed(2) }}°/s</span>
                  <span class="sub-value">({{ result.angular.velocityArcminutesPerSec.toFixed(1) }} 弧分/秒)</span>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="12">
            <div class="result-section">
              <h3>
                <el-icon><Position /></el-icon>
                线速度
              </h3>
              <div class="result-grid">
                <div class="result-item highlight">
                  <span class="label">估算速度</span>
                  <span class="value large">{{ result.linear.velocityKmPerSec.toFixed(2) }}</span>
                  <span class="unit-large">km/s</span>
                </div>
                <div class="result-item">
                  <span class="label">换算</span>
                  <span class="value">{{ result.linear.velocityKmPerHour.toFixed(0) }} km/h</span>
                  <span class="sub-value">({{ result.linear.velocityMetersPerSec.toFixed(0) }} m/s)</span>
                </div>
                <div class="result-item range">
                  <span class="label">速度范围 (70-130km)</span>
                  <span class="value range-value">
                    {{ result.linear.minVelocityKmPerSec.toFixed(2) }} - {{ result.linear.maxVelocityKmPerSec.toFixed(2) }} km/s
                  </span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <el-divider />
        
        <div class="calculation-info">
          <h4>计算参数</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">像素距离:</span>
              <span class="value">{{ result.calculation.pixelDistance.toFixed(1) }} px</span>
            </div>
            <div class="info-item">
              <span class="label">曝光时间:</span>
              <span class="value">{{ result.calculation.exposureTimeSeconds.toFixed(3) }} 秒</span>
            </div>
            <div class="info-item">
              <span class="label">假设高度:</span>
              <span class="value">{{ result.calculation.meteorHeightKm.toFixed(0) }} km</span>
            </div>
            <div class="info-item">
              <span class="label">观测距离:</span>
              <span class="value">{{ result.calculation.distanceToMeteorKm.toFixed(0) }} km</span>
            </div>
          </div>
        </div>
        
        <el-alert 
          title="注意：此估算基于假设的流星高度，实际速度可能有所不同。典型流星速度范围为11-72 km/s。" 
          type="warning" 
          :closable="false"
          show-icon
          class="warning-alert"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Calculator, Compass, Position } from '@element-plus/icons-vue';
import { velocityApi } from '../api/spectra';
const inputMode = ref('distance');
const calculating = ref(false);
const result = ref(null);
const form = ref({
 imageWidth: 1920,
 imageHeight: 1080,
 fieldOfViewDegrees: 50,
 pixelDistance: null,
 startPixelX: 0,
 startPixelY: 0,
 endPixelX: 100,
 endPixelY: 100,
 frames: 5,
 fps: 30,
 meteorHeightKm: 100
});
const calculatedDistance = computed(() => {
 if (inputMode.value === 'coords' &&
 form.value.startPixelX !== null &&
 form.value.startPixelY !== null &&
 form.value.endPixelX !== null &&
 form.value.endPixelY !== null) {
 const dx = form.value.endPixelX - form.value.startPixelX;
 const dy = form.value.endPixelY - form.value.startPixelY;
 return Math.sqrt(dx * dx + dy * dy);
 }
 return 0;
});
watch([() => form.value.startPixelX, () => form.value.startPixelY, () => form.value.endPixelX, () => form.value.endPixelY], () => {
 if (inputMode.value === 'coords' && calculatedDistance.value > 0) {
 form.value.pixelDistance = calculatedDistance.value;
 }
});
const calculateVelocity = async () => {
 if (!form.value.imageWidth || !form.value.imageHeight) {
 ElMessage.warning('请输入图片尺寸');
 return;
 }
 if (!form.value.fieldOfViewDegrees) {
 ElMessage.warning('请输入视场角');
 return;
 }
 if (inputMode.value === 'distance' && !form.value.pixelDistance) {
 ElMessage.warning('请输入像素距离');
 return;
 }
 if (inputMode.value === 'coords' && calculatedDistance.value === 0) {
 ElMessage.warning('请输入有效的起止坐标');
 return;
 }
 if (!form.value.frames || !form.value.fps) {
 ElMessage.warning('请输入帧数和帧率');
 return;
 }
 calculating.value = true;
 try {
 const request = {
 ...form.value,
 pixelDistance: inputMode.value === 'coords' ? calculatedDistance.value : form.value.pixelDistance
 };
 const response = await velocityApi.estimate(request);
 result.value = response.data;
 ElMessage.success('计算完成');
 }
 catch (error) {
 ElMessage.error(error.response?.data || '计算失败');
 }
 finally {
 calculating.value = false;
 }
};
const resetForm = () => {
 form.value = {
 imageWidth: 1920,
 imageHeight: 1080,
 fieldOfViewDegrees: 50,
 pixelDistance: null,
 startPixelX: 0,
 startPixelY: 0,
 endPixelX: 100,
 endPixelY: 100,
 frames: 5,
 fps: 30,
 meteorHeightKm: 100
 };
 result.value = null;
 inputMode.value = 'distance';
};
</script>

<style scoped>
.velocity-container {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.tool-content {
  padding: 10px 0;
}

.velocity-form {
  max-width: 700px;
}

.dimension-separator {
  margin: 0 10px;
  font-weight: 600;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

.coord-label {
  margin-right: 5px;
  color: #606266;
}

.hint-text {
  color: #909399;
  font-style: italic;
}

.info-alert, .warning-alert {
  margin: 20px 0;
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
}

.result-card {
  margin-top: 30px;
}

.result-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  color: #303133;
}

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.result-item.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.result-item.highlight .label {
  color: rgba(255, 255, 255, 0.8);
}

.result-item.range {
  background: #fff7e6;
}

.result-item .label {
  font-size: 12px;
  color: #909399;
}

.result-item .value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.result-item .value.primary {
  color: #409eff;
}

.result-item .value.large {
  font-size: 32px;
}

.result-item .value.range-value {
  color: #e6a23c;
}

.result-item .unit-large {
  font-size: 16px;
  margin-left: 5px;
}

.result-item .sub-value {
  font-size: 12px;
  color: #909399;
}

.calculation-info {
  margin: 20px 0;
}

.calculation-info h4 {
  margin-bottom: 15px;
  color: #606266;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
}

.info-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.height-value {
  margin-left: 20px;
  font-weight: 600;
  color: #409eff;
}
</style>
