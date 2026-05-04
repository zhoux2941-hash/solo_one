import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartridgeStore = defineStore('cartridge', () => {
  const samples = ref([])
  const totalSamples = ref(0)
  const currentSample = ref(null)
  const sampleImages = ref([])
  
  const queryImage = ref(null)
  const queryImageUrl = ref('')
  const queryImageFeatures = ref(null)
  
  const comparisonResults = ref([])
  const currentComparison = ref(null)
  const isComparing = ref(false)
  const comparisonTime = ref(null)
  
  const matchedPoints = ref([])
  const selectedMatch = ref(null)
  
  const hasResults = computed(() => comparisonResults.value.length > 0)
  const bestMatch = computed(() => comparisonResults.value[0] || null)
  
  function setSamples(sampleList) {
    samples.value = sampleList
  }
  
  function setTotalSamples(count) {
    totalSamples.value = count
  }
  
  function setCurrentSample(sample) {
    currentSample.value = sample
  }
  
  function setSampleImages(images) {
    sampleImages.value = images
  }
  
  function addSampleImage(image) {
    sampleImages.value.push(image)
  }
  
  function setQueryImage(image) {
    queryImage.value = image
  }
  
  function setQueryImageUrl(url) {
    queryImageUrl.value = url
  }
  
  function setQueryImageFeatures(features) {
    queryImageFeatures.value = features
  }
  
  function setComparisonResults(results, time = null) {
    comparisonResults.value = results
    comparisonTime.value = time
  }
  
  function setCurrentComparison(comparison) {
    currentComparison.value = comparison
  }
  
  function setIsComparing(value) {
    isComparing.value = value
  }
  
  function setMatchedPoints(points) {
    matchedPoints.value = points
  }
  
  function setSelectedMatch(match) {
    selectedMatch.value = match
  }
  
  function addSample(sample) {
    samples.value.unshift(sample)
    totalSamples.value++
  }
  
  function removeSample(sampleId) {
    const index = samples.value.findIndex(s => s.id === sampleId)
    if (index >= 0) {
      samples.value.splice(index, 1)
      totalSamples.value--
    }
  }
  
  function clearQuery() {
    queryImage.value = null
    queryImageUrl.value = ''
    queryImageFeatures.value = null
  }
  
  function clearComparison() {
    comparisonResults.value = []
    currentComparison.value = null
    matchedPoints.value = []
    selectedMatch.value = null
    comparisonTime.value = null
  }
  
  function $reset() {
    samples.value = []
    totalSamples.value = 0
    currentSample.value = null
    sampleImages.value = []
    queryImage.value = null
    queryImageUrl.value = ''
    queryImageFeatures.value = null
    comparisonResults.value = []
    currentComparison.value = null
    isComparing.value = false
    comparisonTime.value = null
    matchedPoints.value = []
    selectedMatch.value = null
  }
  
  return {
    samples,
    totalSamples,
    currentSample,
    sampleImages,
    queryImage,
    queryImageUrl,
    queryImageFeatures,
    comparisonResults,
    currentComparison,
    isComparing,
    comparisonTime,
    matchedPoints,
    selectedMatch,
    hasResults,
    bestMatch,
    setSamples,
    setTotalSamples,
    setCurrentSample,
    setSampleImages,
    addSampleImage,
    setQueryImage,
    setQueryImageUrl,
    setQueryImageFeatures,
    setComparisonResults,
    setCurrentComparison,
    setIsComparing,
    setMatchedPoints,
    setSelectedMatch,
    addSample,
    removeSample,
    clearQuery,
    clearComparison,
    $reset
  }
})
