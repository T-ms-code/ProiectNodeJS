'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      // define association here
      Message.belongsTo(models.Chat, {
        foreignKey: 'chatId',
        as: 'chat'
      });
      Message.belongsTo(models.CircleMember, {
        foreignKey: 'memberId',
        as: 'member'
      });
    }
  }
  Message.init({
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    memberId:{ 
      type: DataTypes.INTEGER,
      allowNull: true//If a member is deleted, we keep his messages but set memberId to null
    },
    content: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Message',
  });
  return Message;
};