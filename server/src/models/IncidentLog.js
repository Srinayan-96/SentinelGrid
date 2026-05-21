// ═══════════════════════════════════════════════════
// IncidentLog Model — Status Change Audit Trail
// ═══════════════════════════════════════════════════
//
// Every status change on an incident writes a row here.
// This is the data source for the "timeline" view on
// the incident detail panel.
//
// Actions tracked:
// CREATED, ASSIGNED, ACCEPTED, ARRIVED, ESCALATED,
// RESOLVED, FALSE_ALARM, STATUS_CHANGE, NOTE_ADDED
//
// The `metadata` JSONB field stores action-specific data
// (e.g., for ASSIGNED: { responder_name, force_id })
// ═══════════════════════════════════════════════════

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IncidentLog = sequelize.define('incident_logs', {
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

  actor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'User who performed the action (null = system)',
  },

  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'CREATED, ASSIGNED, ARRIVED, RESOLVED, ESCALATED, etc.',
  },

  old_status: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },

  new_status: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },

  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Human-readable description of what happened',
  },

  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Action-specific structured data',
  },
}, {
  timestamps: true,
  underscored: true,
  tableName: 'incident_logs',
  // Only createdAt — logs are immutable, never updated
  updatedAt: false,
  indexes: [
    { fields: ['incident_id'] },
    { fields: ['actor_id'] },
    { fields: ['action'] },
    { fields: ['created_at'] },
  ],
});

module.exports = IncidentLog;
