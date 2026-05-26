export type OrderStatus = 'pending' | 'accepted' | 'delivered' | 'completed' | 'appealed';

export type PackageSize = 'small' | 'medium' | 'large';

export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  creditScore: number;
}

export interface Order {
  id: string;
  expressNo: string;
  pickupCode: string;
  packageSize: PackageSize;
  rewardPoints: number;
  status: OrderStatus;
  publisherId: string;
  courierId?: string;
  createdAt: Date;
  acceptedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  appealedAt?: Date;
}

export interface PointsRecord {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  orderId: string;
  description: string;
  createdAt: Date;
}

export interface CreditRecord {
  id: string;
  userId: string;
  amount: number;
  type: 'increase' | 'decrease';
  orderId: string;
  description: string;
  createdAt: Date;
}

export const packageSizeLabels: Record<PackageSize, string> = {
  small: '小件',
  medium: '中件',
  large: '大件',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: '待接单',
  accepted: '已接单',
  delivered: '已送达',
  completed: '已完成',
  appealed: '已申诉',
};
