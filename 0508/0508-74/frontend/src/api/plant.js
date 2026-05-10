import axios from 'axios'

const API_BASE = '/api/plants'

export const plantApi = {
  getAllPlants: () => axios.get(API_BASE),
  
  getPlantById: (id) => axios.get(`${API_BASE}/${id}`),
  
  getOverduePlants: () => axios.get(`${API_BASE}/overdue`),
  
  waterPlant: (plantId, wateredBy, notes) => 
    axios.post(`${API_BASE}/water`, { plantId, wateredBy, notes }),
  
  getWateringLogs: (plantId) => axios.get(`${API_BASE}/${plantId}/logs`),
  
  getRanking: (days = 30) => axios.get(`${API_BASE}/ranking`, { params: { days } })
}
