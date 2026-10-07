import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useSocket } from '../../hooks/useSocket';
import client from '../../api/client';
import MapView from '../../components/MapView';
import ChatPanel from '../../components/ChatPanel';
import { Shield, AlertCircle, MapPin, CheckCircle, Navigation, MessageSquare, List, TrendingUp, Clock } from 'lucide-react';

const Mission: React.FC = () => {
  const { user, incidents, updateIncident } = useAppStore();
  const socket = useSocket();
  const [activeMission, setActiveMission] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'MISSION' | 'CHAT' | 'STATS'>('MISSION');
  const [responderPos, setResponderPos] = useState<[number, number]>([19.0760, 72.8777]);

  useEffect(() => {
    // Find active mission assigned to me
    const safeIncidents = Array.isArray(incidents) ? incidents : [];
    const mission = safeIncidents.find(i => i.assigned_to === user?.id || i.assigned_unit === user?.unit_name && i.status !== 'RESOLVED');
    if (mission) setActiveMission(mission);
    else setActiveMission(null);
  }, [incidents, user]);

  // Simulate Location Broadcasting
  useEffect(() => {
    if (!activeMission || !socket) return;

    const interval = setInterval(() => {
      // Move slightly toward destination for demo simulation
      const destLat = Number(activeMission.lat || 0);
      const destLng = Number(activeMission.lng || 0);
      
      setResponderPos(prev => {
        const newLat = prev[0] + (destLat - prev[0]) * 0.05;
        const newLng = prev[1] + (destLng - prev[1]) * 0.05;
        
        socket.emit('responder:location', {
          userId: user?.id,
          lat: newLat,
          lng: newLng,
          incidentId: activeMission.id
        });
        
        return [newLat, newLng];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeMission, socket, user]);

  const updateStatus = async (status: string) => {
    try {
      const res = await client.patch(`/incidents/${activeMission.id}/status`, { status });
      updateIncident(res.data);
      socket?.emit('incident:updated', res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const resolveMission = async () => {
    try {
      const res = await client.patch(`/incidents/${activeMission.id}/resolve`, {
        people_saved: activeMission.people_affected,
        resources_used: activeMission.ai_resources,
        notes: 'Mission completed successfully. Situation stabilized.'
      });
      updateIncident(res.data);
      socket?.emit('incident:updated', res.data);
      setActiveMission(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-white">
      {/* Sidebar */}
      <div className="w-[220px] bg-[#161C2C] border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-black text-cyan-400 tracking-tighter italic">{user?.force_id || 'NDRF'}</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{user?.unit_name}</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button onClick={() => setActiveTab('MISSION')} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'MISSION' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Navigation className="w-4 h-4" /> Active Mission
          </button>
          <button onClick={() => setActiveTab('CHAT')} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'CHAT' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'}`}>
            <MessageSquare className="w-4 h-4" /> Messages
          </button>
          <button onClick={() => setActiveTab('STATS')} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'STATS' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'}`}>
            <TrendingUp className="w-4 h-4" /> My Stats
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Authenticated</div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-[10px] font-bold border border-cyan-500/50">{user?.name[0]}</div>
            <div className="text-[10px] font-bold truncate">{user?.name}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!activeMission ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F1A]">
            <div className="text-center animate-pulse">
              <Shield className="w-20 h-20 text-slate-800 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-slate-700 italic">NO ACTIVE MISSION</h2>
              <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] mt-2">Standing by for Sentinel Dispatch</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-[400px] flex flex-col bg-[#161C2C] border-r border-slate-800">
              <div className="p-6 border-b border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-red-500 bg-red-500/10 border border-red-500/50 px-3 py-1 rounded-full uppercase italic">Active Emergency</span>
                  <span className="text-[10px] font-mono text-slate-500">ID: {activeMission.id.slice(0,8)}</span>
                </div>
                <h2 className="text-3xl font-black italic mb-2">{activeMission.type}</h2>
                <div className="text-xs text-slate-400 mb-6">{activeMission.ai_summary}</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0B0F1A] p-3 rounded-lg border border-slate-800">
                    <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">Affected</div>
                    <div className="text-lg font-black italic">👥 {activeMission.people_affected}</div>
                  </div>
                  <div className="bg-[#0B0F1A] p-3 rounded-lg border border-slate-800">
                    <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">ETA</div>
                    <div className="text-lg font-black italic text-cyan-400"><Clock className="inline w-4 h-4" /> {activeMission.eta_minutes}M</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'MISSION' && (
                  <>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Mission Status</h3>
                      <div className="space-y-2">
                        {['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].map(s => (
                          <button 
                            key={s}
                            onClick={() => updateStatus(s)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border text-[10px] font-black tracking-widest transition-all ${activeMission.status === s ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-[#0B0F1A] border-slate-800 text-slate-500 hover:border-slate-600'}`}
                          >
                            {s.replace('_', ' ')}
                            {activeMission.status === s && <CheckCircle className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={resolveMission}
                      className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                    >
                      MARK MISSION RESOLVED
                    </button>
                  </>
                )}

                {activeTab === 'CHAT' && (
                  <ChatPanel incidentId={activeMission.id} socket={socket} />
                )}
              </div>
            </div>

            <div className="flex-1 relative">
              <MapView 
                center={[Number(activeMission.lat || 0), Number(activeMission.lng || 0)]} 
                zoom={14} 
                incidents={[activeMission]}
                responderPos={responderPos}
                destinationPos={[Number(activeMission.lat || 0), Number(activeMission.lng || 0)]}
              />
              
              <div className="absolute top-8 left-8 z-[1000] bg-[#161C2C]/90 backdrop-blur border border-slate-800 p-4 rounded-xl shadow-2xl">
                <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Live Telemetry</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div className="text-[10px] font-bold text-slate-300">Lat: <span className="font-mono text-cyan-400">{responderPos[0].toFixed(6)}</span></div>
                  <div className="text-[10px] font-bold text-slate-300">Lng: <span className="font-mono text-cyan-400">{responderPos[1].toFixed(6)}</span></div>
                  <div className="text-[10px] font-bold text-slate-300">Speed: <span className="font-mono text-cyan-400">42 km/h</span></div>
                  <div className="text-[10px] font-bold text-slate-300">Signal: <span className="font-mono text-green-500">EXCELLENT</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mission;
