import { useMemo } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import type { DishStats, TabType } from '@/types';

export function useSalesAnalysis() {
  const analysisResult = useAnalysisStore((state) => state.analysisResult);
  const activeTab = useAnalysisStore((state) => state.activeTab);
  const setActiveTab = useAnalysisStore((state) => state.setActiveTab);
  const openDishDetail = useAnalysisStore((state) => state.openDishDetail);
  const closeDishDetail = useAnalysisStore((state) => state.closeDishDetail);
  const isModalOpen = useAnalysisStore((state) => state.isModalOpen);
  const selectedDish = useAnalysisStore((state) => state.selectedDish);
  const isLoading = useAnalysisStore((state) => state.isLoading);
  const error = useAnalysisStore((state) => state.error);
  const parseErrors = useAnalysisStore((state) => state.parseErrors);
  const fileName = useAnalysisStore((state) => state.fileName);
  const reset = useAnalysisStore((state) => state.reset);
  const loadSampleData = useAnalysisStore((state) => state.loadSampleData);

  const currentDishes = useMemo(() => {
    if (!analysisResult) return [];
    
    switch (activeTab) {
      case 'star':
        return analysisResult.categorizedDishes.starDishes;
      case 'slow':
        return analysisResult.categorizedDishes.slowDishes;
      case 'problem':
        return analysisResult.categorizedDishes.problemDishes;
      default:
        return [];
    }
  }, [analysisResult, activeTab]);

  const tabCounts = useMemo(() => {
    if (!analysisResult) return { star: 0, slow: 0, problem: 0 };
    return {
      star: analysisResult.categorizedDishes.starDishes.length,
      slow: analysisResult.categorizedDishes.slowDishes.length,
      problem: analysisResult.categorizedDishes.problemDishes.length,
    };
  }, [analysisResult]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleDishClick = (dish: DishStats) => {
    openDishDetail(dish);
  };

  return {
    analysisResult,
    overallStats: analysisResult?.overallStats,
    currentDishes,
    activeTab,
    tabCounts,
    isModalOpen,
    selectedDish,
    isLoading,
    error,
    parseErrors,
    fileName,
    hasData: !!analysisResult,
    handleTabChange,
    handleDishClick,
    closeDishDetail,
    reset,
    loadSampleData,
  };
}
