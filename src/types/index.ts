export type RiskLevel = 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type DepthCategory = 'ankle' | 'knee' | 'waist' | 'chest_above';

export type FlowSpeed = 'stagnant' | 'slow' | 'fast_dangerous';

export type Passability = 
  | 'all' 
  | 'two_wheeler' 
  | 'four_wheeler_only' 
  | 'suv_only' 
  | 'boat_only' 
  | 'blocked';

export type ReporterRole = 'resident' | 'volunteer' | 'warden' | 'anonymous';

export type ReportStatus = 'verified' | 'pending' | 'debunked' | 'resolved';

export interface TrustBreakdown {
  reporterScore: number;
  communityConfirmations: number;
  photoBonus: number;
  timeDecay: number;
  proximityBonus: number;
}

export interface FloodReport {
  id: string;
  neighborhoodId: string;
  neighborhoodName: string;
  streetName: string;
  landmark?: string;
  waterDepthInches: number;
  depthCategory: DepthCategory;
  flowSpeed: FlowSpeed;
  passability: Passability;
  powerOutage: boolean;
  strandedVulnerableCount: number;
  reporterName: string;
  reporterRole: ReporterRole;
  trustScore: number; // 0 - 100
  trustBreakdown: TrustBreakdown;
  confirmationsCount: number;
  photoUrl?: string;
  photoCaption?: string;
  imageType?: 'demo_illustration' | 'user_upload';
  isUserUpload?: boolean;
  status: ReportStatus;
  notes: string;
  timestamp: number; // ms
  source: 'web' | 'whatsapp' | 'warden_field';
}

export interface StreetSegment {
  id: string;
  name: string;
  tamilName: string;
  neighborhoodId: string;
  waterDepthInches: number;
  flowSpeed: FlowSpeed;
  passability: Passability;
  isElevated: boolean;
  isBarricaded?: boolean;
  hasPumpActive?: boolean;
  lastUpdated: number;
  coordinates: { x1: number; y1: number; x2: number; y2: number };
}

export interface Neighborhood {
  id: string;
  name: string;
  tamilName: string;
  zoneNumber: number;
  riskLevel: RiskLevel;
  currentAvgDepthInches: number;
  rainfallLast24hMm: number;
  activeReportsCount: number;
  shelterName: string;
  shelterCapacity: number;
  shelterOccupancy: number;
  shelterContact: string;
  mapCoords: { x: number; y: number; lat: number; lng: number };
  description: string;
  descriptionTa: string;
}

export interface AlertItem {
  id: string;
  title: string;
  titleTa: string;
  message: string;
  messageTa: string;
  severity: 'critical' | 'warning' | 'info';
  neighborhoodId: string;
  neighborhoodName: string;
  timestamp: number;
  source: 'official_mc' | 'community_auto' | 'warden';
  actionRequired?: string;
  actionRequiredTa?: string;
  acknowledged?: boolean;
}

export type TravelMode = 'two_wheeler' | 'car' | 'suv' | 'emergency';

export interface RouteOption {
  id: string;
  name: string;
  nameTa: string;
  type: 'safe_corridor' | 'direct_hazardous';
  distanceKm: number;
  timeMins: number;
  baseTimeMins?: number;
  floodDelayMins?: number;
  riskLevel?: RiskLevel;
  maxWaterDepthInches: number;
  passability: Passability;
  elevatedFlyovers: string[];
  hazards: string[];
  hazardsTa: string[];
  steps: string[];
  stepsTa: string[];
  recommendationScore: number; // 0-100
  modeCompatibility?: 'clear' | 'caution' | 'impassable';
}

export type Language = 'en' | 'ta';

export interface WeatherScenario {
  id: string;
  name: string;
  nameTa: string;
  reservoirDischargeCusecs: number; // Chembarambakkam discharge
  poondiDischargeCusecs: number;
  rainfall1hMm: number;
  redAlertLevel: 'Red' | 'Orange' | 'Yellow' | 'Normal';
  description: string;
}
