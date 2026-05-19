<template>
    <div>
        <el-card>
            <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>题库管理</span>
                    <div>
                        <el-button type="primary" size="small" @click="showAddDialog = true">添加题目</el-button>
                        <el-button type="success" size="small" @click="showBatchDialog = true">批量导入</el-button>
                    </div>
                </div>
            </template>
            <el-table :data="questions" stripe>
                <el-table-column prop="id" label="ID" width="80"></el-table-column>
                <el-table-column prop="type" label="类型" width="120">
                    <template #default="{ row }">
                        <el-tag v-if="row.type === 'SINGLE_CHOICE'" type="primary">单选</el-tag>
                        <el-tag v-else-if="row.type === 'MULTIPLE_CHOICE'" type="success">多选</el-tag>
                        <el-tag v-else-if="row.type === 'TRUE_FALSE'" type="warning">判断</el-tag>
                        <el-tag v-else type="info">简答</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="content" label="题目内容" show-overflow-tooltip></el-table-column>
                <el-table-column prop="score" label="分值" width="80"></el-table-column>
                <el-table-column prop="category" label="分类" width="120"></el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                        <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model="showAddDialog" title="添加题目" width="600px">
            <el-form :model="questionForm" label-width="80px">
                <el-form-item label="题目类型">
                    <el-select v-model="questionForm.type" style="width: 100%">
                        <el-option label="单选题" value="SINGLE_CHOICE"></el-option>
                        <el-option label="多选题" value="MULTIPLE_CHOICE"></el-option>
                        <el-option label="判断题" value="TRUE_FALSE"></el-option>
                        <el-option label="简答题" value="SHORT_ANSWER"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="题目内容">
                    <el-input type="textarea" v-model="questionForm.content" rows="3"></el-input>
                </el-form-item>
                <el-form-item v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionForm.type)" label="选项A">
                    <el-input v-model="questionForm.optionA"></el-input>
                </el-form-item>
                <el-form-item v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionForm.type)" label="选项B">
                    <el-input v-model="questionForm.optionB"></el-input>
                </el-form-item>
                <el-form-item v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionForm.type)" label="选项C">
                    <el-input v-model="questionForm.optionC"></el-input>
                </el-form-item>
                <el-form-item v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionForm.type)" label="选项D">
                    <el-input v-model="questionForm.optionD"></el-input>
                </el-form-item>
                <el-form-item label="正确答案">
                    <el-input v-model="questionForm.answer"></el-input>
                    <div v-if="questionForm.type === 'TRUE_FALSE'" style="color: #999; font-size: 12px; margin-top: 5px">
                        判断题请填 true 或 false
                    </div>
                </el-form-item>
                <el-form-item label="分值">
                    <el-input-number v-model="questionForm.score" :min="1"></el-input-number>
                </el-form-item>
                <el-form-item label="分类">
                    <el-input v-model="questionForm.category"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="handleAdd">确定</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="showBatchDialog" title="批量导入" width="600px">
            <el-alert type="info" :closable="false" style="margin-bottom: 15px">
                <p>将创建5道示例题目：2单选、1多选、1判断、1简答</p>
                <p style="color: #666; font-size: 12px; margin-top: 5px">系统会自动检测并剔除重复题目（基于题目内容去重）</p>
            </el-alert>
            <el-table :data="previewQuestions" size="small" border style="width: 100%">
                <el-table-column prop="type" label="类型" width="80">
                    <template #default="{ row }">
                        <el-tag v-if="row.type === 'SINGLE_CHOICE'" type="primary" size="small">单选</el-tag>
                        <el-tag v-else-if="row.type === 'MULTIPLE_CHOICE'" type="success" size="small">多选</el-tag>
                        <el-tag v-else-if="row.type === 'TRUE_FALSE'" type="warning" size="small">判断</el-tag>
                        <el-tag v-else type="info" size="small">简答</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="content" label="题目内容" show-overflow-tooltip></el-table-column>
                <el-table-column prop="score" label="分值" width="60"></el-table-column>
            </el-table>
            <template #footer>
                <el-button @click="showBatchDialog = false">取消</el-button>
                <el-button type="primary" @click="handleBatchImport">确认导入</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQuestions, createQuestion, deleteQuestion, batchCreateQuestions } from '@/api'

const questions = ref([])
const showAddDialog = ref(false)
const showBatchDialog = ref(false)

const previewQuestions = [
    { type: 'SINGLE_CHOICE', content: 'Java中哪个关键字用于继承？', score: 10 },
    { type: 'SINGLE_CHOICE', content: 'Spring Boot默认端口是？', score: 10 },
    { type: 'MULTIPLE_CHOICE', content: '以下哪些是Java基本数据类型？', score: 15 },
    { type: 'TRUE_FALSE', content: 'Java中String是不可变的', score: 5 },
    { type: 'SHORT_ANSWER', content: '简述什么是面向对象编程？', score: 20 }
]

const questionForm = ref({
    type: 'SINGLE_CHOICE',
    content: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    answer: '',
    score: 10,
    category: '默认'
})

const loadQuestions = async () => {
    try {
        questions.value = await getQuestions() || []
    } catch (error) {
        console.error(error)
    }
}

const handleAdd = async () => {
    try {
        const duplicate = questions.value.find(q => q.content === questionForm.value.content)
        if (duplicate) {
            ElMessage.warning('该题目已存在，请勿重复添加')
            return
        }
        await createQuestion(questionForm.value)
        ElMessage.success('添加成功')
        showAddDialog.value = false
        loadQuestions()
        questionForm.value = {
            type: 'SINGLE_CHOICE',
            content: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            answer: '',
            score: 10,
            category: '默认'
        }
    } catch (error) {
        console.error(error)
    }
}

const handleDelete = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除该题目吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
        await deleteQuestion(id)
        ElMessage.success('删除成功')
        loadQuestions()
    } catch (error) {
        if (error !== 'cancel') {
            console.error(error)
        }
    }
}

const handleBatchImport = async () => {
    const sampleQuestions = [
        { type: 'SINGLE_CHOICE', content: 'Java中哪个关键字用于继承？', optionA: 'extends', optionB: 'implements', optionC: 'inherit', optionD: 'super', answer: 'A', score: 10, category: 'Java' },
        { type: 'SINGLE_CHOICE', content: 'Spring Boot默认端口是？', optionA: '8080', optionB: '8081', optionC: '3000', optionD: '3306', answer: 'A', score: 10, category: 'Spring' },
        { type: 'MULTIPLE_CHOICE', content: '以下哪些是Java基本数据类型？', optionA: 'int', optionB: 'String', optionC: 'boolean', optionD: 'Integer', answer: 'AC', score: 15, category: 'Java' },
        { type: 'TRUE_FALSE', content: 'Java中String是不可变的', optionA: '', optionB: '', optionC: '', optionD: '', answer: 'true', score: 5, category: 'Java' },
        { type: 'SHORT_ANSWER', content: '简述什么是面向对象编程？', optionA: '', optionB: '', optionC: '', optionD: '', answer: '封装、继承、多态', score: 20, category: '基础' }
    ]
    try {
        const result = await batchCreateQuestions(sampleQuestions)
        let message = `批量导入完成，共 ${result.totalCount} 题`
        if (result.duplicateCount > 0) {
            message += `，已自动剔除 ${result.duplicateCount} 道重复题目`
            ElMessage.warning(message)
            if (result.duplicateTitles && result.duplicateTitles.length > 0) {
                console.log('重复题目：', result.duplicateTitles)
            }
        } else {
            message += `，全部导入成功`
            ElMessage.success(message)
        }
        showBatchDialog.value = false
        loadQuestions()
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    loadQuestions()
})
</script>
