import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  LifeBuoy, 
  Download, 
  MapPin, 
  Camera, 
  ZapOff, 
  Car,
  FileCheck,
  Radio,
  Clock
} from 'lucide-react';
import { useFlood } from '../context/FloodContext';

export const AdminDashboard: React.FC = () => {
  const { 
    reports, 
    verifyReport, 
    debunkReport, 
    escalateReport,
    streets, 
    toggleStreetPump, 
    toggleStreetBarricade, 
    wardenLog, 
    language, 
    t 
  } = useFlood();

  const [activeTab, setActiveTab] = useState<'queue' | 'streets' | 'audit'>('queue');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const pendingReports = reports.filter(r => r.status === 'pending');
  const verifiedReports = reports.filter(r => r.status === 'verified');
  const debunkedReports = reports.filter(r => r.status === 'debunked');
  const activePumpsCount = streets.filter(s => s.hasPumpActive).length;

  const handleVerify = (reportId: string) => {
    verifyReport(reportId);
    showNotice(`Report #${reportId.slice(-6)} verified & sealed! Verified count updated.`);
  };

  const handleDebunk = (reportId: string) => {
    debunkReport(reportId);
    showNotice(`Report #${reportId.slice(-6)} flagged as debunked/spam and excluded from active flood aggregation.`);
  };

  const handleEscalate = (reportId: string, streetName: string) => {
    escalateReport(reportId);
    showNotice(`DEMO ONLY: Simulated escalation logged for ${streetName}. Never contacts actual emergency services.`);
  };

  const showNotice = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleExportData = () => {
    const exportPayload = {
      app: 'Nukkad Flood Watch',
      exportTimestamp: new Date().toISOString(),
      reports,
      streets,
      wardenLog
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nukkad_flood_demo_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice('Telemetry JSON exported successfully!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Ward Officer & Warden Command Portal
            </span>
            <span className="text-xs text-slate-400">
              Field Verification Console
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <span>{t.adminTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {t.adminSubtitle}
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 shadow"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>{t.exportData}</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow">
          <span className="text-xs text-slate-400">{t.statsPending}</span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {pendingReports.length}
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow">
          <span className="text-xs text-slate-400">{t.statsVerified}</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {verifiedReports.length}
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow">
          <span className="text-xs text-slate-400">{t.statsPumps}</span>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
            {activePumpsCount} Units
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow">
          <span className="text-xs text-slate-400">Debunked / Spurious</span>
          <div className="text-2xl font-extrabold text-slate-400 font-mono mt-1">
            {debunkedReports.length}
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'queue' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Citizen Verification Queue ({pendingReports.length})
        </button>
        <button
          onClick={() => setActiveTab('streets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'streets' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Municipal Pumps & Barricades ({streets.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Warden Action Audit Log
        </button>
      </div>

      {/* Tab 1: Verification Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Verification Queue Clear</h4>
              <p className="text-xs text-slate-400">All submitted citizen reports have been verified or addressed by ward units.</p>
            </div>
          ) : (
            pendingReports.map(report => (
              <div
                key={report.id}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
                      {report.neighborhoodName}
                    </span>
                    <span className="text-xs font-bold text-white">{report.streetName}</span>
                    <span className="text-[11px] text-slate-400">• Source: {report.source}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {report.waterDepthInches}" Depth ({report.depthCategory})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Flow: {report.flowSpeed}
                    </span>
                    {report.powerOutage && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        ⚡ Power Cut
                      </span>
                    )}
                    {report.strandedVulnerableCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-600/30 text-red-200 font-bold animate-pulse">
                        🚨 {report.strandedVulnerableCount} Stranded Residents!
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    "{report.notes}"
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Reported by: <strong className="text-slate-300">{report.reporterName} ({report.reporterRole})</strong></span>
                    <span>Trust Score: <strong className="text-emerald-400">{report.trustScore}%</strong></span>
                    <span>Confirmations: <strong>{report.confirmationsCount}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleVerify(report.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.btnVerify}</span>
                  </button>

                  <button
                    onClick={() => handleEscalate(report.id, report.streetName)}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                  >
                    <LifeBuoy className="w-4 h-4" />
                    <span>{t.btnEscalateNDRF}</span>
                  </button>

                  <button
                    onClick={() => handleDebunk(report.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors flex items-center gap-1.5 border border-slate-700"
                  >
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>{t.btnDebunk}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Street Municipal Infrastructure (Pumps & Barricades) */}
      {activeTab === 'streets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streets.map(street => (
            <div
              key={street.id}
              className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase">
                    {street.neighborhoodId.replace('_', ' ')}
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    {language === 'ta' ? street.tamilName : street.name}
                  </h4>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {street.waterDepthInches}" Depth
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Passability: <strong className="text-white capitalize">{street.passability.replace('_', ' ')}</strong>
                </span>
                {street.isElevated && (
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                    Flyover
                  </span>
                )}
              </div>

              {/* Action toggles */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <button
                  onClick={() => {
                    toggleStreetPump(street.id);
                    showNotice(`Toggled motor pump for ${street.name}`);
                  }}
                  className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                    street.hasPumpActive
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {street.hasPumpActive ? '✓ Pump Running (-12")' : 'Deploy GCC Pump'}
                </button>

                <button
                  onClick={() => {
                    toggleStreetBarricade(street.id);
                    showNotice(`Toggled barricade status for ${street.name}`);
                  }}
                  className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                    street.isBarricaded
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {street.isBarricaded ? '✓ Road Barricaded' : 'Erect Barricade'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Warden Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-md space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>Official Warden Action Audit Stream</span>
          </h4>
          <div className="space-y-2">
            {wardenLog.map(log => {
              const timeString = new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200">{log.action}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] shrink-0 ml-2">{timeString}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
