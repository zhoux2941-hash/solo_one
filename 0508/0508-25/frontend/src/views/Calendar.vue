<template>
  <div class="page-container">
    <div class="page-title">📅 可预约日历</div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-select v-model="selectedRoom" placeholder="选择房间" style="width: 100%" @change="loadOccupancy">
          <el-option
            v-for="room in rooms"
            :key="room.roomId"
            :label="room.name"
            :value="room.roomId"
          />
        </el-select>
      </el-col>
      <el-col :span="8">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择月份"
          style="width: 100%"
          @change="loadOccupancy"
        />
      </el-col>
    </el-row>

    <el-card class="card-shadow" v-if="selectedRoom">
      <el-calendar v-model="currentDate">
        <template #date-cell="{ data }">
          <div :class="getCellClass(data)">
            <span class="day-number">{{ data.day.split('-').slice(2)[0] }}</span>
            <div v-if="isDateInMonth(data)" class="day-status">
              <el-tag v-if="isDateOccupied(data)" type="danger" size="small" effect="light">已占用</el-tag>
              <el-tag v-else type="success" size="small" effect="light">可预约</el-tag>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <el-card class="card-shadow mt-20" v-if="selectedRoom && selectedRoomInfo">
      <div slot="header">
        <span>房间信息</span>
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="房间名称">{{ selectedRoomInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="房型">{{ roomTypeMap[selectedRoomInfo.roomType] || selectedRoomInfo.roomType }}</el-descriptions-item>
        <el-descriptions-item label="价格">{{ selectedRoomInfo.pricePerDay }} 元/天</el-descriptions-item>
        <el-descriptions-item label="容量">{{ selectedRoomInfo.capacity }} 只</el-descriptions-item>
        <el-descriptions-item label="适合宠物">{{ selectedRoomInfo.suitableForPetType || '不限' }}</el-descriptions-item>
        <el-descriptions-item label="最大体型">{{ sizeMap[selectedRoomInfo.maxSize] || '不限' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ selectedRoomInfo.description }}</el-descriptions-item>
        <el-descriptions-item label="特色" :span="2">{{ selectedRoomInfo.specialFeatures || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-dialog v-model="bookingDialogVisible" title="创建预约" width="600px">
      <el-form :model="bookingForm" label-width="100px">
        <el-form-item label="选择宠物">
          <el-select v-model="bookingForm.petId" placeholder="请选择宠物" style="width: 100%">
            <el-option
              v-for="pet in pets"
              :key="pet.petId"
              :label="`${pet.name} (${pet.type === 'DOG' ? '狗' : '猫'} - ${sizeMap[pet.size]})`"
              :value="pet.petId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入住日期">
          <el-date-picker
            v-model="bookingForm.startDate"
            type="date"
            placeholder="选择入住日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="离开日期">
          <el-date-picker
            v-model="bookingForm.endDate"
            type="date"
            placeholder="选择离开日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="特殊要求">
          <el-input
            v-model="bookingForm.specialRequirements"
            type="textarea"
            :rows="3"
            placeholder="请输入特殊要求"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bookingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createBooking" :loading="creatingBooking">确认预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { centerApi, bookingApi, petApi } from '@/api'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const rooms = ref([])
const pets = ref([])
const selectedRoom = ref(null)
const selectedMonth = ref(new Date())
const currentDate = ref(new Date())
const occupancy = ref([])
const bookingDialogVisible = ref(false)
const creatingBooking = ref(false)

const bookingForm = ref({
  petId: null,
  roomId: null,
  startDate: null,
  endDate: null,
  specialRequirements: ''
})

const roomTypeMap = {
  SMALL_DOG_ROOM: '小型犬房',
  MEDIUM_DOG_ROOM: '中型犬房',
  LARGE_DOG_ROOM: '大型犬房',
  CAT_CAVE: '猫咪城堡',
  CAT_LOFT: '猫咪阁楼',
  DELUXE_CAT_ROOM: '豪华猫房',
  SMALL_PET_SUITE: '小型宠物套房'
}

const sizeMap = {
  SMALL: '小型',
  MEDIUM: '中型',
  LARGE: '大型'
}

const selectedRoomInfo = computed(() => {
  return rooms.value.find(r => r.roomId === selectedRoom.value)
})

const isDateInMonth = (data) => {
  const date = dayjs(data.day)
  const selected = dayjs(selectedMonth.value)
  return date.month() === selected.month() && date.year() === selected.year()
}

const isDateOccupied = (data) => {
  if (!isDateInMonth(data)) return false
  
  const day = parseInt(data.day.split('-')[2]) - 1
  return occupancy.value[day] === true
}

const getCellClass = (data) => {
  const classes = ['calendar-cell']
  if (!isDateInMonth(data)) {
    classes.push('other-month')
  }
  if (isDateOccupied(data)) {
    classes.push('occupied')
  }
  return classes
}

const loadRooms = async () => {
  try {
    rooms.value = await centerApi.getAllRooms()
    if (rooms.value.length > 0 && !selectedRoom.value) {
      selectedRoom.value = rooms.value[0].roomId
    }
  } catch (e) {
    console.error(e)
  }
}

const loadPets = async () => {
  try {
    pets.value = await petApi.getByOwner(appStore.currentOwnerId)
  } catch (e) {
    console.error(e)
  }
}

const loadOccupancy = async () => {
  if (!selectedRoom.value) return
  
  try {
    const year = dayjs(selectedMonth.value).year()
    const month = dayjs(selectedMonth.value).month() + 1
    occupancy.value = await centerApi.getRoomOccupancy(selectedRoom.value, year, month)
  } catch (e) {
    console.error(e)
  }
}

watch(selectedMonth, () => {
  currentDate.value = new Date(selectedMonth.value)
})

const createBooking = async () => {
  if (!bookingForm.value.petId) {
    ElMessage.warning('请选择宠物')
    return
  }
  if (!bookingForm.value.startDate || !bookingForm.value.endDate) {
    ElMessage.warning('请选择日期范围')
    return
  }
  
  creatingBooking.value = true
  try {
    await bookingApi.create({
      petId: bookingForm.value.petId,
      roomId: selectedRoom.value,
      startDate: dayjs(bookingForm.value.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(bookingForm.value.endDate).format('YYYY-MM-DD'),
      specialRequirements: bookingForm.value.specialRequirements
    })
    
    ElMessage.success('预约创建成功')
    bookingDialogVisible.value = false
    loadOccupancy()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '创建预约失败')
  } finally {
    creatingBooking.value = false
  }
}

onMounted(() => {
  loadRooms()
  loadPets()
})
</script>

<style scoped>
.calendar-cell {
  height: 80px;
  padding: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.calendar-cell:hover {
  background-color: #ecf5ff;
}

.calendar-cell.other-month {
  opacity: 0.5;
}

.day-number {
  font-weight: 600;
  display: block;
  margin-bottom: 5px;
}

.day-status {
  margin-top: 5px;
}
</style>
