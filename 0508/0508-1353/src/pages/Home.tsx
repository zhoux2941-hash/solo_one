import { Recycle, Info } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { DateFilter } from '@/components/DateFilter';
import { StatsOverview } from '@/components/StatsOverview';
import { StatsChart } from '@/components/StatsChart';
import { BuildingRank } from '@/components/BuildingRank';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useAppStore } from '@/store/useAppStore';

export default function Home() {
  const { records, isLoading } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">垃圾分类投放正确率统计</h1>
                <p className="text-xs text-gray-500">可视化分析小区垃圾投放数据</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {isLoading && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-700">正在解析数据...</span>
              </div>
            </div>
          )}

          <ErrorMessage />

          <FileUpload />

          {records.length > 0 && (
            <>
              <DateFilter />
              
              <StatsOverview />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <StatsChart />
                </div>
                <div className="lg:col-span-1">
                  <BuildingRank />
                </div>
              </div>
            </>
          )}

          {records.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Info className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无数据</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                请上传CSV格式的垃圾投放记录文件，或点击"加载示例数据"按钮查看演示效果
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto py-6 text-center text-xs text-gray-400">
        <p>垃圾分类投放正确率统计系统 © 2024</p>
      </footer>
    </div>
  );
}
