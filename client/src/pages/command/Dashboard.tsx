import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useSocket } from '../../hooks/useSocket';
import client from '../../api/client';
import MapView from '../../components/MapView';
import { Shield, AlertTriangle, CheckCircle, Activity, ChevronRight, Map as MapIcon, Users, List, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, incidents, setIncidents, updateIncident } = useAppStore();
  const socket = useSocket();
  const [facilities, setFacilities] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  useEffect(() => {
    // Load data
    client.get('/incidents').then(res => setIncidents(res.data));
    client.get('/facilities').then(res => setFacilities(res.data));
  }, [setIncidents]);

  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const activeIncidents = safeIncidents.filter(i => i.status !== 'RESOLVED');
  const criticalCount = activeIncidents.filter(i => i.ai_urgency === 'CRITICAL').length;

  const handleDispatch = async (incident: any, facility: any) => {
    setDispatchLoading(true);
    try {
      // Find a responder for this facility (mock for prototype - usually you'd select one)
      const res = await client.patch(`/incidents/${incident.id}/assign`, {
        facilityId: facility.id,
        assignedUnit: facility.name
      });
      updateIncident(res.data);
      socket?.emit('incident:dispatched', { incident: res.data });
      setSelectedIncident(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-white overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-[220px] bg-[#161C2C] border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-black text-cyan-400 tracking-tighter flex items-center gap-2 italic">
            <Shield className="w-6 h-6" /> SENTINEL
          </h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Command Centre</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold bg-cyan-900/20 text-cyan-400 border border-cyan-800/50 rounded-lg">
            <MapIcon className="w-4 h-4" /> Live Tactical Map
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-lg transition-all">
            <List className="w-4 h-4" /> Incident Log
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-lg transition-all">
            <Users className="w-4 h-4" /> Responder Units
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Connected Operator</div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-[10px] font-bold border border-cyan-500/50">{user?.name[0]}</div>
            <div>
              <div className="text-[10px] font-bold">{user?.name}</div>
              <div className="text-[8px] text-green-500 font-mono flex items-center gap-1">● ONLINE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* KPI Bar */}
        <div className="h-20 bg-[#161C2C] border-b border-slate-800 flex items-center px-6 gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active SOS</span>
            <span className="text-2xl font-mono font-black text-white">{activeIncidents.length}</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Critical High</span>
            <span className={`text-2xl font-mono font-black ${criticalCount > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{criticalCount}</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Dispatched</span>
            <span className="text-2xl font-mono font-black text-white">{safeIncidents.filter(i => i.status === 'DISPATCHED').length}</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Resolved</span>
            <span className="text-2xl font-mono font-black text-white">{safeIncidents.filter(i => i.status === 'RESOLVED').length}</span>
          </div>
          
          <div className="ml-auto flex gap-3">
            <div className="flex items-center gap-2 bg-[#0B0F1A] px-4 py-2 border border-slate-700 rounded-full">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold">AI Triage Active</span>
            </div>
          </div>
        </div>

        {/* Map + Incident Panel */}
        <div className="flex-1 flex">
          <div className="flex-1 relative">
            <MapView 
              center={[20.5937, 78.9629]} 
              zoom={5} 
              incidents={activeIncidents} 
              facilities={facilities}
            />
          </div>

          {/* Incident Selection Panel */}
          <div className="w-[360px] bg-[#161C2C] border-l border-slate-800 overflow-y-auto">
            <div className="p-4 border-b border-slate-800 bg-[#1F2937]/30">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Incident Queue</h3>
            </div>
            
            <div className="divide-y divide-slate-800">
              {activeIncidents.length === 0 ? (
                <div className="p-10 text-center text-slate-600">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">All clear. Standing by.</p>
                </div>
              ) : (
                activeIncidents.map(inc => (
                  <div 
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-800/50 ${selectedIncident?.id === inc.id ? 'bg-cyan-900/10 border-l-4 border-cyan-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${inc.ai_urgency === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-amber-500/10 border-amber-500 text-amber-500'}`}>
                        {inc.ai_urgency}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">{inc.type}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">{inc.address || `Lat: ${Number(inc.lat || 0).toFixed(4)}, Lng: ${Number(inc.lng || 0).toFixed(4)}`}</div>
                    <div className="text-[10px] text-slate-400 mb-3">{inc.ai_summary}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> {inc.people_affected} affected</span>
                      <ChevronRight className="w-4 h-4 text-slate-700" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Overlay */}
      {selectedIncident && (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-[#0B0F1A] border-l border-slate-800 shadow-2xl z-[2000] p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
          <button onClick={() => setSelectedIncident(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
          
          <div className="mb-6">
            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">Incident Control</div>
            <h2 className="text-2xl font-black italic">{selectedIncident.type} EMERGENCY</h2>
            <div className="flex gap-2 mt-4">
              <span className="text-[9px] font-bold px-3 py-1 bg-red-600 rounded text-white">{selectedIncident.ai_urgency}</span>
              <span className="text-[9px] font-bold px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 uppercase">{selectedIncident.status}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#161C2C] border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">AI Triage Assessment</div>
              <p className="text-sm text-slate-300 italic">"{selectedIncident.ai_summary}"</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedIncident.ai_resources?.map((r: string) => (
                  <span key={r} className="text-[9px] bg-cyan-900/30 text-cyan-400 border border-cyan-800 px-2 py-1 rounded">{r}</span>
                ))}
              </div>
            </div>

            {selectedIncident.status === 'OPEN' ? (
              <div className="space-y-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign Tactical Unit</div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {Array.isArray(facilities) && facilities
                    .filter(f => f.state === selectedIncident.state)
                    .map((f: any) => (
                      <button 
                        key={f.id}
                        disabled={!f.is_available || dispatchLoading}
                        onClick={() => handleDispatch(selectedIncident, f)}
                        className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${f.is_available ? 'bg-[#161C2C] border-slate-800 hover:border-cyan-500' : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}`}
                      >
                        <div>
                          <div className="text-xs font-bold">{f.name}</div>
                          <div className="text-[9px] text-slate-500 uppercase mt-1">{f.type} • 👥 {f.personnel} Personnel</div>
                        </div>
                        {f.is_available && <div className="text-[9px] font-black text-cyan-400">DISPATCH →</div>}
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-cyan-900/10 border border-cyan-500/30 rounded-xl text-center">
                <CheckCircle className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-cyan-50">UNIT DISPATCHED</div>
                <div className="text-xs text-cyan-400/70 mt-1 uppercase tracking-wider">{selectedIncident.assigned_unit}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
