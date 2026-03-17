const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Content extends Model {}

Content.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    history: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    leadership: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coreValues: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vision: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mission: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    faq: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    googleMapEmbed: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Content',
    tableName: 'contents',
  }
);

module.exports = Content;