'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.Book, {
        through: models.PersonalLibrary,
        foreignKey: 'userId',
        otherKey: 'bookId',
        as: 'books'//for accessing user's books
      });
      User.hasMany(models.Notification, {
        foreignKey: 'userId',
        as: 'notifications'
      });
      User.belongsToMany(models.ReadingCircle, {
        through: models.CircleMember,
        foreignKey: 'userId',
        otherKey: 'circleId',
        as: 'readingCircles'
      });
    }
  }
  User.init({
    name: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    age: DataTypes.INTEGER,
    country: DataTypes.STRING,
    bio: DataTypes.TEXT,
    role: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};