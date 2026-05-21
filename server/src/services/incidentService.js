const User = require('../models/User');
const Facility = require('../models/Facility');

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function enrichIncidentsList(incidents) {
  const users = await User.findAll({ where: { role: 'RESPONDER' } });
  const responderMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
  
  const facilities = await Facility.findAll();
  const facilityMap = {};
  facilities.forEach(f => { facilityMap[f.name] = f; });

  return incidents.map(inc => {
    const plain = inc.toJSON ? inc.toJSON() : { ...inc };
    const incLat = plain.location?.coordinates?.[1] || plain.location?.lat || 0;
    const incLng = plain.location?.coordinates?.[0] || plain.location?.lng || 0;

    const assignedIds = Array.isArray(plain.assigned_to) ? plain.assigned_to : (plain.assigned_to ? [plain.assigned_to] : []);
    plain.responders = [];

    assignedIds.forEach(rid => {
      const responder = responderMap[rid];
      if (!responder) return;

      const respPlain = responder.toSafeJSON ? responder.toSafeJSON() : responder;
      let baseLat = responder.last_location?.coordinates?.[1];
      let baseLng = responder.last_location?.coordinates?.[0];

      if (responder.unit_name && facilityMap[responder.unit_name]) {
        baseLat = Number(facilityMap[responder.unit_name].lat);
        baseLng = Number(facilityMap[responder.unit_name].lng);
      }

      if (!baseLat || !baseLng) {
        const stateFac = facilities.find(f => f.state === plain.state) || facilities[0];
        if (stateFac) {
          baseLat = Number(stateFac.lat);
          baseLng = Number(stateFac.lng);
        } else {
          baseLat = 30.7333; baseLng = 76.7794;
        }
      }

      const distKm = haversineKm(incLat, incLng, baseLat, baseLng);
      let speedKmh = 60;
      const vType = (responder.vehicle_type || '').toUpperCase();
      if (vType.includes('HELICOPTER')) speedKmh = 220;
      else if (vType.includes('AMBULANCE')) speedKmh = 80;
      else if (vType.includes('TRUCK') || vType.includes('ENGINE')) speedKmh = 50;
      else if (vType.includes('BOAT')) speedKmh = 40;

      const etaMinutes = Math.max(2, Math.round((distKm / speedKmh) * 60));
      const waypoints = [];
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const fraction = i / steps;
        const arcOffset = Math.sin(fraction * Math.PI) * 0.02; 
        const lat = baseLat + (incLat - baseLat) * fraction + arcOffset;
        const lng = baseLng + (incLng - baseLng) * fraction;
        waypoints.push([lat, lng]);
      }

      plain.responders.push({
        ...respPlain,
        base_facility: responder.unit_name || plain.assigned_unit || 'Central Response Hub',
        location: { type: 'Point', coordinates: [baseLng, baseLat], lat: baseLat, lng: baseLng },
        distance_km: Number(distKm.toFixed(2)),
        eta_minutes: etaMinutes,
        speed_kmh: speedKmh,
        route_waypoints: waypoints
      });
    });

    if (plain.responders.length > 0) {
      plain.responder = plain.responders[0];
      plain.eta_minutes = plain.responders[0].eta_minutes;
    }

    return plain;
  });
}

module.exports = {
  enrichIncidentsList,
  haversineKm
};
