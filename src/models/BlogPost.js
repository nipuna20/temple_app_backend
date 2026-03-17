const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class BlogPost extends Model {}

BlogPost.init(
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
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    authorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    authorImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      defaultValue: 'draft',
    },
  },
  {
    sequelize,
    modelName: 'BlogPost',
    tableName: 'blog_posts',
  }
);

module.exports = BlogPost;