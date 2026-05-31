import { useState, useCallback, useEffect } from 'react';
import { Product } from '@/types';
import { addProduct, getProducts, deleteProduct } from '@/db';
import { formatDateTime } from '@/utils/helpers';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载商品失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddProduct = useCallback(async (data: Omit<Product, 'id' | 'createdAt'>) => {
    setError(null);
    try {
      const product: Omit<Product, 'id'> = {
        ...data,
        createdAt: formatDateTime(new Date()),
      };
      await addProduct(product);
      await loadProducts();
      return { success: true, message: '商品添加成功' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加商品失败';
      setError(message);
      return { success: false, message };
    }
  }, [loadProducts]);

  const handleDeleteProduct = useCallback(async (id: number) => {
    setError(null);
    try {
      await deleteProduct(id);
      await loadProducts();
      return { success: true, message: '商品删除成功' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除商品失败';
      setError(message);
      return { success: false, message };
    }
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    loadProducts,
    addProduct: handleAddProduct,
    deleteProduct: handleDeleteProduct,
  };
}
