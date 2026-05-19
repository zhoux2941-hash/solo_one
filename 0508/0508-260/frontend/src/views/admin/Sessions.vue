<template>
    <div>
        <el-card>
            <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>考试场次管理</span>
                    <el-button type="primary" size="small" @click="showAddDialog = true">创建考试</el-button>
                </div>
            </template>
            <el-table :data="sessions" stripe>
                <el-table-column prop="id" label="ID" width="80"></el-table-column>
                <el-table-column prop="name" label="考试名称"></el-table-column>
                <el-table-column prop="examPaperId" label="试卷ID" width="100"></el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 'PENDING'" type="info">待开始</el-tag>
                        <el-tag v-else-if="row.status === 'IN_PROGRESS'" type="warning">进行中</el-tag>
                        <el-tag v-else type="success">已结束</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="{ row }">
                        <el-button size="small" @click="viewRanking(row.id)">查看排名</el-button>
                        <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model="showAddDialog" title="创建考试" width="500px">
            <el-form :model="sessionForm" label-width="100px">
                <el-form-item label="考试名称">
                    <el-input v-model="sessionForm.name"></el-input>
                </el-form-item>
                <el-form-item label="选择试卷">
                    <el-select v-model="sessionForm.examPaperId" style="width: 100%">
                        <el-option v-for="p in papers" :key="p.id" :label="p.name" :value="p.id"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="考试状态">
                    <el-select v-model="sessionForm.status" style="width: 100%">
                        <el-option label="待开始" value="PENDING"></el-option>
                        <el-option label="进行中" value="IN_PROGRESS"></el-option>
                        <el-option label="已结束" value="COMPLETED"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="handleCreate">创建</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="showRankingDialog" title="成绩排名" width="700px">
            <el-table :data="ranking" stripe>
                <el-table-column type="index" label="排名" width="80" align="center"></el-table-column>
                <el-table-column prop="userId" label="用户ID" width="100"></el-table-column>
                <el-table-column prop="score" label="得分" width="100"></el-table-column>
                <el-table-column prop="totalScore" label="总分" width="100"></el-table-column>
                <el-table-column prop="passed" label="是否通过" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.passed ? 'success' : 'danger'">
                            {{ row.passed ? '是' : '否' }}
                        </el-tag>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSessions, createSession, deleteSession, getPapers, getRanking } from '@/api'

const sessions = ref([])
const papers = ref([])
const ranking = ref([])
const showAddDialog = ref(false)
const showRankingDialog = ref(false)

const sessionForm = ref({
    name: '',
    examPaperId: null,
    status: 'PENDING'
})

const loadSessions = async () => {
    try {
        sessions.value = await getSessions() || []
    } catch (error) {
        console.error(error)
    }
}

const loadPapers = async () => {
    try {
        papers.value = await getPapers() || []
    } catch (error) {
        console.error(error)
    }
}

const handleCreate = async () => {
    try {
        await createSession(sessionForm.value)
        ElMessage.success('创建成功')
        showAddDialog.value = false
        loadSessions()
        sessionForm.value = {
            name: '',
            examPaperId: null,
            status: 'PENDING'
        }
    } catch (error) {
        console.error(error)
    }
}

const handleDelete = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除该考试吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
        await deleteSession(id)
        ElMessage.success('删除成功')
        loadSessions()
    } catch (error) {
        if (error !== 'cancel') {
            console.error(error)
        }
    }
}

const viewRanking = async (sessionId) => {
    try {
        ranking.value = await getRanking(sessionId) || []
        showRankingDialog.value = true
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    loadSessions()
    loadPapers()
})
</script>
