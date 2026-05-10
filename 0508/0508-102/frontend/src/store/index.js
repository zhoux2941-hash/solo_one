import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const state = {
  token: localStorage.getItem('token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  },
  SET_USER(state, user) {
    state.user = user
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  LOGOUT(state) {
    state.token = ''
    state.user = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

const actions = {
  login({ commit }, { token, user }) {
    commit('SET_TOKEN', token)
    commit('SET_USER', user)
  },
  logout({ commit }) {
    commit('LOGOUT')
  },
  updateUser({ commit }, user) {
    commit('SET_USER', user)
  }
}

const getters = {
  isLoggedIn: state => !!state.token && !!state.user,
  isOwner: state => state.user && state.user.role === 'OWNER',
  isWorker: state => state.user && state.user.role === 'WORKER',
  userName: state => state.user ? state.user.name : '',
  userId: state => state.user ? state.user.id : null
}

export default new Vuex.Store({
  state,
  mutations,
  actions,
  getters
})
