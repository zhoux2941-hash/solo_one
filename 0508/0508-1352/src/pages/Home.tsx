import React from 'react';
import {
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
  Percent,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  Download,
  Wrench,
  Trash2,
  Check,
} from 'lucide-react';
import { useSalesAnalysis } from '@/hooks/useSalesAnalysis';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import {
  FileUpload,
  StatsCard,
  TabNavigation,
  DishList,
  DishDetailModal,
  DataCleaningModal,
} from '@/components';
import { formatCurrency, formatPercent, formatDate, cn } from '@/utils';
import { dataExporter } from '@/services';
import type { AnomalyAction } from '@/types';

export default function Home() {
  const {
    hasData,
    overallStats,
    currentDishes,
    activeTab,
    tabCounts,
    isModalOpen,
    selectedDish,
    isLoading,
    error,
    parseErrors,
    fileName,
    handleTabChange,
    handleDishClick,
    closeDishDetail,
    reset,
    loadSampleData,
  } = useSalesAnalysis();

  const anomalies = useAnalysisStore((state) => state.anomalies);
  const isDataCleaningModalOpen = useAnalysisStore((state) => state.isDataCleaningModalOpen);
  const dataCleaningStats = useAnalysisStore((state) => state.dataCleaningStats);
  const closeDataCleaningModal = useAnalysisStore((state) => state.closeDataCleaningModal);
  const handleAnomalies = useAnalysisStore((state) => state.handleAnomalies);

  const handleExport = () => {
    if (useAnalysisStore.getState().analysisResult) {
      dataExporter.exportToCSV(useAnalysisStore.getState().analysisResult!);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-display">
                  餐厅菜单销量分析
                </h1>
                <p className="text-xs text-gray-500">数据驱动的菜单优化决策</p>
              </div>
            </div>
            
            {hasData && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 hidden sm:block">
                  {fileName}
                </span>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">导出报告</span>
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">重新上传</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-accent-50 border border-accent-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-accent-700">{error}</p>
              {parseErrors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-sm text-accent-600">{err}</p>
                  ))}
                  {parseErrors.length > 5 && (
                    <p className="text-sm text-accent-600">...还有 {parseErrors.length - 5} 条错误</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!hasData ? (
          <div className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 font-display mb-3">
                开始分析您的菜单销售数据
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                上传您的订单明细CSV，系统将自动识别明星菜品、滞销菜品和问题菜品，
                帮助您优化菜单结构，提升经营效益。
              </p>
            </div>
            <FileUpload onLoadSample={loadSampleData} />
          </div>
        ) : (
          <div className="space-y-8">
            {overallStats && (
              <div className="opacity-0 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">整体概览</h2>
                  <p className="text-sm text-gray-500">
                    统计周期：{formatDate(overallStats.dateRange.start)} - {formatDate(overallStats.dateRange.end)}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard
                    title="订单总数"
                    value={overallStats.totalOrders.toLocaleString()}
                    subtitle="笔订单"
                    icon={ShoppingBag}
                    color="blue"
                    delay={0}
                  />
                  <StatsCard
                    title="菜品总销量"
                    value={overallStats.totalDishes.toLocaleString()}
                    subtitle="份"
                    icon={UtensilsCrossed}
                    color="primary"
                    delay={100}
                  />
                  <StatsCard
                    title="总销售额"
                    value={formatCurrency(overallStats.totalSales)}
                    subtitle="营业收入"
                    icon={DollarSign}
                    color="gold"
                    delay={200}
                  />
                  <StatsCard
                    title="总毛利"
                    value={formatCurrency(overallStats.totalProfit)}
                    subtitle={`毛利率 ${formatPercent(overallStats.avgProfitMargin)}`}
                    icon={TrendingUp}
                    color="green"
                    delay={300}
                  />
                </div>
              </div>
            )}

            {(dataCleaningStats.fixedCount > 0 || dataCleaningStats.deletedCount > 0 || dataCleaningStats.keptCount > 0) && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-sm font-medium text-gray-700">数据清洗结果：</span>
                {dataCleaningStats.fixedCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-primary-600">
                    <Wrench className="w-4 h-4" />
                    修正 {dataCleaningStats.fixedCount} 条
                  </span>
                )}
                {dataCleaningStats.deletedCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-accent-600">
                    <Trash2 className="w-4 h-4" />
                    删除 {dataCleaningStats.deletedCount} 条
                  </span>
                )}
                {dataCleaningStats.keptCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Check className="w-4 h-4" />
                    保留 {dataCleaningStats.keptCount} 条
                  </span>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">菜品分析</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Percent className="w-4 h-4" />
                  <span>毛利率低于20%为问题菜品</span>
                </div>
              </div>
              
              <TabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                counts={tabCounts}
              />
              
              <div className="mt-6">
                <DishList
                  dishes={currentDishes}
                  tabType={activeTab}
                  onDishClick={handleDishClick}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <DishDetailModal
        dish={selectedDish}
        isOpen={isModalOpen}
        onClose={closeDishDetail}
      />

      <DataCleaningModal
        isOpen={isDataCleaningModalOpen}
        anomalies={anomalies}
        onConfirm={handleAnomalies}
        onCancel={closeDataCleaningModal}
      />

      <footer className="mt-auto py-6 text-center text-sm text-gray-400">
        <p>数据仅在本地处理，不会上传至服务器，保护您的商业隐私</p>
      </footer>
    </div>
  );
}
