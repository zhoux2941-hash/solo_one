<template>
    <div>
        <el-row :gutter="20">
            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-item">
                        <div class="stat-icon" style="background: #409eff">
                            <el-icon><Document /></el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ stats.questions }}</div>
                            <div class="stat-label">题目数量</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-item">
                        <div class="stat-icon" style="background: #67c23a">
                            <el-icon><Tickets /></el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ stats.papers }}</div>
                            <div class="stat-label">试卷数量</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-item">
                        <div class="stat-icon" style="background: #e6a23c">
                            <el-icon><Calendar /></el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ stats.sessions }}</div>
                            <div class="stat-label">考试场次</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-item">
                        <div class="stat-icon" style="background: #f56c6c">
                            <el-icon><User /></el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ stats.users }}</div>
                            <div class="stat-label">用户数量</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
        <el-card style="margin-top: 20px">
            <template #header>
                <span>系统说明</span>
            </template>
            <ul>
                <li>1. 题库管理：支持单选、多选、判断、简答题的录入和批量导入</li>
                <li>2. 试卷管理：支持手动组卷和自动随机组卷</li>
                <li>3. 考试管理：创建考试场次，分配考生</li>
                <li>4. 成绩查询：查看考试成绩和排名</li>
                <li>5. 答题页面支持实时保存、倒计时、防切屏功能</li>
            </ul>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getQuestions, getPapers, getSessions, getUsers } from '@/api'
import { Document, Tickets, Calendar, User } from '@element-plus/icons-vue'

const stats = ref({
    questions: 0,
    papers: 0,
    sessions: 0,
    users: 0
})

const loadStats = async () => {
    try {
        const [questions, papers, sessions, users] = await Promise.all([
            getQuestions(),
            getPapers(),
            getSessions(),
            getUsers()
        ])
        stats.value.questions = questions?.length || 0
        stats.value.papers = papers?.length || 0
        stats.value.sessions = sessions?.length || 0
        stats.value.users = users?.length || 0
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    loadStats()
})
</script>

<style scoped>
.stat-card {
    margin-bottom: 20px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 20px;
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 28px;
}

.stat-info {
    flex: 1;
}

.stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #333;
}

.stat-label {
    font-size: 14px;
    color: #999;
    margin-top: 5px;
}

ul {
    line-height: 2;
    color: #666;
}
</style>
