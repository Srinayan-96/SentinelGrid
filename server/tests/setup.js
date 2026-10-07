// Removed express-async-handler mock
jest.mock('../src/config/database', () => {
  return {
    transaction: jest.fn(async (callback) => {
      const t = { LOCK: { UPDATE: 'UPDATE' } };
      return await callback(t);
    })
  };
});

jest.mock('../src/models/Incident', () => {
  return {
    findByPk: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn()
  };
});

jest.mock('../src/models/User', () => {
  return {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  };
});

jest.mock('../src/models/Assignment', () => {
  return {
    create: jest.fn(),
    update: jest.fn()
  };
});

jest.mock('../src/models/Facility', () => {
  return {
    update: jest.fn()
  };
});

jest.mock('../src/services/incidentService', () => ({
  enrichIncidentsList: jest.fn((incidents) => incidents),
}));

jest.mock('../src/socket/gateway', () => ({
  getIo: jest.fn(() => ({
    emit: jest.fn(),
  })),
}));

jest.mock('../src/services/triage', () => ({
  triageIncident: jest.fn()
}));
