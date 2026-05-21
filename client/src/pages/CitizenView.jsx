import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store';
import { AlertCircle, ShieldAlert, Navigation, MessageSquare, ShieldCheck, PhoneCall } from 'lucide-react';
import ChatComponent from '../components/ChatComponent';

const CitizenView = () => {
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [uiState, setUiState] = useState(() => {
    return localStorage.getItem('activeIncidentId') ? 'SEARCHING' : 'IDLE';
  });
  const [activeWait, setActiveWait] = useState(null); 
  const [gps, setGps] = useState(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackPhoto, setFeedbackPhoto] = useState('');

  const incidents = useStore(state => state.incidents);
  const user = useStore(state => state.user);
  const setActiveIncidentId = useStore(state => state.setActiveIncidentId);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGps(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const [timeLeft, setTimeLeft] = useState(8 * 60); // in seconds
  
  // Handle ETA Timer Countdown
  useEffect(() => {
    if (uiState === 'EN_ROUTE') {
      const etaSecs = activeWait?.eta_minutes ? activeWait.eta_minutes * 60 : 8 * 60;
      // Only set initial if we don't have a value or it's a huge jump
      if (timeLeft === 8 * 60) setTimeLeft(etaSecs);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) return 0; // stop at 0
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [uiState, activeWait?.eta_minutes]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Restore active session on reload if a mission is still active
  useEffect(() => {
    const savedId = localStorage.getItem('activeIncidentId');
    const activeStates = ['OPEN', 'ASSIGNED', 'DISPATCHED', 'RESOLVED', 'UNCOMPLETED'];
    
    if (savedId && incidents && incidents.length > 0) {
      const foundIncident = incidents.find(i => String(i.id) === String(savedId));
      if (foundIncident && activeStates.includes(foundIncident.status)) {
        setActiveWait(foundIncident);
        setActiveIncidentId(foundIncident.id);
        
        // Sync UI state with the restored incident's status ONLY IF we aren't confirming resolution
        setUiState(prev => {
          if (prev === 'CONFIRM_RESOLUTION' && ['ASSIGNED', 'DISPATCHED', 'RESOLVED'].includes(foundIncident.status)) {
             return prev; // keep confirming if we started confirming early
          }
          if (['ASSIGNED', 'DISPATCHED'].includes(foundIncident.status)) return 'EN_ROUTE';
          if (foundIncident.status === 'RESOLVED') return 'CONFIRM_RESOLUTION';
          if (foundIncident.status === 'UNCOMPLETED') return 'UNCOMPLETED';
          return 'SEARCHING';
        });
      } else if (foundIncident && foundIncident.status === 'COMPLETED') {
        localStorage.removeItem('activeIncidentId');
        setActiveIncidentId(null);
        setActiveWait(null);
        setUiState('IDLE');
      } else if (!foundIncident && incidents.length > 0) {
        localStorage.removeItem('activeIncidentId');
        setActiveIncidentId(null);
        setActiveWait(null);
        setUiState('IDLE');
      }
    } else if (!savedId && !activeWait && incidents && incidents.length > 0 && user?.id) {
      const myActiveIncidents = incidents
        .filter(i => i.reporter_id === user.id && activeStates.includes(i.status))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      if (myActiveIncidents.length > 0) {
        const foundIncident = myActiveIncidents[0];
        setActiveWait(foundIncident);
        setActiveIncidentId(foundIncident.id);
        localStorage.setItem('activeIncidentId', foundIncident.id);
        
        setUiState(prev => {
          if (prev === 'CONFIRM_RESOLUTION' && ['ASSIGNED', 'DISPATCHED', 'RESOLVED'].includes(foundIncident.status)) return prev;
          if (['ASSIGNED', 'DISPATCHED'].includes(foundIncident.status)) return 'EN_ROUTE';
          if (foundIncident.status === 'RESOLVED') return 'CONFIRM_RESOLUTION';
          if (foundIncident.status === 'UNCOMPLETED') return 'UNCOMPLETED';
          return 'SEARCHING';
        });
      }
    }
  }, [user, incidents, activeWait, setActiveIncidentId]);

  const submitSOS = async (e) => {
    e.preventDefault();
    setUiState('SEARCHING');
    setTimeout(async () => {
      try {
        const lat = gps?.lat ?? useStore.getState().location?.[0] ?? 20.6;
        const lng = gps?.lng ?? useStore.getState().location?.[1] ?? 78.96;
        const textUpper = `${formData.title} ${formData.description}`.toUpperCase();
        let detectedType = 'RESCUE';
        if (textUpper.includes('FIRE')) detectedType = 'FIRE';
        else if (textUpper.includes('FLOOD')) detectedType = 'FLOOD';
        const res = await axios.post('/api/incidents', {
          type: detectedType,
          severity: 'HIGH',
          description: `${formData.title}\n\n${formData.description}`.trim(),
          people_affected: 5,
          lat, lng,
          reporter_id: user?.id
        });
        setActiveWait(res.data);
        setActiveIncidentId(res.data.id);
        localStorage.setItem('activeIncidentId', res.data.id);
      } catch(err) {
        setUiState('IDLE');
        alert("Failed to reach dispatch.");
      }
    }, 1000);
  };

  const handleResolutionConfirm = async (confirmed) => {
    try {
      const res = await axios.patch(`/api/incidents/${activeWait.id}/citizen-confirm`, {
        confirmed,
        notes: feedbackNotes,
        photo_url: feedbackPhoto
      });
      setActiveWait(res.data);
      setUiState(confirmed ? 'COMPLETED' : 'UNCOMPLETED');
      if (confirmed) {
        localStorage.removeItem('activeIncidentId');
      }
    } catch (err) {
      alert('Failed to submit confirmation.');
    }
  };

  useEffect(() => {
    if(activeWait) {
      const match = incidents.find(i => String(i.id) === String(activeWait.id));
      if (match) {
        setActiveWait(match);
        if ((match.status === 'ASSIGNED' || match.status === 'DISPATCHED') && (uiState === 'SEARCHING' || uiState === 'UNCOMPLETED')) setUiState('EN_ROUTE');
        else if (match.status === 'RESOLVED' && uiState !== 'CONFIRM_RESOLUTION') setUiState('CONFIRM_RESOLUTION');
        else if (match.status === 'COMPLETED' && uiState !== 'COMPLETED') setUiState('COMPLETED');
        else if (match.status === 'UNCOMPLETED' && uiState !== 'UNCOMPLETED') setUiState('UNCOMPLETED');
      }
    }
  }, [incidents, uiState, activeWait]);

  return (
    <>
      {activeWait && activeWait.status !== 'COMPLETED' && (
        <div className="sidebar sidebar-left glass-panel animated-entry" style={{ top: '5rem', bottom: 'revert', height: 'auto', zIndex: 999 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeWait.status === 'UNCOMPLETED' ? '#ef4444' : '#10b981', marginBottom: '1rem' }}>
            <ShieldAlert size={20} /> Tactical Briefing
          </h3>
          <div style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: activeWait.status === 'UNCOMPLETED' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{fontSize: '1.5rem', marginBottom: '5px'}}>{activeWait?.type === 'FIRE' ? '🔥' : '🌊'}</div>
            <div style={{
              fontSize: '0.7rem', 
              color: activeWait.status === 'UNCOMPLETED' ? '#ef4444' : '#10b981', 
              fontWeight: 'bold',
              textShadow: activeWait.status === 'UNCOMPLETED' ? '0 0 8px rgba(239,68,68,0.5)' : 'none'
            }}>
              AI STATUS: {activeWait.status === 'UNCOMPLETED' ? 'ESCALATED - RE-ROUTING' : activeWait?.status}
            </div>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '1rem' }}>{activeWait?.ai_summary || 'Analyzing...'}</p>
          {activeWait && !['RESOLVED', 'CONFIRM_RESOLUTION'].includes(activeWait.status) && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <ChatComponent incidentId={activeWait.id} channel="CIVILIAN" title="Live Rescue Chat" />
            </div>
          )}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '500px' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          {uiState === 'IDLE' && (
            <form onSubmit={submitSOS} className="animated-entry">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', marginBottom: '1rem' }}><AlertCircle color="#ef4444" /> Drop SOS Beacon</h3>
              <input className="input-base" placeholder="Issue Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <textarea className="input-base" placeholder="Details..." rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              <button type="submit" className="btn-primary">BROADCAST AUTO-SOS</button>
            </form>
          )}

          {uiState === 'SEARCHING' && (
            <div className="animated-entry" style={{ textAlign: 'center' }}>
              <div className="live-dot" style={{ margin: '0 auto 1rem auto' }}></div>
              <h3 style={{ color: '#f97316', marginBottom: '1rem' }}>Finding Rescue Unit...</h3>
              <button
                className="btn-secondary"
                style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.75rem', padding: '6px' }}
                onClick={async () => {
                   if (activeWait?.id) {
                     try { await axios.patch(`/api/incidents/${activeWait.id}/status`, { status: 'COMPLETED' }); } catch(e) {}
                   }
                   localStorage.removeItem('activeIncidentId');
                   window.location.reload();
                }}
              >
                CANCEL SEARCH
              </button>
            </div>
          )}

          {uiState === 'EN_ROUTE' && (
            <div className="animated-entry" style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}><Navigation /> Squad En Route</h3>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', margin: '1rem 0' }}>
                 <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ESTIMATED ARRIVAL</p>
                 <p style={{ fontWeight: 'bold', fontSize: '2rem', color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                   {formatTime(timeLeft)}
                 </p>
              </div>
              <button onClick={() => setUiState('CONFIRM_RESOLUTION')} className="btn-primary" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }}>HELP RECEIVED EARLY</button>
              
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <p style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.8rem', fontWeight: 'bold' }}>Rescue Delay? Need Immediate Help?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={async () => {
                      if(window.confirm("Alert Command HQ of rescue failure?")) {
                        try { await axios.post(`/api/incidents/${activeWait.id}/escalate`); alert("HQ Notified."); } catch(e) {}
                      }
                    }}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    REPORT: SQUAD NOT ARRIVING
                  </button>
                  <button 
                    onClick={() => window.open('tel:180073684635')}
                    style={{ background: 'white', color: '#000', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <PhoneCall size={14}/> CALL EMERGENCY HOTLINE
                  </button>
                </div>
              </div>
            </div>
          )}

          {uiState === 'CONFIRM_RESOLUTION' && (
            <div className="animated-entry" style={{ textAlign: 'center' }}>
              <ShieldAlert color="#f59e0b" size={40} style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: '#f8fafc' }}>Confirm Resolution</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1rem' }}>Has the situation been resolved safely?</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => handleResolutionConfirm(true)}>YES</button>
                <button className="btn-primary" style={{ background: '#f59e0b' }} onClick={() => handleResolutionConfirm(false)}>NO (ESCALATE)</button>
              </div>
            </div>
          )}

          {uiState === 'UNCOMPLETED' && (
            <div className="animated-entry" style={{ textAlign: 'center' }}>
              <div className="live-dot" style={{ margin: '0 auto 1rem auto', backgroundColor: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></div>
              <h3 style={{ color: '#ef4444' }}>Rescue Escalated to Command HQ</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '1rem 0' }}>
                You reported that the rescue unit did not resolve the situation. 
                Our Command Center has been alerted and is currently <strong>re-deploying a new tactical squad</strong> to your location.
              </p>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.2rem' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>HQ STATUS: SEARCHING FOR REINFORCEMENTS</p>
              </div>
              <div style={{ background: '#fff', color: '#000', padding: '0.8rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <PhoneCall size={18} /> 1800-SENTINEL
              </div>
              <button 
                className="btn-secondary" 
                style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                onClick={async () => {
                   if (window.confirm("Cancel this SOS request permanently?")) {
                     try { 
                       await axios.patch(`/api/incidents/${activeWait.id}/status`, { status: 'COMPLETED' }); 
                     } catch(e) { console.error("Cancellation failed", e); }
                     localStorage.removeItem('activeIncidentId');
                     window.location.reload();
                   }
                }}
              >
                CANCEL SOS REQUEST
              </button>
            </div>
          )}

          {uiState === 'COMPLETED' && (
            <div className="animated-entry" style={{ textAlign: 'center' }}>
              <ShieldCheck color="#10b981" size={48} style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: '#10b981' }}>Mission Success</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem 0' }}>Thank you. The situation has been safely resolved.</p>
              <button 
                className="btn-primary" 
                style={{ marginTop: '1rem', width: '100%' }} 
                onClick={() => {
                  localStorage.removeItem('activeIncidentId');
                  window.location.reload();
                }}
              >
                CLOSE
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CitizenView;
