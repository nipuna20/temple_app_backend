const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
  async validPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user', // roles: user, admin
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

// Hook to hash password before creating user
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
  }
});

module.exports = User;