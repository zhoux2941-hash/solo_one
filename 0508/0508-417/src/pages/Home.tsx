import React, { useState, useEffect } from 'react';
import { Mail, Brain, Github, Info } from 'lucide-react';
import { EmailInput } from '../components/EmailInput';
import { ClassificationResult } from '../components/ClassificationResult';
import { WordBagBreakdown } from '../components/WordBagBreakdown';
import { ModelControl } from '../components/ModelControl';
import { classifier } from '../utils/classifier';
import { ClassificationResult as ClassificationResultType } from '../types/classifier';

const Home: React.FC = () => {
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [result, setResult] = useState<ClassificationResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [userSampleCount, setUserSampleCount] = useState({ spam: 0, ham: 0 });
  const [totalSampleCount, setTotalSampleCount] = useState({ spam: 0, ham: 0, total: 0 });
  const [vocabularySize, setVocabularySize] = useState(0);
  const [userWeight, setUserWeight] = useState(50);

  useEffect(() => {
    updateModelStats();
  }, []);

  const updateModelStats = () => {
    setAccuracy(classifier.calculateAccuracy());
    setUserSampleCount(classifier.getUserSampleCount());
    setTotalSampleCount(classifier.getTotalSampleCount());
    setVocabularySize(classifier.getVocabularySize());
    setUserWeight(classifier.getUserWeight());
  };

  const handleClassify = (text: string) => {
    setIsLoading(true);
    setCurrentEmail(text);
    
    setTimeout(() => {
      const classificationResult = classifier.classify(text);
      setResult(classificationResult);
      setIsLoading(false);
    }, 500);
  };

  const handleMislabel = (correctLabel: 'spam' | 'ham') => {
    if (currentEmail) {
      classifier.addTrainingSample(currentEmail, correctLabel);
      updateModelStats();
      
      const newResult = classifier.classify(currentEmail);
      setResult(newResult);
    }
  };

  const handleReset = () => {
    classifier.resetToPreset();
    setResult(null);
    updateModelStats();
  };

  const handleWeightChange = (weight: number) => {
    classifier.setUserWeight(weight);
    updateModelStats();
    if (currentEmail && result) {
      const newResult = classifier.classify(currentEmail);
      setResult(newResult);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  垃圾邮件分类器
                </h1>
                <p className="text-xs text-gray-500">基于朴素贝叶斯算法</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <Brain className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600 font-medium">
                  准确率: {Math.round(accuracy * 100)}%
                </span>
              </div>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            智能邮件分类系统
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            输入邮件内容，系统将使用朴素贝叶斯算法分析每个词的概率贡献，
            判断邮件是否为垃圾邮件，并展示详细的词袋分解过程。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <EmailInput onClassify={handleClassify} isLoading={isLoading} />
            <ModelControl
              accuracy={accuracy}
              userSampleCount={userSampleCount}
              totalSampleCount={totalSampleCount}
              vocabularySize={vocabularySize}
              hasResult={!!result}
              userWeight={userWeight}
              onMislabel={handleMislabel}
              onReset={handleReset}
              onWeightChange={handleWeightChange}
            />
          </div>

          <div className="space-y-6">
            <ClassificationResult result={result} />
            <WordBagBreakdown contributions={result?.wordContributions || []} />
          </div>
        </div>

        <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">算法原理说明</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>朴素贝叶斯分类器</strong> 基于贝叶斯定理，假设特征词之间相互独立：
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  P(垃圾|邮件) = P(邮件|垃圾) × P(垃圾) / P(邮件)
                </div>
                <p>
                  系统使用<strong>对数概率</strong>避免数值下溢，对未登录词采用<strong>拉普拉斯平滑</strong>处理。
                  点击「报告误判」可将当前邮件加入训练集，模型会自动重新训练。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>基于 UCI Spambase 数据集的 100 个特征词训练 · 支持在线学习</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
