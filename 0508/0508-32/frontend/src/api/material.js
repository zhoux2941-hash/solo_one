import axios from 'axios'

const API_BASE_URL = '/api/material'

export const getTrendData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/trend`)
    return response.data
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    throw error
  }
}

export const getShareData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/share`)
    return response.data
  } catch (error) {
    console.error('获取占比数据失败:', error)
    throw error
  }
}

export const getWarningData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/warning`)
    return response.data
  } catch (error) {
    console.error('获取预警数据失败:', error)
    throw error
  }
}
