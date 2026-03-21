const sequelize = require('../config/database');

const User = require('./User');
const Event = require('./Event');
const EventRegistration = require('./EventRegistration');
const Donation = require('./Donation');
const BlogPost = require('./BlogPost');
const CommunityPost = require('./CommunityPost');
const Publication = require('./Publication');
const Content = require('./Content');
const DanaBooking = require('./DanaBooking');
const MonthlyDonation = require('./MonthlyDonation');
const ContactMessage = require('./ContactMessage');
const ChatMessage = require('./ChatMessage');
const Notification = require('./Notification');
const PoyaCalendar = require("./PoyaCalendar");

// Associations
Event.hasMany(EventRegistration, { foreignKey: 'eventId', onDelete: 'CASCADE' });
EventRegistration.belongsTo(Event, { foreignKey: 'eventId' });

User.hasMany(Donation, { foreignKey: 'userId' });
Donation.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(EventRegistration, { foreignKey: 'userId' });
EventRegistration.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(MonthlyDonation, { foreignKey: 'userId' });
MonthlyDonation.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ChatMessage, { foreignKey: 'userId' });
ChatMessage.belongsTo(User, { foreignKey: 'userId' });

Event.hasMany(ChatMessage, { foreignKey: 'eventId' });
ChatMessage.belongsTo(Event, { foreignKey: 'eventId' });

// Dana booking owner and requester associations
User.hasMany(DanaBooking, { foreignKey: 'userId', as: 'ownedDanaBookings' });
DanaBooking.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DanaBooking, { foreignKey: 'requestUserId', as: 'requestedDanaBookings' });
DanaBooking.belongsTo(User, { foreignKey: 'requestUserId', as: 'requestUser' });

// Notifications
// User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Notification.belongsTo(User, { foreignKey: 'userId' });

// Notification.belongsTo(DanaBooking, { foreignKey: 'bookingId' });
// DanaBooking.hasMany(Notification, { foreignKey: 'bookingId' });

Event.hasMany(EventRegistration, { foreignKey: "eventId", onDelete: "CASCADE" });
EventRegistration.belongsTo(Event, { foreignKey: "eventId" });

User.hasMany(EventRegistration, { foreignKey: "userId" });
EventRegistration.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Notification, { foreignKey: "userId", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "userId" });

DanaBooking.hasMany(Notification, { foreignKey: "bookingId", onDelete: "CASCADE" });
Notification.belongsTo(DanaBooking, { foreignKey: "bookingId" });

const initDb = async () => {
  await sequelize.sync({ alter: true });
};

module.exports = {
  sequelize,
  initDb,
  User,
  Event,
  EventRegistration,
  Donation,
  BlogPost,
  CommunityPost,
  Publication,
  Content,
  DanaBooking,
  MonthlyDonation,
  ContactMessage,
  ChatMessage,
  Notification,
  PoyaCalendar,
};
