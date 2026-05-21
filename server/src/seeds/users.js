const seedUsers = async (User) => {
  await User.destroy({ where: {} });
  
  const cities = [
    { name: 'Amritsar', coords: [74.8723, 31.6340] },
    { name: 'Ludhiana', coords: [75.8573, 30.9010] },
    { name: 'Jalandhar', coords: [75.5762, 31.3260] },
    { name: 'Patiala', coords: [76.3869, 30.3398] },
    { name: 'Bathinda', coords: [74.9455, 30.2110] },
    { name: 'Hoshiarpur', coords: [75.9114, 31.5236] },
    { name: 'Mohali', coords: [76.7179, 30.7046] },
    { name: 'Pathankot', coords: [75.6500, 32.2689] }
  ];

  const baseUsers = [
    { name: 'Punjab State Command', email: 'command@rescue.in', password: 'RESCUE2024', role: 'ADMIN' },
    { name: 'NDRF Base 1', email: 'ndrf1@rescue.in', password: 'RESCUE2024', role: 'RESPONDER', unit_name: 'NDRF Punjab Main', vehicle_type: 'HEAVY_TRUCK', last_location: { type: 'Point', coordinates: [74.9455, 30.2110] } }
  ];

  const responders = [];

  // Add 20 Ambulances
  for (let i = 1; i <= 20; i++) {
    const city = cities[i % cities.length];
    responders.push({
      name: `Ambulance Unit ${i}`,
      email: `amb${i}@rescue.in`,
      password: 'RESCUE2024',
      role: 'RESPONDER',
      force_id: `AMB-${i.toString().padStart(3, '0')}`,
      unit_name: `Paramedic Squad ${i} - ${city.name}`,
      state: 'Punjab',
      vehicle_type: 'AMBULANCE',
      skills: ['Emergency Medicine', 'Triage'],
      personnel_count: 3,
      handled_cases: Math.floor(Math.random() * 100),
      is_available: true,
      last_location: { type: 'Point', coordinates: [city.coords[0] + (Math.random() - 0.5) * 0.1, city.coords[1] + (Math.random() - 0.5) * 0.1] }
    });
  }

  // Add 10 Rescue Boats (for Flood situations)
  for (let i = 1; i <= 10; i++) {
    const city = cities[i % cities.length];
    responders.push({
      name: `Rescue Boat ${i}`,
      email: `boat${i}@rescue.in`,
      password: 'RESCUE2024',
      role: 'RESPONDER',
      force_id: `BOAT-${i.toString().padStart(3, '0')}`,
      unit_name: `Water Rescue Squad ${i} - ${city.name}`,
      state: 'Punjab',
      vehicle_type: 'BOAT',
      skills: ['Flood Rescue', 'Water Navigation', 'Diving'],
      personnel_count: 8,
      handled_cases: Math.floor(Math.random() * 40),
      is_available: true,
      last_location: { type: 'Point', coordinates: [city.coords[0] + (Math.random() - 0.5) * 0.1, city.coords[1] + (Math.random() - 0.5) * 0.1] }
    });
  }

  // Add 15 Fire Trucks (FIRE_ENGINE)
  for (let i = 1; i <= 15; i++) {
    const city = cities[i % cities.length];
    responders.push({
      name: `Fire Engine ${i}`,
      email: `fire${i}@rescue.in`,
      password: 'RESCUE2024',
      role: 'RESPONDER',
      force_id: `FIRE-${i.toString().padStart(3, '0')}`,
      unit_name: `Fire Station - ${city.name}`,
      state: 'Punjab',
      vehicle_type: 'FIRE_ENGINE',
      skills: ['Firefighting', 'Extrication', 'Hazmat'],
      personnel_count: 6,
      handled_cases: Math.floor(Math.random() * 120),
      is_available: true,
      last_location: { type: 'Point', coordinates: [city.coords[0] + (Math.random() - 0.5) * 0.15, city.coords[1] + (Math.random() - 0.5) * 0.15] }
    });
  }

  // Add 20 Police Patrols (POLICE_CAR)
  for (let i = 1; i <= 20; i++) {
    const city = cities[i % cities.length];
    responders.push({
      name: `Police Patrol ${i}`,
      email: `police${i}@rescue.in`,
      password: 'RESCUE2024',
      role: 'RESPONDER',
      force_id: `POLICE-${i.toString().padStart(3, '0')}`,
      unit_name: `Police Outpost - ${city.name}`,
      state: 'Punjab',
      vehicle_type: 'POLICE_CAR',
      skills: ['Crowd Control', 'Security', 'First Aid'],
      personnel_count: 4,
      handled_cases: Math.floor(Math.random() * 300),
      is_available: true,
      last_location: { type: 'Point', coordinates: [city.coords[0] + (Math.random() - 0.5) * 0.2, city.coords[1] + (Math.random() - 0.5) * 0.2] }
    });
  }

  // Add 10 Medical Ambulances (AMBULANCE)
  for (let i = 1; i <= 10; i++) {
    const city = cities[i % cities.length];
    responders.push({
      name: `Ambulance ${i}`,
      email: `med${i}@rescue.in`,
      password: 'RESCUE2024',
      role: 'RESPONDER',
      force_id: `AMB-${i.toString().padStart(3, '0')}`,
      unit_name: `EMS Hub - ${city.name}`,
      state: 'Punjab',
      vehicle_type: 'AMBULANCE',
      skills: ['Advanced Life Support', 'Trauma Care'],
      personnel_count: 3,
      handled_cases: Math.floor(Math.random() * 450),
      is_available: true,
      last_location: { type: 'Point', coordinates: [city.coords[0] + (Math.random() - 0.5) * 0.1, city.coords[1] + (Math.random() - 0.5) * 0.1] }
    });
  }

  // Add 10 Heavy Rescue / NDRF Squads
  for (let i = 1; i <= 10; i++) {
    const city = cities[i % cities.length];
    responders.push({
      name: `NDRF Squad ${i}`,
      email: `ndrf_squad${i}@rescue.in`,
      password: 'RESCUE2024',
      role: 'RESPONDER',
      force_id: `NDRF-${i.toString().padStart(3, '0')}`,
      unit_name: `NDRF Tactical Unit ${i} - ${city.name}`,
      state: 'Punjab',
      vehicle_type: 'HEAVY_TRUCK',
      skills: ['Flood Rescue', 'Collapse Rescue'],
      personnel_count: 20,
      handled_cases: Math.floor(Math.random() * 200),
      is_available: true,
      last_location: { type: 'Point', coordinates: [city.coords[0] + (Math.random() - 0.5) * 0.1, city.coords[1] + (Math.random() - 0.5) * 0.1] }
    });
  }

  // Add 5 Air Rescue Units
  for (let i = 1; i <= 5; i++) {
    const city = cities[i % cities.length];
    responders.push({
      name: `Air Rescue ${i}`,
      email: `air${i}@rescue.in`,
      password: 'RESCUE2024',
      role: 'RESPONDER',
      force_id: `AIR-${i.toString().padStart(3, '0')}`,
      unit_name: `Airborne MedEvac ${i} - ${city.name}`,
      state: 'Punjab',
      vehicle_type: 'HELICOPTER',
      skills: ['Air Rescue', 'Medical Evacuation'],
      personnel_count: 5,
      handled_cases: Math.floor(Math.random() * 30),
      is_available: true,
      last_location: { type: 'Point', coordinates: [city.coords[0] + (Math.random() - 0.5) * 0.1, city.coords[1] + (Math.random() - 0.5) * 0.1] }
    });
  }

  for (const u of [...baseUsers, ...responders]) {
    await User.create(u);
  }
  console.log('Seed data: Expanded responder units created.');
};

module.exports = seedUsers;
