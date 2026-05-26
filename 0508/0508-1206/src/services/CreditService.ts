import type { User, CreditRecord } from '../types';

export interface CreditResult {
  success: boolean;
  message: string;
  record?: CreditRecord;
  updatedUser?: User;
  canAcceptOrders?: boolean;
}

export class CreditService {
  private users: User[];
  private records: CreditRecord[];
  private readonly MIN_CREDIT_FOR_ACCEPT = 60;
  private readonly COMPLETE_ORDER_BONUS = 1;
  private readonly APPEAL_PENALTY = 5;

  constructor(users: User[], records: CreditRecord[]) {
    this.users = [...users];
    this.records = [...records];
  }

  addCredit(userId: string, amount: number, orderId: string, description: string): CreditResult {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: '用户不存在' };
    }

    const record: CreditRecord = {
      id: `cr${Date.now()}`,
      userId,
      amount,
      type: 'increase',
      orderId,
      description,
      createdAt: new Date(),
    };

    const user = this.users[userIndex];
    const newCreditScore = Math.min(100, user.creditScore + amount);
    const updatedUser = { ...user, creditScore: newCreditScore };
    this.users[userIndex] = updatedUser;
    this.records.unshift(record);

    return {
      success: true,
      message: '信用分增加成功',
      record,
      updatedUser,
      canAcceptOrders: this.canAcceptOrders(userId),
    };
  }

  deductCredit(userId: string, amount: number, orderId: string, description: string): CreditResult {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: '用户不存在' };
    }

    const record: CreditRecord = {
      id: `cr${Date.now()}`,
      userId,
      amount: -amount,
      type: 'decrease',
      orderId,
      description,
      createdAt: new Date(),
    };

    const user = this.users[userIndex];
    const newCreditScore = Math.max(0, user.creditScore - amount);
    const updatedUser = { ...user, creditScore: newCreditScore };
    this.users[userIndex] = updatedUser;
    this.records.unshift(record);

    const canAccept = this.canAcceptOrders(userId);

    return {
      success: true,
      message: '信用分扣除成功',
      record,
      updatedUser,
      canAcceptOrders: canAccept,
    };
  }

  rewardForCompletion(userId: string, orderId: string): CreditResult {
    return this.addCredit(
      userId,
      this.COMPLETE_ORDER_BONUS,
      orderId,
      '完成代取订单'
    );
  }

  penalizeForAppeal(userId: string, orderId: string, reason: string): CreditResult {
    return this.deductCredit(
      userId,
      this.APPEAL_PENALTY,
      orderId,
      `订单被投诉：${reason}`
    );
  }

  canAcceptOrders(userId: string): boolean {
    const user = this.users.find(u => u.id === userId);
    return user ? user.creditScore >= this.MIN_CREDIT_FOR_ACCEPT : false;
  }

  getCreditScore(userId: string): number {
    const user = this.users.find(u => u.id === userId);
    return user?.creditScore ?? 0;
  }

  getCreditProgress(userId: string): number {
    return Math.min(100, this.getCreditScore(userId));
  }

  getCreditStatus(userId: string): 'good' | 'warning' | 'poor' {
    const score = this.getCreditScore(userId);
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'poor';
  }

  getStatusText(userId: string): string {
    const status = this.getCreditStatus(userId);
    switch (status) {
      case 'good': return '信用优秀';
      case 'warning': return '信用良好';
      case 'poor': return '信用较低';
    }
  }

  getUsers(): User[] {
    return this.users;
  }

  getRecords(): CreditRecord[] {
    return this.records;
  }

  getRecordsByUser(userId: string): CreditRecord[] {
    return this.records
      .filter(r => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getMinCreditForAccept(): number {
    return this.MIN_CREDIT_FOR_ACCEPT;
  }

  getCompleteOrderBonus(): number {
    return this.COMPLETE_ORDER_BONUS;
  }

  getAppealPenalty(): number {
    return this.APPEAL_PENALTY;
  }
}
