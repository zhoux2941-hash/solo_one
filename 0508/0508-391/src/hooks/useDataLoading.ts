import { useEffect } from 'react';
import { useStarMapStore } from '../store/useStarMapStore';
import type { Star, Constellation, Connection } from '../../shared/types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export const useDataLoading = () => {
  const {
    setStars,
    setConstellations,
    setConnections,
    setLoading,
    setError,
  } = useStarMapStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [starsRes, constellationsRes, connectionsRes] = await Promise.all([
          fetch(`${API_BASE}/stars?magnitude_lte=6`),
          fetch(`${API_BASE}/constellations`),
          fetch(`${API_BASE}/connections`),
        ]);

        if (!starsRes.ok || !constellationsRes.ok || !connectionsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const stars = await starsRes.json() as Star[];
        const constellations = await constellationsRes.json() as Constellation[];
        const connections = await connectionsRes.json() as Connection[];

        setStars(stars);
        setConstellations(constellations);
        setConnections(connections);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setStars, setConstellations, setConnections, setLoading, setError]);
};
