const axios = require('axios');
const Facility = require('../models/Facility');
const User = require('../models/User');

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCdtO3859oA-wX_P8f3YCtCRYjek7P56Jg';

async function fetchAndSeedNearbyFacilities(lat, lng, state) {
  try {
    const types = [
      { googleType: 'hospital', dbType: 'HOSPITAL', label: 'Hospital' },
      { googleType: 'police', dbType: 'POLICE', label: 'Police Station' },
      { googleType: 'fire_station', dbType: 'NDRF', label: 'Fire & Rescue Station' }
    ];
    
    let createdFacilities = [];
    let assignedResponders = 0;
    
    // We fetch a few of each type nearby
    for (const { googleType, dbType, label } of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=30000&type=${googleType}&key=${MAPS_API_KEY}`;
      const response = await axios.get(url);
      
      const results = response.data.results || [];
      const topResults = results.slice(0, 3); // Get up to 3 of each type
      
      for (const place of topResults) {
        // Check if facility already exists by name
        const existing = await Facility.findOne({ where: { name: place.name } });
        if (!existing) {
          const newFac = await Facility.create({
            name: place.name,
            type: dbType,
            state: state || 'Unknown',
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            contact: '100', // Mock contact
            personnel: Math.floor(Math.random() * (40 - 10) + 10),
            is_available: true,
            vehicle_type: dbType === 'HOSPITAL' ? 'Ambulance' : (dbType === 'NDRF' ? 'Rescue Truck' : 'Police Cruiser')
          });
          createdFacilities.push(newFac);
          
          // Generate a fake responder user attached to this facility
          const responderCount = await User.count({ where: { unit_name: newFac.name } });
          if (responderCount === 0) {
            assignedResponders++;
            const suffix = String(assignedResponders).padStart(2, '0');
            await User.create({
              name: `Responder ${suffix} (${label})`,
              email: `responder${suffix}_${Date.now()}@rescue.in`,
              password: 'hashed_password', // Mock since they won't log in directly unless we want them to
              role: 'RESPONDER',
              state: state || 'Unknown',
              force_id: `${dbType}-${suffix}`,
              unit_name: newFac.name,
              vehicle_type: newFac.vehicle_type
            });
          }
        } else {
          createdFacilities.push(existing);
        }
      }
    }
    
    return createdFacilities;
  } catch (err) {
    console.error('Error fetching nearby facilities:', err.message);
    return [];
  }
}

module.exports = {
  fetchAndSeedNearbyFacilities
};
