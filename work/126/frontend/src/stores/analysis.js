import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAnalysisStore = defineStore('analysis', () => {
  const currentPointCloud = ref(null)
  const selectedBulletHoles = ref([])
  const weaponParams = ref({
    weapon_type: 'pistol',
    initial_velocity_min: 300,
    initial_velocity_max: 400,
    bullet_mass: null,
    drag_coefficient: null,
    bullet_diameter: null
  })
  const environmentParams = ref({
    temperature: 20.0,
    altitude: 0.0,
    humidity: 50.0,
    pressure: null
  })
  const currentAnalysis = ref(null)
  const trajectoryData = ref([])
  const probabilityCone = ref(null)
  const shooterPosition = ref(null)
  const lodLevels = ref([])
  const currentLodLevel = ref(0)
  const calculatedAirDensity = ref(null)

  const hasEnoughHoles = computed(() => selectedBulletHoles.value.length >= 2)
  const hasLodLevels = computed(() => lodLevels.value.length > 0)

  function setPointCloud(pointCloud) {
    currentPointCloud.value = pointCloud
    selectedBulletHoles.value = []
    currentAnalysis.value = null
    trajectoryData.value = []
    probabilityCone.value = null
    shooterPosition.value = null
    lodLevels.value = []
    currentLodLevel.value = 0
  }

  function setLodLevels(levels) {
    lodLevels.value = levels
    if (levels.length > 0) {
      const optimalLevel = levels.find(l => l.point_count <= 500000)
      currentLodLevel.value = optimalLevel ? optimalLevel.lod_level : levels[0].lod_level
    }
  }

  function setCurrentLodLevel(level) {
    currentLodLevel.value = level
  }

  function addBulletHole(hole) {
    selectedBulletHoles.value.push({
      ...hole,
      id: Date.now(),
      is_manual: true,
      confidence: 1.0
    })
  }

  function removeBulletHole(index) {
    selectedBulletHoles.value.splice(index, 1)
  }

  function updateBulletHole(index, updates) {
    if (index >= 0 && index < selectedBulletHoles.value.length) {
      selectedBulletHoles.value[index] = {
        ...selectedBulletHoles.value[index],
        ...updates
      }
    }
  }

  function clearBulletHoles() {
    selectedBulletHoles.value = []
  }

  function setWeaponParams(params) {
    weaponParams.value = { ...weaponParams.value, ...params }
  }

  function setEnvironmentParams(params) {
    environmentParams.value = { ...environmentParams.value, ...params }
  }

  function setCalculatedAirDensity(density) {
    calculatedAirDensity.value = density
  }

  function setAnalysisResult(result) {
    currentAnalysis.value = result
    trajectoryData.value = result.trajectory_data || []
    probabilityCone.value = result.probability_cone
    shooterPosition.value = result.shooter_position
  }

  function clearAnalysis() {
    currentAnalysis.value = null
    trajectoryData.value = []
    probabilityCone.value = null
    shooterPosition.value = null
  }

  function $reset() {
    currentPointCloud.value = null
    selectedBulletHoles.value = []
    weaponParams.value = {
      weapon_type: 'pistol',
      initial_velocity_min: 300,
      initial_velocity_max: 400,
      bullet_mass: null,
      drag_coefficient: null,
      bullet_diameter: null
    }
    environmentParams.value = {
      temperature: 20.0,
      altitude: 0.0,
      humidity: 50.0,
      pressure: null
    }
    currentAnalysis.value = null
    trajectoryData.value = []
    probabilityCone.value = null
    shooterPosition.value = null
    lodLevels.value = []
    currentLodLevel.value = 0
    calculatedAirDensity.value = null
  }

  return {
    currentPointCloud,
    selectedBulletHoles,
    weaponParams,
    environmentParams,
    currentAnalysis,
    trajectoryData,
    probabilityCone,
    shooterPosition,
    lodLevels,
    currentLodLevel,
    calculatedAirDensity,
    hasEnoughHoles,
    hasLodLevels,
    setPointCloud,
    setLodLevels,
    setCurrentLodLevel,
    addBulletHole,
    removeBulletHole,
    updateBulletHole,
    clearBulletHoles,
    setWeaponParams,
    setEnvironmentParams,
    setCalculatedAirDensity,
    setAnalysisResult,
    clearAnalysis,
    $reset
  }
})
