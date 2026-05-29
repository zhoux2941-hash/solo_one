<script setup lang="ts">import { ref, computed } from 'vue';
import type { ColorStop, GradientType, LinearDirection, RadialShape, RadialSize, GradientConfig } from '../types/gradient';
import { presetGradients } from '../presets/gradients';
import { CssOutputService, type OutputFormat } from '../services/CssOutputService';
import ColorStopItem from './ColorStopItem.vue';
import GradientPreview from './GradientPreview.vue';
import CSSCode from './CSSCode.vue';
import PresetLibrary from './PresetLibrary.vue';
const generateId = () => Math.random().toString(36).substring(2, 9);
const gradientType = ref<GradientType>('linear');
const linearDirection = ref<LinearDirection>('to right');
const angle = ref(90);
const radialShape = ref<RadialShape>('circle');
const radialSize = ref<RadialSize>('farthest-corner');
const colorStops = ref<ColorStop[]>([
 { id: generateId(), color: '#FF6B35', position: 0, opacity: 1 },
 { id: generateId(), color: '#F7C59F', position: 50, opacity: 1 },
 { id: generateId(), color: '#EFEFD0', position: 100, opacity: 1 }
]);
const copied = ref(false);
const hoveredPreset = ref<string | null>(null);
const outputFormat = ref<OutputFormat>('standard');
const maxColorStops = 8;
const updateColorStop = (id: string, field: keyof ColorStop, value: string | number) => {
 const index = colorStops.value.findIndex(stop => stop.id === id);
 if (index !== -1) {
 colorStops.value[index] = {
 ...colorStops.value[index],
 [field]: value
 };
 }
};
const addColorStop = () => {
 if (colorStops.value.length >= maxColorStops)
 return;
 const sortedStops = [...colorStops.value].sort((a, b) => a.position - b.position);
 const lastPosition = sortedStops[sortedStops.length - 1]?.position || 100;
 const newPosition = Math.min(lastPosition - 1, 99);
 colorStops.value.push({
 id: generateId(),
 color: '#ffffff',
 position: newPosition,
 opacity: 1
 });
};
const removeColorStop = (id: string) => {
 if (colorStops.value.length <= 2)
 return;
 colorStops.value = colorStops.value.filter(stop => stop.id !== id);
};
const moveColorStop = (fromIndex: number, toIndex: number) => {
 const item = colorStops.value.splice(fromIndex, 1)[0];
 colorStops.value.splice(toIndex, 0, item);
};
const currentConfig = computed<GradientConfig>(() => ({
 type: gradientType.value,
 linearDirection: linearDirection.value,
 angle: angle.value,
 radialShape: radialShape.value,
 radialSize: radialSize.value,
 colorStops: colorStops.value
}));
const applyPreset = (config: GradientConfig) => {
 gradientType.value = config.type;
 linearDirection.value = config.linearDirection;
 angle.value = config.angle;
 radialShape.value = config.radialShape;
 radialSize.value = config.radialSize;
 colorStops.value = config.colorStops.map(stop => ({ ...stop, id: generateId() }));
};
const copyToClipboard = async () => {
 const code = computedCSS.value;
 try {
 await navigator.clipboard.writeText(code);
 copied.value = true;
 setTimeout(() => copied.value = false, 2000);
 }
 catch (err) {
 console.error('Failed to copy:', err);
 }
};
const computedCSS = computed(() => {
 const service = new CssOutputService(currentConfig.value);
 return service.generate({ format: outputFormat.value });
});
const exportCSS = () => {
 const service = new CssOutputService(currentConfig.value);
 const code = service.generate({ format: outputFormat.value });
 const blob = new Blob([code], { type: 'text/css' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = 'gradient.css';
 a.click();
 URL.revokeObjectURL(url);
};
const linearDirections: {
 value: LinearDirection;
 label: string;
}[] = [
 { value: 'to top', label: '向上' },
 { value: 'to top right', label: '右上' },
 { value: 'to right', label: '向右' },
 { value: 'to bottom right', label: '右下' },
 { value: 'to bottom', label: '向下' },
 { value: 'to bottom left', label: '左下' },
 { value: 'to left', label: '向左' },
 { value: 'to top left', label: '左上' },
 { value: 'angle', label: '自定义角度' }
];
const radialShapes: {
 value: RadialShape;
 label: string;
}[] = [
 { value: 'circle', label: '圆形' },
 { value: 'ellipse', label: '椭圆形' }
];
const radialSizes: {
 value: RadialSize;
 label: string;
}[] = [
 { value: 'closest-side', label: '最近边' },
 { value: 'closest-corner', label: '最近角' },
 { value: 'farthest-side', label: '最远边' },
 { value: 'farthest-corner', label: '最远角' },
 { value: 'contain', label: '包含' },
 { value: 'cover', label: '覆盖' }
];
</script>

<template>
  <div class="gradient-generator">
    <header class="header">
      <h1>CSS Gradient Generator</h1>
      <p>Create beautiful CSS gradients with ease</p>
    </header>

    <div class="main-content">
      <div class="left-panel">
        <div class="panel">
          <h2>渐变类型</h2>
          <div class="type-selector">
            <button
              :class="['type-btn', { active: gradientType === 'linear' }]"
              @click="gradientType = 'linear'"
            >
              线性渐变
            </button>
            <button
              :class="['type-btn', { active: gradientType === 'radial' }]"
              @click="gradientType = 'radial'"
            >
              径向渐变
            </button>
          </div>
        </div>

        <div v-if="gradientType === 'linear'" class="panel">
          <h2>方向</h2>
          <div class="direction-selector">
            <button
              v-for="dir in linearDirections"
              :key="dir.value"
              :class="['dir-btn', { active: linearDirection === dir.value }]"
              @click="linearDirection = dir.value"
            >
              {{ dir.label }}
            </button>
          </div>
          <div v-if="linearDirection === 'angle'" class="angle-input">
            <label>角度: {{ angle }}°</label>
            <input
              type="range"
              min="0"
              max="360"
              v-model.number="angle"
              class="slider"
            />
          </div>
        </div>

        <div v-if="gradientType === 'radial'" class="panel">
          <h2>形状</h2>
          <div class="shape-selector">
            <button
              v-for="shape in radialShapes"
              :key="shape.value"
              :class="['shape-btn', { active: radialShape === shape.value }]"
              @click="radialShape = shape.value"
            >
              {{ shape.label }}
            </button>
          </div>
          <h2>大小</h2>
          <div class="size-selector">
            <button
              v-for="size in radialSizes"
              :key="size.value"
              :class="['size-btn', { active: radialSize === size.value }]"
              @click="radialSize = size.value"
            >
              {{ size.label }}
            </button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h2>色标 ({{ colorStops.length }}/{{ maxColorStops }})</h2>
            <button
              class="add-btn"
              :disabled="colorStops.length >= maxColorStops"
              @click="addColorStop"
            >
              + 添加色标
            </button>
          </div>
          <div class="color-stops">
            <ColorStopItem
              v-for="(stop, index) in colorStops"
              :key="stop.id"
              :color-stop="stop"
              :index="index"
              :total="colorStops.length"
              @update="(field, value) => updateColorStop(stop.id, field, value)"
              @remove="removeColorStop(stop.id)"
              @move-up="index > 0 && moveColorStop(index, index - 1)"
              @move-down="index < colorStops.length - 1 && moveColorStop(index, index + 1)"
            />
          </div>
        </div>

        <div class="panel">
          <h2>输出格式</h2>
          <div class="format-selector">
            <button
              :class="['format-btn', { active: outputFormat === 'standard' }]"
              @click="outputFormat = 'standard'"
            >
              标准 CSS
            </button>
            <button
              :class="['format-btn', { active: outputFormat === 'prefixed' }]"
              @click="outputFormat = 'prefixed'"
            >
              带前缀兼容
            </button>
            <button
              :class="['format-btn', { active: outputFormat === 'css-variables' }]"
              @click="outputFormat = 'css-variables'"
            >
              CSS 变量
            </button>
          </div>
        </div>

        <div class="panel">
          <h2>预设模板</h2>
          <PresetLibrary
            :presets="presetGradients"
            :hovered-preset="hoveredPreset"
            @hover="hoveredPreset = $event"
            @select="applyPreset"
          />
        </div>
      </div>

      <div class="right-panel">
        <GradientPreview :config="currentConfig" />
        
        <CSSCode
          :code="computedCSS"
          :copied="copied"
          @copy="copyToClipboard"
          @export="exportCSS"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gradient-generator {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  color: #fff;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header p {
  color: #a0aec0;
  font-size: 1.1rem;
}

.main-content {
  display: flex;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.panel h2 {
  color: #fff;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.type-selector {
  display: flex;
  gap: 10px;
}

.type-btn, .dir-btn, .shape-btn, .size-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-btn:hover, .dir-btn:hover, .shape-btn:hover, .size-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.type-btn.active, .dir-btn.active, .shape-btn.active, .size-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.direction-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.shape-selector, .size-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.format-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-btn {
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.format-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.format-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.angle-input {
  margin-top: 15px;
}

.angle-input label {
  display: block;
  color: #a0aec0;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.add-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-stops {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
