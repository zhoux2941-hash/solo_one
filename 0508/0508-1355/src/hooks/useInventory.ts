import { useState, useCallback, useEffect } from 'react';
import { InventoryItem, StockInData, StockOutData } from '@/types';
import { stockIn, stockOut, getInventory } from '@/db';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载库存失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStockIn = useCallback(async (data: StockInData) => {
    setError(null);
    try {
      await stockIn(data);
      await loadInventory();
      return { success: true, message: '入库成功' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '入库失败';
      setError(message);
      return { success: false, message };
    }
  }, [loadInventory]);

  const handleStockOut = useCallback(async (data: StockOutData) => {
    setError(null);
    try {
      const result = await stockOut(data);
      if (result.success) {
        await loadInventory();
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '出库失败';
      setError(message);
      return { success: false, message };
    }
  }, [loadInventory]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    inventory,
    loading,
    error,
    loadInventory,
    stockIn: handleStockIn,
    stockOut: handleStockOut,
  };
}
