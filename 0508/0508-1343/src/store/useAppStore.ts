import { create } from 'zustand'
import type { SelectorMode, SalaryRecord, PurchasingPowerResult, CompareResult } from '@/types'
import { getSalaryRecord } from '@/data/salaries'
import { ricePriceMap } from '@/data/ricePrices'
import { convertModernSalaryToPurchasingPower } from '@/utils/purchasingPower'
import { compareSalary } from '@/utils/salaryCompare'

const STORAGE_KEY = 'official-salary-state'

interface PersistedState {
  selectedDynasty: string
  selectedOfficial: string
  selectorMode: SelectorMode
  selectedRank: number
  modernSalary: number
  compareDynastyA: string
  compareDynastyB: string
}

const defaultPersisted: PersistedState = {
  selectedDynasty: 'tang',
  selectedOfficial: 'xianling',
  selectorMode: 'official',
  selectedRank: 5,
  modernSalary: 10000,
  compareDynastyA: 'tang',
  compareDynastyB: 'ming',
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPersisted
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return { ...defaultPersisted, ...parsed }
  } catch {
    return defaultPersisted
  }
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

function extractPersisted(state: AppState): PersistedState {
  return {
    selectedDynasty: state.selectedDynasty,
    selectedOfficial: state.selectedOfficial,
    selectorMode: state.selectorMode,
    selectedRank: state.selectedRank,
    modernSalary: state.modernSalary,
    compareDynastyA: state.compareDynastyA,
    compareDynastyB: state.compareDynastyB,
  }
}

interface AppState {
  selectedDynasty: string
  selectedOfficial: string
  selectorMode: SelectorMode
  selectedRank: number
  modernSalary: number
  compareDynastyA: string
  compareDynastyB: string
  currentSalaryRecord: SalaryRecord | undefined
  purchasingPowerResults: PurchasingPowerResult[]
  compareResult: CompareResult | null

  setSelectedDynasty: (dynastyId: string) => void
  setSelectedOfficial: (officialId: string) => void
  setSelectorMode: (mode: SelectorMode) => void
  setSelectedRank: (rank: number) => void
  setModernSalary: (salary: number) => void
  setCompareDynastyA: (dynastyId: string) => void
  setCompareDynastyB: (dynastyId: string) => void
  computePurchasingPower: () => void
  computeCompare: () => void
}

const init = loadPersisted()

export const useAppStore = create<AppState>((set, get) => ({
  selectedDynasty: init.selectedDynasty,
  selectedOfficial: init.selectedOfficial,
  selectorMode: init.selectorMode,
  selectedRank: init.selectedRank,
  modernSalary: init.modernSalary,
  compareDynastyA: init.compareDynastyA,
  compareDynastyB: init.compareDynastyB,
  currentSalaryRecord: getSalaryRecord(init.selectedDynasty, init.selectedOfficial),
  purchasingPowerResults: [],
  compareResult: null,

  setSelectedDynasty: (dynastyId) => {
    const state = get()
    const record = getSalaryRecord(dynastyId, state.selectedOfficial)
    const next = { ...state, selectedDynasty: dynastyId, currentSalaryRecord: record }
    savePersisted(extractPersisted(next))
    set({ selectedDynasty: dynastyId, currentSalaryRecord: record })
  },

  setSelectedOfficial: (officialId) => {
    const state = get()
    const record = getSalaryRecord(state.selectedDynasty, officialId)
    const next = { ...state, selectedOfficial: officialId, currentSalaryRecord: record }
    savePersisted(extractPersisted(next))
    set({ selectedOfficial: officialId, currentSalaryRecord: record })
  },

  setSelectorMode: (mode) => {
    const next = { ...get(), selectorMode: mode }
    savePersisted(extractPersisted(next))
    set({ selectorMode: mode })
  },

  setSelectedRank: (rank) => {
    const next = { ...get(), selectedRank: rank }
    savePersisted(extractPersisted(next))
    set({ selectedRank: rank })
  },

  setModernSalary: (salary) => {
    const next = { ...get(), modernSalary: salary }
    savePersisted(extractPersisted(next))
    set({ modernSalary: salary })
  },

  setCompareDynastyA: (dynastyId) => {
    const next = { ...get(), compareDynastyA: dynastyId }
    savePersisted(extractPersisted(next))
    set({ compareDynastyA: dynastyId })
  },

  setCompareDynastyB: (dynastyId) => {
    const next = { ...get(), compareDynastyB: dynastyId }
    savePersisted(extractPersisted(next))
    set({ compareDynastyB: dynastyId })
  },

  computePurchasingPower: () => {
    const state = get()
    const results = convertModernSalaryToPurchasingPower(state.modernSalary)
    set({ purchasingPowerResults: results })
  },

  computeCompare: () => {
    const state = get()
    const recordA = getSalaryRecord(state.compareDynastyA, state.selectedOfficial)
    const recordB = getSalaryRecord(state.compareDynastyB, state.selectedOfficial)
    if (!recordA || !recordB) {
      set({ compareResult: null })
      return
    }

    const rpA = ricePriceMap[state.compareDynastyA]
    const rpB = ricePriceMap[state.compareDynastyB]
    if (!rpA || !rpB) {
      set({ compareResult: null })
      return
    }

    const result = compareSalary(
      state.compareDynastyA,
      state.compareDynastyB,
      state.selectedOfficial,
      recordA.rankName,
      recordA.salary,
      recordB.salary,
      rpA.pricePerShi,
      rpB.pricePerShi,
    )

    set({ compareResult: result })
  },
}))
