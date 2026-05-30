import { create } from 'zustand'

interface Recommendation {
  patternId: number
  subtype: string
  era: string
  description: string
  categoryType: string
  confidence: number
  matchedFeatures: string[]
}

interface BatchItem {
  id: string
  file: File
  originalImage: string
  processedImage: string | null
  status: 'pending' | 'processing' | 'completed' | 'error'
  recommendations: Recommendation[]
  error?: string
}

interface AppState {
  currentView: 'single' | 'batch'
  batchItems: BatchItem[]
  selectedItemId: string | null
  isProcessing: boolean
  showRecommendations: boolean

  originalImage: string | null
  processedImage: string | null
  enhancedImage: string | null
  direction: 'yang2yin' | 'yin2yang'
  intensity: number
  edgeAlgorithm: 'sobel' | 'laplacian'
  edgeStrength: number
  edgeEnabled: boolean
  zoom: number
  recommendations: Recommendation[]

  setCurrentView: (view: 'single' | 'batch') => void
  addBatchItems: (files: File[]) => void
  removeBatchItem: (id: string) => void
  clearBatchItems: () => void
  updateBatchItem: (id: string, updates: Partial<BatchItem>) => void
  setSelectedItemId: (id: string | null) => void
  setIsProcessing: (isProcessing: boolean) => void
  setShowRecommendations: (show: boolean) => void

  setOriginalImage: (image: string | null) => void
  setProcessedImage: (image: string | null) => void
  setEnhancedImage: (image: string | null) => void
  setDirection: (direction: 'yang2yin' | 'yin2yang') => void
  setIntensity: (intensity: number) => void
  setEdgeAlgorithm: (algorithm: 'sobel' | 'laplacian') => void
  setEdgeStrength: (strength: number) => void
  setEdgeEnabled: (enabled: boolean) => void
  setZoom: (zoom: number) => void
  setRecommendations: (recommendations: Recommendation[]) => void
  reset: () => void
}

const initialSingleState = {
  originalImage: null,
  processedImage: null,
  enhancedImage: null,
  direction: 'yang2yin' as const,
  intensity: 75,
  edgeAlgorithm: 'sobel' as const,
  edgeStrength: 50,
  edgeEnabled: false,
  zoom: 1,
  recommendations: [],
  isProcessing: false,
  showRecommendations: false,
}

const initialBatchState = {
  currentView: 'single' as const,
  batchItems: [],
  selectedItemId: null,
}

export const useAppStore = create<AppState>((set, get) => ({
  ...initialSingleState,
  ...initialBatchState,

  setCurrentView: (view) => set({ currentView: view }),

  addBatchItems: (files) => {
    const items: BatchItem[] = files.map((file) => ({
      id: Math.random().toString(36).slice(2, 10),
      file,
      originalImage: '',
      processedImage: null,
      status: 'pending',
      recommendations: [],
    }))
    set((state) => ({ batchItems: [...state.batchItems, ...items] }))

    items.forEach((item, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        set((state) => ({
          batchItems: state.batchItems.map((i) =>
            i.id === item.id ? { ...i, originalImage: dataUrl } : i
          ),
        }))
      }
      reader.readAsDataURL(item.file)
    })
  },

  removeBatchItem: (id) =>
    set((state) => ({
      batchItems: state.batchItems.filter((i) => i.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    })),

  clearBatchItems: () =>
    set({ batchItems: [], selectedItemId: null }),

  updateBatchItem: (id, updates) =>
    set((state) => ({
      batchItems: state.batchItems.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setShowRecommendations: (showRecommendations) => set({ showRecommendations }),
  setOriginalImage: (image) => set({ originalImage: image }),
  setProcessedImage: (image) => set({ processedImage: image }),
  setEnhancedImage: (image) => set({ enhancedImage: image }),
  setDirection: (direction) => set({ direction }),
  setIntensity: (intensity) => set({ intensity }),
  setEdgeAlgorithm: (edgeAlgorithm) => set({ edgeAlgorithm }),
  setEdgeStrength: (edgeStrength) => set({ edgeStrength }),
  setEdgeEnabled: (edgeEnabled) => set({ edgeEnabled }),
  setZoom: (zoom) => set({ zoom }),
  setRecommendations: (recommendations) => set({ recommendations }),
  reset: () => set({ ...initialSingleState, ...initialBatchState }),
}))
