const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('CITIZEN', 'COMMAND', 'RESPONDER', 'ADMIN'),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  force_id: {
    type: DataTypes.STRING(50),
  },
  unit_name: {
    type: DataTypes.STRING(100),
  },
  state: {
    type: DataTypes.STRING(50),
  },
  vehicle_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'RESCUE_VAN',
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['General Rescue'],
  },
  handled_cases: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_location: {
    type: DataTypes.GEOMETRY('POINT', 4326),
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toSafeJSON = function () {
  const json = this.toJSON ? this.toJSON() : { ...this };
  delete json.password;
  return {
    id: json.id,
    name: json.name,
    email: json.email,
    role: json.role,
    phone: json.phone,
    force_id: json.force_id,
    unit_name: json.unit_name,
    state: json.state,
    vehicle_type: json.vehicle_type,
    skills: json.skills,
    handled_cases: json.handled_cases,
    last_location: json.last_location,
    location: json.last_location, // Frontend convenience
    is_available: json.is_available,
  };
};

module.exports = User;
