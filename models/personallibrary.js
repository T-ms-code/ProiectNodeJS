'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PersonalLibrary extends Model {
    static associate(models) {
      // define association here
    }
  }
  PersonalLibrary.init({
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bookId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'to-read'
      },
    currentPage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true//default
      },
    visibility: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'private'
      }
  }, {
    sequelize,
    modelName: 'PersonalLibrary',
  });
  return PersonalLibrary;
};