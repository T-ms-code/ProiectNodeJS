"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class ReadingCircle extends Model {
    static associate(models) {
      // define association here
      ReadingCircle.belongsTo(models.User, {
        as: "admin",
        foreignKey: "adminId",
      })
      ReadingCircle.hasMany(models.User, {
        through: models.CircleMember,
        foreignKey: "circleId",
        otherKey: "userId",
        as: "members",
      })
      ReadingCircle.hasOne(models.Chat, {
        foreignKey: "circleId",
        as: "chat",
      })
    }
  }
  ReadingCircle.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      adminId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ReadingCircle",
    }
  )
  return ReadingCircle
}
