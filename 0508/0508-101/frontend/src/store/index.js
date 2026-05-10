import { createStore } from 'vuex'
import api from '../api'

export default createStore({
  state: {
    activities: [],
    departments: [],
    currentDepartment: null,
    loading: false,
    budgetChanges: [],
    pendingBudgetChanges: []
  },

  mutations: {
    SET_ACTIVITIES(state, activities) {
      state.activities = activities
    },

    SET_DEPARTMENTS(state, departments) {
      state.departments = departments
    },

    SET_CURRENT_DEPARTMENT(state, department) {
      state.currentDepartment = department
    },

    SET_LOADING(state, loading) {
      state.loading = loading
    },

    ADD_ACTIVITY(state, activity) {
      state.activities.unshift(activity)
    },

    UPDATE_ACTIVITY(state, updatedActivity) {
      const index = state.activities.findIndex(a => a.id === updatedActivity.id)
      if (index !== -1) {
        state.activities.splice(index, 1, updatedActivity)
      }
    },

    REMOVE_ACTIVITY(state, id) {
      state.activities = state.activities.filter(a => a.id !== id)
    },

    SET_BUDGET_CHANGES(state, changes) {
      state.budgetChanges = changes
    },

    SET_PENDING_BUDGET_CHANGES(state, changes) {
      state.pendingBudgetChanges = changes
    },

    ADD_BUDGET_CHANGE(state, change) {
      state.budgetChanges.unshift(change)
    },

    UPDATE_BUDGET_CHANGE(state, updatedChange) {
      const index = state.budgetChanges.findIndex(c => c.id === updatedChange.id)
      if (index !== -1) {
        state.budgetChanges.splice(index, 1, updatedChange)
      }
      const pendingIndex = state.pendingBudgetChanges.findIndex(c => c.id === updatedChange.id)
      if (pendingIndex !== -1) {
        if (updatedChange.status === 'PENDING') {
          state.pendingBudgetChanges.splice(pendingIndex, 1, updatedChange)
        } else {
          state.pendingBudgetChanges.splice(pendingIndex, 1)
        }
      }
    }
  },

  actions: {
    async fetchActivities({ commit, state }) {
      commit('SET_LOADING', true)
      try {
        const response = await api.getActivities(state.currentDepartment)
        commit('SET_ACTIVITIES', response.data)
      } catch (error) {
        console.error('Failed to fetch activities:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchDepartments({ commit }) {
      try {
        const response = await api.getDepartments()
        commit('SET_DEPARTMENTS', response.data)
      } catch (error) {
        console.error('Failed to fetch departments:', error)
      }
    },

    async createActivity({ commit }, activityData) {
      commit('SET_LOADING', true)
      try {
        const response = await api.createActivity(activityData)
        commit('ADD_ACTIVITY', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to create activity:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async submitActual({ commit }, { id, data }) {
      commit('SET_LOADING', true)
      try {
        const response = await api.submitActual(id, data)
        commit('UPDATE_ACTIVITY', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to submit actual:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async approveActivity({ commit }, id) {
      commit('SET_LOADING', true)
      try {
        const response = await api.approveActivity(id)
        commit('UPDATE_ACTIVITY', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to approve activity:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async rejectActivity({ commit }, id) {
      commit('SET_LOADING', true)
      try {
        const response = await api.rejectActivity(id)
        commit('UPDATE_ACTIVITY', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to reject activity:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async deleteActivity({ commit }, id) {
      commit('SET_LOADING', true)
      try {
        await api.deleteActivity(id)
        commit('REMOVE_ACTIVITY', id)
      } catch (error) {
        console.error('Failed to delete activity:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    setCurrentDepartment({ commit, dispatch }, department) {
      commit('SET_CURRENT_DEPARTMENT', department)
      return dispatch('fetchActivities')
    },

    async fetchBudgetChanges({ commit }, activityId) {
      try {
        const response = await api.getBudgetChangesByActivity(activityId)
        commit('SET_BUDGET_CHANGES', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to fetch budget changes:', error)
        throw error
      }
    },

    async fetchPendingBudgetChanges({ commit }) {
      try {
        const response = await api.getPendingBudgetChanges()
        commit('SET_PENDING_BUDGET_CHANGES', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to fetch pending budget changes:', error)
        throw error
      }
    },

    async createBudgetChange({ commit, dispatch }, { activityId, data }) {
      commit('SET_LOADING', true)
      try {
        const response = await api.createBudgetChange(activityId, data)
        commit('ADD_BUDGET_CHANGE', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to create budget change:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async approveBudgetChange({ commit, dispatch }, { id, reviewReason }) {
      commit('SET_LOADING', true)
      try {
        const response = await api.approveBudgetChange(id, reviewReason)
        commit('UPDATE_BUDGET_CHANGE', response.data)
        await dispatch('fetchActivities')
        return response.data
      } catch (error) {
        console.error('Failed to approve budget change:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async rejectBudgetChange({ commit }, { id, reviewReason }) {
      commit('SET_LOADING', true)
      try {
        const response = await api.rejectBudgetChange(id, reviewReason)
        commit('UPDATE_BUDGET_CHANGE', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to reject budget change:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },

  getters: {
    closedActivities: state => {
      return state.activities.filter(a => a.status === 'CLOSED')
    },

    pendingActivities: state => {
      return state.activities.filter(a => a.status !== 'CLOSED')
    },

    budgetExceededActivities: state => {
      return state.activities.filter(a => {
        const actual = parseFloat(a.actualTotal || 0)
        const budget = parseFloat(a.budgetTotal || 0)
        return actual > budget
      })
    }
  }
})
