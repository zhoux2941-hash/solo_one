<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.ql-container {
  font-size: 16px;
  height: 100%;
}

.ql-editor {
  min-height: 400px;
  font-size: 16px;
  line-height: 1.8;
}

.ql-toolbar.ql-snow {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.ql-container.ql-snow {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
</style>
