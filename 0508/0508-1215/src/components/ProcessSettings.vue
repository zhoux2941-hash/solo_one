<script setup lang="ts">import { ref, watch } from 'vue';
import { Image, Compress, Maximize2, Type, Info } from 'lucide-vue-next';
import type { ProcessOptions } from '@/types';
import { templateVariables } from '@/utils/fileUtils';
const props = defineProps<{
 modelValue: ProcessOptions;
}>();
const emit = defineEmits<{
 (e: 'update:modelValue', value: ProcessOptions): void;
}>();
const localOptions = ref({ ...props.modelValue });
const showTemplateHelp = ref(false);
watch(() => props.modelValue, (newVal) => {
 localOptions.value = { ...newVal };
}, { deep: true });
function updateOption<K extends keyof ProcessOptions>(key: K, value: ProcessOptions[K]) {
 localOptions.value[key] = value;
 emit('update:modelValue', { ...localOptions.value });
}
function insertVariable(variable: string) {
 localOptions.value.renameTemplate += variable;
 emit('update:modelValue', { ...localOptions.value });
}
const formatOptions = [
 { value: 'original', label: '保持原格式' },
 { value: 'png', label: 'PNG' },
 { value: 'jpg', label: 'JPG' },
 { value: 'webp', label: 'WebP' }
];
const resizeModeOptions = [
 { value: 'none', label: '不调整' },
 { value: 'pixel', label: '按像素' },
 { value: 'percentage', label: '按百分比' }
];
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-6">处理设置</h3>
    
    <div class="space-y-6">
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Image class="w-4 h-4 text-primary-600" />
          格式转换
        </label>
        <select
          :value="localOptions.format"
          @change="updateOption('format', ($event.target as HTMLSelectElement).value as ProcessOptions['format'])"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          <option v-for="opt in formatOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Compress class="w-4 h-4 text-primary-600" />
          压缩质量: {{ localOptions.quality }}%
        </label>
        <input
          type="range"
          min="10"
          max="100"
          :value="localOptions.quality"
          @input="updateOption('quality', Number(($event.target as HTMLInputElement).value))"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span>10%</span>
          <span>100%</span>
        </div>
      </div>

      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Maximize2 class="w-4 h-4 text-primary-600" />
          尺寸调整
        </label>
        <select
          :value="localOptions.resizeMode"
          @change="updateOption('resizeMode', ($event.target as HTMLSelectElement).value as ProcessOptions['resizeMode'])"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-3 bg-white"
        >
          <option v-for="opt in resizeModeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        
        <div v-if="localOptions.resizeMode === 'pixel'" class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">宽度(px)</label>
            <input
              type="number"
              min="1"
              :value="localOptions.width || ''"
              @input="updateOption('width', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">高度(px)</label>
            <input
              type="number"
              min="1"
              :value="localOptions.height || ''"
              @input="updateOption('height', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-500 col-span-2">
            <input
              type="checkbox"
              :checked="localOptions.maintainRatio"
              @change="updateOption('maintainRatio', ($event.target as HTMLInputElement).checked)"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            保持比例
          </label>
        </div>
        
        <div v-if="localOptions.resizeMode === 'percentage'">
          <label class="text-xs text-gray-500 mb-1 block">缩放比例(%)</label>
          <input
            type="number"
            min="1"
            max="200"
            :value="localOptions.width || ''"
            @input="updateOption('width', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Type class="w-4 h-4 text-primary-600" />
          重命名模板
        </label>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">文件名模板</label>
            <div class="relative">
              <input
                type="text"
                :value="localOptions.renameTemplate"
                @input="updateOption('renameTemplate', ($event.target as HTMLInputElement).value)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm pr-8"
                placeholder="例如: {{name}}_{{date}}_{{seq}}"
              />
              <button
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                @click="showTemplateHelp = !showTemplateHelp"
              >
                <Info class="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          <div v-if="showTemplateHelp" class="bg-blue-50 rounded-lg p-3">
            <p class="text-xs text-blue-700 mb-2 font-medium">可用变量：</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="varItem in templateVariables"
                :key="varItem.key"
                class="text-xs px-2 py-1 bg-white border border-blue-200 rounded text-blue-600 hover:bg-blue-100 transition-colors"
                @click="insertVariable(varItem.key)"
                :title="varItem.description"
              >
                {{ varItem.key }}
              </button>
            </div>
            <p class="text-xs text-blue-600 mt-2">点击变量插入到模板中</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">序号起始值</label>
              <input
                type="number"
                min="1"
                :value="localOptions.sequenceStart"
                @input="updateOption('sequenceStart', Number(($event.target as HTMLInputElement).value))"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">序号位数</label>
              <input
                type="number"
                min="1"
                max="10"
                :value="localOptions.sequencePadding"
                @input="updateOption('sequencePadding', Number(($event.target as HTMLInputElement).value))"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
