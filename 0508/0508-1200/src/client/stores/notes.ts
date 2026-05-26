import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  archived: number;
  position: number;
  sortOrder: number;
  created_at: string;
  updated_at: string;
}

const API = '/api';

async function fetchJSON(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const colors = ref<string[]>([]);
  const view = ref<'active' | 'archived'>('active');
  const search = ref('');
  const colorFilter = ref<string | null>(null);
  const editingNote = ref<Note | null>(null);
  const modalVisible = ref(false);
  const pendingSortSave = ref(false);

  const sectionTitle = computed(() =>
    view.value === 'archived' ? '归档便签' : '全部便签'
  );
  const toggleBtnText = computed(() =>
    view.value === 'archived' ? '查看活动' : '查看归档'
  );

  async function loadColors() {
    colors.value = await fetchJSON(`${API}/colors`);
  }

  async function loadNotes() {
    const params = new URLSearchParams();
    params.set('archived', view.value === 'archived' ? '1' : '0');
    if (search.value) params.set('q', search.value);
    if (colorFilter.value) params.set('color', colorFilter.value);
    notes.value = await fetchJSON(`${API}/notes?${params.toString()}`);
  }

  function openModal(note?: Note) {
    if (note) {
      editingNote.value = { ...note };
    } else {
      editingNote.value = {
        id: 0,
        title: '',
        content: '',
        color: 'yellow',
        archived: 0,
        position: 0,
        sortOrder: 0,
        created_at: '',
        updated_at: ''
      };
    }
    modalVisible.value = true;
  }

  function closeModal() {
    modalVisible.value = false;
    editingNote.value = null;
  }

  async function saveNote() {
    if (!editingNote.value) return;
    const data = {
      title: editingNote.value.title.trim(),
      content: editingNote.value.content,
      color: editingNote.value.color
    };
    try {
      if (editingNote.value.id) {
        await fetchJSON(`${API}/notes/${editingNote.value.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        await fetchJSON(`${API}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      closeModal();
      await loadNotes();
    } catch (err) {
      alert('保存失败: ' + (err as Error).message);
    }
  }

  async function deleteNote(id: number) {
    if (!confirm('确定删除该便签？')) return;
    await fetchJSON(`${API}/notes/${id}`, { method: 'DELETE' });
    await loadNotes();
  }

  async function toggleArchive(note: Note) {
    await fetchJSON(`${API}/notes/${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: note.archived ? 0 : 1 })
    });
    await loadNotes();
  }

  async function saveSortFromDOM(wallEl: HTMLElement) {
    const ids = Array.from(wallEl.querySelectorAll('.note'))
      .map((el) => Number((el as HTMLElement).dataset.id))
      .filter((n) => n);
    if (ids.length < 2) return;
    try {
      await fetchJSON(`${API}/notes/sort`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: ids })
      });
    } catch (err) {
      alert('保存顺序失败: ' + (err as Error).message);
    }
    await loadNotes();
  }

  function toggleView() {
    view.value = view.value === 'archived' ? 'active' : 'archived';
    loadNotes();
  }

  return {
    notes,
    colors,
    view,
    search,
    colorFilter,
    editingNote,
    modalVisible,
    pendingSortSave,
    sectionTitle,
    toggleBtnText,
    loadColors,
    loadNotes,
    openModal,
    closeModal,
    saveNote,
    deleteNote,
    toggleArchive,
    saveSortFromDOM,
    toggleView
  };
});
