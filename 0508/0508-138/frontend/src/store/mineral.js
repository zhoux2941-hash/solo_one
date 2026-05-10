import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mineralApi } from '../api'

export const useMineralStore = defineStore('mineral', () => {
  const featureOptions = ref(null)
  const identificationResults = ref([])
  const loading = ref(false)
  const lastQuery = ref(null)

  const getFeatureOptions = async () => {
    if (featureOptions.value) {
      return featureOptions.value
    }
    
    const res = await mineralApi.getFeatureOptions()
    featureOptions.value = res.data
    return res.data
  }

  const identifyMinerals = async (params) => {
    loading.value = true
    lastQuery.value = params
    
    try {
      const res = await mineralApi.identifyMinerals(params)
      identificationResults.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const confirmIdentification = async (mineralId) => {
    if (!lastQuery.value) {
      throw new Error('没有查询记录可确认')
    }
    
    const params = {
      confirmedMineralId: mineralId,
      ...lastQuery.value
    }
    
    return await mineralApi.confirmIdentification(params)
  }

  return {
    featureOptions,
    identificationResults,
    loading,
    lastQuery,
    getFeatureOptions,
    identifyMinerals,
    confirmIdentification
  }
})
