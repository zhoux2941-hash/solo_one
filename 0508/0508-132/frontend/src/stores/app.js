import { defineStore } from 'pinia'
import { tubeRackApi, experimentApi, optimizationApi } from '@/services/api'

export const useAppStore = defineStore('app', {
  state: () => ({
    tubeRacks: [],
    currentTubeRack: null,
    experiments: [],
    currentExperiment: null,
    optimizationResult: null,
    reagentTypes: [
      { code: 'SAMPLE_A', name: '样本A', color: '#f56c6c' },
      { code: 'SAMPLE_B', name: '样本B', color: '#e6a23c' },
      { code: 'SAMPLE_C', name: '样本C', color: '#67c23a' },
      { code: 'BUFFER', name: '缓冲液', color: '#409eff' },
      { code: 'WASTE', name: '废液', color: '#909399' },
      { code: 'EMPTY', name: '空孔', color: '#ffffff' }
    ]
  }),

  actions: {
    async loadTubeRacks() {
      const response = await tubeRackApi.getAll()
      if (response.success) {
        this.tubeRacks = response.data
      }
      return response
    },

    async loadTubeRackById(id) {
      const response = await tubeRackApi.getById(id)
      if (response.success) {
        this.currentTubeRack = response.data
      }
      return response
    },

    async createTubeRack(data) {
      const response = await tubeRackApi.create(data)
      if (response.success) {
        await this.loadTubeRacks()
      }
      return response
    },

    async deleteTubeRack(id) {
      const response = await tubeRackApi.delete(id)
      if (response.success) {
        await this.loadTubeRacks()
      }
      return response
    },

    async updateWell(tubeRackId, row, col, data) {
      const response = await tubeRackApi.updateWell(tubeRackId, row, col, data)
      if (response.success && this.currentTubeRack?.id === tubeRackId) {
        const well = this.currentTubeRack.wells.find(w => w.rowNum === row && w.colNum === col)
        if (well) {
          Object.assign(well, response.data)
        }
      }
      return response
    },

    async updateWellsBatch(tubeRackId, wells) {
      const response = await tubeRackApi.updateWellsBatch(tubeRackId, wells)
      if (response.success) {
        await this.loadTubeRackById(tubeRackId)
      }
      return response
    },

    async loadExperiments() {
      const response = await experimentApi.getAll()
      if (response.success) {
        this.experiments = response.data
      }
      return response
    },

    async loadExperimentById(id) {
      const response = await experimentApi.getById(id)
      if (response.success) {
        this.currentExperiment = response.data
      }
      return response
    },

    async createExperiment(data) {
      const response = await experimentApi.create(data)
      if (response.success) {
        await this.loadExperiments()
      }
      return response
    },

    async updateExperiment(id, data) {
      const response = await experimentApi.update(id, data)
      if (response.success) {
        await this.loadExperiments()
      }
      return response
    },

    async shareExperiment(id) {
      return await experimentApi.share(id)
    },

    async deleteExperiment(id) {
      const response = await experimentApi.delete(id)
      if (response.success) {
        await this.loadExperiments()
      }
      return response
    },

    async optimizePath(data) {
      const response = await optimizationApi.optimize(data)
      if (response.success) {
        this.optimizationResult = response.data
      }
      return response
    },

    async calculateManualDistance(tasks, startRow, startCol) {
      return await optimizationApi.calculateManual(tasks, startRow, startCol)
    },

    setOptimizationResult(result) {
      this.optimizationResult = result
    },

    getReagentColor(code) {
      const reagent = this.reagentTypes.find(r => r.code === code)
      return reagent?.color || '#ffffff'
    },

    getReagentName(code) {
      const reagent = this.reagentTypes.find(r => r.code === code)
      return reagent?.name || code
    }
  }
})