import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useSocket } from '../../hooks/useSocket';
import client from '../../api/client';
import MapView from '../../components/MapView';
import ChatPanel from '../../components/ChatPanel';
import { AlertCircle, MapPin, Users, Send, Info, CheckCircle, Clock } from 'lucide-react';

const SOSPage: React.FC = () => {
  const { user, activeIncidentId, setActiveIncident, addIncident, incidents } = useAppStore();
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState<'REPORT' | 'FACILITIES' | 'CHAT'>('REPORT');
  
  // Form State
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'MEDICAL',
    severity: 'MEDIUM',
    description: '',
    people_affected: 1,
    lat: 19.0760, // Default Mumbai
    lng: 72.8777
  });

  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const activeIncident = safeIncidents.find(i => i.id === activeIncidentId);

  const emergencyTypes = [
    { id: 'FLOOD', icon: '🌊', label: 'Flood' },
    { id: 'FIRE', icon: '🔥', label: 'Fire' },
    { id: 'MEDICAL', icon: '🏥', label: 'Medical' },
    { id: 'RESCUE', icon: '🆘', label: 'Rescue' },
    { id: 'COLLAPSE', icon: '🏚', label: 'Collapse' },
    { id: 'CYCLONE', icon: '🌪', label: 'Cyclone' },
    { id: 'ACCIDENT', icon: '⚡', label: 'Accident' },
    { id: 'CHEMICAL', icon: '🧪', label: 'Chemical' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.post('/incidents', {
        ...form,
        reporter_id: user?.id,
        state: user?.state
      });
      addIncident(res.data);
      setActiveIncident(res.data.id);
      socket?.emit('incident:new', res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm({ ...form, lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-white">
      {/* Left Panel */}
      <div className="w-[360px] border-r border-slate-800 flex flex-col bg-[#161C2C]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-black text-cyan-400 tracking-widest">SENTINEL SOS</h2>
          <span className="text-[10px] text-slate-500">{user?.name}</span>
        </div>

        <div className="flex border-b border-slate-800">
          <button onClick={() => setActiveTab('REPORT')} className={`flex-1 py-3 text-[10px] uppercase font-bold ${activeTab === 'REPORT' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>SOS Report</button>
          <button onClick={() => setActiveTab('FACILITIES')} className={`flex-1 py-3 text-[10px] uppercase font-bold ${activeTab === 'FACILITIES' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>Facilities</button>
          <button onClick={() => setActiveTab('CHAT')} className={`flex-1 py-3 text-[10px] uppercase font-bold ${activeTab === 'CHAT' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>Live Chat</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'REPORT' && (
            !activeIncident ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-3 block">Emergency Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {emergencyTypes.map(t => (
                      <button 
                        key={t.id} type="button"
                        onClick={() => setForm({...form, type: t.id})}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${form.type === t.id ? 'bg-cyan-900/40 border-cyan-500' : 'bg-[#0B0F1A] border-slate-700 opacity-60'}`}
                      >
                        <span className="text-lg">{t.icon}</span>
                        <span className="text-[8px] font-bold truncate w-full text-center">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-3 block">Severity</label>
                  <div className="flex gap-2">
                    {['LOW', 'MEDIUM', 'CRITICAL'].map(s => (
                      <button 
                        key={s} type="button"
                        onClick={() => setForm({...form, severity: s})}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${form.severity === s ? (s === 'CRITICAL' ? 'bg-red-600 border-red-400' : 'bg-cyan-600 border-cyan-400') : 'bg-[#0B0F1A] border-slate-700 opacity-60'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Description</label>
                  <textarea 
                    className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg p-3 text-xs h-24 outline-none focus:border-cyan-500"
                    placeholder="What happened? Any casualties?"
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Affected</label>
                    <div className="flex items-center gap-2 bg-[#0B0F1A] border border-slate-700 rounded-lg px-3 py-2">
                      <Users className="w-3 h-3 text-slate-500" />
                      <input type="number" className="bg-transparent text-xs w-full outline-none" value={form.people_affected} onChange={e => setForm({...form, people_affected: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Location</label>
                    <button type="button" onClick={detectLocation} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 text-[10px] font-bold flex items-center justify-center gap-2">
                      <MapPin className="w-3 h-3" /> Detect
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <><AlertCircle className="w-5 h-5" /> Dispatch SOS</>}
                </button>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl text-center">
                  <CheckCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                  <h3 className="text-lg font-black text-red-500 italic">ALERT DISPATCHED</h3>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">Sentinel Network processing rescue</p>
                </div>

                <div className="bg-[#0B0F1A] border border-amber-500/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">AI Triage Status</span>
                    <span className="text-[9px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-500 font-bold">LOCAL AI</span>
                  </div>
                  <div className="text-xs text-slate-200 mb-4">{activeIncident.ai_summary}</div>
                  <div className="flex flex-wrap gap-2">
                    {activeIncident.ai_resources?.map(r => (
                      <span key={r} className="text-[9px] bg-slate-800 px-2 py-1 rounded-full text-slate-300 border border-slate-700">{r}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-cyan-900/10 border border-cyan-500/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter">Assigned Unit</span>
                    <span className="text-[10px] font-mono text-cyan-500 flex items-center gap-1 animate-pulse"><Clock className="w-3 h-3" /> {activeIncident.eta_minutes || 12}M</span>
                  </div>
                  <div className="text-sm font-bold text-cyan-100">{activeIncident.assigned_unit || 'Waiting for Command...'}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{activeIncident.status === 'DISPATCHED' ? '● En Route' : '● Processing at Command Centre'}</div>
                </div>

                <button onClick={() => setActiveTab('CHAT')} className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Message Responder
                </button>
              </div>
            )
          )}

          {activeTab === 'FACILITIES' && (
            <div className="text-slate-500 text-center py-10">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Nearby facilities will appear here once incident is mapped.</p>
            </div>
          )}

          {activeTab === 'CHAT' && (
            activeIncidentId ? (
              <ChatPanel incidentId={activeIncidentId} socket={socket} />
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">No active incident to chat about.</div>
            )
          )}
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 relative">
        <MapView 
          center={activeIncident ? [activeIncident.lat, activeIncident.lng] : [form.lat, form.lng]} 
          zoom={activeIncident ? 14 : 12}
          incidents={activeIncident ? [activeIncident] : []}
        />
        
        {activeIncident && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-[#161C2C]/90 backdrop-blur border border-cyan-500/50 px-6 py-3 rounded-full flex items-center gap-6 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{activeIncident.assigned_unit || 'DISPATCHING...'}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="text-sm font-mono font-bold text-cyan-400">{activeIncident.eta_minutes || '--'}M</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <div className="text-[10px] text-slate-400 uppercase font-medium">{activeIncident.status}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSPage;
