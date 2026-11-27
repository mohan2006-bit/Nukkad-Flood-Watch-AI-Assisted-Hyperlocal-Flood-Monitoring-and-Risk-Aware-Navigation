import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Compass, 
  Droplets, 
  CheckCircle2, 
  Users, 
  MapPin, 
  ExternalLink, 
  Clock, 
  Camera, 
  Flame, 
  ZapOff, 
  LifeBuoy, 
  Car,
  ChevronRight,
  TrendingUp,
  FileText,
  Info
} from 'lucide-react';
import { useFlood } from '../context/FloodContext';
import { Neighborhood, FloodReport, RiskLevel } from '../types';

interface ResidentDashboardProps {
  onNavigate: (tab: string, neighborhoodId?: string) => void;
}

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ onNavigate }) => {
  const { 
    neighborhoods, 
    reports, 
    currentScenario, 
    confirmReport, 
    userConfirmedReportIds, 
    language, 
    t 
  } = useFlood();

  const [filterNeighborhood, setFilterNeighborhood] = useState<string>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'verified' | 'high_trust'>('all');

  const criticalNeighborhoods = neighborhoods.filter(n => n.riskLevel === 'CRITICAL');
  const highRiskNeighborhoods = neighborhoods.filter(n => n.riskLevel === 'HIGH');
  const totalShelterCapacity = neighborhoods.reduce((acc, n) => acc + n.shelterCapacity, 0);
  const totalShelterOccupancy = neighborhoods.reduce((acc, n) => acc + n.shelterOccupancy, 0);

  const filteredReports = reports.filter(r => {
    if (filterNeighborhood !== 'all' && r.neighborhoodId !== filterNeighborhood) return false;
    if (reportFilter === 'verified' && r.status !== 'verified') return false;
    if (reportFilter === 'high_trust' && r.trustScore < 80) return false;
    return true;
  });

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/20 text-red-400 border-red-500/40',
          dot: 'bg-red-500 animate-pulse',
          text: t.riskCritical
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          dot: 'bg-orange-500',
          text: t.riskHigh
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
          dot: 'bg-yellow-500',
          text: t.riskModerate
        };
      case 'SAFE':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-500',
          text: t.riskSafe
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                {currentScenario.redAlertLevel} ALERT
              </span>
              <span className="text-xs text-slate-400">
                Chennai Basin Telemetry
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'ta' ? 'சென்னை சுற்றுவட்டார வெள்ள அபாய நிலை' : 'Chennai Hyperlocal Flood Risk Dashboard'}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'ta'
                ? 'செம்பரம்பாக்கம் ஏரி உபரி நீர் திறப்பு மற்றும் பொதுமக்கள் சமர்ப்பித்த நேரடி அறிக்கைகளின் ஒருங்கிணைந்த பகுப்பாய்வு.'
                : 'Real-time street water depth, reservoir discharge alerts, and trust-scored citizen reports for South Chennai corridors.'}
            </p>
          </div>

          {/* Direct Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('report')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Droplets className="w-4 h-4" />
              <span>{t.btnSubmitReport}</span>
            </button>
            <button
              onClick={() => onNavigate('routes')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <Compass className="w-4 h-4" />
              <span>{t.btnFindSafeRoute}</span>
            </button>
            <button
              onClick={() => onNavigate('whatsapp')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-xs sm:text-sm border border-emerald-500/30 transition-all"
            >
              <span>{t.btnOpenWhatsApp}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Wards Card */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical Flood Zones</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-400">
              {criticalNeighborhoods.length + highRiskNeighborhoods.length}
            </span>
            <span className="text-xs text-slate-400">of {neighborhoods.length} Wards</span>
          </div>
          <div className="mt-2 text-[11px] text-red-300/80 flex items-center gap-1">
            <span className="font-semibold">{criticalNeighborhoods.map(n => n.name).join(', ')}</span>
          </div>
        </div>

        {/* Reservoir Outflow Card */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Chembarambakkam Outflow</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-400">
              {currentScenario.reservoirDischargeCusecs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">{t.cusecs}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Poondi: {currentScenario.poondiDischargeCusecs.toLocaleString()} {t.cusecs}</span>
            <span className="text-amber-400 font-medium">Surge Level 3</span>
          </div>
        </div>

        {/* Community Verified Reports Card */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Verified Citizen Reports</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {reports.filter(r => r.status === 'verified').length}
            </span>
            <span className="text-xs text-slate-400">of {reports.length} Reports</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-300/80 flex items-center gap-1">
            <span>Trust index: 88% average score</span>
          </div>
        </div>

        {/* Relief Shelter Capacity */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Relief Shelters</span>
            <LifeBuoy className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">
              {totalShelterOccupancy}
            </span>
            <span className="text-xs text-slate-400">/ {totalShelterCapacity} Capacity</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-cyan-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.round((totalShelterOccupancy / totalShelterCapacity) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Neighborhood Flood Risk Indicators Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span>{language === 'ta' ? 'வார்டு வெள்ள அபாய குறிகாட்டிகள் / Ward Risk Indicators' : 'Ward-Level Flood Risk Indicators'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ta' 
                ? 'சென்னையின் முக்கிய குடியிருப்புப் பகுதிகளின் தற்போதைய சராசரி நீர்மட்டம் மற்றும் நிவாரண முகாம் விவரங்கள்.' 
                : 'Current average street water depth, rainfall telemetry, and relief shelters across Chennai zones.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{language === 'ta' ? 'முழு வரைபடத்தைக் காண்க' : 'Open Interactive Street Map'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid of Neighborhood Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {neighborhoods.map(neighborhood => {
            const badge = getRiskBadge(neighborhood.riskLevel);
            const depthInFeet = (neighborhood.currentAvgDepthInches / 12).toFixed(1);

            return (
              <div 
                key={neighborhood.id}
                className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                        {language === 'ta' ? `${neighborhood.name} (${neighborhood.tamilName})` : neighborhood.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Zone {neighborhood.zoneNumber} • {neighborhood.activeReportsCount} Reports
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      {badge.text}
                    </span>
                  </div>

                  {/* Water Depth Level Indicator */}
                  <div className="my-3 bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Avg Water Depth:</span>
                      <span className="font-bold text-white font-mono">
                        {neighborhood.currentAvgDepthInches}" <span className="text-slate-400 font-normal">({depthInFeet} ft)</span>
                      </span>
                    </div>

                    {/* Visual Depth Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          neighborhood.currentAvgDepthInches > 24 
                            ? 'bg-red-500' 
                            : neighborhood.currentAvgDepthInches > 12 
                            ? 'bg-orange-500' 
                            : neighborhood.currentAvgDepthInches > 5 
                            ? 'bg-yellow-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (neighborhood.currentAvgDepthInches / 36) * 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>Dry</span>
                      <span>Knee (1.5')</span>
                      <span>Waist (3'+)</span>
                    </div>
                  </div>

                  {/* Description / Hotspot summary */}
                  <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                    {language === 'ta' ? neighborhood.descriptionTa : neighborhood.description}
                  </p>
                </div>

                {/* Shelter & Quick Action Footer */}
                <div className="pt-3 border-t border-slate-800/80 text-xs">
                  <div className="text-[11px] text-slate-400 mb-2 truncate">
                    <span className="text-slate-500 font-medium">Shelter: </span>
                    <span className="text-slate-300">{neighborhood.shelterName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('map', neighborhood.id)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[11px] font-semibold text-center border border-blue-500/30 transition-colors"
                    >
                      {language === 'ta' ? 'வரைபடத்தில் காண்க' : 'View Streets'}
                    </button>
                    <button
                      onClick={() => onNavigate('report', neighborhood.id)}
                      className="py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-semibold text-center border border-emerald-500/30 transition-colors"
                    >
                      + {language === 'ta' ? 'அறிக்கை' : 'Report'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust-Scored Live Reports Stream */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{language === 'ta' ? 'உறுதிப்படுத்தப்பட்ட நேரடிப் பொது அறிக்கைகள்' : 'Trust-Scored Citizen Reports Stream'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? 'பொதுமக்கள் சமர்ப்பித்த தகவல்கள் நம்பகத்தன்மை மதிப்பெண் மற்றும் புகைப்படங்களுடன்.'
                : 'Aggregated ground reports scored by reporter role, photo verification, and community confirmations.'}
            </p>
          </div>

          {/* Filters for feed */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter reports by neighborhood"
              value={filterNeighborhood}
              onChange={(e) => setFilterNeighborhood(e.target.value)}
              className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700"
            >
              <option value="all">{language === 'ta' ? 'அனைத்து பகுதிகள்' : 'All Neighborhoods'}</option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{language === 'ta' ? n.tamilName : n.name}</option>
              ))}
            </select>

            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setReportFilter('all')}
                className={`px-2 py-1 rounded ${reportFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                {language === 'ta' ? 'அனைத்தும்' : 'All'}
              </button>
              <button
                onClick={() => setReportFilter('verified')}
                className={`px-2 py-1 rounded ${reportFilter === 'verified' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                {language === 'ta' ? 'சரிபார்க்கப்பட்டவை' : 'Verified'}
              </button>
              <button
                onClick={() => setReportFilter('high_trust')}
                className={`px-2 py-1 rounded ${reportFilter === 'high_trust' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                {language === 'ta' ? 'உயர் நம்பிக்கை (>80%)' : 'High Trust (>80%)'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(report => {
            const isConfirmedByUser = userConfirmedReportIds.includes(report.id);
            const timeAgoMins = Math.max(1, Math.round((Date.now() - report.timestamp) / (1000 * 60)));

            return (
              <div
                key={report.id}
                className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 flex flex-col justify-between shadow-md transition-all"
              >
                <div>
                  {/* Card Header: Location & Trust Meter */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                        {report.neighborhoodName}
                      </span>
                      <h4 className="font-bold text-white text-sm line-clamp-1">
                        {report.streetName}
                      </h4>
                      {report.landmark && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">{report.landmark}</p>
                      )}
                    </div>

                    {/* Circular or Pill Trust Score Meter with interactive explanation toggle */}
                    <div className="flex flex-col items-end relative group/trust">
                      <div className={`px-2 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 border cursor-help ${
                        report.trustScore >= 80 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : report.trustScore >= 60 
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                      title={`Role: ${report.trustBreakdown?.reporterScore || 55}pts | Photo: +${report.trustBreakdown?.photoBonus || 0}pts | Community: +${report.trustBreakdown?.communityConfirmations || 5}pts`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{report.trustScore}%</span>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-0.5">
                        <span>Trust Score</span>
                        <Info className="w-2.5 h-2.5 text-slate-400" />
                      </span>

                      {/* Tooltip Hover Explanation */}
                      <div className="hidden group-hover/trust:block absolute right-0 top-7 z-30 w-52 p-2.5 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-[10px] text-slate-300 space-y-1">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">
                          Trust Score Breakdown:
                        </div>
                        <div className="flex justify-between">
                          <span>Reporter Role ({report.reporterRole}):</span>
                          <strong className="text-white">{report.trustBreakdown?.reporterScore ?? 55} pts</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Photo Corroboration:</span>
                          <strong className="text-emerald-400">+{report.trustBreakdown?.photoBonus ?? (report.photoUrl ? 15 : 0)} pts</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Peer Confirmations ({report.confirmationsCount}):</span>
                          <strong className="text-blue-400">+{report.trustBreakdown?.communityConfirmations ?? (report.confirmationsCount * 5)} pts</strong>
                        </div>
                        {(report.trustBreakdown?.timeDecay ?? 0) < 0 && (
                          <div className="flex justify-between text-amber-400">
                            <span>Time Decay Penalty:</span>
                            <strong>{report.trustBreakdown?.timeDecay} pts</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Water Depth & Passability Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      report.waterDepthInches >= 24 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : report.waterDepthInches >= 12 
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {report.waterDepthInches}" Depth ({report.depthCategory})
                    </span>

                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {report.passability.replace('_', ' ')}
                    </span>

                    {report.powerOutage && (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <ZapOff className="w-3 h-3" />
                        Power Cut
                      </span>
                    )}

                    {report.strandedVulnerableCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-red-600/30 text-red-200 border border-red-500/40 flex items-center gap-1 font-bold animate-pulse">
                        <LifeBuoy className="w-3 h-3" />
                        {report.strandedVulnerableCount} Stranded!
                      </span>
                    )}
                  </div>

                  {/* Notes / Ground observations */}
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-3 italic">
                    "{report.notes}"
                  </p>

                  {/* Photo Attachment: Distinctly tagged as DEMO ILLUSTRATION vs USER PHOTO */}
                  {report.photoUrl && (
                    <div className="relative mb-3 rounded-lg overflow-hidden border border-slate-800 max-h-36 group/img">
                      <img 
                        src={report.photoUrl} 
                        alt={report.photoCaption || "Field flood condition"} 
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border shadow ${
                          report.isUserUpload
                            ? 'bg-blue-600/90 text-white border-blue-400'
                            : 'bg-amber-500/90 text-slate-950 border-amber-300'
                        }`}>
                          {report.isUserUpload ? '📸 User Uploaded Photo' : '🎨 Demo Illustration'}
                        </span>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-sm p-1.5 text-[10px] text-slate-300 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{report.photoCaption || (report.isUserUpload ? 'Ground observation photo uploaded' : 'Simulated demonstration photo')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Reporter, Timestamp, Confirmations & Upvote */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                  <div className="text-[11px] text-slate-400 min-w-0">
                    <div className="font-medium text-slate-300 truncate max-w-[130px]">
                      {report.reporterName}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgoMins}m ago</span>
                      <span>•</span>
                      <span className="capitalize">{report.source}</span>
                    </div>
                  </div>

                  {/* 1-Click "I Can Confirm This" Button (Disabled after click to prevent duplicate confirmations) */}
                  <button
                    type="button"
                    onClick={() => confirmReport(report.id)}
                    disabled={isConfirmedByUser}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      isConfirmedByUser 
                        ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 cursor-default shadow-none' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 active:scale-95 shadow'
                    }`}
                    title={isConfirmedByUser ? "You have already confirmed this incident" : "Upvote and corroborate this citizen report"}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isConfirmedByUser ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>
                      {isConfirmedByUser ? t.confirmedByYou : t.btnConfirmReport} ({report.confirmationsCount})
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
