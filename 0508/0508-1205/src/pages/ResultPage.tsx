import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { isPass } from '@/utils/examUtils';
import { CheckCircle, XCircle, Home, RotateCcw, BarChart3 } from 'lucide-react';

const ResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const { examRecords } = useAppStore();

  const examRecord = examRecords.find((r) => r.id === id);

  if (!examRecord) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">未找到该考试记录</p>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  const pass = isPass(examRecord.score);
  const wrongRate = ((examRecord.totalQuestions - examRecord.correctCount) / examRecord.totalQuestions) * 100;

  return (
    <div className="space-y-6">
      <div className={`card text-center py-8 ${pass ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${pass ? 'bg-green-100' : 'bg-red-100'}`}>
          {pass ? (
            <CheckCircle className="w-12 h-12 text-green-600" />
          ) : (
            <XCircle className="w-12 h-12 text-red-600" />
          )}
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${pass ? 'text-green-700' : 'text-red-700'}`}>
          {pass ? '恭喜通过！' : '未能通过'}
        </h2>
        <div className="text-5xl font-bold mb-2">
          <span className={pass ? 'text-green-600' : 'text-red-600'}>{examRecord.score}</span>
          <span className="text-gray-400 text-2xl">分</span>
        </div>
        <p className="text-gray-600">
          {pass ? '继续保持，你已经很熟练了！' : '别灰心，继续努力！'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">正确率</p>
            <p className="text-3xl font-bold text-green-600">
              {Math.round((examRecord.correctCount / examRecord.totalQuestions) * 100)}%
            </p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">答对题目</p>
            <p className="text-3xl font-bold text-green-600">{examRecord.correctCount}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">答错题目</p>
            <p className="text-3xl font-bold text-red-600">
              {examRecord.totalQuestions - examRecord.correctCount}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">各章节得分率</h3>
        <div className="space-y-4">
          {Object.entries(examRecord.chapterScores).map(([chapter, data]) => {
            const rate = Math.round((data.correct / data.total) * 100);
            return (
              <div key={chapter}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{chapter}</span>
                  <span className={rate >= 90 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                    {rate}% ({data.correct}/{data.total})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${rate >= 90 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">错题分布</h3>
        <div className="flex flex-wrap gap-2">
          {examRecord.wrongQuestions.slice(0, 20).map((id, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
            >
              第{id}题
            </span>
          ))}
          {examRecord.wrongQuestions.length > 20 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              +{examRecord.wrongQuestions.length - 20}道
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <Link to="/" className="btn-secondary inline-flex items-center space-x-2">
          <Home className="w-5 h-5" />
          <span>返回首页</span>
        </Link>
        <Link to="/exam" className="btn-primary inline-flex items-center space-x-2">
          <RotateCcw className="w-5 h-5" />
          <span>再来一次</span>
        </Link>
        <Link to="/wrong-questions" className="btn-secondary inline-flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>查看错题</span>
        </Link>
      </div>
    </div>
  );
};

export default ResultPage;
