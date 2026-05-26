import { useAppStore } from '@/store/appStore';
import { getRecentExamRecords, isPass } from '@/utils/examUtils';
import { BarChart3, TrendingUp, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const HistoryPage = () => {
  const { examRecords } = useAppStore();

  const recentRecords = getRecentExamRecords(examRecords, 10);

  const chartData = recentRecords.map((record, index) => ({
    name: `第${index + 1}次`,
    score: record.score,
    date: record.date.split(' ')[0],
  })).reverse();

  const averageScore = recentRecords.length > 0
    ? Math.round(recentRecords.reduce((sum, r) => sum + r.score, 0) / recentRecords.length)
    : 0;

  const passCount = recentRecords.filter((r) => isPass(r.score)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6" />
          <span>历史记录</span>
        </h2>
        <div className="text-gray-500">
          最近10次模拟考
        </div>
      </div>

      {examRecords.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无考试记录</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">平均分</p>
                  <p className="text-3xl font-bold text-blue-600">{averageScore}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">通过次数</p>
                  <p className="text-3xl font-bold text-green-600">{passCount}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">考试次数</p>
                  <p className="text-3xl font-bold text-gray-700">{examRecords.length}</p>
                </div>
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">成绩趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}分`, '得分']}
                  />
                  <ReferenceLine y={90} stroke="#10b981" strokeDasharray="5 5" label="及格线" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">考试详情</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">日期</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">得分</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">正确率</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{record.date}</td>
                      <td className="py-3 px-4">
                        <span className={`text-lg font-bold ${isPass(record.score) ? 'text-green-600' : 'text-red-600'}`}>
                          {record.score}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {Math.round((record.correctCount / record.totalQuestions) * 100)}%
                        ({record.correctCount}/{record.totalQuestions})
                      </td>
                      <td className="py-3 px-4">
                        {isPass(record.score) ? (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            通过
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600">
                            <XCircle className="w-4 h-4 mr-1" />
                            未通过
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryPage;
