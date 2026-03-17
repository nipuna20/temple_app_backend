const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class MonthlyDonation extends Model {}

MonthlyDonation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'bi-weekly', 'bi-monthly', 'monthly', 'yearly'),
      allowNull: false,
    },
    nextChargeDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'cancelled'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'MonthlyDonation',
    tableName: 'monthly_donations',
  }
);

module.exports = MonthlyDonation;