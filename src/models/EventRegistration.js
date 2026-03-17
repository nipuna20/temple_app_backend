const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class EventRegistration extends Model { }

EventRegistration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },

    telephone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    additionalInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },

    paymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'EventRegistration',
    tableName: 'event_registrations',
  }
);

module.exports = EventRegistration;