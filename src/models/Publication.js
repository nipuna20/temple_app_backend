const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Publication extends Model {}

Publication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('pdf', 'video'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Publication',
    tableName: 'publications',
  }
);

module.exports = Publication;