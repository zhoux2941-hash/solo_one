import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchRoles, fetchColorSymbolism } from '../services/api';

export const useFetchData = () => {
  const { setRoles, setColorSymbolism, setLoading, setError } = useStore();

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [roles, colorSymbolism] = await Promise.all([
          fetchRoles(),
          fetchColorSymbolism(),
        ]);
        
        setRoles(roles);
        setColorSymbolism(colorSymbolism);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [setRoles, setColorSymbolism, setLoading, setError]);
};
