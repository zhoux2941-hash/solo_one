export interface Product {
  id?: number;
  name: string;
  category: string;
  unit: string;
  createdAt: string;
}

export interface InventoryBatch {
  id?: number;
  productId: number;
  batchNumber: string;
  quantity: number;
  productionDate: string;
  inboundTime: string;
}

export interface Transaction {
  id?: number;
  productId: number;
  type: 'in' | 'out';
  quantity: number;
  batchNumber: string;
  time: string;
}

export interface InventoryItem {
  product: Product;
  totalQuantity: number;
  batches: InventoryBatch[];
  isLowStock: boolean;
}

export interface StockInData {
  productId: number;
  quantity: number;
  batchNumber: string;
  productionDate: string;
}

export interface StockOutData {
  productId: number;
  quantity: number;
  batchNumber: string;
}

export const LOW_STOCK_THRESHOLD = 10;
