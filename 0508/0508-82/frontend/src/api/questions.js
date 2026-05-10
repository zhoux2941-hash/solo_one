import axios from './axios'

export function getCategories() {
  return axios.get('/questions/categories')
}

export function createCategory(name, description) {
  const params = new URLSearchParams()
  params.append('name', name)
  if (description) params.append('description', description)
  return axios.post('/questions/categories?' + params.toString())
}

export function getQuestions() {
  return axios.get('/questions')
}

export function getQuestionsByCategory(categoryId) {
  return axios.get(`/questions/category/${categoryId}`)
}

export function addQuestion(question) {
  return axios.post('/questions', question)
}

export function importQuestions(file, categoryId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('categoryId', categoryId)
  return axios.post('/questions/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
