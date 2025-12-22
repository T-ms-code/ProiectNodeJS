'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    static associate(models) {
      // define association here
      Chat.belongsTo(models.ReadingCircle, {
         foreignKey: 'circleId',
         as: 'readingCircle'
        });
      Chat.hasMany(models.Message, { 
        foreignKey: 'chatId' ,
        as: 'messages'
      });
    }
  }
  Chat.init({
    circleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Chat',
  });
  return Chat;
};