const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  severity: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  people_affected: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  location: {
    type: DataTypes.GEOMETRY('POINT', 4326),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
  },
  state: {
    type: DataTypes.STRING(50),
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'OPEN',
  },
  reporter_id: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  assigned_to: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  assigned_unit: {
    type: DataTypes.STRING(100),
  },
  ai_urgency: {
    type: DataTypes.STRING(10),
  },
  ai_summary: {
    type: DataTypes.TEXT,
  },
  ai_resources: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  eta_minutes: {
    type: DataTypes.INTEGER,
  },
  people_saved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  help_received_early: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  photo_url: {
    type: DataTypes.TEXT,
  }
});

module.exports = Incident;
