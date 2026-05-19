<template>
    <div class="review-page">
        <div class="review-header">
            <h3>考试成绩</h3>
            <div class="score-info">
                <span>得分：<strong>{{ record?.score || 0 }}</strong> / {{ record?.totalScore || 0 }}</span>
                <el-tag :type="record?.passed ? 'success' : 'danger'">
                    {{ record?.passed ? '通过' : '未通过' }}
                </el-tag>
            </div>
            <el-button @click="goBack">返回</el-button>
        </div>

        <div class="review-body">
            <div v-for="(question, index) in questions" :key="question.id" class="question-item">
                <div class="question-header">
                    <el-tag :type="isCorrect(question.id) ? 'success' : 'danger'" size="small">
                        {{ isCorrect(question.id) ? '正确' : '错误' }}
                    </el-tag>
                    <span class="q-type">{{ getTypeLabel(question.type) }}</span>
                    <span class="q-num">第 {{ index + 1 }} 题</span>
                    <span class="q-score">（{{ question.score }}分）</span>
                </div>
                <div class="question-content">
                    <p><strong>题目：</strong>{{ question.content }}</p>
                    
                    <div v-if="question.type !== 'SHORT_ANSWER'" class="options">
                        <div v-if="question.optionA" class="option">A. {{ question.optionA }}</div>
                        <div v-if="question.optionB" class="option">B. {{ question.optionB }}</div>
                        <div v-if="question.optionC" class="option">C. {{ question.optionC }}</div>
                        <div v-if="question.optionD" class="option">D. {{ question.optionD }}</div>
                    </div>
                    
                    <div class="answer-info">
                        <p class="my-answer">
                            <strong>你的答案：</strong>
                            <span :class="{ 'wrong': !isCorrect(question.id) }">
                                {{ getUserAnswer(question.id) || '未作答' }}
                            </span>
                        </p>
                        <p class="correct-answer">
                            <strong>正确答案：</strong>
                            <span class="correct">{{ question.answer }}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRecord, getPaperQuestions, getAnswers } from '@/api'

const route = useRoute()
const router = useRouter()
const recordId = route.params.recordId

const record = ref(null)
const questions = ref([])
const userAnswers = ref({})

const getTypeLabel = (type) => {
    const map = {
        'SINGLE_CHOICE': '单选题',
        'MULTIPLE_CHOICE': '多选题',
        'TRUE_FALSE': '判断题',
        'SHORT_ANSWER': '简答题'
    }
    return map[type] || type
}

const getUserAnswer = (questionId) => {
    return userAnswers.value[questionId] || ''
}

const isCorrect = (questionId) => {
    const question = questions.value.find(q => q.id === questionId)
    const userAnswer = getUserAnswer(questionId)
    return question && question.answer && question.answer.toUpperCase() === userAnswer.toUpperCase()
}

const loadData = async () => {
    try {
        record.value = await getRecord(recordId)
        if (record.value && record.value.examPaperId) {
            questions.value = await getPaperQuestions(record.value.examPaperId) || []
        }
        const answers = await getAnswers(recordId) || []
        answers.forEach(a => {
            userAnswers.value[a.questionId] = a.answer
        })
    } catch (error) {
        console.error(error)
    }
}

const goBack = () => {
    router.back()
}

onMounted(() => {
    loadData()
})
</script>

<style scoped>
.review-page {
    width: 100%;
    min-height: 100vh;
    background: #f5f7fa;
    padding: 20px;
}

.review-header {
    background: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.score-info {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 18px;
}

.score-info strong {
    color: #f56c6c;
    font-size: 24px;
}

.review-body {
    background: white;
    border-radius: 8px;
    padding: 30px;
}

.question-item {
    margin-bottom: 30px;
    padding-bottom: 30px;
    border-bottom: 1px solid #eee;
}

.question-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.question-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.q-type {
    background: #ecf5ff;
    color: #409eff;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
}

.q-num {
    font-weight: bold;
    color: #333;
}

.q-score {
    color: #999;
}

.question-content p {
    line-height: 1.8;
    margin-bottom: 15px;
}

.options {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 15px;
}

.option {
    padding: 8px 0;
}

.answer-info {
    background: #f0f9eb;
    padding: 15px;
    border-radius: 5px;
}

.answer-info p {
    margin: 10px 0;
}

.wrong {
    color: #f56c6c;
    font-weight: bold;
}

.correct {
    color: #67c23a;
    font-weight: bold;
}
</style>
