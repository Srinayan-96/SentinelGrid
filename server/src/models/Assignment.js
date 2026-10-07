// ═══════════════════════════════════════════════════
// Assignment Model — Full Audit Trail
// ═══════════════════════════════════════════════════
//
// Every time a responder is assigned to an incident
// (whether by admin or self-claim), an Assignment record
// is created. This provides a complete history of who
// was assigned, when they accepted, arrived, and resolved.
//
// Enables analytics:
// - Average response time (assigned_at → arrived_at)
// - Average resolution time (arrived_at → resolved_at)
// - Resources used per incident
// ═══════════════════════════════════════════════════

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Assignment = sequelize.define('assignments', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  incident_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'incidents', key: 'id' },
  },

  responder_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },

  force_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Force unit at time of assignment',
  },

  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Responder acknowledged the assignment',
  },

  arrived_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Responder physically arrived at scene',
  },

  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Mission completed',
  },

  people_saved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  resources_used: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: [],
  },

  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Responder notes on the mission',
  },

  status: {
    type: DataTypes.STRING(15),
    defaultValue: 'ASSIGNED',
    validate: {
      isIn: {
        args: [['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED', 'CANCELLED']],
        msg: 'Invalid assignment status',
      },
    },
  },
}, {
  timestamps: true,
  underscored: true,
  tableName: 'assignments',
  indexes: [
    { fields: ['incident_id'] },
    { fields: ['responder_id'] },
    { fields: ['status'] },
  ],
});

module.exports = Assignment;
