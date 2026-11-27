import React from 'react';
import { 
  Waves, 
  AlertTriangle, 
  Activity, 
  CloudRain, 
  Languages, 
  ShieldAlert, 
  Compass, 
  MapPin, 
  MessageSquare, 
  FilePlus, 
  BarChart3,
  Bell
} from 'lucide-react';
import { useFlood } from '../context/FloodContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { 
    language, 
    setLanguage, 
    t, 
    currentScenario, 
    setWeatherScenario, 
    weatherScenarios, 
    alerts 
  } = useFlood();

  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top Banner: Emergency Telemetry & Demo Data Notice */}
      <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/90 border-b border-red-900/40 px-3 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Demo Data Disclaimer Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 text-[11px] tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {t.demoBadge}
            </span>
            <span className="text-slate-400 hidden sm:inline text-[11px]">
              {t.demoNotice}
            </span>
          </div>

          {/* Real-time telemetry ticker */}
          <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
            <div className="flex items-center gap-1 text-red-400 font-medium">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Chembarambakkam:</span>
              <span className="font-bold text-red-300">{currentScenario.reservoirDischargeCusecs.toLocaleString()} {t.cusecs}</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-blue-300">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Rain:</span>
              <span className="font-bold">{currentScenario.rainfall1hMm} {t.mmPerHour}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                currentScenario.redAlertLevel === 'Red' 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : currentScenario.redAlertLevel === 'Orange' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-yellow-500 text-slate-950'
              }`}>
                {currentScenario.redAlertLevel} ALERT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                {t.appTitle}
                <span className="text-xs px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono font-normal border border-blue-500/30">
                  Chennai
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Right Header Controls: Scenario Simulation + Language Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Simulation Scenario Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
            <span className="text-slate-400 px-1 text-[11px] font-medium hidden lg:inline">
              {t.simulationTitle}:
            </span>
            <select
              aria-label="Simulate weather scenario"
              value={currentScenario.id}
              onChange={(e) => setWeatherScenario(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              {weatherScenarios.map(sc => (
                <option key={sc.id} value={sc.id}>
                  {language === 'ta' ? sc.nameTa : sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bilingual Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            aria-label="Toggle language between English and Tamil"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors text-xs font-semibold"
          >
            <Languages className="w-4 h-4" />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav aria-label="Main Navigation" className="border-t border-slate-800/80 bg-slate-900/90 backdrop-blur px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1.5 scrollbar-thin">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t.navDashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{t.navMap}</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'report'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>{t.navReport}</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t.navWhatsApp}</span>
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'routes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t.navRoutes}</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all relative ${
              activeTab === 'alerts'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{t.navAlerts}</span>
            {criticalAlertsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'admin'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{t.navAdmin}</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
