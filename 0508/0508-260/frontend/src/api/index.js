import request from '@/utils/request'

export const login = (data) => {
    return request({
        url: '/user/login',
        method: 'post',
        data
    })
}

export const getUsers = () => {
    return request({
        url: '/user/list',
        method: 'get'
    })
}

export const createUser = (data) => {
    return request({
        url: '/user/create',
        method: 'post',
        data
    })
}

export const deleteUser = (id) => {
    return request({
        url: `/user/${id}`,
        method: 'delete'
    })
}

export const getQuestions = () => {
    return request({
        url: '/question/list',
        method: 'get'
    })
}

export const createQuestion = (data) => {
    return request({
        url: '/question/create',
        method: 'post',
        data
    })
}

export const batchCreateQuestions = (data) => {
    return request({
        url: '/question/batch',
        method: 'post',
        data
    })
}

export const deleteQuestion = (id) => {
    return request({
        url: `/question/${id}`,
        method: 'delete'
    })
}

export const getPapers = () => {
    return request({
        url: '/paper/list',
        method: 'get'
    })
}

export const createPaper = (data) => {
    return request({
        url: '/paper/create',
        method: 'post',
        data
    })
}

export const autoGeneratePaper = (data) => {
    return request({
        url: '/paper/auto-generate',
        method: 'post',
        data
    })
}

export const deletePaper = (id) => {
    return request({
        url: `/paper/${id}`,
        method: 'delete'
    })
}

export const getSessions = () => {
    return request({
        url: '/exam/session/list',
        method: 'get'
    })
}

export const createSession = (data) => {
    return request({
        url: '/exam/session/create',
        method: 'post',
        data
    })
}

export const deleteSession = (id) => {
    return request({
        url: `/exam/session/${id}`,
        method: 'delete'
    })
}

export const startExam = (data) => {
    return request({
        url: '/exam/start',
        method: 'post',
        data
    })
}

export const saveAnswer = (data) => {
    return request({
        url: '/exam/answer/save',
        method: 'post',
        data
    })
}

export const getAnswers = (recordId) => {
    return request({
        url: `/exam/answers/${recordId}`,
        method: 'get'
    })
}

export const submitExam = (data) => {
    return request({
        url: '/exam/submit',
        method: 'post',
        data
    })
}

export const getPaperQuestions = (paperId) => {
    return request({
        url: `/exam/paper/questions/${paperId}`,
        method: 'get'
    })
}

export const getUserRecords = (userId) => {
    return request({
        url: `/exam/record/user/${userId}`,
        method: 'get'
    })
}

export const getSessionRecords = (sessionId) => {
    return request({
        url: `/exam/record/session/${sessionId}`,
        method: 'get'
    })
}

export const getRanking = (sessionId) => {
    return request({
        url: `/exam/ranking/${sessionId}`,
        method: 'get'
    })
}

export const getRecord = (id) => {
    return request({
        url: `/exam/record/${id}`,
        method: 'get'
    })
}
