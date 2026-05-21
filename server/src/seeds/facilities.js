const facilitiesData = [
  // MAHARASHTRA
  { name: 'NDRF 4th Battalion Mumbai', type: 'NDRF', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, personnel: 24, vehicle_type: 'NDRF Rescue Boat + ATV' },
  { name: 'NDRF Rapid Response Pune', type: 'NDRF', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, personnel: 18, vehicle_type: 'Flood Rescue Vehicle' },
  { name: 'KEM Hospital Mumbai', type: 'HOSPITAL', state: 'Maharashtra', lat: 18.9953, lng: 72.8406, personnel: 12, vehicle_type: 'ALS Ambulance' },
  { name: 'Sassoon Hospital Pune', type: 'HOSPITAL', state: 'Maharashtra', lat: 18.5195, lng: 73.8533, personnel: 10, vehicle_type: 'Medical Response Van' },
  { name: 'Mumbai Fire Brigade HQ', type: 'FIRE', state: 'Maharashtra', lat: 18.9641, lng: 72.8350, personnel: 16, vehicle_type: 'Fire Engine + Aerial Ladder' },
  { name: 'Pune Fire Central', type: 'FIRE', state: 'Maharashtra', lat: 18.5195, lng: 73.8553, personnel: 12, vehicle_type: 'Fire Tanker' },
  { name: 'Mumbai Police HQ', type: 'POLICE', state: 'Maharashtra', lat: 18.9396, lng: 72.8353, personnel: 20, vehicle_type: 'Police Response Vehicle' },

  // DELHI
  { name: 'NDRF 1st Battalion Delhi', type: 'NDRF', state: 'Delhi', lat: 28.6139, lng: 77.2090, personnel: 30, vehicle_type: 'Multi-Hazard Response Unit' },
  { name: 'AIIMS New Delhi', type: 'HOSPITAL', state: 'Delhi', lat: 28.5672, lng: 77.2100, personnel: 15, vehicle_type: 'Trauma Ambulance' },
  { name: 'Safdarjung Hospital', type: 'HOSPITAL', state: 'Delhi', lat: 28.5686, lng: 77.2063, personnel: 12, vehicle_type: 'ALS Ambulance' },
  { name: 'Delhi Fire Service HQ', type: 'FIRE', state: 'Delhi', lat: 28.6562, lng: 77.2410, personnel: 18, vehicle_type: 'Fire Engine' },
  { name: 'Delhi Police HQ', type: 'POLICE', state: 'Delhi', lat: 28.6517, lng: 77.2219, personnel: 25, vehicle_type: 'PCR Van' },

  // GUJARAT
  { name: 'NDRF 7th Battalion Gandhinagar', type: 'NDRF', state: 'Gujarat', lat: 23.2156, lng: 72.6369, personnel: 22, vehicle_type: 'Rescue Boat + Dive Team' },
  { name: 'NDRF Rapid Unit Surat', type: 'NDRF', state: 'Gujarat', lat: 21.1702, lng: 72.8311, personnel: 16, vehicle_type: 'Flood Response Vehicle' },
  { name: 'Civil Hospital Ahmedabad', type: 'HOSPITAL', state: 'Gujarat', lat: 23.0395, lng: 72.5870, personnel: 14, vehicle_type: 'ALS Ambulance' },
  { name: 'Ahmedabad Fire Station', type: 'FIRE', state: 'Gujarat', lat: 23.0225, lng: 72.5714, personnel: 14, vehicle_type: 'Fire Tanker' },
  { name: 'Gujarat Police HQ', type: 'POLICE', state: 'Gujarat', lat: 23.2156, lng: 72.6369, personnel: 20, vehicle_type: 'Armed Response Vehicle' },
  { name: 'Coast Guard Porbandar', type: 'NDRF', state: 'Gujarat', lat: 21.6422, lng: 69.6293, personnel: 18, vehicle_type: 'Coast Guard Vessel' },

  // KERALA
  { name: 'NDRF Kerala Thiruvananthapuram', type: 'NDRF', state: 'Kerala', lat: 8.5241, lng: 76.9366, personnel: 20, vehicle_type: 'Boat Rescue Team' },
  { name: 'NDRF Kochi Response Team', type: 'NDRF', state: 'Kerala', lat: 9.9312, lng: 76.2673, personnel: 18, vehicle_type: 'Amphibious Vehicle' },
  { name: 'Medical College TVM', type: 'HOSPITAL', state: 'Kerala', lat: 8.5074, lng: 76.9462, personnel: 12, vehicle_type: 'Trauma Ambulance' },
  { name: 'Amrita Hospital Kochi', type: 'HOSPITAL', state: 'Kerala', lat: 9.9390, lng: 76.3235, personnel: 10, vehicle_type: 'ALS Ambulance' },
  { name: 'Kerala Fire Force TVM', type: 'FIRE', state: 'Kerala', lat: 8.5069, lng: 76.9581, personnel: 12, vehicle_type: 'Fire Engine' },
  { name: 'Coast Guard Kochi', type: 'NDRF', state: 'Kerala', lat: 9.9638, lng: 76.2673, personnel: 22, vehicle_type: 'Coast Guard Patrol Vessel' },

  // RAJASTHAN
  { name: 'NDRF Jaipur Unit', type: 'NDRF', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, personnel: 20, vehicle_type: 'Desert Rescue Vehicle' },
  { name: 'NDRF Jodhpur Response', type: 'NDRF', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, personnel: 16, vehicle_type: 'All-Terrain Rescue Unit' },
  { name: 'SMS Hospital Jaipur', type: 'HOSPITAL', state: 'Rajasthan', lat: 26.9260, lng: 75.8235, personnel: 14, vehicle_type: 'ALS Ambulance' },
  { name: 'AIIMS Jodhpur', type: 'HOSPITAL', state: 'Rajasthan', lat: 26.2700, lng: 73.0200, personnel: 12, vehicle_type: 'Medical Response Van' },
  { name: 'Jaipur Fire Station', type: 'FIRE', state: 'Rajasthan', lat: 26.9217, lng: 75.7900, personnel: 12, vehicle_type: 'Fire Tanker' },
  { name: 'Rajasthan Police HQ', type: 'POLICE', state: 'Rajasthan', lat: 26.9215, lng: 75.7873, personnel: 20, vehicle_type: 'Police Response Vehicle' },

  // PUNJAB
  { name: 'NDRF 7th Battalion Bathinda', type: 'NDRF', state: 'Punjab', lat: 30.2110, lng: 74.9455, personnel: 25, vehicle_type: 'Multi-Hazard Response Unit' },
  { name: 'Civil Hospital Amritsar', type: 'HOSPITAL', state: 'Punjab', lat: 31.6340, lng: 74.8723, personnel: 12, vehicle_type: 'ALS Ambulance' },
  { name: 'Chandigarh Fire Central', type: 'FIRE', state: 'Punjab', lat: 30.7333, lng: 76.7794, personnel: 15, vehicle_type: 'Fire Engine' },
  { name: 'Ludhiana Police HQ', type: 'POLICE', state: 'Punjab', lat: 30.9010, lng: 75.8573, personnel: 20, vehicle_type: 'PCR Van' },
  { name: 'Army Western Command HQ', type: 'NDRF', state: 'Punjab', lat: 30.7333, lng: 76.7794, personnel: 40, vehicle_type: 'Rescue Helicopter' },
];

const seedFacilities = async (Facility) => {
  await Facility.destroy({ where: {} });
  await Facility.bulkCreate(facilitiesData);
  console.log('✅ Facilities seeded');
};

module.exports = seedFacilities;
