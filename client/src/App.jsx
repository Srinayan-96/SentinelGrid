// Import React and necessary hooks for side-effects and state management
import React, { useEffect, useState } from 'react';
// Import routing components to handle single page application navigation
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
// Import socket.io-client to establish a WebSocket connection with the server
import { io } from 'socket.io-client';
// Import axios to perform HTTP requests to the backend API
import axios from 'axios';
// Import icons from the lucide-react library for the user interface
import { Network, ActivitySquare, LogIn, Menu, X } from 'lucide-react';
// Import custom Zustand store hook for global state management
import { useStore } from './store';
// Import the singleton socket instance configured for this app
import socket from './socket';

// Import the MapEngine component which displays the interactive map
import MapEngine from './components/MapEngine';
// Import the AdminPortal component which acts as the Command Center
import AdminPortal from './pages/AdminPortal';
// Import the ResponderPortal component for emergency responders
import ResponderPortal from './pages/ResponderPortal';
// Import the CitizenView component which is the default public interface
import CitizenView from './pages/CitizenView';

// Define the main App component
function App() {
  // Destructure required actions and state variables from the global Zustand store
  const { setIncidents, addIncident, responders, setResponders, user, setUser, setToken, addBroadcast } = useStore();
  // Initialize local state to track whether the mobile/navigation menu is open
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Fixed: changed React.useState to useState since it's already imported
  // Initialize the useNavigate hook to programmatically change routes
  const navigate = useNavigate();

  // useEffect hook to run setup logic when the App component mounts
  useEffect(() => {
    // Connect the socket to the server
    socket.connect();
    
    // Listen for 'NEW_INCIDENT' events to add new reports to the global state
    socket.on('NEW_INCIDENT', (incident) => {
      console.log('New tactical report:', incident);
      addIncident(incident);
    });

    // Listen for 'INCIDENT_ASSIGNED' and other updates to keep state consistent
    socket.on('INCIDENT_ASSIGNED', (incident) => {
      console.log('Tactical assignment updated:', incident);
      addIncident(incident); // addIncident handles both adding and updating
    });

    // Listen for 'TACTICAL_ALERT' events for system-wide broadcasts
    socket.on('TACTICAL_ALERT', (data) => {
      console.log('Tactical HQ Alert:', data);
      addBroadcast(data);
    });

    // Fetch initial dataset of all incidents from the backend API
    const fetchState = () => {
      axios.get('/api/incidents')
        .then(res => setIncidents(res.data))
        .catch(err => console.error('Error polling incidents:', err));
      axios.get('/api/users/responders')
        .then(res => setResponders(res.data))
        .catch(err => console.error('Error polling responders:', err));
    };

    fetchState();
    // Guarantee real-time responsiveness via robust 2-second polling loop
    const intervalId = setInterval(fetchState, 2000);

    // Cleanup function that runs when the component unmounts
    return () => {
      clearInterval(intervalId);
      // Disconnect the socket to prevent memory leaks and dangling connections
      socket.disconnect();
    };
  }, []); // Empty dependency array ensures this effect only runs once on mount

  // Define an asynchronous function to handle demo user logins
  const demoLogin = async (role) => {
    // Start a try-catch block to handle potential network or authentication errors
    try {
      const res = await axios.post('/api/auth/demo-login', { role });
      setUser(res.data.user);
      setToken(res.data.token);
      if (role === 'RESPONDER' || res.data.user.role === 'RESPONDER') navigate('/responder');
      if (role === 'ADMIN' || role === 'COMMAND' || res.data.user.role === 'ADMIN') navigate('/admin');
    } catch(err) {
      console.error('Demo login failed:', err);
      alert('Authentication failed. Ensure the server is running and database is seeded.');
    }
  };

  // Return the JSX layout for the App component
  return (
    // Main wrapper div with a CSS class for general app styling
    <div className="app-container">
      {/* Header navigation bar with a glassmorphism effect class */}
      <div className="header-nav glass-panel">
        {/* Link component to navigate back to the home/citizen view */}
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          {/* Container for the app title and logo, styled with a glowing effect */}
          <div className="title-glow" style={{ cursor: 'pointer' }}>
            {/* Render the Network icon from lucide-react with specific color and size */}
            <Network color="#10b981" size={28} />
            {/* Display the main application title text */}
            <span style={{ fontSize: '1.25rem' }}>SentinelGrid</span>
            
            {/* Container for the 'LIVE' indicator badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '1rem' }}>
              {/* CSS animated dot indicating live connection status */}
              <div className="live-dot"></div>
              {/* Text label for the live indicator */}
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>LIVE</span>
            </div>
          </div>
        </Link>

        {/* Container for the right-side navigation menu button and dropdown */}
        <div style={{ position: 'relative' }}>
          {/* Button to toggle the visibility of the dropdown menu */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            {/* Conditionally render the Close (X) icon if open, else render the Menu icon */}
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          {/* Conditionally render the dropdown menu if isMenuOpen is true */}
          {isMenuOpen && (
            // Dropdown menu container with glassmorphism and animation classes
            <div className="glass-panel animated-entry" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '1rem',
              padding: '1rem', borderRadius: '12px', minWidth: '220px', display: 'flex',
              flexDirection: 'column', gap: '0.5rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
            }}>
              {/* If a user is logged in, display their name and a small icon */}
              {user && (
                <div style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ActivitySquare size={16}/> Logged in as {user.name}
                </div>
              )}
              
              {/* Link to navigate to the default Citizen SOS Portal */}
              <Link to="/" className="btn-secondary" onClick={() => setIsMenuOpen(false)}>Citizen SOS Portal</Link>

              {/* Show demo login buttons if guest or just a citizen */}
              {(!user || user.role === 'CITIZEN') && (
                <>
                  {/* Button to trigger a demo login as a Responder */}
                  <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { demoLogin('RESPONDER'); setIsMenuOpen(false); }}>
                    <LogIn size={14}/> Responder Portal
                  </button>
                  {/* Button to trigger a demo login as an Admin */}
                  <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { demoLogin('ADMIN'); setIsMenuOpen(false); }}>
                    <LogIn size={14}/> Command Center
                  </button>
                </>
              )}

              {/* If the logged-in user is a Responder, show link to their specific portal */}
              {user?.role === 'RESPONDER' && <Link to="/responder" className="btn-secondary" onClick={() => setIsMenuOpen(false)}>Tactical Console</Link>}
              {/* If the logged-in user is an Admin, show link to their specific portal */}
              {user?.role === 'ADMIN' && <Link to="/admin" className="btn-secondary" onClick={() => setIsMenuOpen(false)}>Operations Center</Link>}
              
              {/* If a user is logged in, display a logout button */}
              {user && (
                <button className="btn-secondary" style={{ color: '#ef4444', marginTop: '0.5rem' }} onClick={() => { setUser(null); setToken(null); navigate('/'); setIsMenuOpen(false); }}>
                  Logout Session
                </button>
              )}

              {/* If no user is logged in, display a small reference of demo credentials */}
              {!user && (
                <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.7rem', color: '#94a3b8' }}>
                  <p style={{ fontWeight: 'bold', color: '#cbd5e1', marginBottom: '5px' }}>Demo Credentials:</p>
                  <p>Command: command@rescue.in</p>
                  <p>Responder: ndrf1@rescue.in</p>
                  <p>Pass: RESCUE2024</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content area containing the routing logic and the map engine */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex' }}>
        {/* React Router component to define route paths and their corresponding elements */}
        <Routes>
          {/* Default route renders the CitizenView */}
          <Route path="/" element={<CitizenView />} />
          {/* Admin route renders the AdminPortal */}
          <Route path="/admin" element={<AdminPortal />} />
          {/* Responder route renders the ResponderPortal */}
          <Route path="/responder" element={<ResponderPortal />} />
        </Routes>
        {/* MapEngine component is rendered outside routes so it persists across page navigations */}
        <MapEngine />
      </div>
    </div>
  );
}

// Export the App component as the default export of this module
export default App;
