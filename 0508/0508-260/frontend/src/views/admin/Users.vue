<template>
    <div>
        <el-card>
            <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>用户管理</span>
                    <el-button type="primary" size="small" @click="showAddDialog = true">添加用户</el-button>
                </div>
            </template>
            <el-table :data="users" stripe>
                <el-table-column prop="id" label="ID" width="80"></el-table-column>
                <el-table-column prop="username" label="用户名"></el-table-column>
                <el-table-column prop="name" label="姓名"></el-table-column>
                <el-table-column prop="department" label="部门"></el-table-column>
                <el-table-column prop="role" label="角色" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'primary'">
                            {{ row.role === 'ADMIN' ? '管理员' : '考生' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                        <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model="showAddDialog" title="添加用户" width="500px">
            <el-form :model="userForm" label-width="80px">
                <el-form-item label="用户名">
                    <el-input v-model="userForm.username"></el-input>
                </el-form-item>
                <el-form-item label="密码">
                    <el-input v-model="userForm.password" type="password"></el-input>
                </el-form-item>
                <el-form-item label="姓名">
                    <el-input v-model="userForm.name"></el-input>
                </el-form-item>
                <el-form-item label="部门">
                    <el-input v-model="userForm.department"></el-input>
                </el-form-item>
                <el-form-item label="角色">
                    <el-select v-model="userForm.role" style="width: 100%">
                        <el-option label="管理员" value="ADMIN"></el-option>
                        <el-option label="考生" value="EXAMINEE"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="handleAdd">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, createUser, deleteUser } from '@/api'

const users = ref([])
const showAddDialog = ref(false)

const userForm = ref({
    username: '',
    password: '',
    name: '',
    department: '',
    role: 'EXAMINEE'
})

const loadUsers = async () => {
    try {
        users.value = await getUsers() || []
    } catch (error) {
        console.error(error)
    }
}

const handleAdd = async () => {
    try {
        await createUser(userForm.value)
        ElMessage.success('添加成功')
        showAddDialog.value = false
        loadUsers()
        userForm.value = {
            username: '',
            password: '',
            name: '',
            department: '',
            role: 'EXAMINEE'
        }
    } catch (error) {
        console.error(error)
    }
}

const handleDelete = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
        await deleteUser(id)
        ElMessage.success('删除成功')
        loadUsers()
    } catch (error) {
        if (error !== 'cancel') {
            console.error(error)
        }
    }
}

onMounted(() => {
    loadUsers()
})
</script>
