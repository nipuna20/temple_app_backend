require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create Sequelize instance configured for Postgres
const sequelize = new Sequelize(
  process.env.DB_NAME || 'temple_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      // optional SSL configuration
      ssl: process.env.DB_SSL === 'true'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  }
);

module.exports = sequelize;