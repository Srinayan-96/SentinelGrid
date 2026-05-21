// ═══════════════════════════════════════════════════
// Rating Model — Citizen Rates Responder
// ═══════════════════════════════════════════════════
//
// After an incident is RESOLVED, the citizen who filed
// the report can rate the assigned responder (1-5 stars).
// The user.rating field is recalculated as the average
// of all ratings for that responder.
// ═══════════════════════════════════════════════════

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rating = sequelize.define('ratings', {
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

  rater_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'Citizen who submitted the rating',
  },

  responder_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'Responder being rated',
  },

  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Score must be at least 1' },
      max: { args: [5], msg: 'Score must be at most 5' },
    },
  },

  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  underscored: true,
  tableName: 'ratings',
  updatedAt: false,  // Ratings are immutable
  indexes: [
    { fields: ['incident_id'] },
    { fields: ['rater_id'] },
    { fields: ['responder_id'] },
    // Prevent duplicate ratings: one citizen can rate once per incident
    {
      fields: ['incident_id', 'rater_id'],
      unique: true,
      name: 'idx_unique_rating_per_incident',
    },
  ],
});

module.exports = Rating;
