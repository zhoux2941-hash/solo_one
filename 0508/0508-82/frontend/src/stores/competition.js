import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useCompetitionStore = defineStore('competition', () => {
  const currentCompetition = ref(null)
  const currentQuestion = ref(null)
  const teams = ref([])
  const buzzerStatus = reactive({
    available: true,
    winnerTeamId: null,
    winnerTeamName: null
  })
  const selectedTeam = ref(null)
  const answerTimeLeft = ref(0)
  const hasSubmittedAnswer = ref(false)

  function setCompetition(competition) {
    currentCompetition.value = competition
  }

  function setQuestion(question) {
    currentQuestion.value = question
    hasSubmittedAnswer.value = false
  }

  function setTeams(newTeams) {
    teams.value = newTeams
  }

  function updateBuzzerStatus(status) {
    buzzerStatus.available = status.available
    buzzerStatus.winnerTeamId = status.winnerTeamId
    buzzerStatus.winnerTeamName = status.winnerTeamName
  }

  function setSelectedTeam(team) {
    selectedTeam.value = team
  }

  function setAnswerTimeLeft(time) {
    answerTimeLeft.value = time
  }

  function markAnswerSubmitted() {
    hasSubmittedAnswer.value = true
  }

  function resetCompetition() {
    currentCompetition.value = null
    currentQuestion.value = null
    teams.value = []
    buzzerStatus.available = true
    buzzerStatus.winnerTeamId = null
    buzzerStatus.winnerTeamName = null
    selectedTeam.value = null
    answerTimeLeft.value = 0
    hasSubmittedAnswer.value = false
  }

  return {
    currentCompetition,
    currentQuestion,
    teams,
    buzzerStatus,
    selectedTeam,
    answerTimeLeft,
    hasSubmittedAnswer,
    setCompetition,
    setQuestion,
    setTeams,
    updateBuzzerStatus,
    setSelectedTeam,
    setAnswerTimeLeft,
    markAnswerSubmitted,
    resetCompetition
  }
})
