import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  LifeBuoy,
  X
} from 'lucide-react';
import { useFlood } from '../context/FloodContext';

export const AlertCenter: React.FC = () => {
  const { 
    alerts, 
    neighborhoods, 
    addAlert, 
    dismissAlert, 
    language, 
    t 
  } = useFlood();

  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [newSeverity, setNewSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [newArea, setNewArea] = useState<string>('velachery');

  const filteredAlerts = alerts.filter(alert => {
    if (selectedArea === 'all') return true;
    return alert.neighborhoodId === selectedArea;
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const targetNeighborhood = neighborhoods.find(n => n.id === newArea);

    addAlert({
      title: newTitle.trim(),
      titleTa: newTitle.trim(),
      message: newMessage.trim(),
      messageTa: newMessage.trim(),
      severity: newSeverity,
      neighborhoodId: newArea,
      neighborhoodName: targetNeighborhood ? targetNeighborhood.name : 'Chennai Ward',
      source: 'warden',
      actionRequired: 'Follow ward volunteer instructions; stay alert.',
      actionRequiredTa: 'வார்டு தன்னார்வலர்களின் அறிவுரைகளைப் பின்பற்றவும்.'
    });

    setNewTitle('');
    setNewMessage('');
    setShowBroadcastModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Alert Header & Broadcast Action */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              Live Emergency Ticker
            </span>
            <span className="text-xs text-slate-400">
              Automated Ward Triggers
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>{t.alertsTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {t.alertsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Broadcast Community Alert</span>
          </button>
        </div>
      </div>

      {/* Neighborhood Filter Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Filter Area:</span>
        <button
          onClick={() => setSelectedArea('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedArea === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {t.allAreas} ({alerts.length})
        </button>
        {neighborhoods.map(n => {
          const count = alerts.filter(a => a.neighborhoodId === n.id).length;
          return (
            <button
              key={n.id}
              onClick={() => setSelectedArea(n.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedArea === n.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {language === 'ta' ? n.tamilName : n.name} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Active Alerts for this Area</h4>
            <p className="text-xs text-slate-400">All drainage channels and roads are reported stable within buffer limits.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const timeAgoMins = Math.max(1, Math.round((Date.now() - alert.timestamp) / (1000 * 60)));

            return (
              <div
                key={alert.id}
                className={`rounded-2xl p-5 border transition-all shadow-lg ${
                  isCritical
                    ? 'bg-red-950/40 border-red-500/50 text-red-200'
                    : isWarning
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}>
                      {isCritical ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          isCritical ? 'bg-red-500 text-white' : isWarning ? 'bg-amber-500 text-slate-950' : 'bg-blue-500 text-white'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {alert.neighborhoodName}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgoMins}m ago
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">
                        {language === 'ta' ? alert.titleTa : alert.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {language === 'ta' ? alert.messageTa : alert.message}
                      </p>

                      {alert.actionRequired && (
                        <div className="pt-2 text-xs font-medium text-amber-300 flex items-center gap-1.5">
                          <strong>Action Required:</strong>
                          <span>{language === 'ta' ? alert.actionRequiredTa : alert.actionRequired}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-slate-500 hover:text-slate-300 p-1"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chennai Emergency Helplines Directory Card */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">{t.helplineTitle}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">Greater Chennai Corp (GCC)</span>
            <div className="text-base font-extrabold text-emerald-400 font-mono">1913</div>
            <p className="text-[11px] text-slate-500">24/7 Flood Control & Water Drainage</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">TNEB Electricity Helpline</span>
            <div className="text-base font-extrabold text-amber-400 font-mono">94987 94987</div>
            <p className="text-[11px] text-slate-500">Emergency power shutoff & live wires</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">State Disaster Control (SDRF)</span>
            <div className="text-base font-extrabold text-blue-400 font-mono">1070</div>
            <p className="text-[11px] text-slate-500">Boat rescue & emergency evacuation</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">Police Control Room</span>
            <div className="text-base font-extrabold text-white font-mono">100</div>
            <p className="text-[11px] text-slate-500">Law & order, road diversions</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">Emergency Medical Ambulance</span>
            <div className="text-base font-extrabold text-red-400 font-mono">108</div>
            <p className="text-[11px] text-slate-500">Critical patients & pregnant mothers</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">Chennai Metro Water</span>
            <div className="text-base font-extrabold text-cyan-400 font-mono">044 4567 4567</div>
            <p className="text-[11px] text-slate-500">Clean drinking water tanker supplies</p>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                <span>Broadcast Emergency Community Alert</span>
              </h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Ward / Area</label>
                <select
                  aria-label="Target Ward / Area"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 rounded-xl px-3.5 py-2.5 border border-slate-800"
                >
                  {neighborhoods.map(n => (
                    <option key={n.id} value={n.id}>{n.name} (Zone {n.zoneNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSeverity('critical')}
                    className={`py-2 rounded-xl font-bold border ${
                      newSeverity === 'critical' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Critical
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSeverity('warning')}
                    className={`py-2 rounded-xl font-bold border ${
                      newSeverity === 'warning' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSeverity('info')}
                    className={`py-2 rounded-xl font-bold border ${
                      newSeverity === 'info' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Info
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Alert Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Inundation warning: Velachery Vijayanagar underpass impassable"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 text-slate-200 rounded-xl px-3.5 py-2.5 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Alert Details & Action Needed</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Advise 2-wheelers to take elevated bypass. Municipal 100 HP pump deployed."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  required
                  className="w-full bg-slate-950 text-slate-200 rounded-xl px-3.5 py-2.5 border border-slate-800"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow"
                >
                  Send Alert Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
