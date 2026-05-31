import { create } from 'zustand';
import type { OrderRecord, AnalysisResult, DishStats, TabType, AnomalyRecord, AnomalyAction } from '@/types';
import { parseCSVFile, dataAnalyzer, generateSampleCSV, dataCleaner } from '@/services';
import { parseCSVFile as parseCSV } from '@/services/csvParser';

interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  rawRecords: OrderRecord[];
  analysisResult: AnalysisResult | null;
  activeTab: TabType;
  selectedDish: DishStats | null;
  isModalOpen: boolean;
  parseErrors: string[];
  fileName: string;
  anomalies: AnomalyRecord[];
  isDataCleaningModalOpen: boolean;
  dataCleaningStats: {
    fixedCount: number;
    deletedCount: number;
    keptCount: number;
  };

  uploadFile: (file: File) => Promise<void>;
  loadSampleData: () => Promise<void>;
  setActiveTab: (tab: TabType) => void;
  openDishDetail: (dish: DishStats) => void;
  closeDishDetail: () => void;
  reset: () => void;
  closeDataCleaningModal: () => void;
  handleAnomalies: (actions: Map<string, AnomalyAction>) => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  isLoading: false,
  error: null,
  rawRecords: [],
  analysisResult: null,
  activeTab: 'star',
  selectedDish: null,
  isModalOpen: false,
  parseErrors: [],
  fileName: '',
  anomalies: [],
  isDataCleaningModalOpen: false,
  dataCleaningStats: { fixedCount: 0, deletedCount: 0, keptCount: 0 },

  uploadFile: async (file: File) => {
    set({ isLoading: true, error: null, fileName: file.name });
    
    try {
      const result = await parseCSVFile(file);
      
      if (result.errors.length > 0 && result.data.length === 0) {
        set({
          isLoading: false,
          error: '数据解析失败，请检查CSV格式',
          parseErrors: result.errors,
        });
        return;
      }

      if (result.data.length === 0) {
        set({
          isLoading: false,
          error: '未找到有效数据',
          parseErrors: [],
        });
        return;
      }

      const anomalies = dataCleaner.detectAnomalies(result.data);
      
      if (anomalies.length > 0) {
        set({
          isLoading: false,
          rawRecords: result.data,
          anomalies,
          isDataCleaningModalOpen: true,
          parseErrors: result.errors,
        });
        return;
      }

      const analysisResult = dataAnalyzer.analyze(result.data);
      
      set({
        isLoading: false,
        rawRecords: result.data,
        analysisResult,
        parseErrors: result.errors,
        error: result.errors.length > 0 ? '部分数据解析失败，已自动跳过' : null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '上传失败，请重试',
        parseErrors: [],
      });
    }
  },

  loadSampleData: async () => {
    set({ isLoading: true, error: null, fileName: '示例数据.csv' });
    
    try {
      const sampleCSV = generateSampleCSV();
      const blob = new Blob([sampleCSV], { type: 'text/csv' });
      const file = new File([blob], '示例数据.csv', { type: 'text/csv' });
      
      const result = await parseCSV(file);
      
      if (result.data.length === 0) {
        set({
          isLoading: false,
          error: '示例数据加载失败',
        });
        return;
      }

      const anomalies = dataCleaner.detectAnomalies(result.data);
      
      if (anomalies.length > 0) {
        set({
          isLoading: false,
          rawRecords: result.data,
          anomalies,
          isDataCleaningModalOpen: true,
          parseErrors: [],
        });
        return;
      }

      const analysisResult = dataAnalyzer.analyze(result.data);
      
      set({
        isLoading: false,
        rawRecords: result.data,
        analysisResult,
        parseErrors: [],
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载失败，请重试',
      });
    }
  },

  setActiveTab: (tab: TabType) => {
    set({ activeTab: tab });
  },

  openDishDetail: (dish: DishStats) => {
    set({ selectedDish: dish, isModalOpen: true });
  },

  closeDishDetail: () => {
    set({ isModalOpen: false, selectedDish: null });
  },

  closeDataCleaningModal: () => {
    set({ isDataCleaningModalOpen: false, anomalies: [] });
  },

  handleAnomalies: (actions: Map<string, AnomalyAction>) => {
    const { rawRecords, anomalies } = get();
    
    const { cleanedRecords, fixedCount, deletedCount } = dataCleaner.applyAction(
      anomalies,
      actions,
      rawRecords
    );
    const keptCount = Array.from(actions.values()).filter(a => a === 'keep').length;

    if (cleanedRecords.length === 0) {
      set({
        isDataCleaningModalOpen: false,
        anomalies: [],
        error: '处理后无有效数据，请重新上传',
        dataCleaningStats: { fixedCount, deletedCount, keptCount },
      });
      return;
    }

    const analysisResult = dataAnalyzer.analyze(cleanedRecords);
    
    set({
      isDataCleaningModalOpen: false,
      anomalies: [],
      rawRecords: cleanedRecords,
      analysisResult,
      dataCleaningStats: { fixedCount, deletedCount, keptCount },
    });
  },

  reset: () => {
    set({
      rawRecords: [],
      analysisResult: null,
      parseErrors: [],
      error: null,
      fileName: '',
      activeTab: 'star',
      selectedDish: null,
      isModalOpen: false,
      anomalies: [],
      isDataCleaningModalOpen: false,
      dataCleaningStats: { fixedCount: 0, deletedCount: 0, keptCount: 0 },
    });
  },
}));
