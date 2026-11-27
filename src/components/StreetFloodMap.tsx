import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Filter, 
  Navigation, 
  AlertOctagon, 
  Droplet, 
  Car, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  Activity
} from 'lucide-react';
import { useFlood } from '../context/FloodContext';
import { StreetSegment, Passability } from '../types';

interface StreetFloodMapProps {
  onNavigateToReport: (neighborhoodId?: string) => void;
  initialNeighborhoodId?: string;
}

export const StreetFloodMap: React.FC<StreetFloodMapProps> = ({ 
  onNavigateToReport,
  initialNeighborhoodId 
}) => {
  const { 
    neighborhoods, 
    streets, 
    reports, 
    language, 
    t, 
    confirmReport, 
    userConfirmedReportIds,
    toggleStreetPump,
    toggleStreetBarricade
  } = useFlood();

  const [selectedStreet, setSelectedStreet] = useState<StreetSegment | null>(null);
  const [depthFilter, setDepthFilter] = useState<'all' | 'safe' | 'knee' | 'waist_submerged'>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [highlightElevated, setHighlightElevated] = useState<boolean>(false);
  const [mapScale, setMapScale] = useState<number>(1);

  // Filtered street segments
  const filteredStreets = streets.filter(street => {
    // Depth filter
    if (depthFilter === 'safe' && street.waterDepthInches > 6) return false;
    if (depthFilter === 'knee' && (street.waterDepthInches < 8 || street.waterDepthInches > 19)) return false;
    if (depthFilter === 'waist_submerged' && street.waterDepthInches < 20) return false;

    // Vehicle passability filter
    if (vehicleFilter !== 'all') {
      if (vehicleFilter === 'two_wheeler' && !['all', 'two_wheeler'].includes(street.passability)) return false;
      if (vehicleFilter === 'four_wheeler_only' && !['all', 'two_wheeler', 'four_wheeler_only'].includes(street.passability)) return false;
      if (vehicleFilter === 'suv_only' && !['all', 'two_wheeler', 'four_wheeler_only', 'suv_only'].includes(street.passability)) return false;
      if (vehicleFilter === 'boat_only' && street.passability !== 'boat_only') return false;
    }

    return true;
  });

  const getStreetStrokeColor = (street: StreetSegment) => {
    if (street.isElevated && highlightElevated) return '#38bdf8'; // sky blue glowing flyover
    if (street.isBarricaded) return '#ef4444'; // barricaded red
    if (street.waterDepthInches <= 3) return '#10b981'; // dry green
    if (street.waterDepthInches <= 7) return '#eab308'; // ankle yellow
    if (street.waterDepthInches <= 19) return '#f97316'; // knee orange
    if (street.waterDepthInches <= 35) return '#ef4444'; // waist red
    return '#881337'; // chest / submerged dark crimson
  };

  const getStreetStrokeWidth = (street: StreetSegment) => {
    if (selectedStreet?.id === street.id) return 9;
    if (street.isElevated) return 6;
    return 4.5;
  };

  // Find reports matching selected street
  const selectedStreetReports = selectedStreet 
    ? reports.filter(r => r.neighborhoodId === selectedStreet.neighborhoodId)
    : [];

  return (
    <div className="space-y-4">
      {/* Map Header & Controls Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Interactive Telemetry
            </span>
            <span className="text-xs text-slate-400">
              {filteredStreets.length} street segments active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-400" />
            <span>{t.mapTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.mapSubtitle}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Depth Filter */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-slate-400 px-2 font-medium hidden sm:inline">Depth:</span>
            <button
              onClick={() => setDepthFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                depthFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDepthFilter('safe')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                depthFilter === 'safe' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              &lt; 7"
            </button>
            <button
              onClick={() => setDepthFilter('knee')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                depthFilter === 'knee' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Knee (8-19")
            </button>
            <button
              onClick={() => setDepthFilter('waist_submerged')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                depthFilter === 'waist_submerged' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Waist+ (&gt;20")
            </button>
          </div>

          {/* Vehicle Passability Dropdown */}
          <div className="flex items-center bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            <Car className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              aria-label="Filter by vehicle passability"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none"
            >
              <option value="all">Any Vehicle</option>
              <option value="two_wheeler">Bikes & Scooters</option>
              <option value="four_wheeler_only">Cars / Autos</option>
              <option value="suv_only">High SUVs</option>
              <option value="boat_only">Rescue Boats</option>
            </select>
          </div>

          {/* Toggle Elevated Flyovers */}
          <button
            onClick={() => setHighlightElevated(!highlightElevated)}
            className={`px-3 py-1.5 rounded-xl font-medium border flex items-center gap-1.5 transition-all ${
              highlightElevated 
                ? 'bg-sky-500/20 text-sky-300 border-sky-400' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flyovers Only</span>
          </button>
        </div>
      </div>

      {/* Main Map Canvas & Side Panel Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SVG Interactive Map Area (Takes 2 Columns on desktop) */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-2 sm:p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between">
          {/* Map Top Floating Overlay Info */}
          <div className="absolute top-6 left-6 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-xs shadow-lg flex items-center gap-3 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
              <span className="font-bold text-white">Live Hydrological Vector</span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">Click any street or node for telemetry</span>
          </div>

          {/* Zoom controls */}
          <div className="absolute top-6 right-6 z-10 flex flex-col gap-1.5">
            <button
              onClick={() => setMapScale(prev => Math.min(1.4, prev + 0.1))}
              className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-base shadow"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setMapScale(prev => Math.max(0.8, prev - 0.1))}
              className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-base shadow"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => setMapScale(1)}
              className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs shadow"
              title="Reset Zoom"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive SVG Drawing */}
          <div className="w-full overflow-auto flex items-center justify-center py-2">
            <svg 
              viewBox="0 0 650 620" 
              className="w-full max-w-[650px] h-auto select-none transition-transform duration-300"
              style={{ transform: `scale(${mapScale})`, transformOrigin: 'center center' }}
            >
              <defs>
                {/* Bay of Bengal Pattern */}
                <linearGradient id="bayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#082f49" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
                </linearGradient>

                {/* Lake Inundation Filter */}
                <radialGradient id="lakeWaterGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#0369a1" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.5" />
                </radialGradient>

                {/* Glow Filter for Active Flyovers */}
                <filter id="flyoverGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Coastline / Bay of Bengal */}
              <rect x="0" y="0" width="650" height="620" fill="#090d16" />
              
              {/* Eastern Bay of Bengal Coastal Water */}
              <path 
                d="M 540 0 Q 560 300 590 620 L 650 620 L 650 0 Z" 
                fill="url(#bayGradient)" 
              />
              <text x="590" y="80" fill="#38bdf8" fontSize="11" fontWeight="bold" opacity="0.6" transform="rotate(85, 590, 80)">
                BAY OF BENGAL
              </text>

              {/* Natural Water Bodies */}
              {/* Adyar River Channel */}
              <path 
                d="M 50 250 Q 200 280 340 260 T 540 260" 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="14" 
                strokeLinecap="round" 
                opacity="0.8" 
              />
              <text x="210" y="265" fill="#bae6fd" fontSize="10" fontWeight="bold" opacity="0.8">
                Adyar River Channel (Flood Spilling)
              </text>

              {/* Buckingham Canal North-South Link */}
              <path 
                d="M 460 30 L 470 240 L 460 480 L 475 610" 
                fill="none" 
                stroke="#0369a1" 
                strokeWidth="6" 
                strokeDasharray="4 3" 
                opacity="0.6" 
              />
              <text x="475" y="140" fill="#7dd3fc" fontSize="9" opacity="0.6" transform="rotate(88, 475, 140)">
                Buckingham Canal
              </text>

              {/* Pallikaranai Marshland Wetland Zone */}
              <ellipse 
                cx="460" 
                cy="490" 
                rx="65" 
                ry="45" 
                fill="#155e75" 
                opacity="0.5" 
                stroke="#06b6d4" 
                strokeWidth="1.5" 
                strokeDasharray="5 3" 
              />
              <text x="420" y="495" fill="#a5f3fc" fontSize="10" fontWeight="bold">
                Pallikaranai Marsh
              </text>

              {/* Velachery Lake */}
              <ellipse 
                cx="390" 
                cy="400" 
                rx="35" 
                ry="24" 
                fill="url(#lakeWaterGrad)" 
                stroke="#ef4444" 
                strokeWidth="2" 
              />
              <text x="365" y="405" fill="#ffffff" fontSize="9" fontWeight="bold">
                Velachery Lake
              </text>

              {/* Arterial Connecting Grid Lines (Background Road Grid) */}
              <g stroke="#1e293b" strokeWidth="2" opacity="0.5">
                <line x1="220" y1="520" x2="330" y2="440" />
                <line x1="330" y1="440" x2="420" y2="380" />
                <line x1="420" y1="380" x2="480" y2="460" />
                <line x1="420" y1="380" x2="490" y2="280" />
                <line x1="490" y1="280" x2="390" y2="210" />
                <line x1="390" y1="210" x2="480" y2="190" />
                <line x1="480" y1="460" x2="410" y2="550" />
              </g>

              {/* Street Segments (Dynamic Flood Telemetry) */}
              {filteredStreets.map(street => {
                const strokeColor = getStreetStrokeColor(street);
                const strokeWidth = getStreetStrokeWidth(street);
                const isSelected = selectedStreet?.id === street.id;
                const midX = (street.coordinates.x1 + street.coordinates.x2) / 2;
                const midY = (street.coordinates.y1 + street.coordinates.y2) / 2;
                const labelText = `${street.name.split(' ')[0]} ${street.isElevated ? '▲' : `(${street.waterDepthInches}")`}`;

                return (
                  <g 
                    key={street.id} 
                    onClick={() => setSelectedStreet(street)} 
                    className="cursor-pointer group"
                  >
                    {/* Glowing highlight for selection */}
                    {isSelected && (
                      <line
                        x1={street.coordinates.x1}
                        y1={street.coordinates.y1}
                        x2={street.coordinates.x2}
                        y2={street.coordinates.y2}
                        stroke="#38bdf8"
                        strokeWidth={strokeWidth + 6}
                        strokeLinecap="round"
                        opacity="0.7"
                      />
                    )}

                    {/* Main Street Vector */}
                    <line
                      x1={street.coordinates.x1}
                      y1={street.coordinates.y1}
                      x2={street.coordinates.x2}
                      y2={street.coordinates.y2}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      filter={street.isElevated ? 'url(#flyoverGlow)' : undefined}
                      className="transition-all duration-300"
                    />

                    {/* Street Midpoint Interactive Marker Button */}
                    <circle
                      cx={midX}
                      cy={midY}
                      r={isSelected ? 6 : 4}
                      fill={strokeColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="group-hover:scale-150 transition-transform origin-center"
                    />

                    {/* Street Label with dark backdrop pill to prevent overlapping with road vectors */}
                    <g className="pointer-events-none select-none">
                      <rect
                        x={midX - 32}
                        y={midY - 18}
                        width="64"
                        height="13"
                        rx="3"
                        fill="#090d16"
                        fillOpacity="0.88"
                        stroke="#1e293b"
                        strokeWidth="0.8"
                      />
                      <text
                        x={midX}
                        y={midY - 8}
                        fill="#f1f5f9"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="drop-shadow"
                      >
                        {labelText}
                      </text>
                    </g>

                    {/* Active GCC Motor Pump Icon */}
                    {street.hasPumpActive && (
                      <circle
                        cx={midX + 16}
                        cy={midY}
                        r="5"
                        fill="#06b6d4"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    )}

                    {/* Barricaded Road Icon */}
                    {street.isBarricaded && (
                      <rect
                        x={midX - 22}
                        y={midY - 4}
                        width="8"
                        height="8"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                );
              })}

              {/* Neighborhood Node Markers */}
              {neighborhoods.map(n => {
                const isCritical = n.riskLevel === 'CRITICAL';
                const isHigh = n.riskLevel === 'HIGH';
                const nodeFill = isCritical ? '#ef4444' : (isHigh ? '#f97316' : '#10b981');
                const displayName = language === 'ta' ? n.tamilName : n.name;

                return (
                  <g 
                    key={n.id}
                    onClick={() => {
                      const firstStreet = streets.find(s => s.neighborhoodId === n.id);
                      if (firstStreet) setSelectedStreet(firstStreet);
                    }}
                    className="cursor-pointer group select-none"
                  >
                    {/* Pulse ring for critical neighborhoods */}
                    {isCritical && (
                      <circle
                        cx={n.mapCoords.x}
                        cy={n.mapCoords.y}
                        r="18"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        opacity="0.6"
                        className="animate-ping"
                      />
                    )}

                    {/* Node Core Circle */}
                    <circle
                      cx={n.mapCoords.x}
                      cy={n.mapCoords.y}
                      r="10"
                      fill="#0f172a"
                      stroke={nodeFill}
                      strokeWidth="2.5"
                      className="group-hover:scale-125 transition-transform origin-center"
                    />

                    {/* Inner Warning Dot */}
                    <circle
                      cx={n.mapCoords.x}
                      cy={n.mapCoords.y}
                      r="4"
                      fill={nodeFill}
                    />

                    {/* Neighborhood Title Badge Plate to prevent visual collision */}
                    <g className="pointer-events-none">
                      <rect
                        x={n.mapCoords.x - 42}
                        y={n.mapCoords.y + 12}
                        width="84"
                        height="24"
                        rx="5"
                        fill="#0b1329"
                        fillOpacity="0.92"
                        stroke={nodeFill}
                        strokeWidth="0.8"
                      />
                      <text
                        x={n.mapCoords.x}
                        y={n.mapCoords.y + 23}
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {displayName}
                      </text>
                      <text
                        x={n.mapCoords.x}
                        y={n.mapCoords.y + 33}
                        fill={nodeFill}
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {n.currentAvgDepthInches}" avg • {n.riskLevel}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map Legend Ribbon */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 mt-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.legendTitle}:</span>
            </span>

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-300">{t.legendDry}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-slate-300">{t.legendAnkle}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-slate-300">{t.legendKnee}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-300">{t.legendWaist}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-900"></span>
                <span className="text-slate-300">{t.legendChest}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                <span className="text-slate-300">Elevated Flyover</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Street Details & Action Drawer (Takes 1 Column) */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          {selectedStreet ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      {selectedStreet.neighborhoodId.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                      selectedStreet.waterDepthInches >= 24
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : selectedStreet.waterDepthInches >= 12
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : selectedStreet.waterDepthInches >= 4
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {selectedStreet.waterDepthInches >= 24 ? 'CRITICAL RISK' : selectedStreet.waterDepthInches >= 12 ? 'HIGH ALERT' : selectedStreet.waterDepthInches >= 4 ? 'MODERATE' : 'SAFE'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {language === 'ta' ? selectedStreet.tamilName : selectedStreet.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>{selectedStreetReports.length} Reports logged</span>
                    <span>•</span>
                    <span className="text-slate-300">
                      Updated {Math.max(1, Math.round((Date.now() - selectedStreet.lastUpdated) / (1000 * 60)))} mins ago
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStreet(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Water Depth Gauge */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Observed Water Depth:</span>
                  <span className="text-xl font-extrabold text-white font-mono">
                    {selectedStreet.waterDepthInches} inches
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full ${
                      selectedStreet.waterDepthInches > 20
                        ? 'bg-red-500'
                        : selectedStreet.waterDepthInches > 8
                        ? 'bg-orange-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (selectedStreet.waterDepthInches / 36) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Passability: <strong className="text-white capitalize">{selectedStreet.passability.replace('_', ' ')}</strong></span>
                  <span>Current: <strong className="text-white capitalize">{selectedStreet.flowSpeed}</strong></span>
                </div>
              </div>

              {/* Status Highlights */}
              <div className="space-y-2">
                {selectedStreet.isElevated && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
                    <span>Elevated Flyover: Clear from ground water surge.</span>
                  </div>
                )}

                {selectedStreet.hasPumpActive && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">
                    <Activity className="w-4 h-4 shrink-0 text-cyan-400 animate-spin" />
                    <span>{t.activePump}</span>
                  </div>
                )}

                {selectedStreet.isBarricaded && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    <AlertOctagon className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{t.barricadedNotice}</span>
                  </div>
                )}
              </div>

              {/* Interactive Municipal Controls for Street */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Interactive Municipal Actions
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => toggleStreetPump(selectedStreet.id)}
                    className={`py-2 px-2 rounded-lg font-medium border text-center transition-all ${
                      selectedStreet.hasPumpActive 
                        ? 'bg-cyan-600 text-white border-cyan-500' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {selectedStreet.hasPumpActive ? 'Stop Pump' : 'Start Pump (-12")'}
                  </button>
                  <button
                    onClick={() => toggleStreetBarricade(selectedStreet.id)}
                    className={`py-2 px-2 rounded-lg font-medium border text-center transition-all ${
                      selectedStreet.isBarricaded 
                        ? 'bg-red-600 text-white border-red-500' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {selectedStreet.isBarricaded ? 'Open Street' : 'Barricade Street'}
                  </button>
                </div>
              </div>

              {/* Related Citizen Reports for this street */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Community Reports ({selectedStreetReports.length})</span>
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {selectedStreetReports.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No reports logged yet for this exact street segment.</p>
                  ) : (
                    selectedStreetReports.map(rep => (
                      <div key={rep.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{rep.reporterName}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">{rep.trustScore}% Trust</span>
                        </div>
                        <p className="text-slate-300 text-[11px] line-clamp-2">"{rep.notes}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action: Add report for this street */}
              <button
                onClick={() => onNavigateToReport(selectedStreet.neighborhoodId)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>+ Submit New Update for this Area</span>
              </button>
            </div>
          ) : (
            /* Empty selection state */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Select a Street on the Map</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Click on any colored street vector or neighborhood node above to view live depth gauges, pump status, and community reports.
              </p>
              <div className="pt-4 flex flex-col gap-2 w-full">
                <button
                  onClick={() => setSelectedStreet(streets[0])}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  Inspect Velachery 100ft Road
                </button>
                <button
                  onClick={() => setSelectedStreet(streets[3])}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  Inspect Madipakkam Kuberan Nagar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
