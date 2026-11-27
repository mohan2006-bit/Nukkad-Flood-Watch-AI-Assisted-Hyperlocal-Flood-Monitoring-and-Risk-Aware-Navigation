import React, { useState } from 'react';
import { 
  Droplet, 
  MapPin, 
  CheckCircle2, 
  Camera, 
  AlertTriangle, 
  Car, 
  ZapOff, 
  LifeBuoy, 
  ShieldCheck, 
  Users, 
  Upload, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useFlood } from '../context/FloodContext';
import { DepthCategory, FlowSpeed, Passability, ReporterRole } from '../types';
import { calculateTrustScore, evaluatePassability } from '../utils/floodLogic';

interface ReportFormProps {
  onSuccess: (tab: string) => void;
  preselectedNeighborhoodId?: string;
}

export const ReportForm: React.FC<ReportFormProps> = ({ 
  onSuccess, 
  preselectedNeighborhoodId 
}) => {
  const { neighborhoods, addReport, language, t } = useFlood();

  const [neighborhoodId, setNeighborhoodId] = useState<string>(preselectedNeighborhoodId || 'velachery');
  const [streetName, setStreetName] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [waterDepthInches, setWaterDepthInches] = useState<number>(14);
  const [depthCategory, setDepthCategory] = useState<DepthCategory>('knee');
  const [flowSpeed, setFlowSpeed] = useState<FlowSpeed>('slow');
  const [powerOutage, setPowerOutage] = useState<boolean>(false);
  const [strandedCount, setStrandedCount] = useState<number>(0);
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterRole, setReporterRole] = useState<ReporterRole>('resident');
  const [notes, setNotes] = useState<string>('');
  const [hasPhoto, setHasPhoto] = useState<boolean>(true);
  const [photoUrl, setPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80');
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  // Quick street landmark suggestions for Chennai
  const streetSuggestions: Record<string, string[]> = {
    velachery: ['Vijayanagar Bus Stand Junction', '100ft Bypass Road', 'Lake View Main Road', 'Kaiveli Corner', 'Ram Nagar 2nd Main Rd'],
    madipakkam: ['Kuberan Nagar 1st Main Rd', 'Bazaar Road Market', 'Balaiah Nagar Main Road', 'Puzhuthivakkam High Road'],
    perumbakkam: ['Medavakkam Main Road', 'TNHB Colony Phase 2', 'Nookampalayam Link Road'],
    t_nagar: ['South Usman Road', 'Ranganathan Street', 'GN Chetty Road', 'Panagal Park North'],
    pallikaranai: ['200ft Radial Road', 'Kamakoti Nagar Main Rd', 'Oil Mill Road'],
    mudichur: ['Mudichur High Road', 'Varadarajapuram Bridge Approach', 'Krishna Nagar Main Rd'],
    adyar: ['LB Road Junction', 'Gandhi Nagar 4th Main', 'Kasturibai Nagar 3rd Cross'],
    mylapore: ['Luz Church Road', 'Royapettah High Road', 'North Mada Street']
  };

  const handleDepthSelect = (inches: number, cat: DepthCategory) => {
    setWaterDepthInches(inches);
    setDepthCategory(cat);
  };

  // Calculate live passability
  const currentPassability: Passability = evaluatePassability(waterDepthInches, flowSpeed);

  // Live trust score preview calculation
  const predictedTrust = calculateTrustScore({
    reporterRole,
    confirmationsCount: 1,
    hasPhoto,
    timestamp: Date.now()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetName.trim()) {
      alert('Please enter a street name or landmark.');
      return;
    }

    const createdReport = addReport({
      neighborhoodId,
      streetName: streetName.trim(),
      landmark: landmark.trim() || undefined,
      waterDepthInches,
      depthCategory,
      flowSpeed,
      passability: currentPassability,
      powerOutage,
      strandedVulnerableCount: strandedCount,
      reporterName: reporterName.trim() || (reporterRole === 'warden' ? 'Ward Officer' : 'Chennai Resident'),
      reporterRole,
      notes: notes.trim() || 'Observed street waterlogging during field transit.',
      hasPhoto,
      photoUrl: hasPhoto ? photoUrl : undefined,
      photoCaption: hasPhoto ? `Ground photo of ${streetName}` : undefined,
      imageType: 'user_upload',
      isUserUpload: true,
      source: 'web'
    });

    setSubmittedReportId(createdReport.id);
  };

  if (submittedReportId) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-900 rounded-2xl p-8 border border-emerald-500/30 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            Report #{submittedReportId.slice(-6)} Broadcast Live
          </span>
          <h2 className="text-2xl font-bold text-white">
            {language === 'ta' ? 'அறிக்கை வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!' : 'Street Report Broadcasted Successfully!'}
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            {language === 'ta'
              ? 'உங்கள் அறிக்கை உடனடியாக பொது வரைபடம், அபாயக் குறியீடுகள் மற்றும் எச்சரிக்கை முறையில் புதுப்பிக்கப்பட்டுள்ளது.'
              : 'Your field observation is now live on the interactive street map, updating risk scores and alerting neighborhood commuters.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 max-w-md mx-auto text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Location:</span>
            <strong className="text-white">{streetName} ({neighborhoodId})</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Water Depth:</span>
            <strong className="text-amber-400">{waterDepthInches}" ({depthCategory})</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Passability:</span>
            <strong className="text-white capitalize">{currentPassability.replace('_', ' ')}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Initial Trust Score:</span>
            <strong className="text-emerald-400 font-bold">{predictedTrust.score}%</strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onSuccess('map')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <span>{language === 'ta' ? 'வரைபடத்தில் பார்க்க' : 'View on Street Map'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSubmittedReportId(null);
              setStreetName('');
              setNotes('');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
          >
            {language === 'ta' ? 'மற்றொரு அறிக்கை அளிக்க' : 'Submit Another Report'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Citizen Ground Intelligence
          </span>
          <span className="text-xs text-slate-400">
            Chennai Flood Network
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {t.reportTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          {t.reportSubtitle}
        </p>

        {/* Live Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Neighborhood & Street Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.selectNeighborhood} *
              </label>
              <select
                aria-label={t.selectNeighborhood}
                value={neighborhoodId}
                onChange={(e) => setNeighborhoodId(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-blue-500"
              >
                {neighborhoods.map(n => (
                  <option key={n.id} value={n.id}>
                    {language === 'ta' ? n.tamilName : n.name} (Zone {n.zoneNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.streetAddress} *
              </label>
              <input
                type="text"
                placeholder={t.streetPlaceholder}
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-blue-500"
              />

              {/* Suggestions chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500 py-0.5">Quick picks:</span>
                {(streetSuggestions[neighborhoodId] || streetSuggestions['velachery']).slice(0, 3).map((st, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStreetName(st)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Visual Water Depth Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              {t.waterDepthLabel}: <span className="text-amber-400 font-extrabold">{waterDepthInches} inches</span> ({depthCategory})
            </label>

            {/* Depth Preset Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleDepthSelect(5, 'ankle')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  depthCategory === 'ankle'
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-base font-bold">Ankle Deep</div>
                <div className="text-[11px] opacity-80 mt-0.5">3 - 7 inches</div>
                <div className="text-[10px] text-emerald-400 font-medium mt-2">Two-wheelers OK</div>
              </button>

              <button
                type="button"
                onClick={() => handleDepthSelect(14, 'knee')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  depthCategory === 'knee'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-base font-bold">Knee Deep</div>
                <div className="text-[11px] opacity-80 mt-0.5">8 - 19 inches</div>
                <div className="text-[10px] text-amber-400 font-medium mt-2">Cars & SUVs only</div>
              </button>

              <button
                type="button"
                onClick={() => handleDepthSelect(28, 'waist')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  depthCategory === 'waist'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-base font-bold">Waist Deep</div>
                <div className="text-[11px] opacity-80 mt-0.5">20 - 35 inches</div>
                <div className="text-[10px] text-red-400 font-medium mt-2">High SUVs / Boats</div>
              </button>

              <button
                type="button"
                onClick={() => handleDepthSelect(42, 'chest_above')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  depthCategory === 'chest_above'
                    ? 'bg-rose-900/40 border-rose-500 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-base font-bold">Submerged</div>
                <div className="text-[11px] opacity-80 mt-0.5">36+ inches</div>
                <div className="text-[10px] text-rose-400 font-bold mt-2">Boats Only!</div>
              </button>
            </div>

            {/* Fine Tuning Slider */}
            <div className="pt-2">
              <input
                type="range"
                min="1"
                max="48"
                value={waterDepthInches}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setWaterDepthInches(val);
                  if (val < 8) setDepthCategory('ankle');
                  else if (val < 20) setDepthCategory('knee');
                  else if (val < 36) setDepthCategory('waist');
                  else setDepthCategory('chest_above');
                }}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1" (Trickle)</span>
                <span>12" (1 Foot)</span>
                <span>24" (2 Feet)</span>
                <span>36" (3 Feet)</span>
                <span>48" (4 Feet)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Water Velocity & Passability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.flowSpeedLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFlowSpeed('stagnant')}
                  className={`p-2 rounded-xl text-xs font-medium border text-center ${
                    flowSpeed === 'stagnant'
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {t.flowStagnant}
                </button>
                <button
                  type="button"
                  onClick={() => setFlowSpeed('slow')}
                  className={`p-2 rounded-xl text-xs font-medium border text-center ${
                    flowSpeed === 'slow'
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {t.flowSlow}
                </button>
                <button
                  type="button"
                  onClick={() => setFlowSpeed('fast_dangerous')}
                  className={`p-2 rounded-xl text-xs font-medium border text-center ${
                    flowSpeed === 'fast_dangerous'
                      ? 'bg-red-600/30 text-red-300 border-red-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {t.flowFast}
                </button>
              </div>
            </div>

            {/* Evaluated Vehicle Passability */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Passability (Calculated by Depth & Flow)
              </label>
              <div className="bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white capitalize">
                    {currentPassability.replace('_', ' ')}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  currentPassability === 'all' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : currentPassability === 'blocked' || currentPassability === 'boat_only'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {currentPassability === 'blocked' ? 'Impassable' : 'Passable'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Power Outage & Stranded People */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Electricity Status</span>
                <span className="text-[11px] text-slate-400">Power cut or transformer danger</span>
              </div>
              <button
                type="button"
                onClick={() => setPowerOutage(!powerOutage)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                  powerOutage
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <ZapOff className="w-3.5 h-3.5" />
                <span>{powerOutage ? 'Power Cut / Tripped' : 'Normal Power'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Stranded Residents?</span>
                <span className="text-[11px] text-slate-400">Need priority boat rescue</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStrandedCount(Math.max(0, strandedCount - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-700"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-white font-mono">
                  {strandedCount}
                </span>
                <button
                  type="button"
                  onClick={() => setStrandedCount(strandedCount + 1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Reporter Role & Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.reporterRoleLabel}
              </label>
              <select
                aria-label={t.reporterRoleLabel}
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value as ReporterRole)}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="resident">{t.roleResident}</option>
                <option value="volunteer">{t.roleVolunteer}</option>
                <option value="warden">{t.roleWarden}</option>
                <option value="anonymous">{t.roleAnon}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Reporter Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Anand Kumar (Resident)"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 6: Photo Attachment Simulation */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Attach Photo Verification (+15 Trust Points)</span>
              </div>
              <input 
                type="checkbox"
                id="hasPhotoCheck"
                checked={hasPhoto}
                onChange={(e) => setHasPhoto(e.target.checked)}
                className="rounded accent-emerald-500"
              />
            </div>

            {hasPhoto && (
              <div className="flex items-center gap-4">
                <img 
                  src={photoUrl} 
                  alt="Field verification preview"
                  className="w-20 h-16 rounded-lg object-cover border border-slate-700" 
                />
                <div className="flex-1 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Select field photo simulation:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                    >
                      Knee Water
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                    >
                      Flooded Street
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                    >
                      Bridge Inundation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {t.notesLabel}
            </label>
            <textarea
              rows={2}
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          {/* Real-time Trust Score Preview Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-blue-950 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm">
                {predictedTrust.score}%
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Calculated Trust Confidence Index</span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  Role: {predictedTrust.breakdown.reporterScore}pts • Photo: +{predictedTrust.breakdown.photoBonus}pts
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Droplet className="w-4 h-4" />
              <span>{t.btnSubmit}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
