<template>
    <div>
        <el-card>
            <template #header>
                <span>成绩查询</span>
            </template>
            <el-table :data="allRecords" stripe>
                <el-table-column prop="id" label="记录ID" width="100"></el-table-column>
                <el-table-column prop="userId" label="用户ID" width="100"></el-table-column>
                <el-table-column prop="examSessionId" label="考试ID" width="100"></el-table-column>
                <el-table-column prop="score" label="得分" width="100"></el-table-column>
                <el-table-column prop="totalScore" label="总分" width="100"></el-table-column>
                <el-table-column prop="passed" label="是否通过" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.passed ? 'success' : 'danger'">
                            {{ row.passed ? '是' : '否' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 'IN_PROGRESS'" type="warning">进行中</el-tag>
                        <el-tag v-else-if="row.status === 'SUBMITTED'" type="info">已提交</el-tag>
                        <el-tag v-else type="success">已评分</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                        <el-button size="small" @click="viewRecord(row.id)" v-if="row.status !== 'IN_PROGRESS'">查看</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSessions, getSessionRecords, getRecord } from '@/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const allRecords = ref([])

const loadAllRecords = async () => {
    try {
        const sessions = await getSessions() || []
        const recordsPromises = sessions.map(s => getSessionRecords(s.id))
        const recordsArrays = await Promise.all(recordsPromises)
        allRecords.value = recordsArrays.flat().filter(r => r)
    } catch (error) {
        console.error(error)
    }
}

const viewRecord = (recordId) => {
    router.push(`/review/${recordId}`)
}

onMounted(() => {
    loadAllRecords()
})
</script>
