import { openDB, IDBPDatabase } from 'idb';
import { Product, InventoryBatch, Transaction, StockInData, StockOutData, InventoryItem } from '@/types';
import { calculateTotalQuantity, isLowStock, formatDateTime } from '@/utils/helpers';

const DB_NAME = 'inventoryDB';
const DB_VERSION = 1;

let db: IDBPDatabase | null = null;

export async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        productStore.createIndex('name', 'name', { unique: true });
        productStore.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('inventory')) {
        const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
        inventoryStore.createIndex('productId', 'productId');
        inventoryStore.createIndex('batchNumber', 'batchNumber');
        inventoryStore.createIndex('inboundTime', 'inboundTime');
      }

      if (!db.objectStoreNames.contains('transactions')) {
        const transactionStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        transactionStore.createIndex('productId', 'productId');
        transactionStore.createIndex('type', 'type');
        transactionStore.createIndex('time', 'time');
      }
    },
  });

  return db;
}

export async function getDB(): Promise<IDBPDatabase> {
  if (!db) {
    return initDB();
  }
  return db;
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<number> {
  const database = await getDB();
  return database.add('products', product) as Promise<number>;
}

export async function getProducts(): Promise<Product[]> {
  const database = await getDB();
  const products = await database.getAll('products');
  return products.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteProduct(id: number): Promise<void> {
  const database = await getDB();
  const tx = database.transaction(['products', 'inventory', 'transactions'], 'readwrite');
  
  await tx.objectStore('products').delete(id);
  
  const inventoryIndex = tx.objectStore('inventory').index('productId');
  const inventoryCursor = await inventoryIndex.openCursor(IDBKeyRange.only(id));
  let cursor = inventoryCursor;
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  
  const txIndex = tx.objectStore('transactions').index('productId');
  const txCursor = await txIndex.openCursor(IDBKeyRange.only(id));
  let txCursorItem = txCursor;
  while (txCursorItem) {
    await txCursorItem.delete();
    txCursorItem = await txCursorItem.continue();
  }
  
  await tx.done;
}

export async function stockIn(data: StockInData): Promise<void> {
  const database = await getDB();
  const tx = database.transaction(['inventory', 'transactions'], 'readwrite');
  
  const batchIndex = tx.objectStore('inventory').index('batchNumber');
  const existingBatches = await batchIndex.getAll(IDBKeyRange.only(data.batchNumber)) as InventoryBatch[];
  const existingBatch = existingBatches.find(b => b.productId === data.productId);
  
  if (existingBatch) {
    existingBatch.quantity += data.quantity;
    if (data.productionDate) {
      existingBatch.productionDate = data.productionDate;
    }
    existingBatch.inboundTime = formatDateTime(new Date());
    await tx.objectStore('inventory').put(existingBatch);
  } else {
    const inventoryBatch: InventoryBatch = {
      productId: data.productId,
      batchNumber: data.batchNumber,
      quantity: data.quantity,
      productionDate: data.productionDate,
      inboundTime: formatDateTime(new Date()),
    };
    await tx.objectStore('inventory').add(inventoryBatch);
  }
  
  const transaction: Transaction = {
    productId: data.productId,
    type: 'in',
    quantity: data.quantity,
    batchNumber: data.batchNumber,
    time: formatDateTime(new Date()),
  };
  
  await tx.objectStore('transactions').add(transaction);
  
  await tx.done;
}

export async function stockOut(data: StockOutData): Promise<{ success: boolean; message: string }> {
  const database = await getDB();
  const tx = database.transaction(['inventory', 'transactions'], 'readwrite');
  
  const batchIndex = tx.objectStore('inventory').index('batchNumber');
  const matchingBatches = await batchIndex.getAll(IDBKeyRange.only(data.batchNumber)) as InventoryBatch[];
  const targetBatch = matchingBatches.find(b => b.productId === data.productId);
  
  if (!targetBatch) {
    return { success: false, message: `批次 ${data.batchNumber} 不存在或不属于该商品` };
  }
  
  if (targetBatch.quantity < data.quantity) {
    return { success: false, message: `批次 ${data.batchNumber} 库存不足，当前批次库存: ${targetBatch.quantity}` };
  }
  
  const newQuantity = targetBatch.quantity - data.quantity;
  if (newQuantity <= 0) {
    await tx.objectStore('inventory').delete(targetBatch.id!);
  } else {
    await tx.objectStore('inventory').put({ ...targetBatch, quantity: newQuantity });
  }
  
  const transaction: Transaction = {
    productId: data.productId,
    type: 'out',
    quantity: data.quantity,
    batchNumber: data.batchNumber,
    time: formatDateTime(new Date()),
  };
  
  await tx.objectStore('transactions').add(transaction);
  
  await tx.done;
  return { success: true, message: '出库成功' };
}

export async function getInventory(): Promise<InventoryItem[]> {
  const database = await getDB();
  const products = await getProducts();
  const allBatches = await database.getAll('inventory') as InventoryBatch[];
  
  const inventoryItems: InventoryItem[] = products.map(product => {
    const batches = allBatches
      .filter(batch => batch.productId === product.id)
      .sort((a, b) => new Date(a.inboundTime).getTime() - new Date(b.inboundTime).getTime());
    
    const totalQuantity = calculateTotalQuantity(batches);
    
    return {
      product,
      totalQuantity,
      batches,
      isLowStock: isLowStock(totalQuantity),
    };
  });
  
  return inventoryItems.sort((a, b) => {
    if (a.isLowStock && !b.isLowStock) return -1;
    if (!a.isLowStock && b.isLowStock) return 1;
    return b.totalQuantity - a.totalQuantity;
  });
}

export async function getProductBatches(productId: number): Promise<InventoryBatch[]> {
  const database = await getDB();
  const inventoryIndex = database.transaction('inventory').store.index('productId');
  const batches = await inventoryIndex.getAll(IDBKeyRange.only(productId)) as InventoryBatch[];
  return batches.sort((a, b) => 
    new Date(a.inboundTime).getTime() - new Date(b.inboundTime).getTime()
  );
}
