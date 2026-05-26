<template>
  <div class="app-container">
    <header class="topbar">
      <h1>便签墙</h1>
      <div class="toolbar">
        <input
          v-model="store.search"
          @input="store.loadNotes()"
          type="text"
          placeholder="搜索标题或内容..."
        />
        <div class="color-filter">
          <div
            class="color-chip"
            :class="{ active: store.colorFilter === null }"
            style="background: #eee"
            title="全部"
            @click="setFilter(null)"
          ></div>
          <div
            v-for="c in store.colors"
            :key="c"
            class="color-chip"
            :class="{ active: store.colorFilter === c }"
            :style="{ background: colorMap[c] }"
            :title="c"
            @click="setFilter(c)"
          ></div>
        </div>
        <button @click="store.toggleView()">{{ store.toggleBtnText }}</button>
        <button class="primary" @click="store.openModal()">+ 新建便签</button>
      </div>
    </header>

    <main>
      <h2 class="section-title">{{ store.sectionTitle }}</h2>
      <div
        ref="wallRef"
        class="wall"
        @dragover.prevent="onWallDragOver"
        @drop="onWallDrop"
      >
        <div
          v-for="note in store.notes"
          :key="note.id"
          :data-id="note.id"
          class="note"
          :class="{
            dragging: dragState.draggingId === note.id,
            'drag-over': dragState.dragOverId === note.id
          }"
          :data-color="note.color"
          draggable="true"
          @dragstart="onDragStart($event, note)"
          @dragend="onDragEnd"
          @dragover.prevent="onDragOver($event, note)"
          @dragleave="onDragLeave(note)"
          @drop.stop="onDrop($event, note)"
          @dblclick="store.openModal(note)"
        >
          <h3 class="note-title">{{ note.title || '(无标题)' }}</h3>
          <div class="note-content" v-html="linkifiedContent(note.content)"></div>
          <div class="note-actions">
            <button @click.stop="store.openModal(note)">编辑</button>
            <button @click.stop="store.toggleArchive(note)">
              {{ note.archived ? '还原' : '归档' }}
            </button>
            <button @click.stop="store.deleteNote(note.id)">删除</button>
          </div>
        </div>
      </div>
      <div v-if="store.notes.length === 0" class="empty-hint">
        暂无便签，点击"+ 新建便签"开始吧！
      </div>
    </main>

    <div v-if="store.modalVisible" class="modal" @click.self="store.closeModal()">
      <div class="modal-card">
        <div class="modal-row">
          <label>标题</label>
          <input v-model="store.editingNote!.title" type="text" />
        </div>
        <div class="modal-row">
          <label>内容</label>
          <textarea v-model="store.editingNote!.content" rows="6"></textarea>
        </div>
        <div class="modal-row">
          <label>颜色</label>
          <div class="color-picker">
            <div
              v-for="c in store.colors"
              :key="c"
              class="color-chip"
              :class="{ active: store.editingNote!.color === c }"
              :style="{ background: colorMap[c] }"
              @click="store.editingNote!.color = c"
            ></div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="store.closeModal()">取消</button>
          <button class="primary" @click="store.saveNote()">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useNotesStore } from './stores/notes';
import linkifyHtml from 'linkify-html';

const store = useNotesStore();
const wallRef = ref<HTMLElement | null>(null);

const colorMap: Record<string, string> = {
  yellow: '#fff59d',
  pink: '#f8bbd0',
  blue: '#90caf9',
  green: '#a5d6a7',
  orange: '#ffcc80',
  purple: '#ce93d8'
};

const dragState = reactive({
  draggingId: 0,
  dragOverId: 0,
  pendingSave: false
});

function linkifiedContent(content: string): string {
  return linkifyHtml(content, {
    target: '_blank',
    rel: 'noopener noreferrer',
    attributes: {
      onClick: (e: Event) => e.stopPropagation()
    }
  });
}

function setFilter(color: string | null) {
  store.colorFilter = store.colorFilter === color ? null : color;
  store.loadNotes();
}

function onDragStart(e: DragEvent, note: any) {
  dragState.draggingId = note.id;
  dragState.pendingSave = false;
  const target = e.currentTarget as HTMLElement;
  target.classList.add('dragging');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(note.id));
  }
}

function onDragEnd(e: DragEvent) {
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('dragging');
  document.querySelectorAll('.note.drag-over').forEach((n) => n.classList.remove('drag-over'));
  dragState.draggingId = 0;
  dragState.dragOverId = 0;
  if (dragState.pendingSave && wallRef.value) {
    dragState.pendingSave = false;
    store.saveSortFromDOM(wallRef.value);
  }
}

function onDragOver(e: DragEvent, note: any) {
  const target = e.currentTarget as HTMLElement;
  target.classList.add('drag-over');
  dragState.dragOverId = note.id;
}

function onDragLeave(note: any) {
  if (dragState.dragOverId === note.id) {
    dragState.dragOverId = 0;
  }
}

function onDrop(e: DragEvent, targetNote: any) {
  e.preventDefault();
  e.stopPropagation();
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('drag-over');
  dragState.dragOverId = 0;

  if (!e.dataTransfer) return;
  const draggedId = Number(e.dataTransfer.getData('text/plain'));
  if (!draggedId || draggedId === targetNote.id || !wallRef.value) return;

  const draggedEl = wallRef.value.querySelector(
    `.note[data-id='${draggedId}']`
  ) as HTMLElement;
  if (!draggedEl) return;

  const rect = target.getBoundingClientRect();
  const insertBefore = (e.clientY - rect.top) < rect.height / 2;
  if (insertBefore) {
    wallRef.value.insertBefore(draggedEl, target);
  } else {
    wallRef.value.insertBefore(draggedEl, target.nextSibling);
  }
  dragState.pendingSave = true;
}

function onWallDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}

function onWallDrop(e: DragEvent) {
  e.preventDefault();
  document.querySelectorAll('.note.drag-over').forEach((n) => n.classList.remove('drag-over'));
  dragState.dragOverId = 0;
}

onMounted(async () => {
  await store.loadColors();
  await store.loadNotes();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && store.modalVisible) {
      store.closeModal();
    }
  });
});
</script>

<style scoped>
.topbar {
  background: #fff;
  padding: 16px 24px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.topbar h1 {
  margin: 0;
  font-size: 20px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.toolbar input[type='text'] {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 220px;
  outline: none;
  transition: border-color 0.2s;
}

.toolbar input[type='text']:focus {
  border-color: #4a90e2;
}

button {
  padding: 8px 14px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  font-family: inherit;
}

button:hover {
  background: #f0f0f0;
}

button.primary {
  background: #4a90e2;
  color: #fff;
  border-color: #4a90e2;
}

button.primary:hover {
  background: #3a7bc8;
}

.color-filter {
  display: flex;
  gap: 6px;
}

.color-chip {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s, border-color 0.15s;
}

.color-chip:hover {
  transform: scale(1.15);
}

.color-chip.active {
  border-color: #333;
}

main {
  padding: 24px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 18px;
  color: #555;
}

.wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  align-items: start;
}

.note {
  position: relative;
  min-height: 180px;
  padding: 14px 16px 44px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  cursor: grab;
  user-select: none;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
}

.note:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.note.dragging {
  opacity: 0.4;
  cursor: grabbing;
}

.note.drag-over {
  outline: 2px dashed rgba(0, 0, 0, 0.4);
  outline-offset: 4px;
}

.note-title {
  font-weight: 600;
  margin: 0 0 8px;
  font-size: 15px;
  word-break: break-word;
}

.note-content {
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  line-height: 1.5;
}

.note-content :deep(a) {
  color: inherit;
  text-decoration: underline;
  word-break: break-all;
}

.note-content :deep(a:hover) {
  opacity: 0.7;
}

.note-actions {
  position: absolute;
  bottom: 8px;
  right: 10px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.note:hover .note-actions {
  opacity: 1;
}

.note-actions button {
  padding: 2px 8px;
  font-size: 12px;
  border: none;
  background: rgba(0, 0, 0, 0.12);
  color: inherit;
}

.note-actions button:hover {
  background: rgba(0, 0, 0, 0.25);
}

.note[data-color='yellow'] {
  background: #fff59d;
  color: #4a3f00;
}
.note[data-color='pink'] {
  background: #f8bbd0;
  color: #4a1c2a;
}
.note[data-color='blue'] {
  background: #90caf9;
  color: #0d2f52;
}
.note[data-color='green'] {
  background: #a5d6a7;
  color: #1b3a1d;
}
.note[data-color='orange'] {
  background: #ffcc80;
  color: #4a2e00;
}
.note[data-color='purple'] {
  background: #ce93d8;
  color: #3a1d4a;
}

.empty-hint {
  text-align: center;
  color: #888;
  padding: 40px 0;
  font-size: 15px;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.modal-row label {
  font-size: 13px;
  color: #555;
}

.modal-row input,
.modal-row textarea {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  resize: vertical;
}

.modal-row input:focus,
.modal-row textarea:focus {
  border-color: #4a90e2;
}

.color-picker {
  display: flex;
  gap: 10px;
}

.color-picker .color-chip {
  width: 32px;
  height: 32px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
