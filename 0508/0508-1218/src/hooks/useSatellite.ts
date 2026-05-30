import { useMemo, useState, useEffect } from 'react';
import type { SatelliteInfo, LLA, SatPosition } from '@/types';
import { parseTLE } from '@/data/tle';
import { createSatRecord, propagate, getEpochDate } from '@/core/sgp4';
import { satPositionToLLA } from '@/core/coordinate';
import { useAppStore } from '@/store/appStore';

export function useSatellite(satellite: SatelliteInfo | null) {
  const satrec = useMemo(() => {
    if (!satellite) return null;
    const tle = parseTLE(satellite.tle1, satellite.tle2);
    return createSatRecord(tle);
  }, [satellite]);

  const epochDate = useMemo(() => {
    if (!satellite) return new Date();
    const tle = parseTLE(satellite.tle1, satellite.tle2);
    return getEpochDate(tle);
  }, [satellite]);

  const [position, setPosition] = useState<SatPosition | null>(null);
  const [lla, setLla] = useState<LLA | null>(null);

  const simulatedTime = useAppStore((s) => s.simulatedTime);

  useEffect(() => {
    if (!satrec || !satellite) return;
    const tsince = (simulatedTime.getTime() - epochDate.getTime()) / 60000;
    const pos = propagate(satrec, tsince);
    setPosition(pos);
    const lla2 = satPositionToLLA(pos, simulatedTime);
    setLla(lla2);
  }, [satrec, satellite, simulatedTime, epochDate]);

  return { satrec, epochDate, position, lla };
}
