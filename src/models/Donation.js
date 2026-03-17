const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Donation extends Model {}

Donation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('individual', 'corporate', 'anonymous'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'paid',
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Donation',
    tableName: 'donations',
  }
);

module.exports = Donation;