import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { useStore } from '../store';
import { Shield, MapPin, Activity, Clock, Send, Radio, MessageSquare, Bell, PauseCircle, ShieldCheck, BarChart3, TrendingUp, AlertTriangle, X, PhoneCall } from 'lucide-react';
import ChatComponent from '../components/ChatComponent';

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const AdminPortal = () => {
  const [selectedResponders, setSelectedResponders] = useState({});
  const [overrideStaffing, setOverrideStaffing] = useState({});
  const [activeChatIncidentId, setActiveChatIncidentId] = useState(null);
  const [adminChatTab, setAdminChatTab] = useState('RESPONDER');
  const [activeDropdownIncidentId, setActiveDropdownIncidentId] = useState(null);
  // Stores the pixel rect of the dropdown trigger button for fixed-position dropdown
  const [dropdownRect, setDropdownRect] = useState(null);
  const dropdownBtnRefs = useRef({});
  
  const incidents = useStore(state => state.incidents || []);
  const broadcasts = useStore(state => state.broadcasts || []);
  const addBroadcast = useStore(state => state.addBroadcast);
  const user = useStore(state => state.user);
  const token = useStore(state => state.token);
  const setFocusedResponderId = useStore(state => state.setFocusedResponderId);
  const focusedResponderId = useStore(state => state.focusedResponderId);
  
  const [forces, setForces] = useState([]);
  const [alertMsg, setAlertMsg] = useState('');
  const [activeTab, setActiveTab] = useState('missions'); 

  // Poll forces every 3s so dropdown stays fresh and recovers if server restarts
  useEffect(() => {
    const isAuth = user && (user.role === 'ADMIN' || user.role === 'COMMAND');
    if (!isAuth || !token) return;

    const fetchForces = () => {
      axios.get('/api/users/responders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setForces(Array.isArray(res.data) ? res.data : []))
      .catch(() => {}); // silent retry
    };

    fetchForces(); // immediate first fetch
    const id = setInterval(fetchForces, 3000);
    return () => clearInterval(id);
  }, [user, token]);

  const isAuth = user && (user.role === 'ADMIN' || user.role === 'COMMAND');

  // Pre-sort incidents by priority
  const sortedList = Array.isArray(incidents) ? [...incidents].sort((a,b) => {
    const p = { 'CRITICAL': 1, 'HIGH': 2, 'MODERATE': 3 };
    const urgA = a?.ai_urgency || a?.urgency || 'MODERATE';
    const urgB = b?.ai_urgency || b?.urgency || 'MODERATE';
    return (p[urgA] || 3) - (p[urgB] || 3);
  }) : [];

  // Filter for active missions (Only show OPEN, ASSIGNED, RESOLVED, or UNCOMPLETED missions)
  const activeMissions = sortedList.filter(i => i && i.status !== 'COMPLETED');
  
  // Auto-clear blinking if task disappears or completes
  useEffect(() => {
    if (activeChatIncidentId) {
      const stillActive = activeMissions.find(m => m.id === activeChatIncidentId);
      if (!stillActive) setActiveChatIncidentId(null);
    }
  }, [activeMissions, activeChatIncidentId]);

  // Clear blinking when active tab changes or AdminPortal unmounts
  useEffect(() => {
    return () => {
      setFocusedResponderId(null);
    };
  }, [activeTab, setFocusedResponderId]);

  // Clear focused/blinking responder if the incident is no longer active or selected
  useEffect(() => {
    if (focusedResponderId) {
      const stillSelected = activeMissions.some(inc => selectedResponders[inc.id] === focusedResponderId);
      if (!stillSelected) {
        setFocusedResponderId(null);
      }
    }
  }, [activeMissions, selectedResponders, focusedResponderId, setFocusedResponderId]);

  // Reset focused responder when dropdown closes or changes
  useEffect(() => {
    if (activeDropdownIncidentId) {
      setFocusedResponderId(selectedResponders[activeDropdownIncidentId] || null);
    } else {
      // Keep blink alive for incidents that have a staged (selected but not yet deployed) responder
      const anyPending = Object.values(selectedResponders).some(v => !!v);
      if (!anyPending) setFocusedResponderId(null);
    }
  }, [activeDropdownIncidentId, selectedResponders, setFocusedResponderId]);

  // Helper: open dropdown using fixed position based on button's screen rect
  const openDropdown = useCallback((incId) => {
    const btn = dropdownBtnRefs.current[incId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setActiveDropdownIncidentId(incId);
  }, []);

  const closeDropdown = useCallback(() => {
    setActiveDropdownIncidentId(null);
    setDropdownRect(null);
  }, []);

  // Sync selectedResponders with activeMissions (remove completed or force closed cases)
  useEffect(() => {
    setSelectedResponders(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(id => {
        if (!activeMissions.some(m => String(m.id) === String(id))) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [activeMissions]);

  if (!isAuth) {
    return (
      <div className="sidebar sidebar-left glass-panel animated-entry" style={{ zIndex: 1000 }}>
        <h2 style={{ color: '#ef4444' }}>Access Denied</h2>
        <p style={{ marginTop: '1rem' }}>Command Level clearance required.</p>
      </div>
    );
  }

  const successfulCount = incidents.filter(i => i.status === 'COMPLETED').length;
  const failedCount = incidents.filter(i => i.status === 'UNCOMPLETED').length;
  const successRate = incidents.length > 0 ? ((successfulCount / incidents.length) * 100).toFixed(1) : 0;

  const sendAlert = async () => {
    if(!alertMsg || !token) return;
    const msg = alertMsg;
    setAlertMsg('');
    addBroadcast({ message: msg, timestamp: new Date().toISOString() });
    try {
      await axios.post('/api/auth/broadcast', { message: msg }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="sidebar sidebar-left glass-panel animated-entry" style={{ zIndex: 1000, boxShadow: '0 10px 40px rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <Shield color="#10b981" size={28} />
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '1px' }}>SENTINEL HQ</h2>
          <p style={{ fontSize: '0.65rem', color: '#10b981', margin: 0, fontWeight: 'bold' }}>TACTICAL COMMAND PORTAL</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0 0 4px 0' }}>ACTIVE TASKS</p>
          <h3 style={{ fontSize: '1.3rem', margin: 0, color: '#f8fafc' }}>{activeMissions.length}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0 0 4px 0' }}>SQUADS</p>
          <h3 style={{ fontSize: '1.3rem', margin: 0, color: '#3b82f6' }}>{forces.length}</h3>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveTab('missions')} style={{ background: 'none', border: 'none', color: activeTab === 'missions' ? '#10b981' : '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>LIVE OPS</button>
        <button onClick={() => setActiveTab('deploy')} style={{ background: 'none', border: 'none', color: activeTab === 'deploy' ? '#10b981' : '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>SQUADS</button>
        <button onClick={() => setActiveTab('analytics')} style={{ background: 'none', border: 'none', color: activeTab === 'analytics' ? '#10b981' : '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>STATS</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
        {activeTab === 'missions' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeMissions.length === 0 && <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: '2rem' }}>No active tactical missions.</p>}
            {activeMissions.map(inc => {
              // Card blinks when chat is open OR a responder is staged (selected but not yet deployed)
              const hasStagedResponder = !!selectedResponders[inc.id];
              const isCardActive = activeChatIncidentId === inc.id || hasStagedResponder;
              return (
              <div 
                key={inc.id} 
                className={`incident-card card-${inc.ai_urgency || inc.urgency} ${isCardActive ? 'card-active' : ''}`} 
                style={{ padding: '1.2rem', position: 'relative' }}
              >
                {inc.status === 'UNCOMPLETED' && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '0 0 0 8px', fontWeight: 'bold' }}>ESCALATED</div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                   <div style={{ display: 'flex', gap: '6px' }}>
                     <span className={`badge badge-${inc.ai_urgency || inc.urgency}`}>{inc.ai_urgency || inc.urgency}</span>
                     {inc.status === 'ASSIGNED' && (
                       <span className="badge" style={{ background: '#3b82f6' }}>ASSIGNED</span>
                     )}
                   </div>
                   <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 'bold' }}>{inc.type?.toUpperCase()}</span>
                </div>
                
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {inc.ai_urgency === 'CRITICAL' && <AlertTriangle size={16} color="#ef4444" />}
                  {inc.title || 'Inbound SOS'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 1rem 0' }}>{inc.description}</p>
                
                {inc.status === 'UNCOMPLETED' && (
                   <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid #ef4444', marginBottom: '1rem' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>ALERT: Citizen reported failed rescue!</p>
                   </div>
                )}

                {/* Deployment & Staffing Logic */}
                {(() => {
                  const deployedCount = inc.responders?.length || 0;
                  const requiredForces = Math.max(1, Math.ceil((inc.people_affected || 1) / 5));
                  const isFullyStaffed = deployedCount >= requiredForces;
                  const isOverridden = overrideStaffing[inc.id];
                  
                  return (
                    <div style={{ marginBottom: '1rem' }}>
                      {deployedCount > 0 && (
                        <div style={{ marginBottom: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>DEPLOYED UNITS ({deployedCount}/{requiredForces} REQ):</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {inc.responders.map(r => (
                              <span key={r.id} className="deployed-unit-badge">
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!isFullyStaffed || isOverridden) ? (
                        <>
                          {!isFullyStaffed && deployedCount > 0 && (
                             <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                               <AlertTriangle size={14} /> UNDERSTAFFED - MORE FORCES REQUIRED
                             </p>
                          )}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                              {/* Trigger Button — ref used to calc fixed dropdown position */}
                              <button
                                ref={el => { dropdownBtnRefs.current[inc.id] = el; }}
                                className="input-base"
                                style={{
                                  margin: 0,
                                  padding: '8px 10px',
                                  width: '100%',
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: selectedResponders[inc.id]
                                    ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                                  border: selectedResponders[inc.id]
                                    ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  color: selectedResponders[inc.id] ? '#10b981' : '#94a3b8',
                                  textAlign: 'left',
                                }}
                                onClick={() => {
                                  if (activeDropdownIncidentId === inc.id) {
                                    closeDropdown();
                                  } else {
                                    openDropdown(inc.id);
                                  }
                                }}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {selectedResponders[inc.id]
                                    ? forces.find(f => f.id === selectedResponders[inc.id])?.name || 'Selected Unit'
                                    : (inc.status === 'UNCOMPLETED' ? 'RE-DEPLOY UNIT...' : 'Select Tactical Unit...')}
                                </span>
                                <span style={{ fontSize: '0.55rem', color: '#64748b', flexShrink: 0 }}>
                                  {activeDropdownIncidentId === inc.id ? '▲' : '▼'}
                                </span>
                              </button>

                              {/* Dropdown — rendered fixed so it's never clipped by overflow:hidden */}
                              {activeDropdownIncidentId === inc.id && dropdownRect && ReactDOM.createPortal(
                                <>
                                  <div
                                    style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 99998 }}
                                    onClick={(e) => { e.stopPropagation(); closeDropdown(); }}
                                  />
                                  <div
                                    className="glass-panel animated-entry"
                                    style={{
                                      position: 'fixed',
                                      top: dropdownRect.top,
                                      left: dropdownRect.left,
                                      width: dropdownRect.width,
                                      maxHeight: '220px',
                                      overflowY: 'auto',
                                      zIndex: 99999,
                                      background: 'rgba(10, 14, 26, 0.99)',
                                      border: '1px solid rgba(16,185,129,0.2)',
                                      borderRadius: '10px',
                                      boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
                                      padding: '4px'
                                    }}
                                  >
                                    {(() => {
                                      const iLat = inc.location?.coordinates?.[1] || inc.location?.lat;
                                      const iLng = inc.location?.coordinates?.[0] || inc.location?.lng;

                                      const sortByDist = (arr) => [...arr].sort((a, b) => {
                                        const aLat = a.location?.coordinates?.[1] || a.location?.lat || a.last_location?.coordinates?.[1];
                                        const aLng = a.location?.coordinates?.[0] || a.location?.lng || a.last_location?.coordinates?.[0];
                                        const bLat = b.location?.coordinates?.[1] || b.location?.lat || b.last_location?.coordinates?.[1];
                                        const bLng = b.location?.coordinates?.[0] || b.location?.lng || b.last_location?.coordinates?.[0];
                                        return getDistanceKm(iLat, iLng, aLat, aLng) - getDistanceKm(iLat, iLng, bLat, bLng);
                                      });

                                      const available = sortByDist(forces.filter(f => f.is_available));
                                      const deployed  = sortByDist(forces.filter(f => !f.is_available));
                                      const allForces = [...available, ...deployed];

                                      if (allForces.length === 0) {
                                        return (
                                          <div style={{ padding: '12px', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                                            No units found
                                          </div>
                                        );
                                      }

                                      return allForces.map(f => {
                                        const aLat = f.location?.coordinates?.[1] || f.location?.lat || f.last_location?.coordinates?.[1];
                                        const aLng = f.location?.coordinates?.[0] || f.location?.lng || f.last_location?.coordinates?.[0];
                                        const dist = getDistanceKm(iLat, iLng, aLat, aLng);
                                        const distStr = dist === Infinity ? '' : `${dist.toFixed(1)} km`;
                                        const isSelected = selectedResponders[inc.id] === f.id;
                                        const isDeployed = !f.is_available;

                                        return (
                                          <div
                                            key={f.id}
                                            style={{
                                              padding: '10px 12px',
                                              fontSize: '0.82rem',
                                              color: isSelected ? '#10b981' : isDeployed ? '#64748b' : '#f8fafc',
                                              cursor: 'pointer',
                                              borderRadius: '7px',
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              gap: '8px',
                                              background: isSelected ? 'rgba(16,185,129,0.12)' : 'transparent',
                                              transition: 'all 0.15s ease',
                                              borderLeft: isSelected ? '3px solid #10b981' : '3px solid transparent',
                                              opacity: isDeployed && !isSelected ? 0.55 : 1
                                            }}
                                            className="dropdown-item-hover"
                                            onMouseEnter={() => setFocusedResponderId(f.id)}
                                            onMouseLeave={() => setFocusedResponderId(selectedResponders[inc.id] || null)}
                                            onClick={() => {
                                              setSelectedResponders({ ...selectedResponders, [inc.id]: f.id });
                                              setFocusedResponderId(f.id);
                                              closeDropdown();
                                            }}
                                          >
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {f.name}
                                              {isDeployed && <span style={{ fontSize: '0.6rem', color: '#f97316', marginLeft: '6px' }}>DEPLOYED</span>}
                                            </span>
                                            {distStr && (
                                              <span style={{
                                                fontSize: '0.65rem',
                                                color: '#3b82f6',
                                                background: 'rgba(59,130,246,0.12)',
                                                padding: '2px 7px',
                                                borderRadius: '4px',
                                                flexShrink: 0
                                              }}>
                                                {distStr}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </>,
                                document.body
                              )}
                            </div>
                            <button
                              className="btn-primary"
                              style={{
                                width: 'auto',
                                padding: '8px 14px',
                                fontSize: '0.72rem',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                opacity: selectedResponders[inc.id] ? 1 : 0.4,
                                cursor: selectedResponders[inc.id] ? 'pointer' : 'not-allowed',
                                transition: 'opacity 0.2s ease'
                              }}
                              onClick={async () => {
                                const rid = selectedResponders[inc.id];
                                if (!rid) return;
                                try {
                                  await axios.patch(`/api/incidents/${inc.id}/assign`, { responder_id: rid }, { headers: { Authorization: `Bearer ${token}` } });
                                  // Clear staged selection → stops blink for this card
                                  setSelectedResponders(prev => { const next = { ...prev }; delete next[inc.id]; return next; });
                                  setFocusedResponderId(null);
                                  closeDropdown();
                                } catch (e) { console.error(e); }
                              }}
                            >
                              {deployedCount > 0 ? 'SEND MORE' : (inc.status === 'UNCOMPLETED' ? 'RE-DEPLOY' : 'DEPLOY')}
                            </button>
                            {isFullyStaffed && isOverridden && (
                              <button onClick={() => setOverrideStaffing({...overrideStaffing, [inc.id]: false})} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={14} /> ADEQUATELY STAFFED
                          </span>
                          <button 
                            onClick={() => setOverrideStaffing({...overrideStaffing, [inc.id]: true})}
                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.65rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            ADD FORCES
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                   <button 
                      className="btn-secondary"
                      style={{ fontSize: '0.65rem', flex: 1, border: '1px solid #ef444433', color: '#ef4444', background: 'transparent' }}
                      onClick={async () => {
                        const reason = prompt("Tactical Justification for Force End (will be logged as FAILURE):");
                        if(!reason) return;
                        try {
                          await axios.patch(`/api/incidents/${inc.id}/admin-complete`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
                          setSelectedResponders(prev => {
                            const next = { ...prev };
                            delete next[inc.id];
                            return next;
                          });
                          setFocusedResponderId(null);
                        } catch (e) { alert("Error override failed."); }
                      }}
                   >
                    FORCE END (FAIL)
                   </button>
                   <button 
                    onClick={() => setActiveChatIncidentId(activeChatIncidentId === inc.id ? null : inc.id)}
                    style={{ background: activeChatIncidentId === inc.id ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold', padding: '6px 12px', borderRadius: '8px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                   >
                    {activeChatIncidentId === inc.id ? <><X size={12}/> CLOSE</> : <><MessageSquare size={12}/> COMMS</>}
                   </button>
                </div>

                {activeChatIncidentId === inc.id && (
                  <div className="animated-entry" style={{ marginTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                     <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button onClick={() => setAdminChatTab('RESPONDER')} style={{ background: 'none', border: 'none', color: adminChatTab === 'RESPONDER' ? '#3b82f6' : '#64748b', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>RESPONDER</button>
                        <button onClick={() => setAdminChatTab('CIVILIAN')} style={{ background: 'none', border: 'none', color: adminChatTab === 'CIVILIAN' ? '#10b981' : '#64748b', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>CIVILIAN</button>
                     </div>
                     <ChatComponent incidentId={inc.id} channel={adminChatTab === 'RESPONDER' ? 'COMMAND' : 'CIVILIAN'} title={adminChatTab === 'RESPONDER' ? "Unit Comms" : "Citizen Line"} />
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : activeTab === 'deploy' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {forces.map(f => (
              <div key={f.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.9rem' }}>{f.name}</h4>
                  <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px', background: f.is_available ? 'rgba(16, 185, 129, 0.05)' : 'rgba(249, 115, 22, 0.05)', color: f.is_available ? '#10b981' : '#f97316', fontWeight: 'bold' }}>
                    {f.is_available ? 'STANDBY' : 'DEPLOYED'}
                  </span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>{f.vehicle_type} • {f.handled_cases || 0} Successful Rescues</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="animated-entry" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
             <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.8rem', marginBottom: '1rem' }}>
                   <TrendingUp size={16} /> Mission Integrity
                </h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f8fafc' }}>{successRate}%</div>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '5px' }}>Stats from {incidents.length} total operations.</p>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.03)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.05)' }}>
                   <div style={{ fontSize: '0.6rem', color: '#10b981', marginBottom: '5px' }}>SUCCESSFUL</div>
                   <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{successfulCount}</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.03)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.05)' }}>
                   <div style={{ fontSize: '0.6rem', color: '#ef4444', marginBottom: '5px' }}>UNRESOLVED (FAILED)</div>
                   <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{failedCount}</div>
                </div>
             </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={14} color="#ef4444" /> HQ BROADCAST CHANNEL
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            className="input-base" 
            style={{ margin: 0, flex: 1, fontSize: '0.8rem', padding: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }} 
            value={alertMsg} 
            onChange={e => setAlertMsg(e.target.value)} 
            placeholder="Orders..." 
          />
          <button className="btn-primary" style={{ width: 'auto', background: '#3b82f6', boxShadow: '0 2px 10px rgba(255,255,255,0.05)' }} onClick={sendAlert}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
