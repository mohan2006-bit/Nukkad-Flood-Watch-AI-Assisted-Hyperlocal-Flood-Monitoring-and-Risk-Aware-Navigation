import { 
  FloodReport, 
  RiskLevel, 
  Passability, 
  ReporterRole, 
  TrustBreakdown,
  DepthCategory,
  RouteOption,
  WeatherScenario,
  StreetSegment,
  TravelMode
} from '../types';

/**
 * Calculates trust score (0 - 100) based on multiple verification vectors:
 * - Reporter Role credibility (Wardens/Volunteers have higher base score)
 * - Photo evidence corroboration
 * - Community upvotes / confirmations
 * - Time decay (reports become stale after hours)
 * - Proximity corroborating reports (spatial cluster agreement)
 */
export function calculateTrustScore(params: {
  reporterRole: ReporterRole;
  confirmationsCount: number;
  hasPhoto: boolean;
  timestamp: number;
  corroboratingReportsCount?: number;
  currentTime?: number;
}): { score: number; breakdown: TrustBreakdown } {
  const now = params.currentTime ?? Date.now();
  
  // Base credibility by role
  let reporterScore = 50;
  switch (params.reporterRole) {
    case 'warden':
      reporterScore = 90;
      break;
    case 'volunteer':
      reporterScore = 75;
      break;
    case 'resident':
      reporterScore = 55;
      break;
    case 'anonymous':
      reporterScore = 35;
      break;
  }

  // Community peer verification bonus: up to +25 points
  const communityConfirmations = Math.min(25, params.confirmationsCount * 5);

  // Photo / visual proof bonus: +15 points
  const photoBonus = params.hasPhoto ? 15 : 0;

  // Proximity cluster corroborate bonus (other reports agreeing in same neighborhood): up to +15 points
  const nearbyCount = params.corroboratingReportsCount || 0;
  const proximityBonus = Math.min(15, nearbyCount * 5);

  // Time decay penalty: after 2 hours, decreases by ~5 points per hour
  const ageHours = Math.max(0, (now - params.timestamp) / (1000 * 60 * 60));
  let timeDecay = 0;
  if (ageHours > 2) {
    timeDecay = -Math.min(30, Math.round((ageHours - 2) * 4));
  }

  const rawScore = reporterScore + communityConfirmations + photoBonus + proximityBonus + timeDecay;
  const finalScore = Math.max(10, Math.min(100, Math.round(rawScore)));

  return {
    score: finalScore,
    breakdown: {
      reporterScore,
      communityConfirmations,
      photoBonus,
      timeDecay,
      proximityBonus
    }
  };
}

/**
 * Determines vehicle passability based on water depth and flow velocity
 */
export function evaluatePassability(depthInches: number, flowSpeed: 'stagnant' | 'slow' | 'fast_dangerous'): Passability {
  // Fast moving dangerous water cuts off lower clearance vehicles regardless of shallow depth
  if (flowSpeed === 'fast_dangerous') {
    if (depthInches >= 18) return 'boat_only';
    if (depthInches >= 8) return 'blocked';
    return 'suv_only';
  }

  if (depthInches <= 3) {
    return 'all';
  } else if (depthInches <= 7) {
    return 'two_wheeler'; // Caution for bikes, okay for cars
  } else if (depthInches <= 12) {
    return 'four_wheeler_only';
  } else if (depthInches <= 20) {
    return 'suv_only';
  } else if (depthInches <= 36) {
    return 'boat_only';
  } else {
    return 'blocked';
  }
}

/**
 * Categorizes water depth into resident-friendly terms
 */
export function getDepthCategory(inches: number): DepthCategory {
  if (inches < 8) return 'ankle';
  if (inches < 20) return 'knee';
  if (inches < 36) return 'waist';
  return 'chest_above';
}

/**
 * Aggregates neighborhood flood risk based on active reports, water levels, and rainfall
 */
export function calculateNeighborhoodRisk(
  reports: FloodReport[], 
  rainfall24hMm: number = 0
): { riskLevel: RiskLevel; avgDepthInches: number; maxDepthInches: number } {
  if (reports.length === 0) {
    if (rainfall24hMm > 150) return { riskLevel: 'HIGH', avgDepthInches: 10, maxDepthInches: 14 };
    if (rainfall24hMm > 80) return { riskLevel: 'MODERATE', avgDepthInches: 5, maxDepthInches: 8 };
    return { riskLevel: 'SAFE', avgDepthInches: 0, maxDepthInches: 0 };
  }

  const totalDepth = reports.reduce((acc, r) => acc + r.waterDepthInches, 0);
  const avgDepthInches = Math.round(totalDepth / reports.length);
  const maxDepthInches = Math.max(...reports.map(r => r.waterDepthInches));
  const hasFastCurrent = reports.some(r => r.flowSpeed === 'fast_dangerous');
  const hasPowerOutageHazard = reports.some(r => r.powerOutage);
  const vulnerableStrandedCount = reports.reduce((acc, r) => acc + (r.strandedVulnerableCount || 0), 0);

  let riskLevel: RiskLevel = 'SAFE';

  if (maxDepthInches >= 28 || vulnerableStrandedCount > 3 || (maxDepthInches >= 20 && hasFastCurrent)) {
    riskLevel = 'CRITICAL';
  } else if (maxDepthInches >= 14 || (maxDepthInches >= 10 && hasFastCurrent) || rainfall24hMm > 120 || hasPowerOutageHazard) {
    riskLevel = 'HIGH';
  } else if (maxDepthInches >= 5 || rainfall24hMm > 50) {
    riskLevel = 'MODERATE';
  } else {
    riskLevel = 'SAFE';
  }

  return { riskLevel, avgDepthInches, maxDepthInches };
}

/**
 * Simulates intelligent NLP parsing of citizen WhatsApp messages (English and Tamil)
 * Extracts: neighborhood, street landmark, water depth, flow speed, and creates structured data
 */
export function parseWhatsAppFloodMessage(message: string): {
  neighborhoodId?: string;
  neighborhoodName?: string;
  streetName?: string;
  waterDepthInches?: number;
  depthCategory?: DepthCategory;
  flowSpeed?: 'stagnant' | 'slow' | 'fast_dangerous';
  powerOutage?: boolean;
  strandedCount?: number;
  confidence: number;
} {
  const lower = message.toLowerCase();
  let neighborhoodId: string | undefined;
  let neighborhoodName: string | undefined;
  let streetName: string | undefined;
  let waterDepthInches = 12; // default knee
  let depthCategory: DepthCategory = 'knee';
  let flowSpeed: 'stagnant' | 'slow' | 'fast_dangerous' = 'slow';
  let powerOutage = false;
  let strandedCount = 0;
  let confidence = 0.5;

  // Neighborhood matching
  const neighborhoodsMap: Record<string, { id: string; name: string }> = {
    'velachery': { id: 'velachery', name: 'Velachery' },
    'வேளச்சேரி': { id: 'velachery', name: 'Velachery' },
    'madipakkam': { id: 'madipakkam', name: 'Madipakkam' },
    'மடிப்பாக்கம்': { id: 'madipakkam', name: 'Madipakkam' },
    'perumbakkam': { id: 'perumbakkam', name: 'Perumbakkam' },
    'பெரும்பாக்கம்': { id: 'perumbakkam', name: 'Perumbakkam' },
    't nagar': { id: 't_nagar', name: 'T. Nagar' },
    't. nagar': { id: 't_nagar', name: 'T. Nagar' },
    'தி நகர்': { id: 't_nagar', name: 'T. Nagar' },
    'pallikaranai': { id: 'pallikaranai', name: 'Pallikaranai' },
    'பள்ளிக்கரணை': { id: 'pallikaranai', name: 'Pallikaranai' },
    'mudichur': { id: 'mudichur', name: 'Mudichur' },
    'முடிச்சூர்': { id: 'mudichur', name: 'Mudichur' },
    'adyar': { id: 'adyar', name: 'Adyar' },
    'அடையார்': { id: 'adyar', name: 'Adyar' },
    'mylapore': { id: 'mylapore', name: 'Mylapore' },
    'மயிலாப்பூர்': { id: 'mylapore', name: 'Mylapore' },
    'tambaram': { id: 'tambaram', name: 'Tambaram' },
    'தாம்பரம்': { id: 'tambaram', name: 'Tambaram' },
  };

  for (const [key, val] of Object.entries(neighborhoodsMap)) {
    if (lower.includes(key)) {
      neighborhoodId = val.id;
      neighborhoodName = val.name;
      confidence += 0.25;
      break;
    }
  }

  // Street / Landmark matching
  const landmarks = [
    'vijayanagar', 'vijayanagar bus stand', '100ft road', '100 feet road', 'bypass', 'lake road',
    'kuberan nagar', 'bazaar road', 'medavakkam main road', 'ranganathan st', 'ranganathan street',
    'panagal park', 'marshland link road', 'ram nagar', 'kaiveli', 'oil mill road'
  ];

  for (const lm of landmarks) {
    if (lower.includes(lm)) {
      streetName = lm.charAt(0).toUpperCase() + lm.slice(1);
      confidence += 0.2;
      break;
    }
  }

  if (!streetName && neighborhoodName) {
    streetName = `Main Road, ${neighborhoodName}`;
  }

  // Depth indicators
  if (lower.includes('chest') || lower.includes('roof') || lower.includes('neck') || lower.includes('மார்பளவு') || lower.includes('4 feet') || lower.includes('5 feet')) {
    waterDepthInches = 48;
    depthCategory = 'chest_above';
    confidence += 0.2;
  } else if (lower.includes('waist') || lower.includes('hip') || lower.includes('இடுப்பளவு') || lower.includes('3 feet') || lower.includes('3ft')) {
    waterDepthInches = 32;
    depthCategory = 'waist';
    confidence += 0.2;
  } else if (lower.includes('knee') || lower.includes('முழங்கால்') || lower.includes('2 feet') || lower.includes('2ft') || lower.includes('1.5 feet')) {
    waterDepthInches = 18;
    depthCategory = 'knee';
    confidence += 0.15;
  } else if (lower.includes('ankle') || lower.includes('கரண்டை') || lower.includes('waterlogged') || lower.includes('few inches') || lower.includes('1 foot')) {
    waterDepthInches = 6;
    depthCategory = 'ankle';
    confidence += 0.15;
  }

  // Flow speed indicators
  if (lower.includes('fast') || lower.includes('current') || lower.includes('rushing') || lower.includes('dangerous') || lower.includes('வேகமாக')) {
    flowSpeed = 'fast_dangerous';
  } else if (lower.includes('stagnant') || lower.includes('standing') || lower.includes('தேங்கி')) {
    flowSpeed = 'stagnant';
  }

  // Power outage check
  if (lower.includes('power cut') || lower.includes('blackout') || lower.includes('electricity') || lower.includes('current cut') || lower.includes('மின்வெட்டு')) {
    powerOutage = true;
  }

  // Stranded check
  if (lower.includes('stranded') || lower.includes('trapped') || lower.includes('rescue') || lower.includes('elderly') || lower.includes('சிக்கியுள்ளனர்')) {
    strandedCount = 2;
  }

  return {
    neighborhoodId: neighborhoodId || 'velachery',
    neighborhoodName: neighborhoodName || 'Velachery',
    streetName: streetName || 'Main Cross Road',
    waterDepthInches,
    depthCategory,
    flowSpeed,
    powerOutage,
    strandedCount,
    confidence: Math.min(0.98, confidence)
  };
}

export interface DemoRouteHub {
  id: string;
  name: string;
  tamilName: string;
  lat: number;
  lng: number;
  neighborhoodId?: string;
}

export const DEMO_ROUTE_HUBS: DemoRouteHub[] = [
  { id: 'madipakkam', name: 'Madipakkam', tamilName: 'மடிப்பாக்கம்', lat: 12.9647, lng: 80.1961, neighborhoodId: 'madipakkam' },
  { id: 'velachery', name: 'Velachery', tamilName: 'வேளச்சேரி', lat: 12.9756, lng: 80.2207, neighborhoodId: 'velachery' },
  { id: 'perumbakkam', name: 'Perumbakkam', tamilName: 'பெரும்பாக்கம்', lat: 12.8984, lng: 80.2014, neighborhoodId: 'perumbakkam' },
  { id: 't_nagar', name: 'T. Nagar', tamilName: 'தி. நகர்', lat: 13.0418, lng: 80.2341, neighborhoodId: 't_nagar' },
  { id: 'mudichur', name: 'Mudichur', tamilName: 'முடிச்சூர்', lat: 12.9150, lng: 80.0820, neighborhoodId: 'mudichur' },
  { id: 'pallikaranai', name: 'Pallikaranai', tamilName: 'பள்ளிக்கரணை', lat: 12.9349, lng: 80.2137, neighborhoodId: 'pallikaranai' },
  { id: 'adyar', name: 'Adyar', tamilName: 'அடையார்', lat: 13.0012, lng: 80.2565, neighborhoodId: 'adyar' },
  { id: 'mylapore', name: 'Mylapore', tamilName: 'மயிலாப்பூர்', lat: 13.0368, lng: 80.2676, neighborhoodId: 'mylapore' },
  { id: 'guindy_airport', name: 'Chennai Airport / Guindy', tamilName: 'சென்னை விமான நிலையம் / கிண்டி', lat: 12.9941, lng: 80.1709 },
  { id: 'koyambedu', name: 'Koyambedu CMBT Hub', tamilName: 'கோயம்பேடு பேருந்து நிலையம்', lat: 13.0694, lng: 80.1948 },
  { id: 'omr_sholinganallur', name: 'OMR IT Corridor (Sholinganallur)', tamilName: 'ஓ.எம்.ஆர் சோழிங்கநல்லூர்', lat: 12.9010, lng: 80.2279 },
  { id: 'central', name: 'Chennai Central Station', tamilName: 'சென்னை சென்ட்ரல் ரயில் நிலையம்', lat: 13.0827, lng: 80.2707 }
];

interface DemoRoadEdgeDef {
  id: string;
  from: string;
  to: string;
  roadName: string;
  roadNameTa: string;
  isElevated: boolean;
  flyoverName?: string;
  streetSegmentId?: string;
  neighborhoodIds: string[];
  baseDepthInches: number;
  curvatureFactor: number; // Deterministic road geometry ratio vs straight line
}

const DEMO_STREET_NETWORK_EDGES: DemoRoadEdgeDef[] = [
  {
    id: 'edge_madi_vela_ground',
    from: 'madipakkam',
    to: 'velachery',
    roadName: 'Bazaar Rd & Vijayanagar Ground Junction',
    roadNameTa: 'பஜார் ரோடு & விஜயநகர் தரை சந்திப்பு',
    isElevated: false,
    streetSegmentId: 'st_vijayanagar_jn',
    neighborhoodIds: ['madipakkam', 'velachery'],
    baseDepthInches: 24,
    curvatureFactor: 1.20
  },
  {
    id: 'edge_madi_palli_ground',
    from: 'madipakkam',
    to: 'pallikaranai',
    roadName: 'Kuberan Nagar & Kamakoti Ground Link',
    roadNameTa: 'குபேரன் நகர் & காமகோடி இணைப்பு சாலை',
    isElevated: false,
    streetSegmentId: 'st_kuberan_nagar',
    neighborhoodIds: ['madipakkam', 'pallikaranai'],
    baseDepthInches: 25,
    curvatureFactor: 1.18
  },
  {
    id: 'edge_madi_guindy_ground',
    from: 'madipakkam',
    to: 'guindy_airport',
    roadName: 'Medavakkam Tank Rd & Guindy Subway Ground',
    roadNameTa: 'மேடவாக்கம் டேங்க் ரோடு & கிண்டி சுரங்கப்பாதை',
    isElevated: false,
    neighborhoodIds: ['madipakkam', 'velachery'],
    baseDepthInches: 21,
    curvatureFactor: 1.18
  },
  {
    id: 'edge_madi_guindy_elevated',
    from: 'madipakkam',
    to: 'guindy_airport',
    roadName: 'Inner Ring Rd Bypass & Kathipara Grade Separator',
    roadNameTa: 'உள்வட்டச் சாலை & கத்திப்பாரா மேம்பாலம்',
    isElevated: true,
    flyoverName: 'Kathipara Grade Separator',
    neighborhoodIds: ['madipakkam'],
    baseDepthInches: 2,
    curvatureFactor: 1.46
  },
  {
    id: 'edge_madi_mudichur_ground',
    from: 'madipakkam',
    to: 'mudichur',
    roadName: 'Keelkattalai & Tambaram Camp Ground Rd',
    roadNameTa: 'கீழ்க்கட்டளை & தாம்பரம் முகாம் தரைச் சாலை',
    isElevated: false,
    streetSegmentId: 'st_madipakkam_bazaar',
    neighborhoodIds: ['madipakkam', 'mudichur'],
    baseDepthInches: 23,
    curvatureFactor: 1.18
  },
  {
    id: 'edge_mudichur_guindy_ground',
    from: 'mudichur',
    to: 'guindy_airport',
    roadName: 'Mudichur High Rd & Chromepet Subway Ground',
    roadNameTa: 'முடிச்சூர் ஹை ரோடு & குரோம்பேட்டை தரைச் சாலை',
    isElevated: false,
    streetSegmentId: 'st_mudichur_high_rd',
    neighborhoodIds: ['mudichur'],
    baseDepthInches: 28,
    curvatureFactor: 1.15
  },
  {
    id: 'edge_mudichur_guindy_elevated',
    from: 'mudichur',
    to: 'guindy_airport',
    roadName: 'Tambaram–GST Elevated Highway & Airport Flyover',
    roadNameTa: 'தாம்பரம்–ஜி.எஸ்.டி உயர்மட்ட மேம்பாலச் சாலை',
    isElevated: true,
    flyoverName: 'GST Road Elevated Corridor',
    neighborhoodIds: ['mudichur'],
    baseDepthInches: 2,
    curvatureFactor: 1.32
  },
  {
    id: 'edge_palli_vela_ground',
    from: 'pallikaranai',
    to: 'velachery',
    roadName: 'Velachery–Tambaram Ground Arterial',
    roadNameTa: 'வேளச்சேரி–தாம்பரம் தரைவழிச் சாலை',
    isElevated: false,
    streetSegmentId: 'st_velachery_bypass',
    neighborhoodIds: ['pallikaranai', 'velachery'],
    baseDepthInches: 17,
    curvatureFactor: 1.14
  },
  {
    id: 'edge_palli_vela_elevated',
    from: 'pallikaranai',
    to: 'velachery',
    roadName: '200ft Radial Rd & Velachery Tier-2 Flyover',
    roadNameTa: '200 அடி ரேடியல் சாலை & வேளச்சேரி மேம்பாலம்',
    isElevated: true,
    flyoverName: 'Velachery 100ft High-Level Flyover',
    streetSegmentId: 'st_velachery_flyover',
    neighborhoodIds: ['pallikaranai', 'velachery'],
    baseDepthInches: 2,
    curvatureFactor: 1.34
  },
  {
    id: 'edge_palli_perum_ground',
    from: 'pallikaranai',
    to: 'perumbakkam',
    roadName: 'Pallikaranai Marshland Link Road',
    roadNameTa: 'பள்ளிக்கரணை சதுப்புநில இணைப்புச் சாலை',
    isElevated: false,
    neighborhoodIds: ['pallikaranai', 'perumbakkam'],
    baseDepthInches: 18,
    curvatureFactor: 1.15
  },
  {
    id: 'edge_palli_omr_elevated',
    from: 'pallikaranai',
    to: 'omr_sholinganallur',
    roadName: '200ft Radial Road Elevated Deck',
    roadNameTa: '200 அடி ரேடியல் உயர்மட்டச் சாலை',
    isElevated: true,
    flyoverName: '200ft Radial Road Elevated Link',
    streetSegmentId: 'st_pallikaranai_radial',
    neighborhoodIds: ['pallikaranai'],
    baseDepthInches: 3,
    curvatureFactor: 1.28
  },
  {
    id: 'edge_perum_omr_ground',
    from: 'perumbakkam',
    to: 'omr_sholinganallur',
    roadName: 'Perumbakkam Main Rd to Sholinganallur Jn',
    roadNameTa: 'பெரும்பாக்கம் பிரதான சாலை - சோழிங்கநல்லூர்',
    isElevated: false,
    neighborhoodIds: ['perumbakkam'],
    baseDepthInches: 16,
    curvatureFactor: 1.18
  },
  {
    id: 'edge_vela_guindy_ground',
    from: 'velachery',
    to: 'guindy_airport',
    roadName: 'Velachery 100ft Bypass Ground & Little Mount',
    roadNameTa: 'வேளச்சேரி 100 அடி தரைவழி பைபாஸ் & சின்னமலை',
    isElevated: false,
    streetSegmentId: 'st_velachery_bypass',
    neighborhoodIds: ['velachery'],
    baseDepthInches: 15,
    curvatureFactor: 1.16
  },
  {
    id: 'edge_vela_guindy_elevated',
    from: 'velachery',
    to: 'guindy_airport',
    roadName: 'Velachery High-Level Flyover & Sardar Patel Ramp',
    roadNameTa: 'வேளச்சேரி உயர்மட்ட மேம்பாலம் & சர்தார் படேல் சாலை',
    isElevated: true,
    flyoverName: 'Velachery High-Level Flyover (Tier 2)',
    streetSegmentId: 'st_velachery_flyover',
    neighborhoodIds: ['velachery'],
    baseDepthInches: 1,
    curvatureFactor: 1.35
  },
  {
    id: 'edge_vela_adyar_ground',
    from: 'velachery',
    to: 'adyar',
    roadName: 'Taramani Link & Sardar Patel Ground Rd',
    roadNameTa: 'தரமணி இணைப்பு & சர்தார் படேல் தரைச் சாலை',
    isElevated: false,
    neighborhoodIds: ['velachery', 'adyar'],
    baseDepthInches: 10,
    curvatureFactor: 1.18
  },
  {
    id: 'edge_omr_adyar_elevated',
    from: 'omr_sholinganallur',
    to: 'adyar',
    roadName: 'OMR IT Expressway & Madhya Kailash Flyover',
    roadNameTa: 'ஓ.எம்.ஆர் விரைவுச்சாலை & மத்திய கைலாஷ் மேம்பாலம்',
    isElevated: true,
    flyoverName: 'Madhya Kailash & OMR Elevated Deck',
    neighborhoodIds: ['adyar'],
    baseDepthInches: 3,
    curvatureFactor: 1.22
  },
  {
    id: 'edge_guindy_tnagar_ground',
    from: 'guindy_airport',
    to: 't_nagar',
    roadName: 'Saidapet Ground Bridge & South Usman Subway',
    roadNameTa: 'சைதாப்பேட்டை தரைப் பாலம் & தெற்கு உஸ்மான் சுரங்கப்பாதை',
    isElevated: false,
    streetSegmentId: 'st_ranganathan_st',
    neighborhoodIds: ['t_nagar'],
    baseDepthInches: 12,
    curvatureFactor: 1.15
  },
  {
    id: 'edge_guindy_tnagar_elevated',
    from: 'guindy_airport',
    to: 't_nagar',
    roadName: 'Anna Salai Flyover & Usman Rd Elevated Deck',
    roadNameTa: 'அண்ணா சாலை & உஸ்மான் ரோடு உயர்மட்ட மேம்பாலம்',
    isElevated: true,
    flyoverName: 'Usman Road Elevated Flyover',
    streetSegmentId: 'st_usman_flyover',
    neighborhoodIds: ['t_nagar'],
    baseDepthInches: 1,
    curvatureFactor: 1.30
  },
  {
    id: 'edge_guindy_koyambedu_ground',
    from: 'guindy_airport',
    to: 'koyambedu',
    roadName: 'Ekkatuthangal & Ashok Nagar Ground Arterial',
    roadNameTa: 'ஈக்காட்டுத்தாங்கல் & அசோக் நகர் தரைச் சாலை',
    isElevated: false,
    neighborhoodIds: [],
    baseDepthInches: 12,
    curvatureFactor: 1.14
  },
  {
    id: 'edge_guindy_koyambedu_elevated',
    from: 'guindy_airport',
    to: 'koyambedu',
    roadName: 'Inner Ring Rd & Vadapalani–Koyambedu Grade Separator',
    roadNameTa: 'உள்வட்டச் சாலை & வடபழனி–கோயம்பேடு மேம்பாலம்',
    isElevated: true,
    flyoverName: 'Vadapalani & Koyambedu Flyover Corridor',
    neighborhoodIds: [],
    baseDepthInches: 2,
    curvatureFactor: 1.26
  },
  {
    id: 'edge_adyar_mylapore_elevated',
    from: 'adyar',
    to: 'mylapore',
    roadName: 'Thiru Vi Ka Bridge & Santhome High Rd',
    roadNameTa: 'திரு வி க பாலம் & சாந்தோம் நெடுஞ்சாலை',
    isElevated: true,
    flyoverName: 'Thiru Vi Ka Bridge',
    streetSegmentId: 'st_adyar_bridge',
    neighborhoodIds: ['adyar', 'mylapore'],
    baseDepthInches: 2,
    curvatureFactor: 1.20
  },
  {
    id: 'edge_adyar_tnagar_ground',
    from: 'adyar',
    to: 't_nagar',
    roadName: 'Kotturpuram Low Bridge & Turnbulls Rd',
    roadNameTa: 'கோட்டூர்புரம் தாழ்வான பாலம் & டர்ன்புல்ஸ் சாலை',
    isElevated: false,
    neighborhoodIds: ['adyar', 't_nagar'],
    baseDepthInches: 11,
    curvatureFactor: 1.18
  },
  {
    id: 'edge_tnagar_mylapore_ground',
    from: 't_nagar',
    to: 'mylapore',
    roadName: 'Eldams Rd & Luz Church Rd',
    roadNameTa: 'எல்டாம்ஸ் சாலை & லஸ் சர்ச் சாலை',
    isElevated: false,
    neighborhoodIds: ['t_nagar', 'mylapore'],
    baseDepthInches: 6,
    curvatureFactor: 1.16
  },
  {
    id: 'edge_tnagar_koyambedu_ground',
    from: 't_nagar',
    to: 'koyambedu',
    roadName: 'Kodambakkam Bridge Ground & Arcot Rd',
    roadNameTa: 'கோடம்பாக்கம் தரைப்பாலம் & ஆற்காடு சாலை',
    isElevated: false,
    neighborhoodIds: ['t_nagar'],
    baseDepthInches: 10,
    curvatureFactor: 1.15
  },
  {
    id: 'edge_tnagar_central_ground',
    from: 't_nagar',
    to: 'central',
    roadName: 'Nungambakkam Subway & Egmore Ground Arterial',
    roadNameTa: 'நுங்கம்பாக்கம் சுரங்கப்பாதை & எழும்பூர் தரைச் சாலை',
    isElevated: false,
    neighborhoodIds: ['t_nagar'],
    baseDepthInches: 14,
    curvatureFactor: 1.14
  },
  {
    id: 'edge_tnagar_central_elevated',
    from: 't_nagar',
    to: 'central',
    roadName: 'Anna Flyover (Gemini) & Periyar EVR Elevated Link',
    roadNameTa: 'அண்ணா மேம்பாலம் (ஜெமினி) & பெரியார் ஈ.வெ.ரா சாலை',
    isElevated: true,
    flyoverName: 'Anna Flyover (Gemini)',
    neighborhoodIds: ['t_nagar'],
    baseDepthInches: 2,
    curvatureFactor: 1.28
  },
  {
    id: 'edge_mylapore_central_ground',
    from: 'mylapore',
    to: 'central',
    roadName: 'Kamarajar Salai & Wallajah Arterial',
    roadNameTa: 'காமராஜர் சாலை & வாலாஜா சாலை',
    isElevated: false,
    neighborhoodIds: ['mylapore'],
    baseDepthInches: 5,
    curvatureFactor: 1.16
  },
  {
    id: 'edge_koyambedu_central_ground',
    from: 'koyambedu',
    to: 'central',
    roadName: 'Aminjikarai & Kilpauk Ground Corridor',
    roadNameTa: 'அமைந்தகரை & கீழ்ப்பாக்கம் தரைச் சாலை',
    isElevated: false,
    neighborhoodIds: [],
    baseDepthInches: 11,
    curvatureFactor: 1.14
  },
  {
    id: 'edge_koyambedu_central_elevated',
    from: 'koyambedu',
    to: 'central',
    roadName: 'Anna Arch Flyover & Poonamallee Elevated Deck',
    roadNameTa: 'அண்ணா வளைவு மேம்பாலம் & பூந்தமல்லி உயர்மட்ட சாலை',
    isElevated: true,
    flyoverName: 'Anna Arch Flyover',
    neighborhoodIds: [],
    baseDepthInches: 2,
    curvatureFactor: 1.26
  }
];

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function resolveRouteHub(query: string): DemoRouteHub {
  const q = query.trim().toLowerCase();
  const exact = DEMO_ROUTE_HUBS.find(
    h => h.id === q || h.name.toLowerCase() === q
  );
  if (exact) return exact;

  const partial = DEMO_ROUTE_HUBS.find(
    h =>
      h.name.toLowerCase().includes(q) ||
      q.includes(h.id) ||
      q.includes(h.name.toLowerCase().split(' ')[0])
  );
  return partial || DEMO_ROUTE_HUBS[0];
}

interface EvaluatedEdge {
  edge: DemoRoadEdgeDef;
  fromHub: DemoRouteHub;
  toHub: DemoRouteHub;
  distanceKm: number;
  effectiveDepthInches: number;
  flowSpeed: 'stagnant' | 'slow' | 'fast_dangerous';
  isBarricaded: boolean;
  hasPumpActive: boolean;
  baseTimeMins: number;
  floodDelayMins: number;
  totalTimeMins: number;
  riskPenaltyWeight: number;
}

function getVehicleBaseSpeedKmh(vehicleType: TravelMode): number {
  switch (vehicleType) {
    case 'two_wheeler': return 28;
    case 'car': return 30;
    case 'suv': return 32;
    case 'emergency': return 36;
  }
}

function evaluateEdgeConditions(
  edge: DemoRoadEdgeDef,
  fromHub: DemoRouteHub,
  toHub: DemoRouteHub,
  vehicleType: TravelMode,
  scenario?: WeatherScenario,
  reports?: FloodReport[],
  streets?: StreetSegment[]
): EvaluatedEdge {
  const rawDistance = haversineDistanceKm(fromHub.lat, fromHub.lng, toHub.lat, toHub.lng);
  const distanceKm = Math.max(0.8, Number((rawDistance * edge.curvatureFactor).toFixed(1)));

  const matchedStreet = streets?.find(s => s.id === edge.streetSegmentId);
  const activeReports = (reports || []).filter(
    r => r.status !== 'debunked' && edge.neighborhoodIds.includes(r.neighborhoodId)
  );

  // Weather scenario multipliers
  const isCloudburst = scenario?.id === 'monsoon_burst';
  const isReceding = scenario?.id === 'receding_pumping';
  const depthScale = isCloudburst ? 1.3 : (isReceding ? 0.45 : 0.9);
  const scenarioRainAdd = isCloudburst ? 4 : (isReceding ? -2 : 0);
  const rainSpeedFactor = isCloudburst ? 0.78 : (isReceding ? 0.96 : 0.90);

  let effectiveDepthInches: number;
  let flowSpeed: 'stagnant' | 'slow' | 'fast_dangerous' = matchedStreet?.flowSpeed || 'slow';
  const isBarricaded = Boolean(matchedStreet?.isBarricaded);
  const hasPumpActive = Boolean(matchedStreet?.hasPumpActive);

  if (edge.isElevated) {
    // Elevated bridges stay above ground floodplains; only surface ramp spray
    const baseElevated = matchedStreet ? matchedStreet.waterDepthInches : edge.baseDepthInches;
    effectiveDepthInches = Math.max(
      0,
      Math.min(5, Math.round(baseElevated + (isCloudburst ? 2 : 0) - (isReceding ? 1 : 0)))
    );
    flowSpeed = 'stagnant';
  } else {
    const base = matchedStreet ? matchedStreet.waterDepthInches : edge.baseDepthInches;
    let scaledDepth = Math.round(base * depthScale + scenarioRainAdd);

    if (activeReports.length > 0) {
      const avgReported = Math.round(
        activeReports.reduce((sum, r) => sum + r.waterDepthInches, 0) / activeReports.length
      );
      const reportInfluence = Math.round(avgReported * (isReceding ? 0.55 : isCloudburst ? 1.1 : 0.85));
      scaledDepth = Math.round((scaledDepth + reportInfluence) / 2);

      if (activeReports.some(r => r.flowSpeed === 'fast_dangerous')) {
        flowSpeed = 'fast_dangerous';
      }
    }

    if (hasPumpActive) {
      scaledDepth = Math.max(0, scaledDepth - 3);
    }
    effectiveDepthInches = Math.max(0, Math.min(48, scaledDepth));
    if (effectiveDepthInches >= 24 && isCloudburst) {
      flowSpeed = 'fast_dangerous';
    }
  }

  // Base travel time from deterministic distance and vehicle speed + rain visibility slowdown
  const effectiveSpeedKmh = getVehicleBaseSpeedKmh(vehicleType) * rainSpeedFactor;
  const baseTimeMins = (distanceKm / effectiveSpeedKmh) * 60;

  // Deterministic flood & barricade delay penalties per segment
  let floodDelayMins = 0;

  if (isBarricaded) {
    floodDelayMins += vehicleType === 'emergency' ? 10 : 18;
  }

  if (effectiveDepthInches >= 24) {
    if (vehicleType === 'two_wheeler') floodDelayMins += 28;
    else if (vehicleType === 'car') floodDelayMins += 24;
    else if (vehicleType === 'suv') floodDelayMins += 14;
    else floodDelayMins += 9;
  } else if (effectiveDepthInches >= 12) {
    if (vehicleType === 'two_wheeler') floodDelayMins += 15;
    else if (vehicleType === 'car') floodDelayMins += 10;
    else if (vehicleType === 'suv') floodDelayMins += 4;
    else floodDelayMins += 2;
  } else if (effectiveDepthInches >= 6) {
    if (vehicleType === 'two_wheeler') floodDelayMins += 6;
    else if (vehicleType === 'car') floodDelayMins += 3.5;
    else if (vehicleType === 'suv') floodDelayMins += 1;
    else floodDelayMins += 0.5;
  } else if (effectiveDepthInches >= 3) {
    if (vehicleType === 'two_wheeler') floodDelayMins += 1.5;
    else if (vehicleType === 'car') floodDelayMins += 0.8;
  }

  if (flowSpeed === 'fast_dangerous' && !edge.isElevated) {
    floodDelayMins += vehicleType === 'emergency' ? 3 : 6;
  }

  // Elevated flyovers carry mild diversion congestion during cloudbursts
  if (edge.isElevated && isCloudburst) {
    floodDelayMins += distanceKm * 0.45;
  }

  const totalTimeMins = baseTimeMins + floodDelayMins;

  // Risk-weighted routing cost used to pick the safer flood-avoidance corridor
  const depthRiskWeight = edge.isElevated
    ? 0
    : Math.pow(effectiveDepthInches, 1.6) * (vehicleType === 'two_wheeler' ? 1.5 : vehicleType === 'car' ? 1.2 : 0.7);
  const barricadeRiskWeight = isBarricaded ? 500 : 0;
  const currentRiskWeight = flowSpeed === 'fast_dangerous' && !edge.isElevated ? 60 : 0;

  return {
    edge,
    fromHub,
    toHub,
    distanceKm,
    effectiveDepthInches,
    flowSpeed,
    isBarricaded,
    hasPumpActive,
    baseTimeMins,
    floodDelayMins,
    totalTimeMins,
    riskPenaltyWeight: totalTimeMins + depthRiskWeight + barricadeRiskWeight + currentRiskWeight
  };
}

function findShortestPathDijkstra(
  startId: string,
  endId: string,
  evaluatedEdges: EvaluatedEdge[],
  costSelector: (e: EvaluatedEdge) => number
): EvaluatedEdge[] {
  const dist: Record<string, number> = {};
  const prev: Record<string, { fromNode: string; edge: EvaluatedEdge } | null> = {};
  const visited = new Set<string>();

  for (const hub of DEMO_ROUTE_HUBS) {
    dist[hub.id] = Infinity;
    prev[hub.id] = null;
  }
  dist[startId] = 0;

  while (visited.size < DEMO_ROUTE_HUBS.length) {
    let current: string | null = null;
    let bestCost = Infinity;
    for (const hub of DEMO_ROUTE_HUBS) {
      if (!visited.has(hub.id) && dist[hub.id] < bestCost) {
        bestCost = dist[hub.id];
        current = hub.id;
      }
    }

    if (!current || current === endId || bestCost === Infinity) break;
    visited.add(current);

    for (const e of evaluatedEdges) {
      if (e.fromHub.id !== current) continue;
      const neighbor = e.toHub.id;
      if (visited.has(neighbor)) continue;
      const alt = dist[current] + costSelector(e);
      if (alt < dist[neighbor]) {
        dist[neighbor] = alt;
        prev[neighbor] = { fromNode: current, edge: e };
      }
    }
  }

  const path: EvaluatedEdge[] = [];
  let stepNode = endId;
  while (prev[stepNode]) {
    const link = prev[stepNode]!;
    path.unshift(link.edge);
    stepNode = link.fromNode;
  }
  return path;
}

function evaluateRouteRisk(
  maxDepth: number,
  hasBarricade: boolean,
  hasDangerousCurrent: boolean
): RiskLevel {
  if (hasBarricade || maxDepth >= 24 || (maxDepth >= 16 && hasDangerousCurrent)) return 'CRITICAL';
  if (maxDepth >= 14 || hasDangerousCurrent) return 'HIGH';
  if (maxDepth >= 6) return 'MODERATE';
  return 'SAFE';
}

function evaluateModeCompatibility(
  maxDepth: number,
  hasBarricade: boolean,
  vehicleType: TravelMode
): 'clear' | 'caution' | 'impassable' {
  if (hasBarricade) return 'impassable';
  if (vehicleType === 'two_wheeler') {
    if (maxDepth >= 10) return 'impassable';
    if (maxDepth >= 4) return 'caution';
    return 'clear';
  }
  if (vehicleType === 'car') {
    if (maxDepth >= 16) return 'impassable';
    if (maxDepth >= 7) return 'caution';
    return 'clear';
  }
  if (vehicleType === 'suv') {
    if (maxDepth >= 26) return 'impassable';
    if (maxDepth >= 14) return 'caution';
    return 'clear';
  }
  // emergency truck
  if (maxDepth >= 34) return 'impassable';
  if (maxDepth >= 20) return 'caution';
  return 'clear';
}

/**
 * Calculates dynamic, deterministic route estimates over the Chennai demo street network.
 * Computes separate paths for shortest direct distance vs lower-risk flood-avoidance corridors,
 * incorporating vehicle speed, flooded segment penalties, barricades, weather scenario, and reports.
 * NOTE: Simulated demo estimates only; never guaranteed for real-world emergency navigation.
 */
export function generateSafeRouteComparison(
  origin: string,
  destination: string,
  scenario?: WeatherScenario,
  reports?: FloodReport[],
  vehicleType: TravelMode = 'car',
  streets?: StreetSegment[]
): {
  safeRoute: RouteOption;
  directRoute: RouteOption;
} {
  const originHub = resolveRouteHub(origin);
  let destHub = resolveRouteHub(destination);

  if (originHub.id === destHub.id) {
    destHub = DEMO_ROUTE_HUBS.find(h => h.id !== originHub.id) || DEMO_ROUTE_HUBS[1];
  }

  // Build directed adjacency edges for both directions
  const directedEdges: EvaluatedEdge[] = [];
  for (const rawEdge of DEMO_STREET_NETWORK_EDGES) {
    const hubA = DEMO_ROUTE_HUBS.find(h => h.id === rawEdge.from);
    const hubB = DEMO_ROUTE_HUBS.find(h => h.id === rawEdge.to);
    if (!hubA || !hubB) continue;

    directedEdges.push(
      evaluateEdgeConditions(rawEdge, hubA, hubB, vehicleType, scenario, reports, streets),
      evaluateEdgeConditions(rawEdge, hubB, hubA, vehicleType, scenario, reports, streets)
    );
  }

  // 1. Direct route: strictly minimizes physical distance (preferring ground arterials when tied)
  const directPath = findShortestPathDijkstra(
    originHub.id,
    destHub.id,
    directedEdges,
    e => e.distanceKm + (e.edge.isElevated ? 0.35 : 0)
  );

  // 2. Lower-risk route: minimizes flood-weighted travel time & risk penalties
  const safePath = findShortestPathDijkstra(
    originHub.id,
    destHub.id,
    directedEdges,
    e => e.riskPenaltyWeight
  );

  const summarizePath = (
    path: EvaluatedEdge[],
    type: 'safe_corridor' | 'direct_hazardous'
  ): RouteOption => {
    const distanceKm = Number(path.reduce((sum, s) => sum + s.distanceKm, 0).toFixed(1));
    const baseTimeMins = Math.max(1, Math.round(path.reduce((sum, s) => sum + s.baseTimeMins, 0)));
    const floodDelayMins = Math.round(path.reduce((sum, s) => sum + s.floodDelayMins, 0));
    const timeMins = Math.max(1, Math.round(path.reduce((sum, s) => sum + s.totalTimeMins, 0)));

    const maxWaterDepthInches = path.length > 0
      ? Math.max(...path.map(s => s.effectiveDepthInches))
      : 0;
    const hasBarricade = path.some(s => s.isBarricaded);
    const hasDangerousCurrent = path.some(s => s.flowSpeed === 'fast_dangerous');

    const worstFlow = hasDangerousCurrent
      ? 'fast_dangerous'
      : path.some(s => s.flowSpeed === 'slow')
      ? 'slow'
      : 'stagnant';

    const passability: Passability = hasBarricade
      ? 'blocked'
      : evaluatePassability(maxWaterDepthInches, worstFlow);
    const riskLevel = evaluateRouteRisk(maxWaterDepthInches, hasBarricade, hasDangerousCurrent);
    const modeCompatibility = evaluateModeCompatibility(maxWaterDepthInches, hasBarricade, vehicleType);

    const elevatedFlyovers = Array.from(
      new Set(path.filter(s => s.edge.isElevated && s.edge.flyoverName).map(s => s.edge.flyoverName!))
    );

    const floodedSegments = path.filter(s => s.effectiveDepthInches >= 6 || s.isBarricaded);
    const hazards: string[] = [];
    const hazardsTa: string[] = [];

    if (floodedSegments.length === 0) {
      hazards.push(`Simulated max surface water ~${maxWaterDepthInches}" (minimal ponding on approaches)`);
      hazardsTa.push(`மாதிரி மதிப்பீட்டில் அதிகபட்ச நீர் ~${maxWaterDepthInches} அங்குலம் (குறைந்த தேக்கம்)`);
    } else {
      for (const seg of floodedSegments) {
        if (seg.isBarricaded) {
          hazards.push(`${seg.edge.roadName}: Barricaded / Road Closed (${seg.effectiveDepthInches}" water)`);
          hazardsTa.push(`${seg.edge.roadNameTa}: சாலை தடுப்பு / மூடப்பட்டுள்ளது (${seg.effectiveDepthInches}" நீர்)`);
        } else {
          hazards.push(`${seg.edge.roadName}: ~${seg.effectiveDepthInches}" simulated water depth (+${Math.round(seg.floodDelayMins)}m delay)`);
          hazardsTa.push(`${seg.edge.roadNameTa}: ~${seg.effectiveDepthInches}" நீர் தேக்கம் (+${Math.round(seg.floodDelayMins)} நிமிடம் தாமதம்)`);
        }
      }
    }

    if (floodDelayMins > 0 && type === 'safe_corridor') {
      hazards.push(`Estimated +${floodDelayMins} min weather & diversion slowdown included`);
      hazardsTa.push(`வானிலை & மாற்றுப்பாதை தாமதம் +${floodDelayMins} நிமிடங்கள் சேர்க்கப்பட்டுள்ளது`);
    }

    const steps = path.map(seg => {
      const statusTag = seg.isBarricaded
        ? 'BARRICADED'
        : seg.edge.isElevated
        ? `Elevated (${seg.effectiveDepthInches}" spray)`
        : `${seg.effectiveDepthInches}" ground water`;
      return `${seg.fromHub.name} → ${seg.toHub.name} via ${seg.edge.roadName} (${seg.distanceKm} km • ~${Math.round(seg.totalTimeMins)}m • ${statusTag})`;
    });

    const stepsTa = path.map(seg => {
      const statusTag = seg.isBarricaded
        ? 'சாலை மூடல்'
        : seg.edge.isElevated
        ? `மேம்பாலம் (${seg.effectiveDepthInches}" நீர்)`
        : `${seg.effectiveDepthInches}" தரை நீர்`;
      return `${seg.fromHub.tamilName} → ${seg.toHub.tamilName}: ${seg.edge.roadNameTa} (${seg.distanceKm} கி.மீ • ~${Math.round(seg.totalTimeMins)} நிமி • ${statusTag})`;
    });

    const isSameAsDirect =
      type === 'safe_corridor' &&
      path.length === directPath.length &&
      path.every((s, idx) => s.edge.id === directPath[idx]?.edge.id);

    const name =
      type === 'safe_corridor'
        ? isSameAsDirect
          ? `Optimal Demo Corridor (${originHub.name} to ${destHub.name})`
          : `Lower-Risk Elevated Demo Route (${originHub.name} to ${destHub.name})`
        : `Direct Ground Corridor (${originHub.name} to ${destHub.name})`;

    const nameTa =
      type === 'safe_corridor'
        ? isSameAsDirect
          ? `சிறந்த மாதிரி வழித்தடம் (${originHub.tamilName} → ${destHub.tamilName})`
          : `குறைந்த அபாய மேம்பாலப் பாதை (${originHub.tamilName} → ${destHub.tamilName})`
        : `நேரடி தரைவழிப் பாதை (${originHub.tamilName} → ${destHub.tamilName})`;

    const recommendationScore = Math.max(
      5,
      Math.min(
        96,
        Math.round(100 - maxWaterDepthInches * 2.1 - (hasBarricade ? 35 : 0) - floodDelayMins * 0.6)
      )
    );

    return {
      id: type === 'safe_corridor' ? 'route_elevated_safe' : 'route_direct_blocked',
      name,
      nameTa,
      type,
      distanceKm,
      timeMins,
      baseTimeMins,
      floodDelayMins,
      riskLevel,
      maxWaterDepthInches,
      passability,
      elevatedFlyovers,
      hazards,
      hazardsTa,
      steps,
      stepsTa,
      recommendationScore,
      modeCompatibility
    };
  };

  return {
    safeRoute: summarizePath(safePath, 'safe_corridor'),
    directRoute: summarizePath(directPath, 'direct_hazardous')
  };
}


