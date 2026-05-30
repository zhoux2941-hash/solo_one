import { useState } from 'react';
import { useBayesianCalculation } from '@/hooks/useBayesianCalculation';
import { ParameterInput } from '@/components/ParameterInput';
import { ResultDisplay } from '@/components/ResultDisplay';
import { TreeDiagram } from '@/components/TreeDiagram';
import { BarChart } from '@/components/BarChart';
import { CalculationSteps } from '@/components/CalculationSteps';
import { FormatToggle } from '@/components/FormatToggle';
import { ExportButton } from '@/components/ExportButton';
import { IterationManager } from '@/components/IterationManager';
import { IterationChart } from '@/components/IterationChart';
import { Activity, Github, Layers, Calculator } from 'lucide-react';

type ViewMode = 'single' | 'iteration';

export default function Home() {
  const {
    params,
    result,
    displayFormat,
    selectedPresetId,
    testResults,
    testResultForIteration,
    currentPrior,
    updateParam,
    setDisplayFormat,
    applyPreset,
    setTestResultForIteration,
    addTest,
    removeTest,
    clearTests,
    resetToInitial,
  } = useBayesianCalculation();

  const [viewMode, setViewMode] = useState<ViewMode>('single');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">贝叶斯定理工具</h1>
                <p className="text-xs text-slate-500">疾病检测概率计算器</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  onClick={() => setViewMode('single')}
                  className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'single'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  单次检测
                </button>
                <button
                  onClick={() => setViewMode('iteration')}
                  className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'iteration'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  迭代更新
                  {testResults.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
                      {testResults.length}
                    </span>
                  )}
                </button>
              </div>

              <FormatToggle format={displayFormat} onChange={setDisplayFormat} />
              <ExportButton 
                params={params} 
                result={result} 
                targetId="bayesian-content"
                testResults={testResults}
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div id="bayesian-content" className="space-y-6">
          {viewMode === 'single' ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <ParameterInput
                    params={params}
                    selectedPresetId={selectedPresetId}
                    onParamChange={updateParam}
                    onPresetChange={applyPreset}
                  />
                  <ResultDisplay
                    params={params}
                    result={result}
                    displayFormat={displayFormat}
                  />
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <TreeDiagram result={result} displayFormat={displayFormat} />
                  <BarChart params={params} result={result} />
                </div>
              </div>

              <CalculationSteps steps={result.calculationSteps} />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <ParameterInput
                    params={params}
                    selectedPresetId={selectedPresetId}
                    onParamChange={updateParam}
                    onPresetChange={applyPreset}
                  />
                  <IterationManager
                    testResults={testResults}
                    testResultForIteration={testResultForIteration}
                    currentPrior={currentPrior}
                    params={params}
                    displayFormat={displayFormat}
                    onTestResultChange={setTestResultForIteration}
                    onAddTest={addTest}
                    onRemoveTest={removeTest}
                    onClearTests={clearTests}
                    onReset={resetToInitial}
                  />
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <IterationChart 
                    testResults={testResults} 
                    initialPrior={params.priorProbability}
                  />
                  {testResults.length > 0 && (
                    <TreeDiagram 
                      result={testResults[testResults.length - 1].result} 
                      displayFormat={displayFormat}
                    />
                  )}
                  {testResults.length > 0 && (
                    <CalculationSteps 
                      steps={testResults[testResults.length - 1].result.calculationSteps} 
                    />
                  )}
                </div>
              </div>
            </>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
              关于贝叶斯定理
            </h2>
            <div className="prose prose-sm text-slate-600 space-y-3">
              <p>
                <strong>贝叶斯定理</strong>是概率论中的一个重要定理，用于描述在已知某些证据的情况下，
                一个事件发生的概率如何更新。在医学检测中，它帮助我们回答：
                <em className="text-teal-600">"如果检测结果为阳性，那么真正患病的概率是多少？"</em>
              </p>
              {viewMode === 'iteration' && (
                <p className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                  <strong className="text-indigo-800">迭代更新：</strong>
                  <span className="text-indigo-700">
                    贝叶斯定理的强大之处在于可以连续更新概率。每次检测后，后验概率成为下一次检测的先验概率。
                    多次检测可以显著提高诊断的准确性。例如，第一次阳性检测将概率从1%提升到32%，
                    第二次阳性检测可进一步提升到96%。
                  </span>
                </p>
              )}
              <p>
                这个工具展示了一个反直觉的事实：即使检测准确率很高，
                当疾病在人群中的流行率较低时，阳性预测值（检测阳性时真正患病的概率）
                可能远低于检测灵敏度。这就是为什么罕见疾病的筛查结果需要谨慎解读。
              </p>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-amber-800 text-sm font-medium">
                  💡 <strong>提示：</strong>尝试切换到"迭代更新"模式，模拟多次检测的场景，
                  观察概率如何随检测结果逐步更新。阳性检测会提高患病概率，阴性检测会降低患病概率。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              贝叶斯定理工具 © {new Date().getFullYear()}
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
