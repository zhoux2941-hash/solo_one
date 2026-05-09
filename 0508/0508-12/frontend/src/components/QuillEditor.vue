<template>
  <div class="quill-editor-wrapper">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '开始写作...'
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'text-change', 'selection-change'])

const editorContainer = ref(null)
let quillInstance = null
let isInternalChange = false

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ 'header': 1 }, { 'header': 2 }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'align': [] }],
  ['link', 'image'],
  ['clean']
]

onMounted(() => {
  if (!editorContainer.value) return

  quillInstance = new Quill(editorContainer.value, {
    theme: 'snow',
    placeholder: props.placeholder,
    readOnly: props.readonly,
    modules: {
      toolbar: toolbarOptions,
      history: {
        delay: 500,
        maxStack: 100,
        userOnly: true
      }
    }
  })

  if (props.modelValue) {
    quillInstance.root.innerHTML = props.modelValue
  }

  quillInstance.on('text-change', (delta, oldDelta, source) => {
    if (source === 'user') {
      isInternalChange = true
      const html = quillInstance.root.innerHTML
      emit('update:modelValue', html)
      emit('text-change', { delta, oldDelta, content: html, source })
    }
  })

  quillInstance.on('selection-change', (range, oldRange, source) => {
    emit('selection-change', { range, oldRange, source })
    
    if (range && range.length > 0) {
      const text = quillInstance.getText(range.index, range.length)
      emit('text-selected', { 
        text, 
        positionStart: range.index, 
        positionEnd: range.index + range.length 
      })
    }
  })
})

watch(() => props.modelValue, (newValue) => {
  if (quillInstance && !isInternalChange) {
    const currentHtml = quillInstance.root.innerHTML
    if (currentHtml !== newValue) {
      const selection = quillInstance.getSelection()
      quillInstance.root.innerHTML = newValue || ''
      if (selection) {
        quillInstance.setSelection(selection)
      }
    }
  }
  isInternalChange = false
})

watch(() => props.readonly, (newValue) => {
  if (quillInstance) {
    quillInstance.enable(!newValue)
  }
})

onBeforeUnmount(() => {
  quillInstance = null
})

defineExpose({
  getQuill: () => quillInstance,
  getContent: () => quillInstance?.root.innerHTML || '',
  setContent: (html) => {
    if (quillInstance) {
      isInternalChange = true
      quillInstance.root.innerHTML = html
    }
  },
  getText: () => quillInstance?.getText() || '',
  focus: () => quillInstance?.focus()
})
</script>

<style scoped>
.quill-editor-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-container :deep(.ql-container) {
  flex: 1;
  overflow-y: auto;
}

.editor-container :deep(.ql-editor) {
  min-height: 300px;
  font-size: 16px;
  line-height: 1.8;
}
</style>
