import { useState, useMemo } from 'react';
import { Coins, Shield, TrendingUp, TrendingDown, Clock, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store';
import { PointsService } from '../services/PointsService';
import { CreditService } from '../services/CreditService';
import type { PointsRecord, CreditRecord } from '../types';

type RecordTab = 'points' | 'credit';

export function Profile() {
  const [activeTab, setActiveTab] = useState<RecordTab>('points');
  
  const currentUser = useAppStore(state => state.getCurrentUser());
  const users = useAppStore(state => state.users);
  const pointsRecords = useAppStore(state => state.pointsRecords);
  const creditRecords = useAppStore(state => state.creditRecords);
  const resetData = useAppStore(state => state.resetData);
  
  const pointsService = useMemo(() => new PointsService(users, pointsRecords), [users, pointsRecords]);
  const creditService = useMemo(() => new CreditService(users, creditRecords), [users, creditRecords]);
  
  const userPointsRecords = currentUser ? pointsService.getRecordsByUser(currentUser.id) : [];
  const userCreditRecords = currentUser ? creditService.getRecordsByUser(currentUser.id) : [];
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };
  
  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      resetData();
    }
  };
  
  const creditProgress = currentUser ? creditService.getCreditProgress(currentUser.id) : 0;
  const creditColor = creditProgress >= 60 ? 'from-green-400 to-green-500' : 'from-red-400 to-red-500';
  const creditStatusText = currentUser ? creditService.getStatusText(currentUser.id) : '';
  
  const totalEarned = currentUser ? pointsService.getTotalEarned(currentUser.id) : 0;
  const totalSpent = currentUser ? pointsService.getTotalSpent(currentUser.id) : 0;
  const transactionCount = currentUser ? pointsService.getTransactionCount(currentUser.id) : 0;
  
  return (
    <div className="min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="card overflow-hidden mb-8 animate-fade-in">
            <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative flex items-center gap-6">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-24 h-24 rounded-3xl border-4 border-white/30 shadow-2xl"
                />
                <div>
                  <h2 className="text-2xl font-bold mb-1">{currentUser?.name}</h2>
                  <p className="text-white/80">校园快递互助平台用户</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      (currentUser?.creditScore || 0) >= 60 
                        ? 'bg-green-400/30 text-green-100' 
                        : 'bg-red-400/30 text-red-100'
                    }`}>
                      {(currentUser?.creditScore || 0) >= 60 ? '信用良好' : '信用警告'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-amber-50 rounded-2xl">
                  <Coins className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-3xl font-bold text-amber-600">{currentUser?.points || 0}</p>
                  <p className="text-xs text-amber-600/70 font-medium mt-1">积分余额</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-2xl">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-3xl font-bold text-green-600">+{totalEarned}</p>
                  <p className="text-xs text-green-600/70 font-medium mt-1">累计获得</p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-2xl">
                  <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-3xl font-bold text-red-600">-{totalSpent}</p>
                  <p className="text-xs text-red-600/70 font-medium mt-1">累计消费</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-2xl">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-3xl font-bold text-blue-600">{transactionCount}</p>
                  <p className="text-xs text-blue-600/70 font-medium mt-1">交易次数</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-500" />
                信用分详情
              </h3>
              <span className={`text-2xl font-bold ${
                (currentUser?.creditScore || 0) >= 60 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentUser?.creditScore || 0}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">信用进度</span>
                <span className="font-medium">{creditProgress}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${creditColor} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${creditProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0</span>
                <span className="text-red-500 font-medium">60 (抢单门槛)</span>
                <span>100</span>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${
              (currentUser?.creditScore || 0) >= 60 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {(currentUser?.creditScore || 0) >= 60 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    (currentUser?.creditScore || 0) >= 60 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {(currentUser?.creditScore || 0) >= 60 
                      ? '您的信用状态良好，可以正常抢单' 
                      : '您的信用分已低于60分，暂时无法抢单'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    (currentUser?.creditScore || 0) >= 60 ? 'text-green-600/70' : 'text-red-600/70'
                  }`}>
                    完成订单 +1信用分 | 被投诉 -5信用分
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="border-b border-gray-100">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('points')}
                  className={`flex-1 py-4 px-6 font-medium transition-all ${
                    activeTab === 'points'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Coins className="w-4 h-4" />
                    积分变动记录
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('credit')}
                  className={`flex-1 py-4 px-6 font-medium transition-all ${
                    activeTab === 'credit'
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    信用分变动记录
                  </span>
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {activeTab === 'points' ? (
                userPointsRecords.length > 0 ? (
                  <div className="space-y-4">
                    {userPointsRecords.map((record: PointsRecord, index: number) => (
                      <div 
                        key={record.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          record.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {record.type === 'earn' ? (
                            <TrendingUp className="w-6 h-6 text-green-500" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {record.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            订单号: {record.orderId}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            record.type === 'earn' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {record.type === 'earn' ? '+' : ''}{record.amount}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(record.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Coins className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">暂无积分变动记录</p>
                  </div>
                )
              ) : (
                userCreditRecords.length > 0 ? (
                  <div className="space-y-4">
                    {userCreditRecords.map((record: CreditRecord, index: number) => (
                      <div 
                        key={record.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          record.type === 'increase' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {record.type === 'increase' ? (
                            <TrendingUp className="w-6 h-6 text-green-500" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {record.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            订单号: {record.orderId}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            record.type === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {record.type === 'increase' ? '+' : ''}{record.amount}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(record.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">暂无信用分变动记录</p>
                  </div>
                )
              )}
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              重置所有数据
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
