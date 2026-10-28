import { MineralComposition, QualityResult, RegionType, WaterRecord } from '../types';

export const REGION_METADATA: Record<RegionType, {
  label: string;
  description: string;
  factors: [number, number, number, number, number, number]; // ca, mg, na, k, so4, cl
}> = {
  groundwater: {
    label: 'Groundwater / Aquifer',
    description: 'Natural underground source with high calcium & magnesium carbonates.',
    factors: [0.25, 0.08, 0.12, 0.03, 0.20, 0.15],
  },
  urban: {
    label: 'Urban Tap Water',
    description: 'Municipal distribution supply with standard residual treatment and balanced minerals.',
    factors: [0.20, 0.06, 0.18, 0.02, 0.22, 0.20],
  },
  industrial: {
    label: 'Industrial Region',
    description: 'Effluent-adjacent or high-runoff catchment with elevated sulphates & sodium.',
    factors: [0.15, 0.05, 0.25, 0.03, 0.25, 0.22],
  },
  coastal: {
    label: 'Coastal Area',
    description: 'Marine intrusion prone zone with high sodium chloride salinity.',
    factors: [0.10, 0.05, 0.30, 0.02, 0.20, 0.25],
  },
};

/**
 * Analyzes water quality matching original app.py logic
 */
export function analyzeWater(ph: number, tds: number): QualityResult {
  const isPhSafe = ph >= 6.5 && ph <= 8.5;
  const isTdsSafe = tds < 500;

  if (isPhSafe && isTdsSafe) {
    return {
      status: 'excellent',
      headline: 'Excellent - Safe for Drinking',
      message: 'Water meets WHO standards for drinking and domestic use.',
      whoCompliant: true,
      score: Math.max(85, Math.round(100 - (tds / 500) * 12 - Math.abs(ph - 7.2) * 5)),
    };
  } else if (tds < 1000 && ph >= 6.0 && ph <= 9.0) {
    return {
      status: 'moderate',
      headline: 'Moderate - Suitable for Domestic Use',
      message: 'Safe for domestic utility and washing but purification is recommended for direct drinking.',
      whoCompliant: false,
      score: Math.max(50, Math.round(75 - ((tds - 500) / 500) * 20)),
    };
  } else {
    return {
      status: 'poor',
      headline: 'Poor - Unsafe',
      message: 'High dissolved solids or abnormal pH detected; multi-stage filtration and purification required.',
      whoCompliant: false,
      score: Math.max(15, Math.round(40 - Math.min(30, (tds - 1000) / 50))),
    };
  }
}

/**
 * Estimates mineral concentrations matching original app.py logic
 */
export function estimateMinerals(tds: number, region: RegionType): MineralComposition {
  const factors = REGION_METADATA[region]?.factors || REGION_METADATA.urban.factors;
  const [fCa, fMg, fNa, fK, fSo4, fCl] = factors;

  return {
    ca: Number((tds * fCa).toFixed(2)),
    mg: Number((tds * fMg).toFixed(2)),
    na: Number((tds * fNa).toFixed(2)),
    k: Number((tds * fK).toFixed(2)),
    so4: Number((tds * fSo4).toFixed(2)),
    cl: Number((tds * fCl).toFixed(2)),
  };
}

/**
 * WHO parameter benchmarks
 */
export const WHO_LIMITS = {
  ph: { min: 6.5, max: 8.5, unit: 'pH' },
  tds: { safeMax: 500, allowableMax: 1000, unit: 'ppm (mg/L)' },
  calcium: { idealMax: 75, maxAllowable: 200, unit: 'mg/L' },
  magnesium: { idealMax: 30, maxAllowable: 100, unit: 'mg/L' },
  sodium: { maxAllowable: 200, unit: 'mg/L' },
  potassium: { maxAllowable: 12, unit: 'mg/L' },
  sulphate: { maxAllowable: 250, unit: 'mg/L' },
  chloride: { maxAllowable: 250, unit: 'mg/L' },
};

export const INITIAL_RECORDS: WaterRecord[] = [
  {
    id: 'rec-1',
    dateTime: '2026-10-22 09:15:00',
    ph: 7.2,
    tds: 245,
    region: 'groundwater',
    ca: 61.25,
    mg: 19.6,
    na: 29.4,
    k: 7.35,
    so4: 49.0,
    cl: 36.75,
    result: 'Excellent - Safe for Drinking',
    notes: 'Well water morning routine check',
  },
  {
    id: 'rec-2',
    dateTime: '2026-10-23 14:30:00',
    ph: 7.6,
    tds: 310,
    region: 'urban',
    ca: 62.0,
    mg: 18.6,
    na: 55.8,
    k: 6.2,
    so4: 68.2,
    cl: 62.0,
    result: 'Excellent - Safe for Drinking',
    notes: 'Main municipal water supply tap',
  },
  {
    id: 'rec-3',
    dateTime: '2026-10-24 11:00:00',
    ph: 6.8,
    tds: 680,
    region: 'industrial',
    ca: 102.0,
    mg: 34.0,
    na: 170.0,
    k: 20.4,
    so4: 170.0,
    cl: 149.6,
    result: 'Moderate - Suitable for Domestic Use',
    notes: 'Inlet near light manufacturing district',
  },
  {
    id: 'rec-4',
    dateTime: '2026-10-25 16:45:00',
    ph: 8.1,
    tds: 820,
    region: 'coastal',
    ca: 82.0,
    mg: 41.0,
    na: 246.0,
    k: 16.4,
    so4: 164.0,
    cl: 205.0,
    result: 'Moderate - Suitable for Domestic Use',
    notes: 'Coastal borewell sample at high tide',
  },
  {
    id: 'rec-5',
    dateTime: '2026-10-26 10:20:00',
    ph: 7.1,
    tds: 185,
    region: 'urban',
    ca: 37.0,
    mg: 11.1,
    na: 33.3,
    k: 3.7,
    so4: 40.7,
    cl: 37.0,
    result: 'Excellent - Safe for Drinking',
    notes: 'Post-filtration storage unit',
  },
  {
    id: 'rec-6',
    dateTime: '2026-10-27 18:10:00',
    ph: 8.9,
    tds: 1120,
    region: 'industrial',
    ca: 168.0,
    mg: 56.0,
    na: 280.0,
    k: 33.6,
    so4: 280.0,
    cl: 246.4,
    result: 'Poor - Unsafe',
    notes: 'Perimeter ditch sample, filtration bypass alert',
  },
  {
    id: 'rec-7',
    dateTime: '2026-10-28 08:30:00',
    ph: 7.4,
    tds: 260,
    region: 'groundwater',
    ca: 65.0,
    mg: 20.8,
    na: 31.2,
    k: 7.8,
    so4: 52.0,
    cl: 39.0,
    result: 'Excellent - Safe for Drinking',
    notes: 'Central reservoir intake',
  },
];

export function exportRecordsToCSV(records: WaterRecord[]): string {
  const headers = ['DateTime', 'pH', 'TDS', 'Region', 'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Sulphate', 'Chloride', 'Result', 'Notes'];
  const rows = records.map((r) => [
    r.dateTime,
    r.ph,
    r.tds,
    r.region,
    r.ca,
    r.mg,
    r.k,
    r.na,
    r.so4,
    r.cl,
    `"${r.result.replace(/"/g, '""')}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
