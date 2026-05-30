import type { TLEData } from '@/types';

export function parseTLE(line1: string, line2: string): TLEData {
  const satNum = parseInt(line1.substring(2, 7), 10);

  const epochYear = parseInt(line1.substring(18, 20), 10);
  const epochDay = parseFloat(line1.substring(20, 32));

  const bstarStr = line1.substring(53, 61).trim();
  const bstarExp = parseInt(line1.substring(59, 61), 10);
  const bstarMantissa = parseFloat(bstarStr.substring(0, 6));
  const bstar = bstarMantissa * Math.pow(10, bstarExp) * (line1[52] === '-' ? -1 : 1);

  const inclination = parseFloat(line2.substring(8, 16));
  const raan = parseFloat(line2.substring(17, 25));
  const eccentricity = parseFloat('0.' + line2.substring(26, 33).trim());
  const argPerigee = parseFloat(line2.substring(34, 42));
  const meanAnomaly = parseFloat(line2.substring(43, 51));
  const meanMotion = parseFloat(line2.substring(52, 63));

  return {
    line1,
    line2,
    satNum,
    epochYear: epochYear < 57 ? 2000 + epochYear : 1900 + epochYear,
    epochDay,
    inclination,
    raan,
    eccentricity,
    argPerigee,
    meanAnomaly,
    meanMotion,
    bstar,
  };
}
