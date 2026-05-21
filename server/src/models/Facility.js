const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Facility = sequelize.define('Facility', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: false, // NDRF/HOSPITAL/FIRE/POLICE
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  lat: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
  },
  lng: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING(30),
  },
  personnel: {
    type: DataTypes.INTEGER,
    defaultValue: 8,
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  vehicle_type: {
    type: DataTypes.STRING(100),
  }
});

module.exports = Facility;
