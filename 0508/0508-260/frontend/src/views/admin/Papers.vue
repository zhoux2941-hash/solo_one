<template>
    <div>
        <el-card>
            <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>试卷管理</span>
                    <div>
                        <el-button type="primary" size="small" @click="showAddDialog = true">创建试卷</el-button>
                        <el-button type="success" size="small" @click="showAutoDialog = true">自动组卷</el-button>
                    </div>
                </div>
            </template>
            <el-table :data="papers" stripe>
                <el-table-column prop="id" label="ID" width="80"></el-table-column>
                <el-table-column prop="name" label="试卷名称"></el-table-column>
                <el-table-column prop="totalScore" label="总分" width="100"></el-table-column>
                <el-table-column prop="duration" label="时长(分钟)" width="120"></el-table-column>
                <el-table-column label="题目数量" width="120">
                    <template #default="{ row }">
                        {{ row.questionIds?.length || 0 }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                        <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model="showAddDialog" title="创建试卷" width="700px">
            <el-form :model="paperForm" label-width="100px">
                <el-form-item label="试卷名称">
                    <el-input v-model="paperForm.name"></el-input>
                </el-form-item>
                <el-form-item label="考试时长">
                    <el-input-number v-model="paperForm.duration" :min="1"></el-input-number>
                    <span style="margin-left: 10px">分钟</span>
                </el-form-item>
                <el-form-item label="及格分数">
                    <el-input-number v-model="paperForm.passScore" :min="0"></el-input-number>
                </el-form-item>
                <el-form-item label="选择题目">
                    <el-checkbox-group v-model="paperForm.questionIds">
                        <el-row :gutter="10">
                            <el-col :span="24" v-for="q in questions" :key="q.id">
                                <el-checkbox :label="q.id" style="width: 100%; margin: 5px 0">
                                    [{{ getTypeLabel(q.type) }}] {{ q.content }} ({{ q.score }}分)
                                </el-checkbox>
                            </el-col>
                        </el-row>
                    </el-checkbox-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="handleCreate">创建</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="showAutoDialog" title="自动组卷" width="500px">
            <el-form :model="autoForm" label-width="120px">
                <el-form-item label="试卷名称">
                    <el-input v-model="autoForm.name"></el-input>
                </el-form-item>
                <el-form-item label="单选题数量">
                    <el-input-number v-model="autoForm.singleCount" :min="0"></el-input-number>
                </el-form-item>
                <el-form-item label="多选题数量">
                    <el-input-number v-model="autoForm.multipleCount" :min="0"></el-input-number>
                </el-form-item>
                <el-form-item label="判断题数量">
                    <el-input-number v-model="autoForm.tfCount" :min="0"></el-input-number>
                </el-form-item>
                <el-form-item label="简答题数量">
                    <el-input-number v-model="autoForm.shortAnswerCount" :min="0"></el-input-number>
                </el-form-item>
                <el-form-item label="考试时长">
                    <el-input-number v-model="autoForm.duration" :min="1"></el-input-number>
                    <span style="margin-left: 10px">分钟</span>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showAutoDialog = false">取消</el-button>
                <el-button type="primary" @click="handleAutoGenerate">生成</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPapers, createPaper, deletePaper, autoGeneratePaper, getQuestions } from '@/api'

const papers = ref([])
const questions = ref([])
const showAddDialog = ref(false)
const showAutoDialog = ref(false)

const paperForm = ref({
    name: '',
    duration: 60,
    passScore: 60,
    questionIds: []
})

const autoForm = ref({
    name: '自动组卷测试',
    singleCount: 2,
    multipleCount: 1,
    tfCount: 1,
    shortAnswerCount: 1,
    duration: 60
})

const getTypeLabel = (type) => {
    const map = {
        'SINGLE_CHOICE': '单选',
        'MULTIPLE_CHOICE': '多选',
        'TRUE_FALSE': '判断',
        'SHORT_ANSWER': '简答'
    }
    return map[type] || type
}

const loadPapers = async () => {
    try {
        papers.value = await getPapers() || []
    } catch (error) {
        console.error(error)
    }
}

const loadQuestions = async () => {
    try {
        questions.value = await getQuestions() || []
    } catch (error) {
        console.error(error)
    }
}

const handleCreate = async () => {
    try {
        await createPaper(paperForm.value)
        ElMessage.success('创建成功')
        showAddDialog.value = false
        loadPapers()
        paperForm.value = {
            name: '',
            duration: 60,
            passScore: 60,
            questionIds: []
        }
    } catch (error) {
        console.error(error)
    }
}

const handleAutoGenerate = async () => {
    try {
        await autoGeneratePaper(autoForm.value)
        ElMessage.success('生成成功')
        showAutoDialog.value = false
        loadPapers()
    } catch (error) {
        console.error(error)
    }
}

const handleDelete = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除该试卷吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
        await deletePaper(id)
        ElMessage.success('删除成功')
        loadPapers()
    } catch (error) {
        if (error !== 'cancel') {
            console.error(error)
        }
    }
}

onMounted(() => {
    loadPapers()
    loadQuestions()
})
</script>
