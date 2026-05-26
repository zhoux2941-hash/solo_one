import type { User, PointsRecord } from '../types';

export interface TransferResult {
  success: boolean;
  message: string;
  publisherRecord?: PointsRecord;
  courierRecord?: PointsRecord;
  updatedUsers: User[];
}

export interface SpendResult {
  success: boolean;
  message: string;
  record?: PointsRecord;
  updatedUser?: User;
}

export interface EarnResult {
  success: boolean;
  message: string;
  record?: PointsRecord;
  updatedUser?: User;
}

export class PointsService {
  private users: User[];
  private records: PointsRecord[];

  constructor(users: User[], records: PointsRecord[]) {
    this.users = [...users];
    this.records = [...records];
  }

  spend(userId: string, amount: number, orderId: string, description: string): SpendResult {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: '用户不存在' };
    }

    const user = this.users[userIndex];
    if (user.points < amount) {
      return { success: false, message: '积分不足' };
    }

    const record: PointsRecord = {
      id: `pr${Date.now()}`,
      userId,
      amount: -amount,
      type: 'spend',
      orderId,
      description,
      createdAt: new Date(),
    };

    const updatedUser = { ...user, points: user.points - amount };
    this.users[userIndex] = updatedUser;
    this.records.unshift(record);

    return {
      success: true,
      message: '积分扣除成功',
      record,
      updatedUser,
    };
  }

  earn(userId: string, amount: number, orderId: string, description: string): EarnResult {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: '用户不存在' };
    }

    const record: PointsRecord = {
      id: `pr${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      amount,
      type: 'earn',
      orderId,
      description,
      createdAt: new Date(),
    };

    const user = this.users[userIndex];
    const updatedUser = { ...user, points: user.points + amount };
    this.users[userIndex] = updatedUser;
    this.records.unshift(record);

    return {
      success: true,
      message: '积分增加成功',
      record,
      updatedUser,
    };
  }

  transfer(
    publisherId: string,
    courierId: string,
    amount: number,
    orderId: string
  ): TransferResult {
    const publisherIndex = this.users.findIndex(u => u.id === publisherId);
    const courierIndex = this.users.findIndex(u => u.id === courierId);

    if (publisherIndex === -1) {
      return { success: false, message: '发布者不存在', updatedUsers: [] };
    }
    if (courierIndex === -1) {
      return { success: false, message: '代取员不存在', updatedUsers: [] };
    }

    const publisher = this.users[publisherIndex];
    if (publisher.points < amount) {
      return { success: false, message: '发布者积分不足，无法完成转账', updatedUsers: [] };
    }

    const now = Date.now();

    const publisherRecord: PointsRecord = {
      id: `pr${now}`,
      userId: publisherId,
      amount: -amount,
      type: 'spend',
      orderId,
      description: '发布代取订单',
      createdAt: new Date(),
    };

    const courierRecord: PointsRecord = {
      id: `pr${now + 1}`,
      userId: courierId,
      amount,
      type: 'earn',
      orderId,
      description: '代取订单完成',
      createdAt: new Date(),
    };

    const updatedPublisher = { ...publisher, points: publisher.points - amount };
    const courier = this.users[courierIndex];
    const updatedCourier = { ...courier, points: courier.points + amount };

    this.users[publisherIndex] = updatedPublisher;
    this.users[courierIndex] = updatedCourier;
    this.records.unshift(publisherRecord, courierRecord);

    return {
      success: true,
      message: '积分转账成功',
      publisherRecord,
      courierRecord,
      updatedUsers: [updatedPublisher, updatedCourier],
    };
  }

  refundForTimeout(publisherId: string, amount: number, orderId: string): SpendResult {
    const userIndex = this.users.findIndex(u => u.id === publisherId);
    if (userIndex === -1) {
      return { success: false, message: '用户不存在' };
    }

    const record: PointsRecord = {
      id: `pr${Date.now()}-refund`,
      userId: publisherId,
      amount: amount,
      type: 'earn',
      orderId,
      description: '订单超时释放，积分退还',
      createdAt: new Date(),
    };

    const user = this.users[userIndex];
    const updatedUser = { ...user, points: user.points + amount };
    this.users[userIndex] = updatedUser;
    this.records.unshift(record);

    return {
      success: true,
      message: '积分退还成功',
      record,
      updatedUser,
    };
  }

  getUsers(): User[] {
    return this.users;
  }

  getRecords(): PointsRecord[] {
    return this.records;
  }

  getRecordsByUser(userId: string): PointsRecord[] {
    return this.records
      .filter(r => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getBalance(userId: string): number {
    const user = this.users.find(u => u.id === userId);
    return user?.points ?? 0;
  }

  hasEnoughPoints(userId: string, amount: number): boolean {
    const user = this.users.find(u => u.id === userId);
    return user ? user.points >= amount : false;
  }

  getTotalEarned(userId: string): number {
    return this.records
      .filter(r => r.userId === userId && r.type === 'earn')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  getTotalSpent(userId: string): number {
    return this.records
      .filter(r => r.userId === userId && r.type === 'spend')
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  }

  getTransactionCount(userId: string): number {
    return this.records.filter(r => r.userId === userId).length;
  }
}
