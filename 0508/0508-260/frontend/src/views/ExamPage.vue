<template>
    <div class="exam-page" :class="{ 'fullscreen': isFullscreen }" @contextmenu.prevent>
        <div class="exam-header">
            <div class="header-left">
                <h3>在线考试</h3>
                <el-tag v-if="!isOnline" type="danger" style="margin-left: 15px">
                    <el-icon style="margin-right: 5px"><Connection /></el-icon>
                    网络已断开
                </el-tag>
                <el-tag v-else type="success" style="margin-left: 15px">
                    <el-icon style="margin-right: 5px"><SuccessFilled /></el-icon>
                    在线
                </el-tag>
                <el-tag type="warning" style="margin-left: 15px">
                    <el-icon style="margin-right: 5px"><Warning /></el-icon>
                    切屏次数：{{ switchCount }} / 3
                </el-tag>
            </div>
            <div class="header-center">
                <div class="countdown">
                    <el-icon><Timer /></el-icon>
                    <span>{{ formatTime(remainingTime) }}</span>
                    <el-tag type="warning" v-if="remainingTime < 300" style="margin-left: 10px">即将结束</el-tag>
                </div>
            </div>
            <div class="header-right">
                <el-button size="small" @click="restoreAnswers">恢复答案</el-button>
                <el-button type="primary" @click="submitExam" :loading="submitting">提交试卷</el-button>
            </div>
        </div>

        <div class="exam-body" v-if="isExamReady">
            <div class="question-list">
                <div 
                    v-for="(question, index) in questions" 
                    :key="question.id" 
                    class="question-item"
                    :class="{ 'active': currentIndex === index, 'answered': isAnswered(question.id) }"
                    @click="currentIndex = index"
                >
                    <span>{{ index + 1 }}</span>
                </div>
            </div>
            <div class="question-content">
                <div v-if="questions.length > 0" class="question-detail">
                    <div class="question-header">
                        <el-tag>{{ getTypeLabel(currentQuestion.type) }}</el-tag>
                        <span>（{{ currentQuestion.score }}分）</span>
                        <span class="question-num">第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
                    </div>
                    <div class="question-text">
                        {{ currentQuestion.content }}
                    </div>

                    <div v-if="currentQuestion.type === 'SINGLE_CHOICE'" class="options">
                        <el-radio v-model="answers[currentQuestion.id]" label="A">A. {{ currentQuestion.optionA }}</el-radio>
                        <el-radio v-model="answers[currentQuestion.id]" label="B">B. {{ currentQuestion.optionB }}</el-radio>
                        <el-radio v-model="answers[currentQuestion.id]" label="C">C. {{ currentQuestion.optionC }}</el-radio>
                        <el-radio v-model="answers[currentQuestion.id]" label="D">D. {{ currentQuestion.optionD }}</el-radio>
                    </div>

                    <div v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'" class="options">
                        <el-checkbox v-model="multiAnswers[currentQuestion.id]" label="A">A. {{ currentQuestion.optionA }}</el-checkbox>
                        <el-checkbox v-model="multiAnswers[currentQuestion.id]" label="B">B. {{ currentQuestion.optionB }}</el-checkbox>
                        <el-checkbox v-model="multiAnswers[currentQuestion.id]" label="C">C. {{ currentQuestion.optionC }}</el-checkbox>
                        <el-checkbox v-model="multiAnswers[currentQuestion.id]" label="D">D. {{ currentQuestion.optionD }}</el-checkbox>
                    </div>

                    <div v-else-if="currentQuestion.type === 'TRUE_FALSE'" class="options">
                        <el-radio v-model="answers[currentQuestion.id]" label="true">正确</el-radio>
                        <el-radio v-model="answers[currentQuestion.id]" label="false">错误</el-radio>
                    </div>

                    <div v-else-if="currentQuestion.type === 'SHORT_ANSWER'" class="options">
                        <el-input 
                            type="textarea" 
                            v-model="answers[currentQuestion.id]" 
                            :rows="6"
                            placeholder="请输入答案"
                        ></el-input>
                    </div>

                    <div class="question-nav">
                        <el-button :disabled="currentIndex === 0" @click="currentIndex--">上一题</el-button>
                        <el-button :disabled="currentIndex === questions.length - 1" @click="currentIndex++">下一题</el-button>
                    </div>
                </div>
            </div>
        </div>

        <div class="exam-waiting" v-if="!isExamReady">
            <el-icon size="80" color="#409eff"><Reading /></el-icon>
            <h3>请仔细阅读考试规则后开始考试</h3>
            <p>考试将自动进入全屏模式，请勿切换窗口</p>
        </div>

        <el-dialog v-model="showSubmitDialog" title="确认提交" width="400px">
            <p>已答：{{ answeredCount }} / {{ questions.length }} 题</p>
            <p v-if="answeredCount < questions.length" style="color: #f56c6c">还有题目未作答，确定提交？</p>
            <template #footer>
                <el-button @click="showSubmitDialog = false">取消</el-button>
                <el-button type="primary" @click="confirmSubmit">确认提交</el-button>
            </template>
        </el-dialog>

        <el-dialog 
            v-model="showRuleDialog" 
            title="考试规则须知" 
            width="600px"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :show-close="false"
        >
            <div style="padding: 10px 0">
                <el-alert 
                    title="考试纪律" 
                    type="warning" 
                    :closable="false"
                    style="margin-bottom: 20px"
                >
                    <ul style="margin-top: 10px; line-height: 2">
                        <li>考试全程将自动记录切屏次数，<strong>切屏超过3次将被强制交卷</strong></li>
                        <li>考试期间禁止复制、剪切、粘贴操作</li>
                        <li>考试期间禁止右键菜单、F12开发者工具、查看源代码等操作</li>
                        <li>考试将自动进入全屏模式，请保持浏览器窗口全屏</li>
                        <li>答题内容将自动实时保存，网络断开后恢复时会自动同步</li>
                        <li>考试时间结束后系统将自动交卷，请合理安排答题时间</li>
                    </ul>
                </el-alert>
                <div style="text-align: center; margin-top: 20px">
                    <el-checkbox v-model="agreedRules">
                        我已阅读并同意以上考试规则，承诺诚信应考
                    </el-checkbox>
                </div>
            </div>
            <template #footer>
                <el-button type="primary" :disabled="!agreedRules" @click="startExam">
                    我已阅读，开始考试
                </el-button>
            </template>
        </el-dialog>

        <el-dialog 
            v-model="showWarningDialog" 
            title="系统警告" 
            width="500px"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :show-close="false"
        >
            <div style="text-align: center; padding: 20px 0">
                <el-icon size="60" color="#f56c6c" style="margin-bottom: 20px">
                    <Warning />
                </el-icon>
                <p style="color: #f56c6c; font-size: 20px; font-weight: bold; margin-bottom: 15px">
                    检测到切屏行为！
                </p>
                <p style="font-size: 16px; margin-bottom: 10px">
                    当前切屏次数：<span style="color: #f56c6c; font-weight: bold; font-size: 24px">{{ switchCount }}</span> / 3 次
                </p>
                <p v-if="switchCount >= 3" style="color: #f56c6c; margin-top: 15px">
                    已达到最大切屏次数，即将强制交卷！
                </p>
                <p v-else style="color: #666; margin-top: 15px">
                    超过3次切屏将被系统强制交卷并判定为作弊
                </p>
            </div>
            <template #footer>
                <el-button type="primary" @click="showWarningDialog = false">
                    我知道了，继续答题
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPaperQuestions, saveAnswer, submitExam, getRecord, getAnswers, getPapers } from '@/api'
import { Timer, Connection, SuccessFilled, Warning, Reading } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const recordId = route.params.recordId

const questions = ref([])
const currentIndex = ref(0)
const answers = ref({})
const multiAnswers = ref({})
const remainingTime = ref(3600)
const submitting = ref(false)
const showSubmitDialog = ref(false)
const showWarningDialog = ref(false)
const switchCount = ref(0)
const isFullscreen = ref(false)
const isOnline = ref(navigator.onLine)
const startTime = ref(Date.now())
const totalDuration = ref(3600)
let timer = null
let saveTimer = null

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})
const answeredCount = computed(() => {
    let count = 0
    questions.value.forEach(q => {
        if (answers.value[q.id] || (multiAnswers.value[q.id] && multiAnswers.value[q.id].length > 0)) {
            count++
        }
    })
    return count
})

const remainingTime = computed(() => {
    const elapsed = Math.floor((Date.now() - startTime.value) / 1000)
    const remaining = totalDuration.value - elapsed
    return Math.max(0, remaining)
})

const getTypeLabel = (type) => {
    const map = {
        'SINGLE_CHOICE': '单选题',
        'MULTIPLE_CHOICE': '多选题',
        'TRUE_FALSE': '判断题',
        'SHORT_ANSWER': '简答题'
    }
    return map[type] || type
}

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const isAnswered = (questionId) => {
    return !!answers.value[questionId] || (multiAnswers.value[questionId] && multiAnswers.value[questionId].length > 0)
}

const showRuleDialog = ref(false)
const isExamReady = ref(false)
const agreedRules = ref(false)

const loadExam = async () => {
    try {
        const record = await getRecord(recordId)
        if (record && record.status !== 'IN_PROGRESS') {
            ElMessage.warning('该考试已完成')
            router.push('/examinee/records')
            return
        }
        
        if (record && record.examPaperId) {
            questions.value = await getPaperQuestions(record.examPaperId) || []
            
            const papers = await getPapers()
            const paper = papers?.find(p => p.id === record.examPaperId)
            if (paper && paper.duration) {
                totalDuration.value = paper.duration * 60
            }
            
            if (record.startTime) {
                startTime.value = new Date(record.startTime).getTime()
            } else {
                startTime.value = Date.now()
            }
            
            const savedAnswers = await getAnswers(recordId) || []
            savedAnswers.forEach(ans => {
                const question = questions.value.find(q => q.id === ans.questionId)
                if (question) {
                    if (question.type === 'MULTIPLE_CHOICE') {
                        multiAnswers.value[ans.questionId] = ans.answer ? ans.answer.split('') : []
                    } else {
                        answers.value[ans.questionId] = ans.answer || ''
                    }
                }
            })
            
            if (savedAnswers.length > 0) {
                isExamReady.value = true
                startTimer()
                startAutoSave()
                enterFullscreen()
                ElMessage.success(`已恢复 ${savedAnswers.length} 道题的答案`)
            } else {
                showRuleDialog.value = true
            }
        }
    } catch (error) {
        console.error(error)
    }
}

const startExam = () => {
    showRuleDialog.value = false
    isExamReady.value = true
    startTimer()
    startAutoSave()
    enterFullscreen()
    ElMessage.success('考试开始，请认真作答')
}

const forceTimeSync = ref(false)
let fallbackTimer = null

const startTimer = () => {
    let lastCheckTime = Date.now()
    
    const tick = () => {
        const now = Date.now()
        const delta = now - lastCheckTime
        
        if (delta > 2000 || forceTimeSync.value) {
            console.log(`检测到计时偏差: ${delta}ms，重新校准`)
            forceTimeSync.value = false
        }
        lastCheckTime = now
        
        if (remainingTime.value <= 0) {
            cleanupTimers()
            ElMessage.warning('考试时间到，自动提交')
            confirmSubmit()
            return
        }
        
        timer = requestAnimationFrame(tick)
    }
    
    timer = requestAnimationFrame(tick)
    
    fallbackTimer = setTimeout(() => {
        console.log('兜底计时器触发，强制检查时间')
    }, totalDuration.value * 1000)
}

const cleanupTimers = () => {
    if (timer) cancelAnimationFrame(timer)
    if (fallbackTimer) clearTimeout(fallbackTimer)
    timer = null
    fallbackTimer = null
}

const startAutoSave = () => {
    saveTimer = setInterval(() => {
        autoSave()
    }, 10000)
}

const autoSave = async () => {
    const q = currentQuestion.value
    if (q && q.id) {
        let answer = answers.value[q.id] || ''
        if (q.type === 'MULTIPLE_CHOICE' && multiAnswers.value[q.id]) {
            answer = multiAnswers.value[q.id].sort().join('')
        }
        if (answer) {
            try {
                await saveAnswer({
                    examRecordId: recordId,
                    questionId: q.id,
                    answer: answer
                })
            } catch (e) {}
        }
    }
}

const submitExam = () => {
    showSubmitDialog.value = true
}

const confirmSubmit = async () => {
    submitting.value = true
    try {
        for (const q of questions.value) {
            let answer = answers.value[q.id] || ''
            if (q.type === 'MULTIPLE_CHOICE' && multiAnswers.value[q.id]) {
                answer = multiAnswers.value[q.id].sort().join('')
            }
            if (answer) {
                await saveAnswer({
                    examRecordId: recordId,
                    questionId: q.id,
                    answer: answer
                })
            }
        }
        
        await submitExam({ examRecordId: recordId })
        ElMessage.success('提交成功')
        exitFullscreen()
        router.push('/examinee/records')
    } catch (error) {
        console.error(error)
    } finally {
        submitting.value = false
        showSubmitDialog.value = false
    }
}

const enterFullscreen = () => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
        elem.requestFullscreen()
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen()
    }
    isFullscreen.value = true
}

const exitFullscreen = () => {
    if (document.exitFullscreen) {
        document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
    }
    isFullscreen.value = false
}

const restoreAnswers = async () => {
    try {
        const savedAnswers = await getAnswers(recordId) || []
        let restoredCount = 0
        
        savedAnswers.forEach(ans => {
            const question = questions.value.find(q => q.id === ans.questionId)
            if (question) {
                if (question.type === 'MULTIPLE_CHOICE') {
                    multiAnswers.value[ans.questionId] = ans.answer ? ans.answer.split('') : []
                } else {
                    answers.value[ans.questionId] = ans.answer || ''
                }
                restoredCount++
            }
        })
        
        ElMessage.success(`已恢复 ${restoredCount} 道题的答案`)
    } catch (error) {
        ElMessage.error('恢复答案失败，请检查网络连接')
    }
}

const handleOnline = () => {
    isOnline.value = true
    ElMessage.success('网络已恢复，自动同步答案中...')
    restoreAnswers()
}

const handleOffline = () => {
    isOnline.value = false
    ElMessage.warning('网络已断开，请不要关闭页面重新连接')
}

const handleVisibilityChange = () => {
    if (document.hidden) {
        switchCount.value++
        showWarningDialog.value = true
        
        if (switchCount.value >= 3) {
            setTimeout(() => {
                ElMessage.error('切屏次数超过3次，系统已自动交卷')
                confirmSubmit()
            }, 2000)
        }
    } else {
        forceTimeSync.value = true
    }
}

const handleBlur = () => {
    switchCount.value++
    showWarningDialog.value = true
    
    if (switchCount.value >= 3) {
        setTimeout(() => {
            ElMessage.error('切屏次数超过3次，系统已自动交卷')
            confirmSubmit()
        }, 2000)
    }
}

const handleCopy = (e) => {
    e.preventDefault()
    ElMessage.warning('考试期间禁止复制内容')
    return false
}

const handleCut = (e) => {
    e.preventDefault()
    ElMessage.warning('考试期间禁止剪切内容')
    return false
}

const handlePaste = (e) => {
    e.preventDefault()
    ElMessage.warning('考试期间禁止粘贴内容')
    return false
}

const handleKeyDown = (e) => {
    if (e.key === 'F12') {
        e.preventDefault()
        ElMessage.warning('考试期间禁止打开开发者工具')
        return false
    }
    
    if ((e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault()
        ElMessage.warning('考试期间禁止查看源代码')
        return false
    }
    
    if ((e.ctrlKey && e.key === 's') || (e.ctrlKey && e.key === 'S')) {
        e.preventDefault()
        return false
    }
}

const handleContextMenu = (e) => {
    e.preventDefault()
    ElMessage.warning('考试期间禁止右键操作')
    return false
}

watch([answers, multiAnswers], () => {
    autoSave()
}, { deep: true })

onMounted(() => {
    loadExam()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCut)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)
    
    setTimeout(() => {
        enterFullscreen()
    }, 500)
})

onBeforeUnmount(() => {
    cleanupTimers()
    if (saveTimer) clearInterval(saveTimer)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    window.removeEventListener('blur', handleBlur)
    document.removeEventListener('copy', handleCopy)
    document.removeEventListener('cut', handleCut)
    document.removeEventListener('paste', handlePaste)
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('contextmenu', handleContextMenu)
    exitFullscreen()
})
</script>

<style scoped>
.exam-page {
    width: 100%;
    min-height: 100vh;
    background: #f5f7fa;
}

.exam-header {
    height: 60px;
    background: white;
    border-bottom: 1px solid #e6e6e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    position: sticky;
    top: 0;
    z-index: 100;
}

.countdown {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: bold;
    color: #f56c6c;
}

.exam-body {
    display: flex;
    padding: 20px;
    gap: 20px;
}

.question-list {
    width: 300px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-content: flex-start;
}

.question-item {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #dcdfe6;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
}

.question-item:hover {
    border-color: #409eff;
}

.question-item.active {
    border-color: #409eff;
    background: #409eff;
    color: white;
}

.question-item.answered {
    border-color: #67c23a;
    background: #67c23a;
    color: white;
}

.question-content {
    flex: 1;
    background: white;
    border-radius: 8px;
    padding: 30px;
    min-height: 500px;
}

.question-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
}

.question-num {
    margin-left: auto;
    color: #999;
}

.question-text {
    font-size: 16px;
    line-height: 1.8;
    margin-bottom: 30px;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 5px;
}

.options {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.options :deep(.el-radio),
.options :deep(.el-checkbox) {
    font-size: 15px;
    padding: 10px 15px;
    border: 1px solid #eee;
    border-radius: 5px;
    transition: all 0.3s;
}

.options :deep(.el-radio:hover),
.options :deep(.el-checkbox:hover) {
    border-color: #409eff;
}

.question-nav {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
}

.exam-waiting {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
}

.exam-waiting h3 {
    color: #333;
    font-size: 24px;
    margin: 20px 0 10px 0;
}

.exam-waiting p {
    color: #666;
    font-size: 16px;
}
</style>
