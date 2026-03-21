const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class PoyaCalendar extends Model { }

PoyaCalendar.init(
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
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "PoyaCalendar",
        tableName: "poya_calendar",
    }
);

module.exports = PoyaCalendar;