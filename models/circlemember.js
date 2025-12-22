'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CircleMember extends Model {
    static associate(models) {
      // define association here
      CircleMember.hasMany(models.Message, { 
        foreignKey: 'memberId' ,
        as: 'messages'
      });
    }
  }
  CircleMember.init({
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    circleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    circleRole: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'member'
      }
  }, {
    sequelize,
    modelName: 'CircleMember',
  });
  return CircleMember;
};