const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  incident_id: {
    type: DataTypes.UUID,
    references: { model: 'incidents', key: 'id' }
  },
  sender_id: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  sender_name: {
    type: DataTypes.STRING(100),
  },
  sender_role: {
    type: DataTypes.STRING(20),
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  channel: {
    type: DataTypes.STRING(50),
    defaultValue: 'GENERAL',
  }
});

module.exports = Message;
