import axios from './axios'

export function getCompetitions() {
  return axios.get('/competitions')
}

export function getCompetition(id) {
  return axios.get(`/competitions/${id}`)
}

export function createCompetition(data) {
  return axios.post('/competitions', data)
}

export function getTeams(competitionId) {
  return axios.get(`/competitions/${competitionId}/teams`)
}

export function getCurrentQuestion(competitionId) {
  return axios.get(`/competitions/${competitionId}/current-question`)
}

export function getBuzzerStatus(competitionId) {
  return axios.get(`/competitions/${competitionId}/buzzer-status`)
}

export function buzz(competitionId, teamId) {
  return axios.post(`/competitions/${competitionId}/buzz?teamId=${teamId}`)
}

export function submitAnswer(data) {
  return axios.post('/competitions/submit-answer', data)
}

export function getStatistics(competitionId) {
  return axios.get(`/competitions/${competitionId}/statistics`)
}

export function startCompetition(competitionId) {
  return axios.post(`/host/competitions/${competitionId}/start`)
}

export function nextQuestion(competitionId) {
  return axios.post(`/host/competitions/${competitionId}/next-question`)
}

export function judgeAnswer(data) {
  return axios.post('/host/competitions/judge', data)
}

export function resetBuzzer(competitionId) {
  return axios.post(`/host/competitions/${competitionId}/reset-buzzer`)
}

export function finishCompetition(competitionId) {
  return axios.post(`/host/competitions/${competitionId}/finish`)
}
