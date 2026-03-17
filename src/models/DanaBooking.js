const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DanaBooking extends Model {}

DanaBooking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurrenceType: {
      type: DataTypes.ENUM('daily', 'monthly', 'annually'),
      allowNull: true,
    },
    // Current owner of the booking slot.
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Booking approval status for admin review.
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'declined'),
      defaultValue: 'pending',
    },
    mealType: {
      type: DataTypes.ENUM('breakfast', 'lunch'),
      allowNull: false,
    },
    // Request flow: do NOT create a second booking row. Instead, store the
    // requesting user directly on the original booking.
    requestUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    requestStatus: {
      type: DataTypes.ENUM('none', 'pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'none',
    },
    requestMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'DanaBooking',
    tableName: 'dana_bookings',
  }
);

module.exports = DanaBooking;
