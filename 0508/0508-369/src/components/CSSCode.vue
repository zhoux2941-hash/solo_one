<script setup lang="ts">
interface Props {
  code: string
  copied: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'export'): void
}>()
</script>

<template>
  <div class="css-code">
    <div class="code-header">
      <h2>CSS 代码</h2>
      <div class="code-actions">
        <button
          class="code-btn copy-btn"
          :class="{ copied: copied }"
          @click="emit('copy')"
        >
          <span v-if="!copied">📋 复制</span>
          <span v-else>✓ 已复制</span>
        </button>
        <button class="code-btn export-btn" @click="emit('export')">
          📥 导出 CSS
        </button>
      </div>
    </div>
    
    <div class="code-content">
      <pre><code>{{ code }}</code></pre>
    </div>
    
    <div class="code-prefixes">
      <h3>浏览器前缀</h3>
      <div class="prefix-list">
        <code>-webkit-linear-gradient()</code>
        <code>-moz-linear-gradient()</code>
        <code>-o-linear-gradient()</code>
      </div>
      <p class="prefix-note">现代浏览器已支持标准语法，前缀主要用于兼容旧版浏览器</p>
    </div>
  </div>
</template>

<style scoped>
.css-code {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.code-header h2 {
  color: #fff;
  font-size: 1.2rem;
}

.code-actions {
  display: flex;
  gap: 10px;
}

.code-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.copy-btn.copied {
  background: #22c55e;
}

.export-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.export-btn:hover {
  transform: translateY(-2px);
}

.code-content {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.code-content pre {
  margin: 0;
}

.code-content code {
  color: #a0aec0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.95rem;
  line-height: 1.6;
}

.code-prefixes {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
}

.code-prefixes h3 {
  color: #a0aec0;
  font-size: 0.95rem;
  margin-bottom: 10px;
}

.prefix-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.prefix-list code {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
  color: #90cdf4;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.85rem;
}

.prefix-note {
  color: #718096;
  font-size: 0.85rem;
  margin: 0;
}
</style>
