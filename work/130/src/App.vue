<template>
  <div class="app">
    <div class="header">
      <h1>Code Editor</h1>
    </div>
    <div class="main-content">
      <div class="left-panel">
        <div class="panel-tabs">
          <button 
            class="panel-tab" 
            :class="{ 'active': activeLeftTab === 'files' }"
            @click="activeLeftTab = 'files'"
          >
            📁 Files
          </button>
          <button 
            class="panel-tab" 
            :class="{ 'active': activeLeftTab === 'snippets' }"
            @click="activeLeftTab = 'snippets'"
          >
            📋 Snippets
          </button>
        </div>
        <div class="panel-content" v-show="activeLeftTab === 'files'">
          <FileTree />
        </div>
        <div class="panel-content" v-show="activeLeftTab === 'snippets'">
          <SnippetManager />
        </div>
      </div>
      <div class="editor">
        <CodeEditor />
      </div>
      <div class="console">
        <DebugConsole />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FileTree from './components/FileTree.vue'
import CodeEditor from './components/CodeEditor.vue'
import DebugConsole from './components/DebugConsole.vue'
import SnippetManager from './components/SnippetManager.vue'

const activeLeftTab = ref('files')
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

.header {
  height: 40px;
  background-color: #252526;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #1e1e1e;
}

.header h1 {
  margin: 0;
  font-size: 14px;
  font-weight: normal;
  color: #cccccc;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 280px;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-tabs {
  display: flex;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}

.panel-tab {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  padding: 8px 16px;
  font-size: 12px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.panel-tab:hover {
  color: #cccccc;
  background-color: #3e3e42;
}

.panel-tab.active {
  color: #cccccc;
  border-bottom-color: #007acc;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor {
  flex: 2;
  overflow: hidden;
}

.console {
  flex: 1;
  border-left: 1px solid #3e3e42;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>
