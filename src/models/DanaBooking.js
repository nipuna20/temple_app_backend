const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class DanaBooking extends Model { }

DanaBooking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    mealType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurrenceType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // admin booking status
    status: {
      type: DataTypes.ENUM("pending", "approved", "declined"),
      allowNull: false,
      defaultValue: "pending",
    },

    // request flow
    requestStatus: {
      type: DataTypes.ENUM("none", "pending"),
      allowNull: false,
      defaultValue: "none",
    },
    requestMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    requestUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    // current owner details
    ownerAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ownerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // pending requester details
    requestAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requestPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "DanaBooking",
    tableName: "dana_bookings",
  }
);

module.exports = DanaBooking;