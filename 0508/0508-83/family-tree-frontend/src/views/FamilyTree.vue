<template>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div class="tree-toolbar">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加人员
      </el-button>
      <el-button @click="refreshTree">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
      <el-button @click="handleImportGedcom">
        <el-icon><Upload /></el-icon>
        导入GEDCOM
      </el-button>
      <el-button @click="handleExportGedcom">
        <el-icon><Download /></el-icon>
        导出GEDCOM
      </el-button>
      <span style="margin-left: auto; color: #666;">
        共 {{ treeData?.totalCount || 0 }} 人
      </span>
    </div>

    <div class="tree-container">
      <div ref="chartRef" class="tree-chart"></div>
    </div>

    <el-drawer
      v-model="detailDrawerVisible"
      title="人员详情"
      size="400px"
      class="person-detail-drawer"
    >
      <div v-if="selectedPerson" class="person-info">
        <div class="person-avatar">
          <div v-if="selectedPerson.avatar">
            <img :src="selectedPerson.avatar" />
          </div>
          <div v-else class="avatar-placeholder">
            {{ selectedPerson.name?.charAt(0) || '?' }}
          </div>
        </div>
        <div class="info-item">
          <span class="info-label">姓名：</span>
          <span class="info-value">{{ selectedPerson.name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">性别：</span>
          <span class="info-value">{{ selectedPerson.gender === 'male' ? '男' : '女' }}</span>
        </div>
        <div class="info-item" v-if="selectedPerson.birthYear">
          <span class="info-label">出生年份：</span>
          <span class="info-value">{{ selectedPerson.birthYear }}</span>
        </div>
        <div class="info-item" v-if="selectedPerson.deathYear">
          <span class="info-label">逝世年份：</span>
          <span class="info-value">{{ selectedPerson.deathYear }}</span>
        </div>
        <div class="info-item" v-if="selectedPerson.biography">
          <span class="info-label">简介：</span>
          <span class="info-value" style="white-space: pre-wrap;">{{ selectedPerson.biography }}</span>
        </div>
        <div style="margin-top: 30px; display: flex; gap: 10px;">
          <el-button type="primary" @click="editPerson">编辑</el-button>
          <el-button type="danger" @click="showDeleteConfirm">删除</el-button>
        </div>

        <div style="margin-top: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="margin: 0; font-weight: 600;">
              <el-icon><Calendar /></el-icon> 重要事件
            </h4>
            <el-button size="small" type="primary" @click="openAddEvent">
              <el-icon><Plus /></el-icon>
              添加事件
            </el-button>
          </div>
          <div v-if="selectedPersonEvents.length === 0" style="text-align: center; padding: 30px; color: #999;">
            暂无事件记录
          </div>
          <div v-else class="event-list">
            <div
              v-for="event in selectedPersonEvents"
              :key="event.id"
              class="event-item"
            >
              <div class="event-header">
                <span class="event-type" :class="'event-type-' + event.type">
                  {{ getEventTypeLabel(event.type) }}
                </span>
                <span class="event-date">
                  {{ formatEventDate(event) }}
                </span>
                <span class="event-actions">
                  <el-button link type="primary" size="small" @click="editEvent(event)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button link type="danger" size="small" @click="deleteEvent(event.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </span>
              </div>
              <div class="event-title">{{ event.title }}</div>
              <div v-if="event.description" class="event-desc">{{ event.description }}</div>
              <div v-if="event.location" class="event-loc">
                <el-icon><Location /></el-icon> {{ event.location }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="showAddDialog"
      :title="editingPerson ? '编辑人员' : '添加人员'"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="personForm" :rules="personRules" ref="personFormRef" label-width="80px">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleAvatarChange"
          >
            <img v-if="personForm.avatar" :src="personForm.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="personForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="personForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生年份">
          <el-input-number v-model="personForm.birthYear" :min="0" :max="9999" placeholder="出生年份" />
        </el-form-item>
        <el-form-item label="逝世年份">
          <el-input-number v-model="personForm.deathYear" :min="0" :max="9999" placeholder="逝世年份" />
        </el-form-item>
        <el-form-item label="父亲">
          <el-select v-model="personForm.fatherId" placeholder="选择父亲" clearable filterable>
            <el-option
              v-for="p in malePersons.filter(p => p.id !== editingPerson?.id)"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="母亲">
          <el-select v-model="personForm.motherId" placeholder="选择母亲" clearable filterable>
            <el-option
              v-for="p in femalePersons.filter(p => p.id !== editingPerson?.id)"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="配偶">
          <el-select v-model="personForm.spouseId" placeholder="选择配偶" clearable filterable>
            <el-option
              v-for="p in availableSpouses"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="personForm.biography" type="textarea" :rows="4" placeholder="请输入简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="savePerson">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDeleteDialog" title="删除确认" width="500px">
      <p>确定要删除 <strong>{{ selectedPerson?.name }}</strong> 吗？</p>
      
      <el-alert
        v-if="hasChildren"
        type="warning"
        :closable="false"
        style="margin-top: 15px;"
      >
        <template #title>
          该人员有子女
        </template>
        <p>系统将自动把子女迁移到 <strong>祖父/祖母</strong> 节点下（如果存在）。</p>
        <p style="margin-top: 8px;">您也可以手动指定新的父节点：</p>
        <el-select
          v-model="newParentId"
          placeholder="点击选择新的父节点（可选）"
          clearable
          filterable
          style="width: 100%; margin-top: 10px;"
        >
          <el-option
            v-for="p in persons.filter(p => p.id !== selectedPerson?.id)"
            :key="p.id"
            :label="`${p.name} (${p.gender === 'male' ? '男' : '女'})`"
            :value="p.id"
          />
        </el-select>
      </el-alert>
      
      <el-alert
        v-else
        type="info"
        :closable="false"
        style="margin-top: 15px;"
      >
        该人员没有子女，将直接被删除。
      </el-alert>
      
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showEventDialog"
      :title="editingEvent ? '编辑事件' : '添加事件'"
      width="450px"
      @close="resetEventForm"
    >
      <el-form :model="eventForm" :rules="eventRules" ref="eventFormRef" label-width="80px">
        <el-form-item label="事件标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入事件标题" />
        </el-form-item>
        <el-form-item label="事件类型" prop="type">
          <el-select v-model="eventForm.type" style="width: 100%;">
            <el-option
              v-for="type in eventTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-input-number v-model="eventForm.year" :min="0" :max="9999" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="月份">
          <el-input-number v-model="eventForm.month" :min="1" :max="12" placeholder="可选" clearable />
        </el-form-item>
        <el-form-item label="日期">
          <el-input-number v-model="eventForm.day" :min="1" :max="31" placeholder="可选" clearable />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="eventForm.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入事件描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEventDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEvent">保存</el-button>
      </template>
    </el-dialog>

    <div class="timeline-container" :class="{ 'timeline-expanded': showTimeline }">
      <div class="timeline-header" @click="toggleTimeline">
        <el-icon><Time /></el-icon>
        <span style="margin-left: 8px;">家族时间线</span>
        <el-icon style="margin-left: auto; transition: transform 0.3s;" :style="{ transform: showTimeline ? 'rotate(180deg)' : 'rotate(0deg)' }">
          <ArrowUp />
        </el-icon>
      </div>
      <div v-if="showTimeline" class="timeline-content">
        <div v-if="timelineYearKeys.length === 0" class="timeline-empty">
          暂无事件记录
        </div>
        <div v-else class="timeline-scroll">
          <div
            v-for="year in timelineYearKeys"
            :key="year"
            class="timeline-year-group"
          >
            <div class="timeline-year-badge">{{ year }}</div>
            <div class="timeline-events">
              <div
                v-for="event in timelineEvents[year]"
                :key="event.id"
                class="timeline-event-item"
                @click="jumpToPerson(event.person?.id)"
              >
                <div class="timeline-event-dot"></div>
                <div class="timeline-event-content">
                  <div class="timeline-event-person">
                    <el-avatar
                      :size="24"
                      :src="event.person?.avatar"
                      :style="{ backgroundColor: event.person?.gender === 'female' ? '#f56c6c' : '#409eff' }"
                    >
                      {{ event.person?.name?.charAt(0) || '?' }}
                    </el-avatar>
                    <span style="margin-left: 8px; font-weight: 500;">{{ event.person?.name }}</span>
                  </div>
                  <div class="timeline-event-title">
                    <span class="event-type-mini" :class="'event-type-' + event.type">
                      {{ getEventTypeLabel(event.type) }}
                    </span>
                    {{ event.title }}
                  </div>
                  <div v-if="event.location" class="timeline-event-loc">
                    <el-icon><Location /></el-icon> {{ event.location }}
                  </div>
                  <div v-if="event.description" class="timeline-event-desc">
                    {{ event.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".ged"
      style="display: none;"
      @change="onFileChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Upload, Download, Calendar, Edit, Delete, Time, Location, ArrowUp } from '@element-plus/icons-vue'
import { treeApi, personApi, gedcomApi, fileApi, eventApi } from '../api'

const route = useRoute()
const chartRef = ref(null)
let chart = null

const treeData = ref(null)
const persons = ref([])
const selectedPerson = ref(null)
const detailDrawerVisible = ref(false)
const showAddDialog = ref(false)
const editingPerson = ref(null)
const showDeleteDialog = ref(false)
const newParentId = ref(null)
const fileInputRef = ref(null)
const personFormRef = ref(null)

const selectedPersonEvents = ref([])
const showEventDialog = ref(false)
const editingEvent = ref(null)
const showTimeline = ref(false)
const timelineEvents = ref({})
const eventFormRef = ref(null)

const eventTypes = [
  { label: '出生', value: 'birth' },
  { label: '结婚', value: 'marriage' },
  { label: '毕业', value: 'graduation' },
  { label: '工作', value: 'employment' },
  { label: '搬迁', value: 'move' },
  { label: '其他', value: 'other' }
]

const eventForm = ref({
  title: '',
  year: new Date().getFullYear(),
  month: null,
  day: null,
  type: 'other',
  description: '',
  location: '',
  personId: null
})

const eventRules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  year: [{ required: true, message: '请输入年份', trigger: 'blur' }]
}

const personForm = ref({
  name: '',
  gender: 'male',
  birthYear: null,
  deathYear: null,
  fatherId: null,
  motherId: null,
  spouseId: null,
  biography: '',
  avatar: null
})

const personRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }]
}

const malePersons = computed(() => persons.value.filter(p => p.gender === 'male'))
const femalePersons = computed(() => persons.value.filter(p => p.gender === 'female'))
const availableSpouses = computed(() => {
  const gender = personForm.value.gender
  return persons.value.filter(p => 
    p.gender !== gender && p.id !== editingPerson.value?.id
  )
})

const hasChildren = computed(() => {
  if (!selectedPerson.value || !treeData.value) return false
  const roots = treeData.value.roots || []
  return checkNodeHasChildren(roots, selectedPerson.value.id)
})

const checkNodeHasChildren = (nodes, targetId) => {
  if (!nodes || nodes.length === 0) return false
  for (const node of nodes) {
    if (node.id === targetId) {
      return node.children && node.children.length > 0
    }
    if (node.children && node.children.length > 0) {
      if (checkNodeHasChildren(node.children, targetId)) {
        return true
      }
    }
  }
  return false
}

const timelineYearKeys = computed(() => {
  if (!timelineEvents.value || Object.keys(timelineEvents.value).length === 0) return []
  return Object.keys(timelineEvents.value).map(k => parseInt(k)).sort((a, b) => a - b)
})

const familySpaceId = computed(() => route.params.id)

const loadTreeData = async () => {
  if (!familySpaceId.value) return
  try {
    const res = await treeApi.getTree(familySpaceId.value)
    treeData.value = res.data
    persons.value = res.data.persons || []
    renderChart()
    loadTimeline()
  } catch (e) {
    console.error('加载树数据失败', e)
  }
}

const loadTimeline = async () => {
  if (!familySpaceId.value) return
  try {
    const res = await eventApi.getTimeline(familySpaceId.value)
    timelineEvents.value = res.data || {}
  } catch (e) {
    console.error('加载时间线失败', e)
    timelineEvents.value = {}
  }
}

const loadPersonEvents = async () => {
  if (!familySpaceId.value || !selectedPerson.value) return
  try {
    const res = await eventApi.getByPerson(familySpaceId.value, selectedPerson.value.id)
    selectedPersonEvents.value = res.data || []
  } catch (e) {
    console.error('加载人员事件失败', e)
    selectedPersonEvents.value = []
  }
}

const renderChart = () => {
  if (!chartRef.value || !treeData.value) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
    chart.on('click', handleChartClick)
    
    window.addEventListener('resize', () => {
      chart?.resize()
    })
  }

  const roots = treeData.value.roots || []
  
  if (roots.length === 0) {
    chart.setOption({
      title: {
        text: '暂无数据，请添加人员',
        left: 'center',
        top: 'center',
        textStyle: { color: '#999' }
      },
      series: []
    })
    return
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const data = params.data
        let html = `<strong>${data.name}</strong>`
        if (data.gender) html += `<br/>性别：${data.gender === 'male' ? '男' : '女'}`
        if (data.birthYear) html += `<br/>出生：${data.birthYear}`
        if (data.deathYear) html += `<br/>逝世：${data.deathYear}`
        return html
      }
    },
    toolbox: {
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      feature: {
        zoom: { title: { zoomIn: '放大', zoomOut: '缩小' } },
        restore: { title: '重置' }
      }
    },
    series: roots.map((root, index) => ({
      type: 'tree',
      name: root.name,
      data: [root],
      top: '5%',
      left: `${8 + index * 45}%`,
      bottom: '5%',
      width: '40%',
      symbol: 'circle',
      symbolSize: 25,
      orient: 'TB',
      label: {
        position: 'bottom',
        verticalAlign: 'middle',
        align: 'center',
        fontSize: 12,
        color: '#333'
      },
      leaves: {
        label: {
          position: 'bottom',
          verticalAlign: 'middle',
          align: 'center'
        }
      },
      emphasis: {
        focus: 'descendant'
      },
      expandAndCollapse: true,
      animationDuration: 550,
      animationDurationUpdate: 750,
      itemStyle: {
        color: (params) => params.data.gender === 'female' ? '#f56c6c' : '#409eff'
      },
      lineStyle: {
        color: '#ccc',
        width: 1
      }
    }))
  }

  chart.setOption(option)
}

const handleChartClick = (params) => {
  if (params.data && params.data.id) {
    const person = persons.value.find(p => p.id === params.data.id)
    if (person) {
      selectedPerson.value = person
      detailDrawerVisible.value = true
      loadPersonEvents()
    }
  }
}

const refreshTree = async () => {
  if (!familySpaceId.value) return
  try {
    await treeApi.refreshTree(familySpaceId.value)
    await loadTreeData()
    ElMessage.success('刷新成功')
  } catch (e) {
    console.error('刷新失败', e)
  }
}

const editPerson = () => {
  editingPerson.value = selectedPerson.value
  personForm.value = {
    name: selectedPerson.value.name,
    gender: selectedPerson.value.gender,
    birthYear: selectedPerson.value.birthYear,
    deathYear: selectedPerson.value.deathYear,
    biography: selectedPerson.value.biography,
    avatar: selectedPerson.value.avatar,
    fatherId: null,
    motherId: null,
    spouseId: null
  }
  detailDrawerVisible.value = false
  showAddDialog.value = true
}

const showDeleteConfirm = () => {
  newParentId.value = null
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!familySpaceId.value || !selectedPerson.value) return
  try {
    await personApi.delete(familySpaceId.value, selectedPerson.value.id, newParentId.value)
    ElMessage.success('删除成功')
    showDeleteDialog.value = false
    detailDrawerVisible.value = false
    selectedPerson.value = null
    await loadTreeData()
  } catch (e) {
    console.error('删除失败', e)
  }
}

const handleAvatarChange = async (file) => {
  try {
    const res = await fileApi.uploadAvatar(file.raw)
    personForm.value.avatar = res.data
  } catch (e) {
    console.error('上传头像失败', e)
  }
}

const savePerson = async () => {
  await personFormRef.value.validate()
  try {
    if (editingPerson.value) {
      await personApi.update(familySpaceId.value, editingPerson.value.id, personForm.value)
      ElMessage.success('更新成功')
    } else {
      await personApi.create(familySpaceId.value, personForm.value)
      ElMessage.success('添加成功')
    }
    showAddDialog.value = false
    await loadTreeData()
  } catch (e) {
    console.error('保存失败', e)
  }
}

const resetForm = () => {
  editingPerson.value = null
  personForm.value = {
    name: '',
    gender: 'male',
    birthYear: null,
    deathYear: null,
    fatherId: null,
    motherId: null,
    spouseId: null,
    biography: '',
    avatar: null
  }
}

const handleImportGedcom = () => {
  fileInputRef.value?.click()
}

const onFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  try {
    await gedcomApi.import(familySpaceId.value, file)
    ElMessage.success('导入成功')
    await loadTreeData()
  } catch (e) {
    console.error('导入失败', e)
  }
  event.target.value = ''
}

const handleExportGedcom = async () => {
  try {
    const res = await gedcomApi.export(familySpaceId.value)
    const blob = new Blob([res], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `family_tree_${familySpaceId.value}.ged`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('导出失败', e)
  }
}

const getEventTypeLabel = (type) => {
  const t = eventTypes.find(et => et.value === type)
  return t ? t.label : '其他'
}

const formatEventDate = (event) => {
  let dateStr = event.year + '年'
  if (event.month) {
    dateStr += event.month + '月'
    if (event.day) {
      dateStr += event.day + '日'
    }
  }
  return dateStr
}

const toggleTimeline = () => {
  showTimeline.value = !showTimeline.value
}

const openAddEvent = () => {
  resetEventForm()
  eventForm.value.personId = selectedPerson.value?.id
  showEventDialog.value = true
}

const editEvent = (event) => {
  editingEvent.value = event
  eventForm.value = {
    id: event.id,
    title: event.title,
    year: event.year,
    month: event.month,
    day: event.day,
    type: event.type || 'other',
    description: event.description,
    location: event.location,
    personId: selectedPerson.value?.id
  }
  showEventDialog.value = true
}

const resetEventForm = () => {
  editingEvent.value = null
  eventForm.value = {
    title: '',
    year: new Date().getFullYear(),
    month: null,
    day: null,
    type: 'other',
    description: '',
    location: '',
    personId: selectedPerson.value?.id
  }
}

const saveEvent = async () => {
  await eventFormRef.value.validate()
  try {
    if (editingEvent.value) {
      await eventApi.update(familySpaceId.value, editingEvent.value.id, eventForm.value)
      ElMessage.success('更新成功')
    } else {
      await eventApi.create(familySpaceId.value, eventForm.value)
      ElMessage.success('添加成功')
    }
    showEventDialog.value = false
    await loadPersonEvents()
    await loadTimeline()
  } catch (e) {
    console.error('保存事件失败', e)
  }
}

const deleteEvent = async (eventId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个事件吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await eventApi.delete(familySpaceId.value, eventId)
    ElMessage.success('删除成功')
    await loadPersonEvents()
    await loadTimeline()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除事件失败', e)
    }
  }
}

const jumpToPerson = (personId) => {
  if (!personId) return
  const person = persons.value.find(p => p.id === personId)
  if (person) {
    selectedPerson.value = person
    detailDrawerVisible.value = true
    loadPersonEvents()
  }
}

watch(familySpaceId, () => {
  loadTreeData()
})

onMounted(() => {
  loadTreeData()
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<style scoped>
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}
.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

.event-list {
  margin-top: 10px;
}

.event-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  border-left: 3px solid #409eff;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.event-type {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  background: #409eff;
}

.event-type-birth { background: #67c23a; }
.event-type-marriage { background: #e6a23c; }
.event-type-graduation { background: #909399; }
.event-type-employment { background: #409eff; }
.event-type-move { background: #9b59b6; }
.event-type-other { background: #606266; }

.event-date {
  color: #909399;
  font-size: 12px;
}

.event-actions {
  margin-left: auto;
}

.event-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.event-desc {
  color: #606266;
  font-size: 13px;
  margin-bottom: 4px;
}

.event-loc {
  color: #909399;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-container {
  background: white;
  border-top: 1px solid #e4e7ed;
  transition: height 0.3s;
}

.timeline-container.timeline-expanded {
  height: 300px;
}

.timeline-header {
  height: 40px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  padding: 0 20px;
  cursor: pointer;
  color: #606266;
  font-weight: 500;
  border-bottom: 1px solid #e4e7ed;
}

.timeline-header:hover {
  background: #eef1f6;
}

.timeline-content {
  height: 260px;
  overflow: hidden;
}

.timeline-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.timeline-empty {
  text-align: center;
  padding: 50px;
  color: #909399;
}

.timeline-year-group {
  display: flex;
  margin-bottom: 20px;
}

.timeline-year-badge {
  width: 60px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 4px;
  padding: 4px 8px;
  text-align: center;
  font-weight: 600;
  align-self: flex-start;
}

.timeline-events {
  flex: 1;
  padding-left: 20px;
  border-left: 2px solid #e4e7ed;
  margin-left: 10px;
}

.timeline-event-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.timeline-event-item:hover {
  background: #f5f7fa;
}

.timeline-event-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #409eff;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #409eff;
  margin-right: 15px;
  margin-top: 8px;
  flex-shrink: 0;
  margin-left: -29px;
}

.timeline-event-content {
  flex: 1;
}

.timeline-event-person {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
  color: #606266;
}

.timeline-event-title {
  color: #303133;
  margin-bottom: 4px;
}

.event-type-mini {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: white;
  background: #409eff;
  margin-right: 6px;
}

.timeline-event-loc {
  color: #909399;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.timeline-event-desc {
  color: #606266;
  font-size: 12px;
}
</style>
