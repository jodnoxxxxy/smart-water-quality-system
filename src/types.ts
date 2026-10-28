export type RegionType = 'groundwater' | 'urban' | 'industrial' | 'coastal';

export interface MineralComposition {
  ca: number;  // Calcium
  mg: number;  // Magnesium
  na: number;  // Sodium
  k: number;   // Potassium
  so4: number; // Sulphate
  cl: number;  // Chloride
}

export type WaterQualityStatus = 'excellent' | 'moderate' | 'poor';

export interface QualityResult {
  status: WaterQualityStatus;
  headline: string;
  message: string;
  whoCompliant: boolean;
  score: number; // 0 - 100
}

export interface WaterRecord {
  id: string;
  dateTime: string;
  ph: number;
  tds: number;
  region: RegionType;
  ca: number;
  mg: number;
  k: number;
  na: number;
  so4: number;
  cl: number;
  result: string;
  notes?: string;
}

export type UserRole = 'resident' | 'homeowner' | 'business' | 'analyst' | 'technician' | 'auditor' | 'manager';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  facility: string;
  defaultRegion: RegionType;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  role: string;
  facility: string;
  region: RegionType;
  avatarUrl?: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
}

export type UsageSuitability = 'safe' | 'caution' | 'unsafe';

export interface UsageCategoryItem {
  id: string;
  name: string;
  suitability: UsageSuitability;
  title: string;
  description: string;
}

export interface PurifierAdvice {
  title: string;
  verdict: string;
  recommendedTech: string;
  reasons: string[];
  maintenanceTip: string;
}

export interface ConsumerWaterAnalysis {
  overallScore: number; // 0 - 100
  overallSuitability: 'excellent' | 'acceptable' | 'requires_treatment' | 'hazardous';
  headline: string;
  summary: string;
  tasteProfile: string;
  scaleRisk: 'low' | 'moderate' | 'high' | 'severe';
  usageCategories: UsageCategoryItem[];
  purifierAdvice: PurifierAdvice;
}

export interface AIWaterAnalysis {
  headline: string;
  oneWordVerdict: string;
  purityScore: number;
  drinkingSuitability: string;
  cookingSuitability: string;
  babyFoodSuitability: string;
  skinBathSuitability: string;
  plantsSuitability: string;
  appliancesSuitability: string;
  quickActionAdvice: string;
  filtrationRecommended: string;
  mineralInsight: string;
  seasonalImpact: string;
  scientificSummary: string;
  keyRisks: string[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

