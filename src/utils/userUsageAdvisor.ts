import { ConsumerWaterAnalysis, UsageCategoryItem, PurifierAdvice, UsageSuitability } from '../types';

/**
 * Evaluates water parameters from a homeowner/consumer perspective
 * Translating chemistry values (pH, TDS) into practical everyday household advice.
 */
export function evaluateConsumerWater(ph: number, tds: number): ConsumerWaterAnalysis {
  const isPhSafeForDrinking = ph >= 6.5 && ph <= 8.5;

  // 1. Evaluate Direct Drinking
  let drinkingSuitability: UsageSuitability = 'safe';
  let drinkingTitle = 'Safe & Healthy for Direct Drinking';
  let drinkingDesc = 'Balanced mineral profile meets WHO guidelines. Pure and safe for direct consumption.';

  if (tds >= 1000 || ph < 6.0 || ph > 9.0) {
    drinkingSuitability = 'unsafe';
    drinkingTitle = 'Unsafe for Direct Drinking';
    drinkingDesc = 'Elevated dissolved solids or abnormal pH. Do not drink raw; purification required.';
  } else if (tds >= 500 || !isPhSafeForDrinking) {
    drinkingSuitability = 'caution';
    drinkingTitle = 'Filtration Recommended';
    drinkingDesc = 'Safe for utility, but high mineral content or pH offset may cause stomach sensitivity over time.';
  } else if (tds < 50) {
    drinkingSuitability = 'caution';
    drinkingTitle = 'Very Low Mineral Content';
    drinkingDesc = 'Over-purified or demineralized water. Safe from microbes, but lacks essential dietary minerals.';
  }

  // 2. Cooking & Beverages (Coffee, Tea, Soups)
  let cookingSuitability: UsageSuitability = 'safe';
  let cookingTitle = 'Excellent for Cooking & Brewing';
  let cookingDesc = 'Enhances aroma of tea and coffee without mineral cloudiness. Vegetables cook evenly.';

  if (tds > 800 || ph < 6.0 || ph > 9.0) {
    cookingSuitability = 'unsafe';
    cookingTitle = 'Alters Food Taste & Texture';
    cookingDesc = 'High salt and dissolved solids interfere with broth clarity and alter recipe taste.';
  } else if (tds > 400 || !isPhSafeForDrinking) {
    cookingSuitability = 'caution';
    cookingTitle = 'Acceptable for Boiling & Stews';
    cookingDesc = 'Boiling is safe, but high hardness may leave mineral film on top of hot teas.';
  }

  // 3. Infant Formula & Baby Food
  let babySuitability: UsageSuitability = 'safe';
  let babyTitle = 'Approved for Infant Formula';
  let babyDesc = 'Low mineral solute load suitable for sensitive infant kidneys (under 12 months).';

  if (tds > 350 || ph < 6.5 || ph > 8.5) {
    babySuitability = 'unsafe';
    babyTitle = 'Not Recommended for Baby Formula';
    babyDesc = 'Infant kidneys require low solute load (TDS < 200 ppm). Use filtered low-mineral water.';
  } else if (tds > 200) {
    babySuitability = 'caution';
    babyTitle = 'Boil & Check Formula Instructions';
    babyDesc = 'Acceptable if boiled for 1 minute, though lower mineral concentration is preferred.';
  }

  // 4. Bathing, Hair & Skin Care
  let bathingSuitability: UsageSuitability = 'safe';
  let bathingTitle = 'Gentle on Skin & Hair';
  let bathingDesc = 'Soft water profile. Soaps lather easily without leaving dry, sticky residue or scalp irritation.';

  if (tds > 750 || ph < 5.5 || ph > 9.0) {
    bathingSuitability = 'unsafe';
    bathingTitle = 'Hard Water Risk: Dry Skin & Hair Fall';
    bathingDesc = 'High mineral hardness binds with soaps, clogging pores and causing dry skin and hair brittleness.';
  } else if (tds > 350) {
    bathingSuitability = 'caution';
    bathingTitle = 'Moderate Hardness: Soap Scum Possible';
    bathingDesc = 'Safe for showers, but requires moisturizing shampoo or showerhead softeners for sensitive skin.';
  }

  // 5. Indoor Houseplants & Gardening
  let plantSuitability: UsageSuitability = 'safe';
  let plantTitle = 'Healthy for Houseplants & Garden';
  let plantDesc = 'Natural mineral nutrients support healthy roots without salt buildup in potting soil.';

  if (tds > 700 || ph < 6.0 || ph > 8.5) {
    plantSuitability = 'unsafe';
    plantTitle = 'High Salinity: Burns Plant Roots';
    plantDesc = 'Excessive dissolved salts can cause yellow leaf tips and white crust on soil surfaces.';
  } else if (tds > 350) {
    plantSuitability = 'caution';
    plantTitle = 'Suitable for Hardy Plants';
    plantDesc = 'Tolerated by shrubs and lawns, but let water sit for 24h before watering sensitive calatheas/ferns.';
  }

  // 6. Home Appliances & Plumbing
  let applianceSuitability: UsageSuitability = 'safe';
  let applianceTitle = 'Low Limescale Risk';
  let applianceDesc = 'Protects water heaters, coffee makers, kettles, and washing machine coils from calcium buildup.';

  if (tds > 600) {
    applianceSuitability = 'unsafe';
    applianceTitle = 'Severe Limescale Encrustation';
    applianceDesc = 'Rapid scale buildup reduces heater efficiency by up to 30% and clogs plumbing valves.';
  } else if (tds > 250) {
    applianceSuitability = 'caution';
    applianceTitle = 'Periodic Descaling Required';
    applianceDesc = 'White chalky spots may appear in electric kettles; descale every 2–3 months with citric acid.';
  }

  const usageCategories: UsageCategoryItem[] = [
    {
      id: 'drinking',
      name: 'Direct Drinking & Hydration',
      suitability: drinkingSuitability,
      title: drinkingTitle,
      description: drinkingDesc,
    },
    {
      id: 'cooking',
      name: 'Cooking & Hot Beverages',
      suitability: cookingSuitability,
      title: cookingTitle,
      description: cookingDesc,
    },
    {
      id: 'baby',
      name: 'Baby Food & Infant Care',
      suitability: babySuitability,
      title: babyTitle,
      description: babyDesc,
    },
    {
      id: 'bathing',
      name: 'Bathing, Skin & Hair',
      suitability: bathingSuitability,
      title: bathingTitle,
      description: bathingDesc,
    },
    {
      id: 'plants',
      name: 'Indoor Plants & Herbs',
      suitability: plantSuitability,
      title: plantTitle,
      description: plantDesc,
    },
    {
      id: 'appliances',
      name: 'Plumbing & Appliances',
      suitability: applianceSuitability,
      title: applianceTitle,
      description: applianceDesc,
    },
  ];

  // Overall Score Calculation (0-100)
  let score = 95;
  if (tds > 300) score -= Math.min(45, ((tds - 300) / 10));
  if (ph < 6.5) score -= Math.min(25, (6.5 - ph) * 20);
  if (ph > 8.5) score -= Math.min(25, (ph - 8.5) * 20);
  score = Math.max(10, Math.min(100, Math.round(score)));

  // Taste Profile
  let tasteProfile = 'Crisp, sweet, and balanced';
  if (tds < 70) tasteProfile = 'Flat and light (low natural minerals)';
  else if (tds <= 250) tasteProfile = 'Refreshing, crisp natural spring taste';
  else if (tds <= 500) tasteProfile = 'Slight mineral mouthfeel, full-bodied';
  else if (tds <= 900) tasteProfile = 'Chalky, mineral-heavy, faintly salty';
  else tasteProfile = 'Noticeably saline or metallic brackish taste';

  // Limescale Risk
  let scaleRisk: 'low' | 'moderate' | 'high' | 'severe' = 'low';
  if (tds > 700) scaleRisk = 'severe';
  else if (tds > 450) scaleRisk = 'high';
  else if (tds > 250) scaleRisk = 'moderate';

  // Purifier Advice (Smart buyer recommendation)
  let purifierAdvice: PurifierAdvice;

  if (tds < 200 && isPhSafeForDrinking) {
    purifierAdvice = {
      title: 'Simple Gravity Filter or UV Purifier is Sufficient',
      verdict: 'You DO NOT need an expensive RO system! RO will needlessly strip your healthy natural minerals.',
      recommendedTech: 'UV + Activated Carbon Filter (or Stainless Steel Gravity Filter)',
      reasons: [
        'Your water has an ideal natural mineral concentration (< 200 ppm).',
        'Only disinfection against bacteria/cysts and chlorine removal is needed.',
        'Saves up to 70% of wastewater compared to RO purifiers.',
      ],
      maintenanceTip: 'Replace sediment and carbon filters every 6–9 months. Clean storage chamber regularly.',
    };
  } else if (tds >= 200 && tds < 500 && isPhSafeForDrinking) {
    purifierAdvice = {
      title: 'Carbon + UV or Low-TDS RO with Mineralizer',
      verdict: 'Moderate mineral water. Safe with UV/UF, or RO if municipal chlorine/pesticide taste is present.',
      recommendedTech: 'Activated Carbon Block + UV Chamber (or RO with TDS Modulator)',
      reasons: [
        'Dissolved mineral level is within acceptable WHO drinking bounds.',
        'UV destroys viruses and bacteria while leaving calcium and magnesium intact.',
        'If using an RO, ensure the TDS controller is tuned between 100–150 ppm.',
      ],
      maintenanceTip: 'Inspect UV lamp indicator annually. Sanitize pre-filter housing during cartridge changes.',
    };
  } else if (tds >= 500 && tds < 1000) {
    purifierAdvice = {
      title: 'Reverse Osmosis (RO) Purifier Recommended',
      verdict: 'High dissolved solids detected. Multi-stage RO is necessary to protect health and taste.',
      recommendedTech: 'Multi-Stage RO + Post-Carbon + UV Chamber',
      reasons: [
        'Reduces excessive dissolved salts, heavy mineral hardness, and pipe impurities.',
        'Protects against gastrointestinal heaviness and kidney stone mineral burdens.',
        'Improves water clarity, taste, and cooking quality.',
      ],
      maintenanceTip: 'Change sediment pre-filters every 3–6 months to protect the RO membrane from premature clogging.',
    };
  } else {
    purifierAdvice = {
      title: 'Heavy Duty RO Purifier + Whole-House Softener',
      verdict: 'Extremely high TDS / salinity. Comprehensive treatment required for drinking and plumbing.',
      recommendedTech: 'Commercial-Grade RO (75–100 GPD) + Ion-Exchange Water Softener',
      reasons: [
        'Water is brackish or contains unsafe concentrations of dissolved total solids (> 1000 ppm).',
        'Direct consumption without multi-stage RO membrane separation is unadvisable.',
        'A whole-house water softener is advised to protect geysers, showers, and washing machines.',
      ],
      maintenanceTip: 'Monitor RO membrane rejection rate quarterly with a handheld digital TDS tester.',
    };
  }

  // Overall Headline & Summary
  let overallSuitability: 'excellent' | 'acceptable' | 'requires_treatment' | 'hazardous' = 'excellent';
  let headline = 'Ideal Drinking & Home Utility Water';
  let summary = 'Your water sample boasts optimal balance. Safe for direct drinking, infant food, gentle on skin and plumbing.';

  if (tds >= 1000 || ph < 6.0 || ph > 9.0) {
    overallSuitability = 'hazardous';
    headline = 'Unsafe for Drinking — Purification Mandatory';
    summary = 'Critical mineral concentration or abnormal pH. Do not drink raw; treat through an RO system before internal consumption.';
  } else if (tds >= 500 || !isPhSafeForDrinking) {
    overallSuitability = 'requires_treatment';
    headline = 'Moderate Utility Water — Filter Before Drinking';
    summary = 'Acceptable for washing, cleaning, and gardening. Drinking filtration (RO or multi-stage) recommended to avoid hardness issues.';
  } else if (tds >= 300) {
    overallSuitability = 'acceptable';
    headline = 'Good Utility Water — Slightly High Minerals';
    summary = 'Safe for drinking and cooking. May cause minor limescale in kettles and requires periodic descaling.';
  }

  return {
    overallScore: score,
    overallSuitability,
    headline,
    summary,
    tasteProfile,
    scaleRisk,
    usageCategories,
    purifierAdvice,
  };
}

export const COMMON_HOME_PRESETS = [
  {
    label: 'Kitchen Tap (Municipal Treated)',
    ph: 7.4,
    tds: 180,
    sourceDescription: 'Piped city water supply, standard residual chlorination, balanced minerals.',
  },
  {
    label: 'Home RO Purifier Output',
    ph: 6.8,
    tds: 45,
    sourceDescription: 'Water from your home RO water filter outlet. Check if minerals are over-stripped!',
  },
  {
    label: 'Borewell / Deep Ground Water',
    ph: 7.9,
    tds: 680,
    sourceDescription: 'Natural deep underground aquifer. Rich in calcium and magnesium hardness.',
  },
  {
    label: 'Packaged 20L Water Can',
    ph: 7.1,
    tds: 120,
    sourceDescription: 'Commercial bottled delivery can. Filtered with added remineralization.',
  },
  {
    label: 'Coastal Borewell / Hard Well',
    ph: 8.3,
    tds: 1180,
    sourceDescription: 'Saline intrusion or extremely hard underground spring water.',
  },
  {
    label: 'Rainwater Storage Tank',
    ph: 6.4,
    tds: 65,
    sourceDescription: 'Collected rooftop rainwater. Low minerals, slightly acidic from ambient air.',
  },
];
