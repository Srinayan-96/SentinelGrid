// Import React for creating components
import React, { useState } from 'react';
// Import Axios for making HTTP requests to the backend server
import axios from 'axios';
// Import the custom Zustand global store to access state (incidents, user, etc.)
import { useStore } from '../store';
// Import UI icons from the lucide-react library
import { Crosshair, MapPin, ShieldAlert, Cpu, Bell, MessageSquare } from 'lucide-react';
// Import the ChatComponent so responders can communicate with citizens
import ChatComponent from '../components/ChatComponent';

// Define the ResponderPortal functional component
const ResponderPortal = () => {
  const [commsTab, setCommsTab] = useState('CIVILIAN');
  // Retrieve the global incidents array from the Zustand store
  const incidents = useStore(state => state.incidents);
  // Retrieve tactical broadcasts from the Zustand store
  const broadcasts = useStore(state => state.broadcasts);
  // Retrieve the currently authenticated user from the store
  const user = useStore(state => state.user);
  // Retrieve the authentication token to send with API requests
  const token = useStore(state => state.token);
  // Retrieve the responder's current GPS location
  const location = useStore(state => state.location);

  // Helper to calculate distance in KM
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Security & Role check: Ensure a user is logged in AND their role is RESPONDER
  if (!user || (user.role || '').toUpperCase() !== 'RESPONDER') {
    // If unauthorized, return an access denied message wrapped in the standard sidebar UI
    return (
      <div className="sidebar sidebar-left glass-panel animated-entry">
        <h2 style={{ color: '#f97316' }}>Responder Access Only</h2>
        <p style={{ marginTop: '1rem' }}>Please login as RESPONDER.</p>
      </div>
    );
  }

  // Find the active mission(s) specifically assigned to THIS responder (including those awaiting citizen confirmation)
  const activeMission = incidents.find(i => {
    const assignedIds = Array.isArray(i.assigned_to) ? i.assigned_to : (i.assigned_to ? [i.assigned_to] : []);
    return assignedIds.includes(user.id) && ['ASSIGNED', 'RESOLVED'].includes(i.status);
  });
  
  // Filter the global incidents to find 'OPEN' or 'UNCOMPLETED' incidents within a 50km radius
  const openIncidents = incidents.filter(i => {
    if (i.status !== 'OPEN' && i.status !== 'UNCOMPLETED') return false;
    const iLat = i.location?.coordinates?.[1] || i.location?.lat;
    const iLng = i.location?.coordinates?.[0] || i.location?.lng;
    if (!iLat || !iLng) return false;
    return getDistance(location[0], location[1], iLat, iLng) <= 50;
  });

  // Asynchronous function triggered when a responder clicks "ACCEPT DISPATCH"
  const handleAccept = async (incidentId) => {
    // Start a try-catch block to handle API errors
    try {
      // Send a PATCH request to the backend to mark the incident as claimed
      await axios.patch(`/api/incidents/${incidentId}/claim`, {}, {
        // Pass the responder's JWT token in the Authorization header
        headers: { Authorization: `Bearer ${token}` }
      });
      // (The global incident state will update automatically via WebSockets from App.jsx)
    } catch(err) {
      // Log the error for debugging
      console.error('Failed to accept mission', err);
      // Show an alert if the mission was perhaps taken by another responder simultaneously
      alert("Failed to accept mission - maybe already taken.");
    }
  };

  // Return the JSX layout for the Responder Portal
  return (
    // Wrap everything in a sidebar container positioned on the right side of the screen
    <div className="sidebar sidebar-left glass-panel animated-entry">
      {/* Header section with an icon and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Crosshair color="#f97316" size={24} />
        <h2 style={{ fontSize: '1.25rem' }}>Tactical Field Feed</h2>
      </div>

      {/* Broadcast Feed Section: Displays system-wide alerts from Command Center */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
        {/* Broadcast header */}
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          <Bell size={14} /> Tactical Broadcasts
        </h4>
        {/* Scrollable list of broadcast messages */}
        <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* If no broadcasts exist, show a placeholder message */}
          {broadcasts.length === 0 && <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No active commands.</p>}
          {/* Map through all broadcasts and render them as stylized list items */}
          {broadcasts.map((b, i) => (
            <div key={i} style={{ padding: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', fontSize: '0.75rem', borderLeft: '2px solid #ef4444' }}>
              {b.message}
            </div>
          ))}
        </div>
      </div>

      {/* Conditional Rendering: Show either the Active Mission OR the list of Open Incidents */}
      {activeMission ? (
        // --- ACTIVE MISSION VIEW ---
        <div className="active-mission-panel animated-entry">
          {/* Card detailing the core incident information */}
          <div className={`incident-card card-${activeMission.ai_urgency || activeMission.urgency}`} style={{border: '1px solid #10b981'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              {/* Badge showing the urgency level */}
              <span className={`badge badge-${activeMission.ai_urgency || activeMission.urgency}`}>{activeMission.ai_urgency || activeMission.urgency}</span>
              {/* Badge highlighting that this is the currently active mission */}
              <span className="badge" style={{background: '#064e3b'}}>ACTIVE MISSION</span>
            </div>
            {/* Incident Title */}
            <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>{activeMission.title || `${activeMission.type} Emergency`}</h4>
            {/* Incident Description */}
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{activeMission.description}</p>
          </div>

          {/* AI Mission Intelligence Panel */}
          <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '0.8rem', fontSize: '0.9rem' }}>
              <Cpu size={16} /> AI Mission Intelligence
            </h4>
            {/* Display the AI-generated situation analysis and summary */}
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '4px' }}>
              <strong>Situation Analysis:</strong> AI has flagged this as {activeMission.ai_urgency || 'pending'} emergency. 
              <p style={{marginTop:'5px'}}>{activeMission.ai_summary || "Initiating tactical routing and survivor contact protocols."}</p>
            </div>
            {/* Display AI-recommended resources/gear for the responder to bring */}
            <div style={{ marginTop: '1rem' }}>
               <p style={{fontSize:'0.75rem', fontWeight:'bold', color: '#f8fafc', marginBottom:'5px'}}>Recommended Loadout:</p>
               <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
                  {/* Map over the AI resources array */}
                  {(activeMission.ai_resources || ['Standard Gear']).map(r => (
                    <span key={r} style={{fontSize:'0.65rem', background:'rgba(16, 185, 129, 0.1)', color:'#10b981', padding:'2px 6px', borderRadius:'4px', border:'1px solid rgba(16,185,129,0.2)'}}>
                      {r}
                    </span>
                  ))}
               </div>
            </div>
          </div>

          {/* Multi-Channel Comms Interface */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
              <button 
                onClick={() => setCommsTab('CIVILIAN')} 
                style={{ background: 'none', border: 'none', color: commsTab === 'CIVILIAN' ? '#10b981' : '#94a3b8', fontWeight: commsTab === 'CIVILIAN' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <MessageSquare size={12} /> Civilian Channel
              </button>
              <button 
                onClick={() => setCommsTab('COMMAND')} 
                style={{ background: 'none', border: 'none', color: commsTab === 'COMMAND' ? '#3b82f6' : '#94a3b8', fontWeight: commsTab === 'COMMAND' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <MessageSquare size={12} /> Command HQ Channel
              </button>
            </div>

            {commsTab === 'CIVILIAN' ? (
              <ChatComponent incidentId={activeMission.id} channel="CIVILIAN" title="Civilian Comms" />
            ) : (
              <ChatComponent incidentId={activeMission.id} channel="COMMAND" title="Command Center HQ Comms" />
            )}
          </div>

          {/* Mission Control Actions */}
          {activeMission.status === 'ASSIGNED' ? (
            <button className="btn-primary" style={{ marginTop: '1.5rem', background: '#3b82f6' }} onClick={async () => {
              const notes = prompt("Enter mission resolution notes:");
              const saved = prompt("Number of people saved:", "0");
              try {
                await axios.patch(`/api/incidents/${activeMission.id}/resolve`, { 
                  people_saved: parseInt(saved) || 0,
                  notes: notes || "Mission resolved by responder."
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                alert("Mission marked as RESOLVED. Awaiting citizen confirmation.");
              } catch(e) {
                alert("Failed to resolve mission. Try again.");
              }
            }}>
              RESOLVE MISSION
            </button>
          ) : (
            <div style={{ marginTop: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#f59e0b', fontWeight: 'bold', margin: 0 }}>MISSION RESOLVED</p>
              <p style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '4px' }}>Awaiting citizen receipt confirmation...</p>
            </div>
          )}
        </div>
      ) : (
        // --- OPEN INCIDENTS VIEW ---
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* If there are no open incidents, show a placeholder message */}
          {openIncidents.length === 0 && <p style={{color: '#94a3b8'}}>No nearby open missions.</p>}
          {/* Map through all open incidents and render a card for each */}
          {openIncidents.map(inc => (
            <div key={inc.id} className={`incident-card card-${inc.ai_urgency || inc.urgency}`} style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
               {/* Urgency badge */}
               <span className={`badge badge-${inc.ai_urgency || inc.urgency}`}>{inc.ai_urgency || inc.urgency}</span>
               {/* Incident title */}
               <h4 style={{ margin: '0.5rem 0', color: 'white' }}>{inc.title || `${inc.type} SOS`}</h4>
               {/* Incident description */}
               <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>{inc.description}</p>
               
               {/* Button to accept the dispatch */}
               <button className="btn-secondary" style={{ width: '100%', textAlign: 'center', background: '#10b981', color:'white', cursor: 'pointer', border:'none' }} onClick={() => handleAccept(inc.id)}>
                  ACCEPT DISPATCH
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export the component as default for React Router
export default ResponderPortal;
