const sequelize = require('./config/database');
const User = require('./models/User');
const Facility = require('./models/Facility');
const Incident = require('./models/Incident');

const seedUsers = require('./seeds/users');
const seedFacilities = require('./seeds/facilities');

async function runSeed() {
  try {
    console.log('🔄 Starting Tactical Seeding...');
    
    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized (FORCE)');

    // Seed Users (Responders & Admins)
    await seedUsers(User);
    
    // Seed Facilities
    await seedFacilities(Facility);

    // Create a few default Punjab Incidents for the Command Center to show
    await Incident.create({
      type: 'FLOOD',
      severity: 'HIGH',
      title: 'Ludhiana Flash Flood',
      description: 'Water logging in low lying areas near Sutlej. Multiple families need evacuation.',
      people_affected: 25,
      location: { type: 'Point', coordinates: [75.8573, 30.9010] },
      state: 'Punjab',
      ai_urgency: 'HIGH',
      ai_summary: 'Urban flooding incident. Sutlej river overflow affecting residential blocks.',
      ai_resources: ['Rescue Boat', 'Medical Van']
    });

    await Incident.create({
      type: 'ACCIDENT',
      severity: 'MEDIUM',
      title: 'Amritsar Highway Pileup',
      description: 'Multi-vehicle collision on NH-1. 3 persons trapped in wreckage.',
      people_affected: 5,
      location: { type: 'Point', coordinates: [74.8723, 31.6340] },
      state: 'Punjab',
      ai_urgency: 'MODERATE',
      ai_summary: 'Major road traffic accident. Extraction required for trapped passengers.',
      ai_resources: ['Hydraulic Cutter', 'Ambulance']
    });

    console.log('🚀 Tactical Seeding Complete! Punjab Taskforce Deployed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
