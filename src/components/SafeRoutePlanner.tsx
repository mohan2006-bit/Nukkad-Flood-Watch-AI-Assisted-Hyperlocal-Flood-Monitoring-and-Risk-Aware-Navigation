import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Car,
  Navigation,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowLeftRight,
  Clock
} from 'lucide-react';
import { useFlood } from '../context/FloodContext';
import { DEMO_ROUTE_HUBS, generateSafeRouteComparison } from '../utils/floodLogic';
import { RiskLevel, TravelMode } from '../types';

export const SafeRoutePlanner: React.FC = () => {
  const { language, t, currentScenario, reports, streets } = useFlood();

  const [origin, setOrigin] = useState<string>('Madipakkam');
  const [destination, setDestination] = useState<string>('Chennai Airport / Guindy');
  const [vehicleType, setVehicleType] = useState<TravelMode>('car');

  const { safeRoute, directRoute } = generateSafeRouteComparison(
    origin,
    destination,
    currentScenario,
    reports,
    vehicleType,
    streets
  );

  const handleOriginChange = (newOrigin: string) => {
    if (newOrigin === destination) {
      setDestination(origin);
    }
    setOrigin(newOrigin);
  };

  const handleSwapHubs = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const getRiskStyle = (risk?: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MODERATE':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const formatCompatibility = (compat?: 'clear' | 'caution' | 'impassable') => {
    if (compat === 'impassable') return 'Impassable for Selected Mode';
    if (compat === 'caution') return 'Caution / Heavy Slowdown';
    return 'Passable (Simulated)';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Route Planner Header */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Corridor Demo Estimator
            </span>
            <span className="text-xs text-slate-400">
              Street Network & Elevation Simulation
            </span>
          </div>
          <div className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            Active Scenario:{' '}
            <span className="font-semibold text-cyan-300">
              {language === 'ta' ? currentScenario.nameTa : currentScenario.name}
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-blue-400" />
            <span>{t.routesTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {t.routesSubtitle}
          </p>
        </div>

        {/* Prominent Demo Navigation Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-amber-200/90 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-bold tracking-wide uppercase text-[11px] text-amber-300">
              Simulated Estimates Only — Not Verified Emergency Navigation
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Distances, travel durations, and flood penalties are deterministic demo calculations over the simulated Chennai street network. They are not verified for real-world emergency evacuation. Always follow Greater Chennai Corporation (GCC) and Tamil Nadu Police official diversion orders.
            </p>
          </div>
        </div>

        {/* Origin / Destination / Mode Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.originLabel}</span>
            </label>
            <select
              aria-label={t.originLabel}
              value={origin}
              onChange={(e) => handleOriginChange(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-blue-500 font-medium"
            >
              {DEMO_ROUTE_HUBS.map(hub => (
                <option key={hub.id} value={hub.name}>
                  {language === 'ta' ? `${hub.name} (${hub.tamilName})` : hub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwapHubs}
              aria-label="Swap starting point and destination"
              title="Swap starting point and destination"
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.destLabel}</span>
            </label>
            <select
              aria-label={t.destLabel}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-blue-500 font-medium"
            >
              {DEMO_ROUTE_HUBS.filter(h => h.name !== origin).map(hub => (
                <option key={hub.id} value={hub.name}>
                  {language === 'ta' ? `${hub.name} (${hub.tamilName})` : hub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>Travel Mode</span>
            </label>
            <select
              aria-label="Travel Mode"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as TravelMode)}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="two_wheeler">Two-Wheeler (28 km/h base)</option>
              <option value="car">Sedan / Hatchback (30 km/h base)</option>
              <option value="suv">High-Clearance SUV (32 km/h base)</option>
              <option value="emergency">Emergency Relief Truck (36 km/h base)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Route Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LOWER-RISK DEMO ROUTE (FLOOD-AVOIDANCE CORRIDOR) */}
        <div className="bg-gradient-to-b from-slate-900 to-emerald-950/40 rounded-2xl p-5 border-2 border-emerald-500/50 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40">
                  <ShieldCheck className="w-3 h-3" />
                  SIMULATED LOWER-RISK ESTIMATE
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskStyle(safeRoute.riskLevel)}`}>
                  RISK: {safeRoute.riskLevel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1.5">
                {language === 'ta' ? safeRoute.nameTa : safeRoute.name}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-emerald-400 font-mono" data-testid="safe-route-time">
                ~{safeRoute.timeMins} min
              </div>
              <span className="text-[11px] text-slate-300 font-mono" data-testid="safe-route-distance">
                {safeRoute.distanceKm} km
              </span>
            </div>
          </div>

          {/* Timing & Depth Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Max Simulated Water Depth</span>
              <strong className="text-emerald-400 font-bold">
                {safeRoute.maxWaterDepthInches}" ({safeRoute.maxWaterDepthInches <= 3 ? 'Minimal ponding' : 'Caution'})
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Mode Assessment</span>
              <strong className={`font-bold ${safeRoute.modeCompatibility === 'impassable' ? 'text-red-400' : safeRoute.modeCompatibility === 'caution' ? 'text-amber-300' : 'text-emerald-400'}`}>
                {formatCompatibility(safeRoute.modeCompatibility)}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Base Drive: <strong>{safeRoute.baseTimeMins}m</strong>
            </span>
            <span>
              Flood / Weather Delay: <strong className={safeRoute.floodDelayMins ? 'text-amber-300' : 'text-emerald-400'}>+{safeRoute.floodDelayMins || 0}m</strong>
            </span>
          </div>

          {/* Elevated Flyovers List */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>{t.elevatedSections}:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {safeRoute.elevatedFlyovers.length > 0 ? (
                safeRoute.elevatedFlyovers.map((flyover, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold"
                  >
                    ▲ {flyover}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Direct arterial path (no elevated flyovers required on this sector)
                </span>
              )}
            </div>
          </div>

          {/* Turn-by-Turn Simulated Corridor Steps */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              {t.turnByTurn} (Simulated Network)
            </span>
            <div className="space-y-2 text-xs">
              {(language === 'ta' ? safeRoute.stepsTa : safeRoute.steps).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-slate-200 text-xs">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Simulated estimate only — prioritizes lower-depth corridors over shortest distance.</span>
          </div>
        </div>

        {/* DIRECT SHORTEST-DISTANCE GROUND ROUTE */}
        <div className="bg-gradient-to-b from-slate-900 to-red-950/40 rounded-2xl p-5 border-2 border-red-500/40 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[11px] font-bold border border-red-500/40">
                  <AlertTriangle className="w-3 h-3" />
                  SIMULATED DIRECT ROUTE ESTIMATE
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskStyle(directRoute.riskLevel)}`}>
                  RISK: {directRoute.riskLevel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1.5">
                {language === 'ta' ? directRoute.nameTa : directRoute.name}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-red-400 font-mono" data-testid="direct-route-time">
                ~{directRoute.timeMins} min
              </div>
              <span className="text-[11px] text-slate-300 font-mono" data-testid="direct-route-distance">
                {directRoute.distanceKm} km
              </span>
            </div>
          </div>

          {/* Timing & Hazard Tags */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Max Simulated Water Depth</span>
              <strong className={directRoute.maxWaterDepthInches >= 16 ? 'text-red-400 font-bold' : 'text-amber-300 font-bold'}>
                {directRoute.maxWaterDepthInches}" ({directRoute.maxWaterDepthInches >= 24 ? 'Waist/Chest-deep' : directRoute.maxWaterDepthInches >= 8 ? 'Knee-deep' : 'Shallow'})
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Mode Assessment</span>
              <strong className={`font-bold ${directRoute.modeCompatibility === 'impassable' ? 'text-red-400' : directRoute.modeCompatibility === 'caution' ? 'text-amber-300' : 'text-emerald-400'}`}>
                {formatCompatibility(directRoute.modeCompatibility)}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              Base Drive: <strong>{directRoute.baseTimeMins}m</strong>
            </span>
            <span>
              Flood Penalty Delay: <strong className="text-red-400">+{directRoute.floodDelayMins || 0}m</strong>
            </span>
          </div>

          {/* Hazards on Direct Path */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{t.groundHazards}:</span>
            </span>
            <div className="space-y-1.5">
              {(language === 'ta' ? directRoute.hazardsTa : directRoute.hazards).map((hazard, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{hazard}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Route Segment Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              Shortest Ground Segments
            </span>
            <div className="space-y-2 text-xs">
              {(language === 'ta' ? directRoute.stepsTa : directRoute.steps).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-slate-300 text-xs">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>Simulated estimate only — includes flood depth & barricade delay penalties for ground segments.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
