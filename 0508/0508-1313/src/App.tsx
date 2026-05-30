import { useState, useCallback, useEffect } from 'react';
import { Calculator, Hand, GraduationCap } from 'lucide-react';
import { AbacusCanvas } from './components/AbacusCanvas';
import { ValueDisplay } from './components/ValueDisplay';
import { FormulaDisplay } from './components/FormulaDisplay';
import { StepDisplay } from './components/StepDisplay';
import { ControlPanel } from './components/ControlPanel';
import { PracticePanel } from './components/PracticePanel';
import { ScoreDisplay } from './components/ScoreDisplay';
import { SettingsToggle } from './components/SettingsToggle';
import { CorrectAnimation } from './components/CorrectAnimation';
import { useAbacusState } from './hooks/useAbacusState';
import { useCalculation } from './hooks/useCalculation';
import { useSpeech } from './hooks/useSpeech';
import { useScore } from './hooks/useScore';
import type { Operator, PracticeProblem } from './types';
import { practiceProblems } from './data/practiceProblems';

type TabType = 'manual' | 'calculation' | 'practice';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [currentFormula, setCurrentFormula] = useState<string | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null);

  const { abacusState, toggleBead, clearAbacus, setNumber, setBeads, switchType } = useAbacusState('2-5', 8);
  const { speakCorrect, speakWrong, speakFormula } = useSpeech();
  const { scoreState, addCorrect, addWrong, setCurrentProblem, markCompleted, isCompleted, resetScore, accuracy } = useScore();

  const {
    calculationState,
    startCalculation,
    runAllSteps,
    nextStep,
    prevStep,
    resetCalculation,
    setMode,
  } = useCalculation({
    beads: abacusState.beads,
    type: abacusState.type,
    onSetBeads: setBeads,
    onSetFormula: (formula) => {
      setCurrentFormula(formula);
      if (formula) {
        speakFormula(formula);
      }
    },
  });

  useEffect(() => {
    setMode(activeTab === 'calculation' ? 'calculation' : activeTab === 'practice' ? 'practice' : 'manual');
  }, [activeTab, setMode]);

  const handleCalculate = useCallback((op1: number, op2: number, operator: Operator) => {
    startCalculation(op1, op2, operator);
  }, [startCalculation]);

  const handleClear = useCallback(() => {
    clearAbacus();
  }, [clearAbacus]);

  const handleReset = useCallback(() => {
    resetCalculation();
    clearAbacus();
    setCurrentFormula(null);
  }, [resetCalculation, clearAbacus]);

  const handleStepReset = useCallback(() => {
    clearAbacus();
    if (calculationState.operand1 !== null) {
      setNumber(calculationState.operand1);
    }
  }, [calculationState.operand1, clearAbacus, setNumber]);

  const handleSelectProblem = useCallback((problem: PracticeProblem) => {
    setCurrentProblem(problem.id);
    clearAbacus();
  }, [setCurrentProblem, clearAbacus]);

  const handleSubmitAnswer = useCallback((answer: number) => {
    const currentProblem = scoreState.currentProblemId;
    if (!currentProblem) return;

    const problem = practiceProblems.find(p => p.id === currentProblem);

    if (problem && answer === problem.answer) {
      addCorrect();
      markCompleted(currentProblem);
      setShowCorrect(true);
      speakCorrect();
    } else {
      addWrong();
      speakWrong();
    }
  }, [scoreState.currentProblemId, addCorrect, addWrong, markCompleted, speakCorrect, speakWrong]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    handleReset();
    setCurrentProblem(null);
  }, [handleReset, setCurrentProblem]);

  const expressionText = calculationState.operand1 !== null && calculationState.operator !== null
    ? `${calculationState.operand1} ${calculationState.operator} ${calculationState.operand2 ?? ''} ${calculationState.result !== null ? '= ' + calculationState.result : ''}`
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900">
      <CorrectAnimation show={showCorrect} onComplete={() => setShowCorrect(false)} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 mb-2" style={{ fontFamily: '"KaiTi", "STKaiti", serif' }}>
            珠算模拟器
          </h1>
          <p className="text-amber-300/70 text-lg">
            传承千年珠算智慧，体验传统计算之美
          </p>
        </header>

        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-xl bg-stone-800/70 p-1 border border-stone-700/50">
            {[
              { key: 'manual' as TabType, label: '手动拨珠', icon: Hand },
              { key: 'calculation' as TabType, label: '运算演示', icon: Calculator },
              { key: 'practice' as TabType, label: '练习模式', icon: GraduationCap },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                  ${activeTab === key
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/30'
                    : 'text-amber-200/70 hover:text-amber-100 hover:bg-stone-700/50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ValueDisplay
              value={abacusState.displayValue}
              highlight={showCorrect}
            />

            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-600/20 via-amber-400/20 to-amber-600/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative">
                <AbacusCanvas
                  beads={abacusState.beads}
                  type={abacusState.type}
                  onToggleBead={toggleBead}
                  highlightedColumn={highlightedColumn}
                  disabled={calculationState.isAnimating}
                />
              </div>
            </div>

            <SettingsToggle
              type={abacusState.type}
              onTypeChange={switchType}
              disabled={calculationState.isAnimating || activeTab === 'calculation'}
            />

            {activeTab === 'calculation' && calculationState.steps.length > 0 && (
              <StepDisplay
                steps={calculationState.steps}
                currentStep={calculationState.currentStep}
                isAnimating={calculationState.isAnimating}
                onPrev={prevStep}
                onNext={nextStep}
                onPlayAll={runAllSteps}
                onReset={handleStepReset}
                disabled={calculationState.isAnimating}
              />
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <FormulaDisplay
              formula={currentFormula}
            />

            {activeTab === 'manual' && (
              <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700/50">
                <h3 className="text-amber-200 font-semibold mb-3">使用说明</h3>
                <ul className="space-y-2 text-amber-200/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>点击或拖拽珠子进行拨动</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>上珠每颗代表5，下珠每颗代表1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>珠子靠近横梁时计数</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>从右到左依次为个、十、百、千位</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'calculation' && (
              <ControlPanel
                onCalculate={handleCalculate}
                onClear={handleClear}
                onReset={handleReset}
                disabled={calculationState.isAnimating}
                currentExpression={expressionText}
              />
            )}

            {activeTab === 'practice' && (
              <>
                <ScoreDisplay
                  total={scoreState.total}
                  correct={scoreState.correct}
                  accuracy={accuracy}
                />
                <PracticePanel
                  currentProblemId={scoreState.currentProblemId}
                  completedProblems={scoreState.completedProblems}
                  onSelectProblem={handleSelectProblem}
                  onSubmitAnswer={handleSubmitAnswer}
                  currentValue={abacusState.currentValue}
                  score={scoreState.correct}
                  accuracy={accuracy}
                  onResetScore={resetScore}
                  disabled={calculationState.isAnimating}
                />
              </>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-amber-300/50 text-sm">
          <p>珠算，是中国古代劳动人民发明创造的一种简便的计算工具</p>
          <p className="mt-1">珠算口诀是中国古代劳动人民智慧的结晶</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
