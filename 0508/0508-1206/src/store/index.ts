import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PointsService } from '../services/PointsService';
import { CreditService } from '../services/CreditService';
import type { User, Order, PointsRecord, CreditRecord, PackageSize, OrderStatus } from '../types';

export const ORDER_TIMEOUT_MS = 30 * 60 * 1000;

interface AppState {
  currentUserId: string;
  users: User[];
  orders: Order[];
  pointsRecords: PointsRecord[];
  creditRecords: CreditRecord[];
  
  getCurrentUser: () => User | undefined;
  getUserById: (id: string) => User | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getPointsRecordsByUser: (userId: string) => PointsRecord[];
  getCreditRecordsByUser: (userId: string) => CreditRecord[];
  
  getExpiredOrders: () => Order[];
  getOrderRemainingTime: (orderId: string) => number;
  releaseExpiredOrders: () => number;
  
  createOrder: (data: {
    expressNo: string;
    pickupCode: string;
    packageSize: PackageSize;
    rewardPoints: number;
  }) => { success: boolean; message: string };
  
  acceptOrder: (orderId: string) => { success: boolean; message: string };
  deliverOrder: (orderId: string) => { success: boolean; message: string };
  confirmOrder: (orderId: string) => { success: boolean; message: string };
  appealOrder: (orderId: string, reason: string) => { success: boolean; message: string };
  
  switchUser: (userId: string) => void;
  resetData: () => void;
}

const mockUsers: User[] = [
  {
    id: 'user1',
    name: '张同学',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    points: 102,
    creditScore: 86,
  },
  {
    id: 'user2',
    name: '李同学',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    points: 148,
    creditScore: 87,
  },
  {
    id: 'user3',
    name: '王同学',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    points: 80,
    creditScore: 55,
  },
];

const now = Date.now();

const mockOrders: Order[] = [
  {
    id: 'order1',
    expressNo: 'SF1234567890',
    pickupCode: '5-2-18',
    packageSize: 'medium',
    rewardPoints: 5,
    status: 'pending',
    publisherId: 'user1',
    createdAt: new Date(now - 3600000),
  },
  {
    id: 'order2',
    expressNo: 'YT0987654321',
    pickupCode: '3-1-05',
    packageSize: 'small',
    rewardPoints: 3,
    status: 'appealed',
    publisherId: 'user1',
    courierId: 'user2',
    createdAt: new Date(now - 7200000),
    acceptedAt: new Date(now - 5400000),
    deliveredAt: new Date(now - 3600000),
    appealedAt: new Date(now - 3600000),
  },
  {
    id: 'order3',
    expressNo: 'JD1122334455',
    pickupCode: '2-4-12',
    packageSize: 'large',
    rewardPoints: 8,
    status: 'delivered',
    publisherId: 'user2',
    courierId: 'user1',
    createdAt: new Date(now - 10800000),
    acceptedAt: new Date(now - 9000000),
    deliveredAt: new Date(now - 1800000),
  },
  {
    id: 'order4',
    expressNo: 'ZT9988776655',
    pickupCode: '1-3-08',
    packageSize: 'small',
    rewardPoints: 2,
    status: 'completed',
    publisherId: 'user2',
    courierId: 'user1',
    createdAt: new Date(now - 86400000),
    acceptedAt: new Date(now - 82800000),
    deliveredAt: new Date(now - 72000000),
    completedAt: new Date(now - 70200000),
  },
];

const mockPointsRecords: PointsRecord[] = [
  {
    id: 'pr4-publisher',
    userId: 'user2',
    amount: -2,
    type: 'spend',
    orderId: 'order4',
    description: '发布代取订单',
    createdAt: new Date(now - 70200000),
  },
  {
    id: 'pr4-courier',
    userId: 'user1',
    amount: 2,
    type: 'earn',
    orderId: 'order4',
    description: '代取订单完成',
    createdAt: new Date(now - 70200000),
  },
];

const mockCreditRecords: CreditRecord[] = [
  {
    id: 'cr1',
    userId: 'user1',
    amount: 1,
    type: 'increase',
    orderId: 'order4',
    description: '完成代取订单',
    createdAt: new Date(now - 70200000),
  },
  {
    id: 'cr2',
    userId: 'user2',
    amount: -5,
    type: 'decrease',
    orderId: 'order2',
    description: '订单被投诉申诉',
    createdAt: new Date(now - 3600000),
  },
];

const initialState = {
  currentUserId: 'user1',
  users: mockUsers,
  orders: mockOrders,
  pointsRecords: mockPointsRecords,
  creditRecords: mockCreditRecords,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      getCurrentUser: () => {
        const { currentUserId, users } = get();
        return users.find(u => u.id === currentUserId);
      },
      
      getUserById: (id: string) => {
        return get().users.find(u => u.id === id);
      },
      
      getOrdersByStatus: (status: OrderStatus) => {
        return get().orders.filter(o => o.status === status).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
      
      getPointsRecordsByUser: (userId: string) => {
        return new PointsService(get().users, get().pointsRecords).getRecordsByUser(userId);
      },
      
      getCreditRecordsByUser: (userId: string) => {
        return new CreditService(get().users, get().creditRecords).getRecordsByUser(userId);
      },
      
      getExpiredOrders: () => {
        const now = Date.now();
        return get().orders.filter(o => 
          o.status === 'accepted' && 
          o.acceptedAt && 
          now - o.acceptedAt.getTime() >= ORDER_TIMEOUT_MS
        );
      },
      
      getOrderRemainingTime: (orderId: string) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order || !order.acceptedAt || order.status !== 'accepted') {
          return 0;
        }
        const elapsed = Date.now() - order.acceptedAt.getTime();
        return Math.max(0, ORDER_TIMEOUT_MS - elapsed);
      },
      
      releaseExpiredOrders: () => {
        const { orders, users, pointsRecords } = get();
        const now = Date.now();
        let releasedCount = 0;
        
        const pointsService = new PointsService(users, pointsRecords);
        
        const updatedOrders = orders.map(order => {
          if (
            order.status === 'accepted' && 
            order.acceptedAt && 
            now - order.acceptedAt.getTime() >= ORDER_TIMEOUT_MS
          ) {
            pointsService.refundForTimeout(order.publisherId, order.rewardPoints, order.id);
            releasedCount++;
            return { ...order, status: 'pending' as OrderStatus, courierId: undefined, acceptedAt: undefined };
          }
          return order;
        });
        
        if (releasedCount > 0) {
          set({
            orders: updatedOrders,
            pointsRecords: pointsService.getRecords(),
            users: pointsService.getUsers(),
          });
        }
        
        return releasedCount;
      },
      
      createOrder: (data) => {
        const { currentUserId, users } = get();
        const pointsService = new PointsService(users, get().pointsRecords);
        
        if (!pointsService.hasEnoughPoints(currentUserId, data.rewardPoints)) {
          return { success: false, message: '积分不足，无法发布订单' };
        }
        
        const newOrder: Order = {
          id: `order${Date.now()}`,
          expressNo: data.expressNo.trim(),
          pickupCode: data.pickupCode.trim(),
          packageSize: data.packageSize,
          rewardPoints: data.rewardPoints,
          status: 'pending',
          publisherId: currentUserId,
          createdAt: new Date(),
        };
        
        set(state => ({
          orders: [newOrder, ...state.orders],
        }));
        
        return { success: true, message: '订单发布成功' };
      },
      
      acceptOrder: (orderId: string) => {
        const { currentUserId, users, orders } = get();
        const creditService = new CreditService(users, get().creditRecords);
        const order = orders.find(o => o.id === orderId);
        
        if (!creditService.canAcceptOrders(currentUserId)) {
          return { success: false, message: '信用分低于60分，无法抢单' };
        }
        
        if (!order) {
          return { success: false, message: '订单不存在' };
        }
        
        if (order.status !== 'pending') {
          return { success: false, message: '订单状态不正确' };
        }
        
        if (order.publisherId === currentUserId) {
          return { success: false, message: '不能抢自己发布的订单' };
        }
        
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status: 'accepted', courierId: currentUserId, acceptedAt: new Date() }
              : o
          ),
        }));
        
        return { success: true, message: '抢单成功' };
      },
      
      deliverOrder: (orderId: string) => {
        const { currentUserId, orders } = get();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
          return { success: false, message: '订单不存在' };
        }
        
        if (order.status !== 'accepted') {
          return { success: false, message: '订单状态不正确' };
        }
        
        if (order.courierId !== currentUserId) {
          return { success: false, message: '您不是该订单的代取员' };
        }
        
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status: 'delivered', deliveredAt: new Date() }
              : o
          ),
        }));
        
        return { success: true, message: '已标记为已送达' };
      },
      
      confirmOrder: (orderId: string) => {
        const { currentUserId, orders, users, pointsRecords, creditRecords } = get();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
          return { success: false, message: '订单不存在' };
        }
        
        if (order.status !== 'delivered') {
          return { success: false, message: '订单状态不正确' };
        }
        
        if (order.publisherId !== currentUserId) {
          return { success: false, message: '您不是该订单的发布者' };
        }
        
        if (!order.courierId) {
          return { success: false, message: '订单没有代取员' };
        }
        
        const pointsService = new PointsService(users, pointsRecords);
        const transferResult = pointsService.transfer(
          order.publisherId,
          order.courierId,
          order.rewardPoints,
          orderId
        );
        
        if (!transferResult.success) {
          return { success: false, message: transferResult.message };
        }
        
        const creditService = new CreditService(pointsService.getUsers(), creditRecords);
        const creditResult = creditService.rewardForCompletion(order.courierId, orderId);
        
        if (!creditResult.success) {
          return { success: false, message: creditResult.message };
        }
        
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status: 'completed', completedAt: new Date() }
              : o
          ),
          pointsRecords: pointsService.getRecords(),
          creditRecords: creditService.getRecords(),
          users: creditService.getUsers(),
        }));
        
        return { success: true, message: '确认收货成功，积分已转账' };
      },
      
      appealOrder: (orderId: string, reason: string) => {
        const { currentUserId, orders, users, creditRecords } = get();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
          return { success: false, message: '订单不存在' };
        }
        
        if (!['delivered', 'completed'].includes(order.status)) {
          return { success: false, message: '订单状态不正确，无法申诉' };
        }
        
        if (order.publisherId !== currentUserId) {
          return { success: false, message: '您不是该订单的发布者' };
        }
        
        if (!order.courierId) {
          return { success: false, message: '订单没有代取员' };
        }
        
        const creditService = new CreditService(users, creditRecords);
        const result = creditService.penalizeForAppeal(order.courierId, orderId, reason);
        
        if (!result.success) {
          return { success: false, message: result.message };
        }
        
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status: 'appealed', appealedAt: new Date() }
              : o
          ),
          creditRecords: creditService.getRecords(),
          users: creditService.getUsers(),
        }));
        
        return { success: true, message: '申诉成功，代取员信用分已扣除' };
      },
      
      switchUser: (userId: string) => {
        set({ currentUserId: userId });
      },
      
      resetData: () => {
        set(initialState);
      },
    }),
    {
      name: 'campus-express-storage',
      version: 1,
      migrate: (state: unknown) => {
        const s = state as AppState;
        return {
          ...s,
          orders: s.orders.map(o => ({ ...o, createdAt: new Date(o.createdAt) })),
          pointsRecords: s.pointsRecords.map(r => ({ ...r, createdAt: new Date(r.createdAt) })),
          creditRecords: s.creditRecords.map(r => ({ ...r, createdAt: new Date(r.createdAt) })),
        };
      },
    }
  )
);
