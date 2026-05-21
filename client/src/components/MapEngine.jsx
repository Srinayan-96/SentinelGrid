import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store';

// --- ICON CREATION HELPERS ---

const createIncidentIcon = (type, urgency) => {
  let symbol = '⚠️';
  const t = (type || '').toUpperCase();
  if (t.includes('FIRE')) symbol = '🔥';
  else if (t.includes('FLOOD') || t.includes('WATER')) symbol = '🌊';
  else if (t.includes('MEDICAL')) symbol = '🚑';
  else if (t.includes('POLICE') || t.includes('SECURITY')) symbol = '👮';
  else if (t.includes('COLLAPSE')) symbol = '🏗️';
  else if (t.includes('CHEMICAL')) symbol = '🧪';

  let color = '#3b82f6';
  if (urgency === 'CRITICAL') color = '#ef4444';
  else if (urgency === 'HIGH') color = '#f97316';

  return L.divIcon({
    className: 'incident-marker',
    html: `
      <div style="
        background: ${color}; 
        width: 38px; height: 38px; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg);
        border: 2px solid #fff;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">${symbol}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
};

const createResponderIcon = (type, highlightLevel) => {
  let symbol = '🛡️';
  const t = (type || '').toUpperCase();
  if (t.includes('FIRE')) symbol = '🚒';
  else if (t.includes('AMBULANCE')) symbol = '🚑';
  else if (t.includes('BOAT')) symbol = '🚤';
  else if (t.includes('HELICOPTER')) symbol = '🚁';
  else if (t.includes('POLICE')) symbol = '🚔';
  else symbol = '🚛';

  const isFocused = highlightLevel === 'FOCUSED';
  const isRelevant = highlightLevel === 'RELEVANT';

  const color = isFocused ? '#ef4444' : isRelevant ? '#10b981' : '#475569';
  const glow = isFocused ? `box-shadow: 0 0 20px #ef4444; animation: fastPulse 0.8s infinite;` : 
               isRelevant ? `box-shadow: 0 0 15px rgba(255, 255, 255, 0.2); animation: pulse 2s infinite;` : '';

  return L.divIcon({
    className: 'responder-marker',
    html: `
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fastPulse {
          0% { transform: scale(1); opacity: 1; border-color: #fff; }
          50% { transform: scale(1.3); opacity: 0.9; border-color: #ef4444; }
          100% { transform: scale(1); opacity: 1; border-color: #fff; }
        }
      </style>
      <div style="
        background: ${color}; 
        width: 32px; height: 32px; 
        border-radius: 8px; 
        border: 2px solid ${isFocused || isRelevant ? '#fff' : '#94a3b8'}; 
        display:flex; align-items:center; justify-content:center; 
        font-size:16px;
        ${glow}
      ">
        ${symbol}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const createFacilityIcon = (type) => {
  let color = '#3b82f6'; 
  if (type === 'HOSPITAL') color = '#ef4444';
  if (type === 'POLICE_STATION' || type === 'POLICE') color = '#1d4ed8';
  if (type === 'POWER_PLANT') color = '#fbbf24';
  if (type === 'GAS_STATION') color = '#ea580c';

  return L.divIcon({
    className: 'facility-marker',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 2px solid #fff; transform: rotate(45deg); box-shadow: 0 0 5px ${color}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-marker',
    html: `<div style="background-color: #a855f7; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 20px #a855f7;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const createLiveSquadIcon = (type) => {
  let symbol = '🚒';
  const t = (type || '').toUpperCase();
  if (t.includes('HELICOPTER')) symbol = '🚁';
  else if (t.includes('AMBULANCE')) symbol = '🚑';
  else if (t.includes('BOAT')) symbol = '🚤';

  return L.divIcon({
    className: 'live-squad-marker',
    html: `
      <div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 15px rgba(255, 255, 255, 0.2); display:flex; align-items:center; justify-content:center; font-size:16px;">
        ${symbol}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

// --- UTILITIES ---

const haversineMeters = (a, b) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

const getLiveSquadLocation = (waypoints, progress) => {
  if (!waypoints || waypoints.length < 2) return null;
  const totalSegments = waypoints.length - 1;
  const exactIndex = progress * totalSegments;
  const baseIndex = Math.floor(exactIndex);
  const nextIndex = Math.min(baseIndex + 1, totalSegments);
  const remainder = exactIndex - baseIndex;
  const p1 = waypoints[baseIndex];
  const p2 = waypoints[nextIndex];
  return [p1[0] + (p2[0] - p1[0]) * remainder, p1[1] + (p2[1] - p1[1]) * remainder];
};

const isResponderRelevant = (incident, responder) => {
  if (!incident || !responder || !responder.is_available) return false;
  const iType = (incident.type || '').toUpperCase();
  const rType = (responder.vehicle_type || '').toUpperCase();
  if (iType.includes('FIRE')) return rType.includes('FIRE');
  if (iType.includes('FLOOD') || iType.includes('WATER')) return rType.includes('BOAT') || rType.includes('HELICOPTER') || rType.includes('TRUCK');
  if (iType.includes('MEDICAL') || iType.includes('AMBULANCE')) return rType.includes('AMBULANCE') || rType.includes('HELICOPTER');
  if (iType.includes('SECURITY') || iType.includes('POLICE')) return rType.includes('POLICE');
  if (iType.includes('COLLAPSE')) return rType.includes('TRUCK');
  return true;
};

// --- COMPONENTS ---

const MapBoundsHandler = ({ bounds }) => {
  const map = useMap();
  React.useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
};

const RecenterMap = ({ location }) => {
  const map = useMap();
  React.useEffect(() => {
    if (location && Array.isArray(location) && location[0]) {
      map.panTo(location, { animate: true });
    }
  }, [location, map]);
  return null;
};

const MapEngine = () => {
  const incidents = useStore(state => state.incidents);
  const responders = useStore(state => state.responders);
  const location = useStore(state => state.location);
  const setLocation = useStore(state => state.setLocation);
  const user = useStore(state => state.user);
  const token = useStore(state => state.token);
  const activeIncidentId = useStore(state => state.activeIncidentId);
  const focusedResponderId = useStore(state => state.focusedResponderId);

  const [selectedIncident, setSelectedIncident] = React.useState(null);
  const [routeProgress, setRouteProgress] = React.useState(0);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation([pos.coords.latitude, pos.coords.longitude]),
        err => console.log('Location unavailable')
      );
    }
  }, [setLocation]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRouteProgress(prev => (prev >= 0.95 ? 0 : prev + 0.015));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handleAdminDispatch = async (responder) => {
    if (!selectedIncident) return;
    try {
      const axios = (await import('axios')).default;
      await axios.patch(`/api/incidents/${selectedIncident.id}/assign`, {
        responder_id: responder.id,
        assignedUnit: responder.unit_name || responder.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIncident(null);
      alert(`${responder.name} dispatched.`);
    } catch(err) {
      alert("Dispatch failed.");
    }
  };

  const origin = { lat: location?.[0], lng: location?.[1] };
  const isValidOrigin = Number.isFinite(origin.lat) && Number.isFinite(origin.lng);

  const mockFacilities = [
    { id: 1, type: 'HOSPITAL', lat: 31.6340, lng: 74.8723, name: 'Civil Hospital Amritsar' },
    { id: 2, type: 'POLICE', lat: 31.6300, lng: 74.8700, name: 'Amritsar Police Line' },
    { id: 6, type: 'POLICE_STATION', lat: 30.7333, lng: 76.7794, name: 'Chandigarh Central Command' },
  ];

  return (
    <div className="map-layer">
      <MapContainer center={location} zoom={13} style={{ height: '100vh', width: '100vw' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <RecenterMap location={!activeIncidentId ? location : null} />

        {(() => {
          if ((user?.role === 'CITIZEN' || !user) && activeIncidentId) {
            const activeInc = incidents.find(i => String(i.id) === String(activeIncidentId));
            const firstResp = activeInc?.responders?.[0];
            const iLat = activeInc?.location?.coordinates?.[1] || activeInc?.location?.lat;
            const iLng = activeInc?.location?.coordinates?.[0] || activeInc?.location?.lng;
            const rLat = firstResp?.location?.lat || firstResp?.location?.coordinates?.[1];
            const rLng = firstResp?.location?.lng || firstResp?.location?.coordinates?.[0];
            
            if (iLat && iLng && rLat && rLng) {
              const bounds = [[iLat, iLng], [rLat, rLng]];
              return <MapBoundsHandler bounds={bounds} />;
            }
          }
          return null;
        })()}

        <Marker position={location} icon={createUserLocationIcon()} />

        {(!user || user.role === 'CITIZEN') && Array.isArray(mockFacilities) && mockFacilities.map(f => (
          <Marker key={`fac-${f.id}`} position={[f.lat, f.lng]} icon={createFacilityIcon(f.type)} />
        ))}

        {Array.isArray(incidents) && incidents.map((inc) => {
          const lat = inc?.location?.coordinates?.[1] || inc?.location?.lat;
          const lng = inc?.location?.coordinates?.[0] || inc?.location?.lng;
          if (!lat || !lng || ['RESOLVED', 'COMPLETED'].includes(inc.status)) return null;

          if (user?.role === 'RESPONDER' && isValidOrigin && haversineMeters(origin, { lat, lng }) > 50000) return null;
          if ((user?.role === 'CITIZEN' || !user) && String(inc.reporter_id) !== String(user?.id) && String(inc.id) !== String(activeIncidentId)) return null;

          return (
            <React.Fragment key={inc.id}>
              <Marker position={[lat, lng]} icon={createIncidentIcon(inc.type, inc.ai_urgency || inc.severity)} eventHandlers={{ click: () => setSelectedIncident(inc) }}>
                <Popup>
                  <div style={{minWidth: '200px'}}>
                    <h3 style={{margin: '0 0 5px 0', color: '#ef4444'}}>{inc.type}</h3>
                    <p style={{margin: '0 0 10px 0', fontSize: '0.8rem', color: '#cbd5e1'}}>{inc.description}</p>
                    {(user?.role === 'ADMIN' || user?.role === 'COMMAND') && (
                      <button onClick={() => setSelectedIncident(inc)} style={{width:'100%', padding:'5px', background: selectedIncident?.id === inc.id ? '#10b981' : '#3b82f6', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>
                        {selectedIncident?.id === inc.id ? 'READY' : 'SELECT'}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
              {Array.isArray(inc.responders) && inc.responders.map((resp, idx) => {
                if (!resp || !resp.route_waypoints) return null;
                const livePos = getLiveSquadLocation(resp.route_waypoints, routeProgress);
                return (
                  <React.Fragment key={`${inc.id}-resp-${idx}`}>
                    <Polyline positions={resp.route_waypoints} color="#10b981" weight={3} dashArray="5, 10" />
                    {livePos && <Marker position={livePos} icon={createLiveSquadIcon(resp.vehicle_type)} />}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {Array.isArray(responders) && responders.filter(r => {
          if (!r || !r.location) return false;
          const rLat = r.location.lat || r.location.coordinates?.[1];
          const rLng = r.location.lng || r.location.coordinates?.[0];
          if (!rLat || !rLng) return false;

          if (user?.role === 'ADMIN' || user?.role === 'COMMAND') return true;
          if (user?.role === 'RESPONDER') return isValidOrigin && haversineMeters(origin, { lat: rLat, lng: rLng }) <= 50000;
          return Array.isArray(incidents) && incidents.some(i => String(i.reporter_id) === String(user?.id) && (i.assigned_to || []).includes(r.id));
        }).map(r => {
          const rLat = r.location.lat || r.location.coordinates?.[1];
          const rLng = r.location.lng || r.location.coordinates?.[0];
          let highlightLevel = 'NONE';
          if (String(r.id) === String(focusedResponderId)) highlightLevel = 'FOCUSED';
          else if (selectedIncident && isResponderRelevant(selectedIncident, r)) highlightLevel = 'RELEVANT';
          
          return (
            <Marker key={`resp-${r.id}`} position={[rLat, rLng]} icon={createResponderIcon(r.vehicle_type, highlightLevel)}>
              <Popup>
                <div style={{minWidth: '180px'}}>
                  <h4 style={{margin:0, color: highlightLevel !== 'NONE' ? '#3b82f6' : '#10b981'}}>{r.name}</h4>
                  <p style={{margin:'4px 0', fontSize:'0.75rem'}}>{r.unit_name}</p>
                  {selectedIncident && (user?.role === 'ADMIN' || user?.role === 'COMMAND') && (
                    <button onClick={() => handleAdminDispatch(r)} style={{width:'100%', padding:'8px', background:'#3b82f6', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>
                      DISPATCH
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapEngine;
