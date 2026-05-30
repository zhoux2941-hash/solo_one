<script setup lang="ts">
import { ref, provide } from 'vue'
import LissajousCanvas from '@/components/LissajousCanvas.vue'
import LissajousCanvas3D from '@/components/LissajousCanvas3D.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import PresetSelector from '@/components/PresetSelector.vue'
import WaveformDisplay from '@/components/WaveformDisplay.vue'
import Toolbar from '@/components/Toolbar.vue'
import { useLissajous } from '@/composables/useLissajous'
import { useWaveform } from '@/composables/useWaveform'
import { Box, Monitor } from 'lucide-vue-next'
import type { ViewMode } from '@/types'

const lissajous = useLissajous()
const { params, currentTime } = lissajous
const { xWaveformData, yWaveformData } = useWaveform(params, currentTime)

provide('lissajous', lissajous)

const canvas2DRef = ref<InstanceType<typeof LissajousCanvas> | null>(null)
const canvas3DRef = ref<InstanceType<typeof LissajousCanvas3D> | null>(null)
const viewMode = ref<ViewMode>('2d')

function handleExport() {
  if (viewMode.value === '3d') {
    canvas3DRef.value?.exportPNG()
  } else {
    canvas2DRef.value?.exportPNG()
  }
}
</script>

<template>
  <div class="home-page">
    <header class="header glass-panel">
      <div class="header-content">
        <h1 class="title">Lissajous Synthesizer</h1>
        <p class="subtitle">李萨如图形合成器</p>
      </div>
      <div class="view-switcher">
        <button
          class="switch-btn"
          :class="{ active: viewMode === '2d' }"
          @click="viewMode = '2d'"
        >
          <Monitor :size="16" />
          <span>2D</span>
        </button>
        <button
          class="switch-btn"
          :class="{ active: viewMode === '3d' }"
          @click="viewMode = '3d'"
        >
          <Box :size="16" />
          <span>3D</span>
        </button>
      </div>
    </header>

    <main class="main-content">
      <aside class="left-panel">
        <ControlPanel />
        <PresetSelector />
      </aside>

      <section class="center-panel">
        <LissajousCanvas v-if="viewMode === '2d'" ref="canvas2DRef" />
        <LissajousCanvas3D v-else ref="canvas3DRef" />
      </section>

      <aside class="right-panel">
        <WaveformDisplay
          :xWaveformData="xWaveformData"
          :yWaveformData="yWaveformData"
          :currentTime="currentTime"
          :params="params"
        />
      </aside>
    </main>

    <Toolbar :onExport="handleExport" />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #0a0e17;
  padding: 16px;
  padding-bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: fade-in 0.6s ease-out;
}

.header-content {
  text-align: center;
  flex: 1;
}

.title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00f5d4, #8b5cf6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}

.subtitle {
  color: #94a3b8;
  font-size: 1rem;
  letter-spacing: 2px;
}

.view-switcher {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.switch-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.switch-btn:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.05);
}

.switch-btn.active {
  background: rgba(0, 245, 212, 0.15);
  color: #00f5d4;
  box-shadow: 0 0 12px rgba(0, 245, 212, 0.2);
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr 420px;
  gap: 16px;
  min-height: 0;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slide-in 0.6s ease-out 0.1s both;
}

.center-panel {
  display: flex;
  animation: slide-in 0.6s ease-out 0.2s both;
}

.right-panel {
  display: flex;
  flex-direction: column;
  animation: slide-in 0.6s ease-out 0.3s both;
}

@media (max-width: 1280px) {
  .main-content {
    grid-template-columns: 320px 1fr;
  }

  .right-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .left-panel {
    order: 2;
  }

  .center-panel {
    order: 1;
  }

  .right-panel {
    order: 3;
  }
}
</style>
