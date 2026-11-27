import React, { useState } from 'react';
import { FloodProvider, useFlood } from './context/FloodContext';
import { Header } from './components/Header';
import { ResidentDashboard } from './components/ResidentDashboard';
import { StreetFloodMap } from './components/StreetFloodMap';
import { ReportForm } from './components/ReportForm';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { SafeRoutePlanner } from './components/SafeRoutePlanner';
import { AlertCenter } from './components/AlertCenter';
import { AdminDashboard } from './components/AdminDashboard';
import { Waves, Heart, ShieldAlert, Phone } from 'lucide-react';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetedNeighborhoodId, setTargetedNeighborhoodId] = useState<string | undefined>(undefined);
  const { language, t } = useFlood();

  const handleNavigate = (tab: string, neighborhoodId?: string) => {
    setActiveTab(tab);
    setTargetedNeighborhoodId(neighborhoodId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <ResidentDashboard onNavigate={handleNavigate} />
        )}

        {activeTab === 'map' && (
          <StreetFloodMap 
            onNavigateToReport={(nId) => handleNavigate('report', nId)} 
            initialNeighborhoodId={targetedNeighborhoodId}
          />
        )}

        {activeTab === 'report' && (
          <ReportForm 
            onSuccess={(tab) => handleNavigate(tab)} 
            preselectedNeighborhoodId={targetedNeighborhoodId}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppSimulator onNavigateToMap={() => handleNavigate('map')} />
        )}

        {activeTab === 'routes' && (
          <SafeRoutePlanner />
        )}

        {activeTab === 'alerts' && (
          <AlertCenter />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Clean Persistent Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
              <Waves className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">Nukkad Flood Watch • சென்னை</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400/90 font-medium">DEMO DATA / HACKATHON PROTOTYPE</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>GCC Emergency: <strong className="text-emerald-400 font-mono">1913</strong></span>
            <span>TNEB: <strong className="text-amber-400 font-mono">94987 94987</strong></span>
            <span>SDRF: <strong className="text-blue-400 font-mono">1070</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <FloodProvider>
      <MainContent />
    </FloodProvider>
  );
}
