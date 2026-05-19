<template>
    <div>
        <el-card>
            <template #header>
                <span>我的考试</span>
            </template>
            <el-table :data="sessions" stripe>
                <el-table-column prop="id" label="考试ID" width="100"></el-table-column>
                <el-table-column prop="name" label="考试名称"></el-table-column>
                <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 'PENDING'" type="info">待开始</el-tag>
                        <el-tag v-else-if="row.status === 'IN_PROGRESS'" type="warning">进行中</el-tag>
                        <el-tag v-else type="success">已结束</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="{ row }">
                        <el-button 
                            v-if="row.status === 'IN_PROGRESS'" 
                            type="primary" 
                            size="small" 
                            @click="startExam(row.id)"
                        >
                            进入考试
                        </el-button>
                        <el-button 
                            v-else-if="row.status === 'COMPLETED'" 
                            size="small" 
                            @click="viewRecord(row.id)"
                        >
                            查看成绩
                        </el-button>
                        <el-tag v-else type="info" size="small">未开始</el-tag>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSessions, startExam, getSessionRecords } from '@/api'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const sessions = ref([])
const userRecords = ref([])

const loadSessions = async () => {
    try {
        sessions.value = await getSessions() || []
        const records = await getSessionRecords(sessions.value[0]?.id) || []
        userRecords.value = records
    } catch (error) {
        console.error(error)
    }
}

const startExam = async (sessionId) => {
    try {
        const record = await startExam({
            userId: userStore.user.id,
            examSessionId: sessionId
        })
        ElMessage.success('进入考试')
        router.push(`/exam/${record.id}`)
    } catch (error) {
        console.error(error)
    }
}

const viewRecord = async (sessionId) => {
    try {
        const records = await getSessionRecords(sessionId)
        const myRecord = records.find(r => r.userId === userStore.user.id)
        if (myRecord) {
            router.push(`/review/${myRecord.id}`)
        } else {
            ElMessage.warning('暂无考试记录')
        }
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    loadSessions()
})
</script>
