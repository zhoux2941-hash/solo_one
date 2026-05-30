import type { TLEData, SatPosition } from '@/types';
import { DEG2RAD, RAD2DEG, TWOPI, MU, J2, EARTH_RADIUS_KM, CK2, AE, XKE } from './constants';
import { mod2pi, fmod2p } from '@/utils/math';

interface SGP4Init {
  no: number;
  a: number;
  cosio: number;
  sinio: number;
  con41: number;
  x1mth2: number;
  x3thm1: number;
  x7thm1: number;
  t2cof: number;
  t4cof: number;
  t5cof: number;
  gsto: number;
  inclo: number;
  ecco: number;
  nodeo: number;
  argpo: number;
  mo: number;
  bstar: number;
  method: string;
}

function initl(tle: TLEData): { ao: number; con42: number; cosio: number; sinio: number; no: number; gsto: number } {
  const ecco = tle.eccentricity;
  const epochStart = new Date(Date.UTC(tle.epochYear, 0, 1));
  const epochMs = epochStart.getTime() + (tle.epochDay - 1) * 86400000;

  const daysSinceJ2000 = (epochMs - new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime()) / 86400000;
  const gsto = (67310.54841 + 8640184.812866 * (daysSinceJ2000 / 36525) + 0.093104 * Math.pow(daysSinceJ2000 / 36525, 2) - 6.2e-6 * Math.pow(daysSinceJ2000 / 36525, 3)) % 86400;
  const gstoRad = (gsto * Math.PI / 43200) % TWOPI;

  const xpdotp = 1440 / (2 * Math.PI);
  const noKozai = tle.meanMotion / xpdotp;

  const cosio = Math.cos(tle.inclination * DEG2RAD);
  const sinio = Math.sin(tle.inclination * DEG2RAD);

  const ao = Math.pow(MU / (noKozai * noKozai), 1 / 3);
  const con42 = 1.5 * J2 / (ao * ao * (1 - ecco * ecco) * (1 - ecco * ecco)) * (3 * cosio * cosio - 1) / 8;

  const no = noKozai;

  return { ao, con42, cosio, sinio, no, gsto: gstoRad };
}

function sgp4init(tle: TLEData): SGP4Init {
  const { ao, cosio, sinio, no, gsto } = initl(tle);

  const ecco = tle.eccentricity;
  const inclo = tle.inclination * DEG2RAD;
  const nodeo = tle.raan * DEG2RAD;
  const argpo = tle.argPerigee * DEG2RAD;
  const mo = tle.meanAnomaly * DEG2RAD;
  const bstar = tle.bstar;

  const x1mth2 = 1 - cosio * cosio;
  const x3thm1 = 3 * cosio * cosio - 1;
  const x7thm1 = 7 * cosio * cosio - 1;

  const t2cof = 1.5 * CK2 * x3thm1 / (ao * ao * (1 - ecco * ecco) * (1 - ecco * ecco)) * 0.5;
  const t4cof = 3 * CK2 * CK2 * x7thm1 / (ao * ao * ao * ao * Math.pow(1 - ecco * ecco, 4)) * (3 - 14 * cosio * cosio) / 16;
  const t5cof = 3 * CK2 * x1mth2 / (ao * ao * ao * ao * Math.pow(1 - ecco * ecco, 4)) * (3 - 14 * cosio * cosio) / 16;

  const con41 = -x1mth2 * CK2 / (ao * ao * (1 - ecco * ecco) * (1 - ecco * ecco));

  return {
    no,
    a: ao,
    cosio,
    sinio,
    con41,
    x1mth2,
    x3thm1,
    x7thm1,
    t2cof,
    t4cof,
    t5cof,
    gsto,
    inclo,
    ecco,
    nodeo,
    argpo,
    mo,
    bstar,
    method: 'n',
  };
}

function solveKepler(m: number, ecc: number): number {
  let e = m;
  for (let i = 0; i < 10; i++) {
    const deltaE = (e - ecc * Math.sin(e) - m) / (1 - ecc * Math.cos(e));
    e -= deltaE;
    if (Math.abs(deltaE) < 1e-12) break;
  }
  return e;
}

export function propagate(satrec: SGP4Init, tsince: number): SatPosition {
  const { no, a, cosio, sinio, ecco, nodeo, argpo, mo, bstar, t2cof, t4cof, t5cof, con41, x1mth2, x3thm1 } = satrec;

  const em = ecco;
  const inclm = satrec.inclo;
  const mm = mo + no * tsince;
  const nm = no;

  const nodepm = nodeo + (-CK2 * cosio / (a * a * (1 - em * em) * (1 - em * em)) * nm * tsince);
  const argpm = argpo + (CK2 * x3thm1 / (2 * a * a * (1 - em * em) * (1 - em * em)) * nm * tsince);

  const m = fmod2p(mm);

  const e = solveKepler(m, em);

  const sinnom = Math.sin(e);
  const cosnom = Math.cos(e);

  const temp = 1 - em * em;
  const templ = a * temp;
  const pl = templ;

  let r = a * (1 - em * cosnom);
  let v = Math.sqrt(MU * (2 / r - 1 / a));

  const cosu = (Math.cos(argpm) * (cosnom - em) - Math.sin(argpm) * Math.sqrt(temp) * sinnom);
  const sinu = (Math.sin(argpm) * (cosnom - em) + Math.cos(argpm) * Math.sqrt(temp) * sinnom);

  const cosnode = Math.cos(nodepm);
  const sinnode = Math.sin(nodepm);

  const xmx = -sinnode * Math.cos(inclm);
  const xmy = cosnode * Math.cos(inclm);
  const ux = xmx * sinu + cosnode * cosu;
  const uy = xmy * sinu + sinnode * cosu;
  const uz = Math.sin(inclm) * sinu;

  const rfdot = Math.sqrt(MU / pl);
  const vxr = xmx * cosu - cosnode * sinu;
  const vyr = xmy * cosu - sinnode * sinu;
  const vzr = Math.sin(inclm) * cosu;

  r = a * (1 - em * cosnom);
  const cr = 1 - 1.5 * CK2 * x3thm1 / (a * a * (1 - em * em) * (1 - em * em)) * (Math.sqrt(1 - em * em) / pl);
  const su = -1.5 * CK2 * sinio * cosio / (a * a * (1 - em * em) * (1 - em * em)) * rfdot * tsince;

  const x = r * ux + cr * ux;
  const y = r * uy + cr * uy;
  const z = r * uz + cr * uz;

  const p = a * (1 - em * em);
  const fDot = Math.sqrt(MU / p);

  const vx = fDot * vxr;
  const vy = fDot * vyr;
  const vz = fDot * vzr;

  return { x: x * EARTH_RADIUS_KM, y: y * EARTH_RADIUS_KM, z: z * EARTH_RADIUS_KM, vx, vy, vz };
}

export function createSatRecord(tle: TLEData): SGP4Init {
  return sgp4init(tle);
}

export function getEpochDate(tle: TLEData): Date {
  const year = tle.epochYear;
  const day = tle.epochDay;
  const date = new Date(Date.UTC(year, 0, 1));
  date.setTime(date.getTime() + (day - 1) * 86400000);
  return date;
}
