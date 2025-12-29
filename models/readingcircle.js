"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class ReadingCircle extends Model {
    static associate(models) {
      ReadingCircle.belongsTo(models.User, {
        as: "owner",
        foreignKey: "ownerId",
      })

      ReadingCircle.hasMany(models.CircleMember, {
        as: "memberRecords",
        foreignKey: "circleId",
      })

      ReadingCircle.belongsToMany(models.User, {
        through: models.CircleMember,
        as: "members",
        foreignKey: "circleId",
        otherKey: "userId",
      })
    }
  }

  ReadingCircle.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      ownerId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "ReadingCircle",
    }
  )

  return ReadingCircle
}
