import Vue from 'vue'
import Vuex from 'vuex'
import api from '../api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}'),
    remainingVotes: 10
  },
  getters: {
    isLoggedIn: state => !!state.token,
    isAdmin: state => state.userInfo.role === 'ADMIN',
    userInfo: state => state.userInfo,
    remainingVotes: state => state.remainingVotes
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
    },
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo
    },
    SET_REMAINING_VOTES(state, votes) {
      state.remainingVotes = votes
    },
    DECREMENT_VOTES(state) {
      if (state.remainingVotes > 0) {
        state.remainingVotes--
      }
    },
    CLEAR_AUTH(state) {
      state.token = ''
      state.userInfo = {}
    }
  },
  actions: {
    async login({ commit }, credentials) {
      const response = await api.post('/auth/login', credentials)
      if (response.data.code === 200) {
        const { token, ...userInfo } = response.data.data
        commit('SET_TOKEN', token)
        commit('SET_USER_INFO', userInfo)
        localStorage.setItem('token', token)
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
        return true
      }
      throw new Error(response.data.message)
    },
    async register(_, data) {
      const response = await api.post('/auth/register', data)
      if (response.data.code !== 200) {
        throw new Error(response.data.message)
      }
      return true
    },
    async fetchRemainingVotes({ commit, state }) {
      if (!state.token) return
      try {
        const response = await api.get('/votes/remaining')
        if (response.data.code === 200) {
          commit('SET_REMAINING_VOTES', response.data.data.remaining)
        }
      } catch (e) {
        console.error('获取剩余票数失败:', e)
      }
    },
    async vote({ commit, dispatch }, memeId) {
      const response = await api.post(`/votes/${memeId}`)
      if (response.data.code === 200) {
        commit('DECREMENT_VOTES')
        return true
      }
      throw new Error(response.data.message)
    },
    logout({ commit }) {
      commit('CLEAR_AUTH')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
