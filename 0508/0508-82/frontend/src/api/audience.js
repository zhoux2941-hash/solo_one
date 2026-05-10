import axios from './axios'

export function getCompetitionHeat(competitionId) {
  return axios.get(`/audience/competitions/${competitionId}/heat`)
}

export function vote(competitionId, teamId, voteType) {
  return axios.post(`/audience/competitions/${competitionId}/vote?teamId=${teamId}&voteType=${voteType}`)
}

export function like(competitionId, teamId) {
  return axios.post(`/audience/competitions/${competitionId}/like?teamId=${teamId}`)
}

export function cheer(competitionId, teamId) {
  return axios.post(`/audience/competitions/${competitionId}/cheer?teamId=${teamId}`)
}

export function fire(competitionId, teamId) {
  return axios.post(`/audience/competitions/${competitionId}/fire?teamId=${teamId}`)
}

export function getVoteTypes() {
  return axios.get('/audience/vote-types')
}
