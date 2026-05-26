import { useAppStore } from '@/store/appStore';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, AlertTriangle, Clock, BarChart3, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const HomePage = () => {
  const { studyStats, wrongQuestions, examRecords } = useAppStore();

  const quickActions = [
    { path: '/practice', label: '顺序练习', icon: FileText, color: 'bg-blue-500', desc: '每次20题，循序渐进' },
    { path: '/exam', label: '模拟考试', icon: Clock, color: 'bg-orange-500', desc: '随机100题，90分及格' },
    { path: '/wrong-questions', label: '错题本', icon: AlertTriangle, color: 'bg-red-500', desc: `共${wrongQuestions.length}道错题` },
    { path: '/history', label: '历史记录', icon: BarChart3, color: 'bg-green-500', desc: `共${examRecords.length}次考试` },
  ];

  const accuracy = studyStats.totalPractice > 0 
    ? Math.round((studyStats.correctCount / studyStats.totalPractice) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="card bg-gradient-to-r from-blue-800 to-blue-600 text-white">
        <h1 className="text-2xl font-bold mb-2">欢迎使用科目一练习系统</h1>
        <p className="text-blue-100">高效练习，轻松通过驾照考试</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">累计练习</p>
              <p className="text-3xl font-bold text-gray-800">{studyStats.totalPractice}</p>
            </div>
            <BookOpen className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">正确率</p>
              <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">答对题目</p>
              <p className="text-3xl font-bold text-green-600">{studyStats.correctCount}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">错题数量</p>
              <p className="text-3xl font-bold text-red-600">{studyStats.wrongCount}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map(({ path, label, icon: Icon, color, desc }) => (
          <Link
            key={path}
            to={path}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{label}</h3>
            <p className="text-gray-500 text-sm">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
