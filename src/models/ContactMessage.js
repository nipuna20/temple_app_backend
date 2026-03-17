const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ContactMessage extends Model {}

ContactMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    message: { type: DataTypes.TEXT, allowNull: false },
    responded: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'ContactMessage',
    tableName: 'contact_messages',
  }
);

module.exports = ContactMessage;