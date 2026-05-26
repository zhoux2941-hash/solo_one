import { useState } from 'react';
import { Package, Plus, Coins, Truck, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import { OrderCard } from '../components/OrderCard';
import { Modal, Toast } from '../components/Modal';
import { useAppStore } from '../store';
import type { PackageSize, OrderStatus } from '../types';
import { orderStatusLabels } from '../types';

type TabType = 'pending' | 'accepted' | 'delivered' | 'completed';

export function Orders() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealOrderId, setAppealOrderId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  
  const currentUser = useAppStore(state => state.getCurrentUser());
  const orders = useAppStore(state => state.orders);
  const getOrdersByStatus = useAppStore(state => state.getOrdersByStatus);
  const createOrder = useAppStore(state => state.createOrder);
  const acceptOrder = useAppStore(state => state.acceptOrder);
  const deliverOrder = useAppStore(state => state.deliverOrder);
  const confirmOrder = useAppStore(state => state.confirmOrder);
  const appealOrder = useAppStore(state => state.appealOrder);
  
  const [formData, setFormData] = useState({
    expressNo: '',
    pickupCode: '',
    packageSize: 'medium' as PackageSize,
    rewardPoints: 5,
  });
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };
  
  const handleSubmitOrder = () => {
    if (!formData.expressNo.trim()) {
      showToast('请输入快递单号', 'error');
      return;
    }
    if (!formData.pickupCode.trim()) {
      showToast('请输入取件码', 'error');
      return;
    }
    if (formData.rewardPoints < 1 || formData.rewardPoints > 10) {
      showToast('悬赏积分必须在1-10之间', 'error');
      return;
    }
    
    const result = createOrder({
      expressNo: formData.expressNo.trim(),
      pickupCode: formData.pickupCode.trim(),
      packageSize: formData.packageSize,
      rewardPoints: formData.rewardPoints,
    });
    
    if (result.success) {
      showToast(result.message);
      setShowCreateModal(false);
      setFormData({ expressNo: '', pickupCode: '', packageSize: 'medium', rewardPoints: 5 });
    } else {
      showToast(result.message, 'error');
    }
  };
  
  const handleAcceptOrder = (orderId: string) => {
    const result = acceptOrder(orderId);
    showToast(result.message, result.success ? 'success' : 'error');
  };
  
  const handleDeliverOrder = (orderId: string) => {
    const result = deliverOrder(orderId);
    showToast(result.message, result.success ? 'success' : 'error');
  };
  
  const handleConfirmOrder = (orderId: string) => {
    const result = confirmOrder(orderId);
    showToast(result.message, result.success ? 'success' : 'error');
  };
  
  const handleOpenAppeal = (orderId: string) => {
    setAppealOrderId(orderId);
    setAppealReason('');
    setShowAppealModal(true);
  };
  
  const handleSubmitAppeal = () => {
    if (!appealReason.trim()) {
      showToast('请填写申诉原因', 'error');
      return;
    }
    
    if (appealOrderId) {
      const result = appealOrder(appealOrderId, appealReason.trim());
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        setShowAppealModal(false);
        setAppealOrderId(null);
      }
    }
  };
  
  const tabs: { key: TabType; label: string; icon: typeof Package }[] = [
    { key: 'pending', label: '待接单', icon: Clock },
    { key: 'accepted', label: '已接单', icon: Truck },
    { key: 'delivered', label: '已送达', icon: CheckCircle },
    { key: 'completed', label: '已完成', icon: Package },
  ];
  
  const filteredOrders = getOrdersByStatus(activeTab as OrderStatus);
  
  const pendingCount = getOrdersByStatus('pending').length;
  const acceptedCount = getOrdersByStatus('accepted').length;
  const deliveredCount = getOrdersByStatus('delivered').length;
  
  return (
    <div className="min-h-screen pb-12">
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">订单广场</h2>
                <p className="text-gray-500 mt-1">浏览并抢单，帮同学代取快递</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>发布订单</span>
              </button>
            </div>
            
            <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-md overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const count = tab.key === 'pending' ? pendingCount : 
                             tab.key === 'accepted' ? acceptedCount :
                             tab.key === 'delivered' ? deliveredCount : 0;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === tab.key ? 'bg-white/20' : 'bg-primary-100 text-primary-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <div key={order.id} style={{ animationDelay: `${index * 0.05}s` }}>
                    <OrderCard
                      order={order}
                      onAccept={() => handleAcceptOrder(order.id)}
                      onDeliver={() => handleDeliverOrder(order.id)}
                      onConfirm={() => handleConfirmOrder(order.id)}
                      onAppeal={() => handleOpenAppeal(order.id)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 card p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">暂无{orderStatusLabels[activeTab as OrderStatus]}的订单</p>
                  <p className="text-gray-400 text-sm mt-2">切换其他标签页查看更多订单</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:w-1/3 space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-16 h-16 rounded-2xl border-4 border-primary-100"
                />
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{currentUser?.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-medium ${
                      (currentUser?.creditScore || 0) >= 60 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(currentUser?.creditScore || 0) >= 60 ? '信用良好' : '信用较低'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center">
                  <Coins className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold text-amber-600">{currentUser?.points || 0}</p>
                  <p className="text-xs text-amber-600/70 font-medium">积分余额</p>
                </div>
                <div className={`rounded-2xl p-4 text-center ${
                  (currentUser?.creditScore || 0) >= 60 
                    ? 'bg-gradient-to-br from-green-50 to-green-100' 
                    : 'bg-gradient-to-br from-red-50 to-red-100'
                }`}>
                  <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${
                    (currentUser?.creditScore || 0) >= 60 ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <p className={`text-2xl font-bold ${
                    (currentUser?.creditScore || 0) >= 60 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentUser?.creditScore || 0}
                  </p>
                  <p className={`text-xs font-medium ${
                    (currentUser?.creditScore || 0) >= 60 ? 'text-green-600/70' : 'text-red-600/70'
                  }`}>
                    信用分
                  </p>
                </div>
              </div>
              
              {(currentUser?.creditScore || 0) < 60 && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ 您的信用分已低于60分，暂时无法抢单
                  </p>
                </div>
              )}
            </div>
            
            <div className="card p-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                订单统计
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">待接单</span>
                  <span className="font-bold text-amber-600">{pendingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">进行中</span>
                  <span className="font-bold text-blue-600">{acceptedCount + deliveredCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">总订单数</span>
                  <span className="font-bold text-gray-800">{orders.length}</span>
                </div>
              </div>
            </div>
            
            <div className="card p-6 bg-gradient-to-br from-secondary-50 to-primary-50">
              <h4 className="font-bold text-gray-800 mb-3">💡 使用指南</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 发布订单需设置1-10积分悬赏</li>
                <li>• 信用分≥60分才能抢单</li>
                <li>• 完成订单+1信用分，被投诉-5分</li>
                <li>• 确认收货后积分自动转账</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="发布代取订单">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              快递单号
            </label>
            <input
              type="text"
              value={formData.expressNo}
              onChange={(e) => setFormData(prev => ({ ...prev, expressNo: e.target.value }))}
              className="input-field"
              placeholder="请输入快递单号"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              取件码
            </label>
            <input
              type="text"
              value={formData.pickupCode}
              onChange={(e) => setFormData(prev => ({ ...prev, pickupCode: e.target.value }))}
              className="input-field"
              placeholder="如：5-2-18"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              包裹大小
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as PackageSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setFormData(prev => ({ ...prev, packageSize: size }))}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.packageSize === size
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl mb-1">
                    {size === 'small' ? '📦' : size === 'medium' ? '📦📦' : '📦📦📦'}
                  </div>
                  <div className="text-sm font-medium">
                    {size === 'small' ? '小件' : size === 'medium' ? '中件' : '大件'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              悬赏积分: <span className="text-primary-600 font-bold">{formData.rewardPoints}分</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.rewardPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, rewardPoints: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1分</span>
              <span>5分</span>
              <span>10分</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              当前积分余额: <span className="font-bold text-amber-600">{currentUser?.points || 0}分</span>
            </p>
          </div>
          
          <button
            onClick={handleSubmitOrder}
            className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
          >
            <Send className="w-5 h-5" />
            <span>发布订单</span>
          </button>
        </div>
      </Modal>
      
      <Modal isOpen={showAppealModal} onClose={() => setShowAppealModal(false)} title="订单申诉">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm text-red-600">
              ⚠️ 申诉将扣除代取员5个信用分，请确保您有合理的申诉理由。
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              申诉原因
            </label>
            <textarea
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              className="input-field min-h-[120px] resize-none"
              placeholder="请详细描述您的申诉原因..."
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowAppealModal(false)}
              className="flex-1 btn-outline"
            >
              取消
            </button>
            <button
              onClick={handleSubmitAppeal}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-6 rounded-xl shadow-md active:scale-95 transition-all"
            >
              提交申诉
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
