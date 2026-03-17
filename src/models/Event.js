const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Event extends Model {}

Event.init(
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
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    agenda: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    /**
     * Indicates whether the event is currently live streaming.  This boolean field
     * is toggled by the admin through the start/stop live endpoints defined in
     * the streamRoutes.  Defaults to false so newly created events are not
     * considered live until explicitly started.
     */
    isLive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    /**
     * Optional embed URL for an external live stream (e.g. YouTube iframe). When
     * provided, the frontend will display this iframe for viewers who have
     * access to the event.  Admins can update this value via the
     * /api/streams/:eventId/url endpoint exposed in streamRoutes.js.
     */
    streamUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
  }
);

module.exports = Event;