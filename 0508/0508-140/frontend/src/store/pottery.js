import { defineStore } from 'pinia'

export const usePotteryStore = defineStore('pottery', {
  state: () => ({
    profilePoints: [],
    rotationSegments: 64,
    smoothness: 0.5,
    currentPotteryName: '',
    compareProfilePoints: [],
    compareMode: false,
    glazeType: 'celadon'
  }),
  
  actions: {
    setProfilePoints(points) {
      this.profilePoints = [...points]
    },
    
    addProfilePoint(point) {
      this.profilePoints.push({ ...point })
    },
    
    clearProfilePoints() {
      this.profilePoints = []
    },
    
    setRotationSegments(segments) {
      this.rotationSegments = Math.max(4, Math.min(256, segments))
    },
    
    setSmoothness(value) {
      this.smoothness = Math.max(0, Math.min(1, value))
    },
    
    setCurrentPotteryName(name) {
      this.currentPotteryName = name
    },
    
    setCompareProfilePoints(points) {
      this.compareProfilePoints = points ? [...points] : []
      this.compareMode = points && points.length > 0
    },
    
    clearCompare() {
      this.compareProfilePoints = []
      this.compareMode = false
    },
    
    setGlazeType(type) {
      this.glazeType = type
    }
  }
})
