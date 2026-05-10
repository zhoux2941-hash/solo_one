<template>
  <div class="designer">
    <div class="grid grid-3" style="grid-template-columns: 280px 1fr 320px;">
      <div class="card">
        <h3 class="section-title">📐 选择模板</h3>
        <div class="template-list">
          <div
            v-for="template in templates"
            :key="template.id"
            :class="['template-card', { selected: selectedTemplate?.id === template.id }]"
            @click="selectTemplate(template)"
          >
            <div class="template-preview">
              <div v-html="template.svgContent" style="width: 150px; height: 180px;"></div>
            </div>
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">{{ template.description }}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <h3 class="section-title">📤 上传自定义</h3>
          <div class="file-upload">
            <button class="btn btn-outline btn-small">上传SVG轮廓</button>
            <input type="file" accept=".svg" @change="handleSvgUpload" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <button class="btn btn-secondary btn-small" @click="resetDesign">
            🔄 重置
          </button>
          <button class="btn btn-secondary btn-small" @click="downloadPng">
            📥 下载PNG
          </button>
          <button class="btn btn-primary btn-small" @click="showSaveModal = true">
            💾 保存设计
          </button>
        </div>

        <div class="canvas-container">
          <canvas
            ref="canvasRef"
            :width="canvasWidth"
            :height="canvasHeight"
            @click="handleCanvasClick"
            class="mask-preview"
          ></canvas>
        </div>

        <div v-if="selectedRegion" class="card" style="margin-top: 1rem;">
          <h4>当前选中：{{ selectedRegion.name }}</h4>
          <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem;">
            <span style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #333;" :style="{ backgroundColor: currentColor }"></span>
            <span>{{ currentColor }}</span>
            <span>纹理：{{ currentTextureName }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">🖌️ 分区选择</h3>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div
            v-for="region in regions"
            :key="region.id"
            :class="['region-item', { active: selectedRegion?.id === region.id }]"
            @click="selectRegion(region)"
          >
            <span
              style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #333;"
              :style="{ backgroundColor: getRegionColor(region.id) }"
            ></span>
            <span>{{ region.name }}</span>
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <h3 class="section-title">🎨 颜色选择 <span style="font-size: 0.8rem; color: #8B0000; font-weight: normal;">(点击查看文化含义)</span></h3>
          <div class="preset-colors">
            <div
              v-for="color in presetColors"
              :key="color"
              :class="['preset-color', { active: currentColor === color }]"
              :style="{ backgroundColor: color }"
              :title="getColorCulture(color)?.name || color"
              @click="showCultureCard(color)"
            ></div>
          </div>
          <div style="margin-top: 1rem; display: flex; align-items: center; gap: 1rem;">
            <label class="form-label" style="margin: 0;">自定义：</label>
            <input type="color" v-model="currentColor" class="color-picker" />
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <h3 class="section-title">✨ 纹理样式</h3>
          <div class="texture-options">
            <div
              v-for="texture in textureTypes"
              :key="texture.id"
              :class="['texture-option', { active: currentTexture === texture.id }]"
              :style="getTexturePreviewStyle(texture.id)"
              :title="texture.name"
              @click="setTexture(texture.id)"
            ></div>
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
            当前纹理：{{ currentTextureName }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">保存设计</h3>
          <button class="modal-close" @click="showSaveModal = false">&times;</button>
        </div>
        <div class="form-group">
          <label class="form-label">设计名称</label>
          <input type="text" v-model="saveForm.name" class="form-input" placeholder="请输入设计名称" />
        </div>
        <div class="form-group">
          <label class="form-label">描述（可选）</label>
          <textarea v-model="saveForm.description" class="form-input form-textarea" placeholder="描述一下你的设计..."></textarea>
        </div>
        <div class="form-group">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" v-model="saveForm.isPublic" />
            <span>公开分享到作品广场</span>
          </label>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="btn btn-outline" @click="showSaveModal = false">取消</button>
          <button class="btn btn-primary" @click="saveDesign">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showCultureModal && currentCultureData" class="modal-overlay" @click.self="showCultureModal = false">
      <div class="modal-content culture-card" style="max-width: 520px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span class="culture-color-preview" :style="{ backgroundColor: currentCultureColor }"></span>
            <div>
              <h3 class="modal-title">{{ currentCultureData.name }}</h3>
              <p style="font-size: 0.9rem; color: #8B0000; margin-top: 0.25rem;">{{ currentCultureData.meaning }}</p>
            </div>
          </div>
          <button class="modal-close" @click="showCultureModal = false">&times;</button>
        </div>

        <div class="culture-description">
          <p>{{ currentCultureData.description }}</p>
        </div>

        <div class="culture-traits">
          <span class="culture-trait-label">性格标签：</span>
          <span
            v-for="trait in currentCultureData.traits"
            :key="trait"
            class="culture-trait"
          >{{ trait }}</span>
        </div>

        <div class="culture-characters">
          <h4 style="margin-bottom: 1rem; color: #8B0000;">🎭 代表人物</h4>
          <div
            v-for="(char, index) in currentCultureData.characters"
            :key="index"
            class="culture-character"
          >
            <div class="culture-character-name">{{ char.name }}</div>
            <div class="culture-character-desc">{{ char.desc }}</div>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #eee;">
          <button class="btn btn-outline" @click="showCultureModal = false">关闭</button>
          <button class="btn btn-primary" @click="applyColorFromModal">使用此颜色</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { templateApi, designApi } from '../api'
import {
  PRESET_COLORS,
  TEXTURE_TYPES,
  DEFAULT_REGIONS,
  COLOR_CULTURE,
  renderMask,
  getRegionAtPoint,
  getColorCulture
} from '../utils/maskRenderer'

const route = useRoute()
const router = useRouter()

const canvasRef = ref(null)
const canvasWidth = 400
const canvasHeight = 500

const templates = ref([])
const selectedTemplate = ref(null)
const regions = ref([...DEFAULT_REGIONS])
const regionStyles = ref({})
const selectedRegion = ref(null)

const presetColors = PRESET_COLORS
const textureTypes = TEXTURE_TYPES
const currentColor = ref('#DC143C')
const currentTexture = ref('solid')

const showSaveModal = ref(false)
const saveForm = reactive({
  name: '',
  description: '',
  isPublic: true
})

const showCultureModal = ref(false)
const currentCultureColor = ref(null)

const existingDesignId = ref(null)

const currentTextureName = computed(() => {
  const t = textureTypes.find(t => t.id === currentTexture.value)
  return t ? t.name : '纯色'
})

const currentCultureData = computed(() => {
  if (!currentCultureColor.value) return null
  return getColorCulture(currentCultureColor.value)
})

function showCultureCard(color) {
  currentCultureColor.value = color
  showCultureModal.value = true
}

function applyColorFromModal() {
  if (currentCultureColor.value) {
    setColor(currentCultureColor.value)
  }
  showCultureModal.value = false
}

function getRegionColor(regionId) {
  return regionStyles.value[regionId]?.color || regions.value.find(r => r.id === regionId)?.defaultColor || '#F5DEB3'
}

function getTexturePreviewStyle(textureId) {
  const baseColor = currentColor.value
  switch (textureId) {
    case 'cloud':
      return { backgroundColor: baseColor, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.2) 20%, transparent 20%), radial-gradient(circle, rgba(0,0,0,0.2) 20%, transparent 20%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }
    case 'dot':
      return { backgroundColor: baseColor, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 15%, transparent 15%)', backgroundSize: '15px 15px' }
    case 'stripe':
      return { backgroundColor: baseColor, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 6px)' }
    case 'wave':
      return { backgroundColor: baseColor, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.2) 8px, rgba(0,0,0,0.2) 10px)' }
    default:
      return { backgroundColor: baseColor }
  }
}

async function loadTemplates() {
  try {
    const data = await templateApi.getDefaultTemplates()
    if (data && data.length > 0) {
      templates.value = data
      selectTemplate(data[0])
    }
  } catch (e) {
    console.warn('加载模板失败，使用默认数据')
    templates.value = [{
      id: 1,
      name: '经典京剧脸谱',
      description: '传统京剧脸谱模板',
      svgContent: '<svg viewBox="0 0 400 500"><ellipse cx="200" cy="250" rx="120" ry="160" fill="#F5DEB3" stroke="#333" stroke-width="2"/><path d="M200 90 Q280 100 290 130 Q270 160 200 180 Q130 160 110 130 Q120 100 200 90" fill="#F5DEB3" stroke="#333"/><ellipse cx="150" cy="210" rx="30" ry="20" fill="white" stroke="#333"/><ellipse cx="250" cy="210" rx="30" ry="20" fill="white" stroke="#333"/></svg>',
      regions: JSON.stringify(DEFAULT_REGIONS),
      isDefault: 1
    }]
    selectTemplate(templates.value[0])
  }
}

function selectTemplate(template) {
  selectedTemplate.value = template
  if (template.regions) {
    try {
      regions.value = JSON.parse(template.regions)
    } catch (e) {
      regions.value = [...DEFAULT_REGIONS]
    }
  }
  initRegionStyles()
  nextTick(() => render())
}

function initRegionStyles() {
  regionStyles.value = {}
  regions.value.forEach(region => {
    regionStyles.value[region.id] = {
      color: region.defaultColor,
      texture: 'solid',
      selected: false
    }
  })
}

function selectRegion(region) {
  Object.keys(regionStyles.value).forEach(id => {
    regionStyles.value[id].selected = false
  })
  selectedRegion.value = region
  regionStyles.value[region.id].selected = true
  currentColor.value = regionStyles.value[region.id].color
  currentTexture.value = regionStyles.value[region.id].texture
  render()
}

function setColor(color) {
  currentColor.value = color
  if (selectedRegion.value) {
    regionStyles.value[selectedRegion.value.id].color = color
    render()
  }
}

function setTexture(texture) {
  currentTexture.value = texture
  if (selectedRegion.value) {
    regionStyles.value[selectedRegion.value.id].texture = texture
    render()
  }
}

function handleCanvasClick(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const region = getRegionAtPoint(regions.value, x, y)
  if (region) {
    selectRegion(region)
  }
}

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  renderMask(ctx, canvasWidth, canvasHeight, regions.value, regionStyles.value)
}

function resetDesign() {
  initRegionStyles()
  selectedRegion.value = null
  render()
}

function downloadPng() {
  Object.keys(regionStyles.value).forEach(id => {
    regionStyles.value[id].selected = false
  })
  selectedRegion.value = null
  render()

  setTimeout(() => {
    const canvas = canvasRef.value
    const link = document.createElement('a')
    link.download = `脸谱设计_${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, 100)
}

function handleSvgUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    const svgContent = event.target.result
    const customTemplate = {
      id: Date.now(),
      name: file.name.replace('.svg', ''),
      description: '自定义上传模板',
      svgContent: svgContent,
      regions: JSON.stringify(DEFAULT_REGIONS),
      isDefault: 0
    }
    templates.value.push(customTemplate)
    selectTemplate(customTemplate)
  }
  reader.readAsText(file)
}

async function saveDesign() {
  if (!saveForm.name) {
    alert('请输入设计名称')
    return
  }

  Object.keys(regionStyles.value).forEach(id => {
    regionStyles.value[id].selected = false
  })
  render()

  const previewImage = canvasRef.value.toDataURL('image/png')
  const designData = JSON.stringify({
    regions: regions.value,
    regionStyles: regionStyles.value,
    templateId: selectedTemplate.value?.id
  })

  const userId = localStorage.getItem('userId') || '1'
  const userName = localStorage.getItem('userName') || '用户'

  const payload = {
    userId: parseInt(userId),
    userName,
    templateId: selectedTemplate.value?.id,
    name: saveForm.name,
    description: saveForm.description,
    designData,
    previewImage,
    svgContent: selectedTemplate.value?.svgContent || '',
    isPublic: saveForm.isPublic ? 1 : 0
  }

  try {
    if (existingDesignId.value) {
      await designApi.updateDesign(existingDesignId.value, payload)
    } else {
      await designApi.saveDesign(payload)
    }
    alert('保存成功！')
    showSaveModal.value = false
    router.push('/my-designs')
  } catch (e) {
    alert('保存失败：' + e.message)
  }
}

async function loadExistingDesign() {
  const id = route.params.id
  if (!id) return

  try {
    const design = await designApi.getDesignById(id)
    existingDesignId.value = id
    saveForm.name = design.name
    saveForm.description = design.description || ''
    saveForm.isPublic = design.isPublic === 1

    if (design.designData) {
      const data = JSON.parse(design.designData)
      regions.value = data.regions || DEFAULT_REGIONS
      regionStyles.value = data.regionStyles || {}
      nextTick(() => render())
    }

    if (design.templateId) {
      const template = templates.value.find(t => t.id === design.templateId)
      if (template) {
        selectedTemplate.value = template
      }
    }
  } catch (e) {
    console.error('加载设计失败', e)
  }
}

watch(currentColor, () => {
  if (selectedRegion.value) {
    regionStyles.value[selectedRegion.value.id].color = currentColor.value
    render()
  }
})

watch(currentTexture, () => {
  if (selectedRegion.value) {
    regionStyles.value[selectedRegion.value.id].texture = currentTexture.value
    render()
  }
})

onMounted(async () => {
  await loadTemplates()
  await loadExistingDesign()
})
</script>

<style scoped>
.designer {
  min-height: 100%;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.culture-card {
  max-height: 85vh;
  overflow-y: auto;
}

.culture-color-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 3px solid #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.culture-description {
  background: linear-gradient(135deg, #fef3e2 0%, #fff9f0 100%);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  line-height: 1.8;
  color: #333;
}

.culture-description p {
  text-indent: 2em;
}

.culture-traits {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 8px;
}

.culture-trait-label {
  font-weight: 600;
  color: #666;
  margin-right: 0.25rem;
}

.culture-trait {
  background: linear-gradient(135deg, #8B0000 0%, #6b0000 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  box-shadow: 0 1px 3px rgba(139, 0, 0, 0.2);
}

.culture-characters {
  margin-top: 1rem;
}

.culture-character {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.3s;
}

.culture-character:hover {
  border-color: #8B0000;
  box-shadow: 0 2px 8px rgba(139, 0, 0, 0.1);
}

.culture-character:last-child {
  margin-bottom: 0;
}

.culture-character-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: #8B0000;
  margin-bottom: 0.35rem;
}

.culture-character-name::before {
  content: '🎭 ';
}

.culture-character-desc {
  color: #555;
  line-height: 1.7;
  font-size: 0.92rem;
}
</style>
