import { Clock, Package, User, MapPin, Coins, AlertTriangle, Hourglass } from 'lucide-react';
import type { Order } from '../types';
import { packageSizeLabels, orderStatusLabels } from '../types';
import { useAppStore } from '../store';
import { useState, useEffect } from 'react';

interface OrderCardProps {
  order: Order;
  onAccept?: () => void;
  onDeliver?: () => void;
  onConfirm?: () => void;
  onAppeal?: () => void;
}

export function OrderCard({ order, onAccept, onDeliver, onConfirm, onAppeal }: OrderCardProps) {
  const currentUser = useAppStore(state => state.getCurrentUser());
  const getUserById = useAppStore(state => state.getUserById);
  const getOrderRemainingTime = useAppStore(state => state.getOrderRemainingTime);
  const [showActions, setShowActions] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  useEffect(() => {
    if (order.status === 'accepted') {
      const updateTime = () => {
        setRemainingTime(getOrderRemainingTime(order.id));
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
    return;
  }, [order.id, order.status, getOrderRemainingTime]);
  
  const formatRemainingTime = (ms: number) => {
    if (ms <= 0) return '即将超时';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
  };
  
  const publisher = getUserById(order.publisherId);
  const courier = order.courierId ? getUserById(order.courierId) : null;
  
  const statusClass = `status-${order.status}`;
  
  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };
  
  const canAccept = order.status === 'pending' && 
                   currentUser?.id !== order.publisherId && 
                   (currentUser?.creditScore || 0) >= 60;
  
  const canDeliver = order.status === 'accepted' && 
                    order.courierId === currentUser?.id;
  
  const canConfirm = order.status === 'delivered' && 
                    order.publisherId === currentUser?.id;
  
  const canAppeal = ['delivered', 'completed'].includes(order.status) && 
                   order.publisherId === currentUser?.id &&
                   order.status !== 'appealed';
  
  const packageSizeIcon = (size: string) => {
    switch (size) {
      case 'small': return '📦';
      case 'medium': return '📦📦';
      case 'large': return '📦📦📦';
      default: return '📦';
    }
  };
  
  return (
    <div 
      className="card card-hover animate-slide-up overflow-hidden group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-2xl">
              {packageSizeIcon(order.packageSize)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{order.expressNo}</span>
                <span className={`badge ${statusClass}`}>
                  {orderStatusLabels[order.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(order.createdAt)}</span>
              </div>
              {order.status === 'accepted' && (
                <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${
                  remainingTime < 300000 ? 'text-red-500 animate-pulse-soft' : 'text-amber-600'
                }`}>
                  <Hourglass className="w-3.5 h-3.5" />
                  <span>剩余 {formatRemainingTime(remainingTime)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
              <Coins className="w-5 h-5" />
              {order.rewardPoints}
            </div>
            <div className="text-xs text-gray-400">悬赏积分</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span>取件码</span>
            </div>
            <p className="font-mono font-bold text-gray-800">{order.pickupCode}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Package className="w-4 h-4 text-secondary-500" />
              <span>包裹大小</span>
            </div>
            <p className="font-bold text-gray-800">{packageSizeLabels[order.packageSize]}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>发布者: {publisher?.name}</span>
          </div>
          {courier && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-secondary-500" />
              <span>代取员: {courier.name}</span>
            </div>
          )}
        </div>
        
        {order.status === 'pending' && (currentUser?.creditScore || 0) < 60 && currentUser?.id !== order.publisherId && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>您的信用分低于60分，无法抢单</span>
          </div>
        )}
        
        <div className={`flex gap-2 transition-all duration-300 ${showActions || canAccept || canDeliver || canConfirm ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          {canAccept && (
            <button
              onClick={onAccept}
              className="flex-1 btn-secondary text-sm py-2"
            >
              立即抢单
            </button>
          )}
          
          {canDeliver && (
            <button
              onClick={onDeliver}
              className="flex-1 btn-secondary text-sm py-2"
            >
              标记送达
            </button>
          )}
          
          {canConfirm && (
            <button
              onClick={onConfirm}
              className="flex-1 btn-primary text-sm py-2"
            >
              确认收货
            </button>
          )}
          
          {canAppeal && (
            <button
              onClick={onAppeal}
              className="px-4 py-2 text-sm text-red-500 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-all"
            >
              申诉
            </button>
          )}
        </div>
      </div>
      
      <div className="h-1 bg-gradient-to-r from-primary-500 to-secondary-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
}
