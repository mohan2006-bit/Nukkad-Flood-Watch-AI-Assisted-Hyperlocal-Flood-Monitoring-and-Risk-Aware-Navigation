import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { 
  Neighborhood, 
  StreetSegment, 
  FloodReport, 
  AlertItem, 
  WeatherScenario, 
  Language, 
  RiskLevel,
  ReporterRole,
  DepthCategory,
  FlowSpeed,
  Passability
} from '../types';
import { 
  INITIAL_NEIGHBORHOODS, 
  INITIAL_STREETS, 
  INITIAL_REPORTS, 
  INITIAL_ALERTS, 
  INITIAL_WEATHER_SCENARIOS 
} from '../data/mockData';
import { 
  calculateTrustScore, 
  calculateNeighborhoodRisk, 
  evaluatePassability 
} from '../utils/floodLogic';
import { translations } from '../locales/translations';

interface NewReportPayload {
  neighborhoodId: string;
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
  notes: string;
  hasPhoto?: boolean;
  photoUrl?: string;
  photoCaption?: string;
  imageType?: 'demo_illustration' | 'user_upload';
  isUserUpload?: boolean;
  source?: 'web' | 'whatsapp' | 'warden_field';
}

interface FloodContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  
  // Data State
  neighborhoods: Neighborhood[];
  streets: StreetSegment[];
  reports: FloodReport[];
  alerts: AlertItem[];
  weatherScenarios: WeatherScenario[];
  currentScenario: WeatherScenario;
  selectedNeighborhoodId: string | null;
  setSelectedNeighborhoodId: (id: string | null) => void;
  userConfirmedReportIds: string[];
  wardenLog: { id: string; action: string; time: number }[];

  // Actions
  setWeatherScenario: (scenarioId: string) => void;
  addReport: (payload: NewReportPayload) => FloodReport;
  confirmReport: (reportId: string) => void;
  verifyReport: (reportId: string) => void;
  debunkReport: (reportId: string) => void;
  escalateReport: (reportId: string) => void;
  toggleStreetPump: (streetId: string) => void;
  toggleStreetBarricade: (streetId: string) => void;
  addAlert: (alert: Omit<AlertItem, 'id' | 'timestamp'>) => void;
  dismissAlert: (alertId: string) => void;
}

const FloodContext = createContext<FloodContextType | undefined>(undefined);

export const FloodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>(INITIAL_NEIGHBORHOODS);
  const [streets, setStreets] = useState<StreetSegment[]>(INITIAL_STREETS);
  const [reports, setReports] = useState<FloodReport[]>(INITIAL_REPORTS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [currentScenario, setCurrentScenarioState] = useState<WeatherScenario>(INITIAL_WEATHER_SCENARIOS[0]);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | null>(null);
  const [userConfirmedReportIds, setUserConfirmedReportIds] = useState<string[]>([]);
  const [wardenLog, setWardenLog] = useState<{ id: string; action: string; time: number }[]>([
    { id: 'log_1', action: 'Deployed 100 HP Mobile Pump to Vijayanagar Bus Terminus', time: Date.now() - 40 * 60 * 1000 },
    { id: 'log_2', action: 'Erected barricades on Mudichur High Road approach bridge', time: Date.now() - 25 * 60 * 1000 },
    { id: 'log_3', action: 'Verified citizen report #rep_101 with Ward 177 field unit', time: Date.now() - 10 * 60 * 1000 }
  ]);

  const t = useMemo(() => translations[language], [language]);

  // Recalculate neighborhood risks dynamically when reports or scenarios change
  useEffect(() => {
    setNeighborhoods(prevNeighborhoods => {
      return prevNeighborhoods.map(neighborhood => {
        const areaReports = reports.filter(r => r.neighborhoodId === neighborhood.id && r.status !== 'debunked');
        const multiplier = currentScenario.id === 'monsoon_burst' ? 1.4 : (currentScenario.id === 'receding_pumping' ? 0.6 : 1.0);
        const dynamicRain = Math.round(neighborhood.rainfallLast24hMm * multiplier);
        
        const { riskLevel, avgDepthInches } = calculateNeighborhoodRisk(areaReports, dynamicRain);
        
        return {
          ...neighborhood,
          riskLevel,
          currentAvgDepthInches: avgDepthInches > 0 ? avgDepthInches : Math.round(neighborhood.currentAvgDepthInches * multiplier),
          activeReportsCount: areaReports.length
        };
      });
    });
  }, [reports, currentScenario]);

  const setWeatherScenario = (scenarioId: string) => {
    const sc = INITIAL_WEATHER_SCENARIOS.find(s => s.id === scenarioId) || INITIAL_WEATHER_SCENARIOS[0];
    setCurrentScenarioState(sc);

    // Also adjust street depth estimates for simulation
    setStreets(prev => prev.map(st => {
      let depth = st.waterDepthInches;
      if (scenarioId === 'monsoon_burst') {
        depth = Math.min(48, Math.round(st.waterDepthInches * 1.35) + 2);
      } else if (scenarioId === 'receding_pumping') {
        depth = Math.max(0, Math.round(st.waterDepthInches * 0.5) - 4);
      }
      return {
        ...st,
        waterDepthInches: depth,
        passability: evaluatePassability(depth, st.flowSpeed)
      };
    }));

    // Auto-generate system alert for severe weather shift
    if (sc.id === 'monsoon_burst') {
      const alertId = `sc_alert_${Date.now()}`;
      setAlerts(prev => [
        {
          id: alertId,
          title: 'Extreme Weather Simulation Active: Red Alert',
          titleTa: 'தீவிர வானிலை உருவகப்படுத்துதல் இயங்குகிறது: ரெட் அலர்ட்',
          message: 'Chembarambakkam outflow elevated to 12,500 cusecs. Multiple low-elevation subways across Velachery and Madipakkam submerged.',
          messageTa: 'செம்பரம்பாக்கம் உபரி நீர் 12,500 கனஅடியாக உயர்ந்துள்ளது. வேளச்சேரி மற்றும் மடிப்பாக்கம் தரைத்தள சாலைகளில் வெள்ளம் அதிகரித்துள்ளது.',
          severity: 'critical',
          neighborhoodId: 'velachery',
          neighborhoodName: 'Chennai South Flood Corridors',
          timestamp: Date.now(),
          source: 'official_mc',
          actionRequired: 'Stay indoors or use elevated flyovers only.',
          actionRequiredTa: 'உட்புறமே இருக்கவும்; மேம்பாலங்களை மட்டுமே பயன்படுத்தவும்.'
        },
        ...prev.filter(a => a.id !== alertId)
      ]);
    }
  };

  const addReport = (payload: NewReportPayload): FloodReport => {
    const targetNeighborhood = neighborhoods.find(n => n.id === payload.neighborhoodId);
    const neighborhoodName = targetNeighborhood ? targetNeighborhood.name : 'Chennai Ward';

    // Calculate corroborating reports count in same neighborhood
    const corroboratingCount = reports.filter(r => r.neighborhoodId === payload.neighborhoodId).length;

    const { score, breakdown } = calculateTrustScore({
      reporterRole: payload.reporterRole,
      confirmationsCount: 1, // User is 1st
      hasPhoto: Boolean(payload.hasPhoto || payload.photoUrl),
      timestamp: Date.now(),
      corroboratingReportsCount: corroboratingCount
    });

    const newReport: FloodReport = {
      id: `rep_${Date.now()}`,
      neighborhoodId: payload.neighborhoodId,
      neighborhoodName,
      streetName: payload.streetName,
      landmark: payload.landmark,
      waterDepthInches: payload.waterDepthInches,
      depthCategory: payload.depthCategory,
      flowSpeed: payload.flowSpeed,
      passability: payload.passability,
      powerOutage: payload.powerOutage,
      strandedVulnerableCount: payload.strandedVulnerableCount,
      reporterName: payload.reporterName || 'Chennai Citizen',
      reporterRole: payload.reporterRole,
      trustScore: score,
      trustBreakdown: breakdown,
      confirmationsCount: 1,
      photoUrl: payload.photoUrl,
      photoCaption: payload.photoCaption,
      imageType: payload.imageType || (payload.hasPhoto ? 'user_upload' : undefined),
      isUserUpload: payload.isUserUpload ?? Boolean(payload.hasPhoto || payload.photoUrl),
      status: payload.reporterRole === 'warden' ? 'verified' : 'pending',
      notes: payload.notes,
      timestamp: Date.now(),
      source: payload.source || 'web'
    };

    setReports(prev => [newReport, ...prev]);

    // Update matching or create street segment
    setStreets(prevStreets => {
      const existing = prevStreets.find(s => 
        s.neighborhoodId === payload.neighborhoodId && 
        (s.name.toLowerCase().includes(payload.streetName.toLowerCase()) || payload.streetName.toLowerCase().includes(s.name.toLowerCase()))
      );

      if (existing) {
        return prevStreets.map(s => s.id === existing.id ? {
          ...s,
          waterDepthInches: payload.waterDepthInches,
          flowSpeed: payload.flowSpeed,
          passability: payload.passability,
          lastUpdated: Date.now()
        } : s);
      } else {
        // Add as a new observed street segment
        const newStreet: StreetSegment = {
          id: `st_user_${Date.now()}`,
          name: payload.streetName,
          tamilName: payload.streetName,
          neighborhoodId: payload.neighborhoodId,
          waterDepthInches: payload.waterDepthInches,
          flowSpeed: payload.flowSpeed,
          passability: payload.passability,
          isElevated: false,
          lastUpdated: Date.now(),
          coordinates: {
            x1: targetNeighborhood ? targetNeighborhood.mapCoords.x - 20 : 350,
            y1: targetNeighborhood ? targetNeighborhood.mapCoords.y - 15 : 350,
            x2: targetNeighborhood ? targetNeighborhood.mapCoords.x + 25 : 390,
            y2: targetNeighborhood ? targetNeighborhood.mapCoords.y + 10 : 380,
          }
        };
        return [newStreet, ...prevStreets];
      }
    });

    // Automated Alert Trigger: If water is waist deep or vulnerable people are stranded
    if (payload.waterDepthInches >= 24 || payload.strandedVulnerableCount > 0 || payload.flowSpeed === 'fast_dangerous') {
      const autoAlert: AlertItem = {
        id: `auto_alert_${Date.now()}`,
        title: `Automated Alert: Severe Flood at ${payload.streetName}`,
        titleTa: `தானியங்கி எச்சரிக்கை: ${payload.streetName} பகுதியில் தீவிர வெள்ளம்`,
        message: `High risk reported: ${payload.waterDepthInches} inches water depth (${payload.depthCategory}) with ${payload.flowSpeed.replace('_', ' ')}. ${payload.strandedVulnerableCount > 0 ? `${payload.strandedVulnerableCount} residents need rescue assistance.` : ''}`,
        messageTa: `அபாய வெள்ளம் பதிவாகியுள்ளது: ${payload.waterDepthInches} அங்குல நீர் தேக்கம். ${payload.strandedVulnerableCount > 0 ? `${payload.strandedVulnerableCount} பேர் மீட்பு உதவி கோருகின்றனர்.` : ''}`,
        severity: payload.waterDepthInches >= 30 ? 'critical' : 'warning',
        neighborhoodId: payload.neighborhoodId,
        neighborhoodName,
        timestamp: Date.now(),
        source: 'community_auto',
        actionRequired: 'Avoid street; disaster rescue alerted.',
        actionRequiredTa: 'இச்சாலையை தவிர்க்கவும்; மீட்புக் குழுவினர் கவனத்திற்கு அனுப்பப்பட்டது.'
      };
      setAlerts(prev => [autoAlert, ...prev]);
    }

    setWardenLog(prev => [
      { id: `log_${Date.now()}`, action: `New report submitted for ${payload.streetName} (${payload.waterDepthInches}")`, time: Date.now() },
      ...prev
    ]);

    return newReport;
  };

  const confirmReport = (reportId: string) => {
    if (userConfirmedReportIds.includes(reportId)) return;

    setUserConfirmedReportIds(prev => [...prev, reportId]);

    setReports(prevReports => {
      return prevReports.map(report => {
        if (report.id === reportId) {
          const newConfirmCount = report.confirmationsCount + 1;
          const { score, breakdown } = calculateTrustScore({
            reporterRole: report.reporterRole,
            confirmationsCount: newConfirmCount,
            hasPhoto: Boolean(report.photoUrl),
            timestamp: report.timestamp
          });

          // If community confirmations reach 4+, promote status to verified
          const newStatus = (report.status === 'pending' && newConfirmCount >= 4) ? 'verified' : report.status;

          return {
            ...report,
            confirmationsCount: newConfirmCount,
            trustScore: score,
            trustBreakdown: breakdown,
            status: newStatus
          };
        }
        return report;
      });
    });
  };

  const verifyReport = (reportId: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'verified' as const,
          trustScore: Math.max(90, r.trustScore)
        };
      }
      return r;
    }));

    setWardenLog(prev => [
      { id: `log_${Date.now()}`, action: `Warden verified and sealed citizen report #${reportId.slice(-6)}`, time: Date.now() },
      ...prev
    ]);
  };

  const debunkReport = (reportId: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'debunked' as const,
          trustScore: 10
        };
      }
      return r;
    }));

    setWardenLog(prev => [
      { id: `log_${Date.now()}`, action: `Marked report #${reportId.slice(-6)} as debunked/spam (excluded from flood indices)`, time: Date.now() },
      ...prev
    ]);
  };

  const escalateReport = (reportId: string) => {
    const rep = reports.find(r => r.id === reportId);
    const locationName = rep ? rep.streetName : reportId;
    
    // Also verify report so it is addressed
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'verified' as const,
          trustScore: 98
        };
      }
      return r;
    }));

    setWardenLog(prev => [
      { id: `log_${Date.now()}`, action: `[DEMO ONLY] Simulated priority SOS escalated to NDRF / SDRF Command for ${locationName}`, time: Date.now() },
      ...prev
    ]);
  };

  const toggleStreetPump = (streetId: string) => {
    setStreets(prev => prev.map(s => {
      if (s.id === streetId) {
        const nextActive = !s.hasPumpActive;
        const newDepth = nextActive ? Math.max(0, s.waterDepthInches - 12) : s.waterDepthInches + 8;
        return {
          ...s,
          hasPumpActive: nextActive,
          waterDepthInches: newDepth,
          passability: evaluatePassability(newDepth, s.flowSpeed)
        };
      }
      return s;
    }));

    setWardenLog(prev => [
      { id: `log_${Date.now()}`, action: `Toggled GCC drainage motor pump for street #${streetId}`, time: Date.now() },
      ...prev
    ]);
  };

  const toggleStreetBarricade = (streetId: string) => {
    setStreets(prev => prev.map(s => {
      if (s.id === streetId) {
        const nextBarricade = !s.isBarricaded;
        return {
          ...s,
          isBarricaded: nextBarricade,
          passability: nextBarricade ? 'blocked' : evaluatePassability(s.waterDepthInches, s.flowSpeed)
        };
      }
      return s;
    }));

    setWardenLog(prev => [
      { id: `log_${Date.now()}`, action: `Updated traffic barricade status for street #${streetId}`, time: Date.now() },
      ...prev
    ]);
  };

  const addAlert = (alert: Omit<AlertItem, 'id' | 'timestamp'>) => {
    const newAlert: AlertItem = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: Date.now()
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  return (
    <FloodContext.Provider value={{
      language,
      setLanguage,
      t,
      neighborhoods,
      streets,
      reports,
      alerts,
      weatherScenarios: INITIAL_WEATHER_SCENARIOS,
      currentScenario,
      selectedNeighborhoodId,
      setSelectedNeighborhoodId,
      userConfirmedReportIds,
      wardenLog,
      setWeatherScenario,
      addReport,
      confirmReport,
      verifyReport,
      debunkReport,
      escalateReport,
      toggleStreetPump,
      toggleStreetBarricade,
      addAlert,
      dismissAlert
    }}>
      {children}
    </FloodContext.Provider>
  );
};

export const useFlood = () => {
  const context = useContext(FloodContext);
  if (!context) {
    throw new Error('useFlood must be used within a FloodProvider');
  }
  return context;
};
