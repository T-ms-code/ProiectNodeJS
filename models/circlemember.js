"use strict"
const { Model } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class CircleMember extends Model {
    static associate(models) {
      CircleMember.belongsTo(models.User, { as: "user", foreignKey: "userId" })
      CircleMember.belongsTo(models.ReadingCircle, {
        as: "circle",
        foreignKey: "circleId",
      })
    }
  }

  CircleMember.init(
    {
      userId: DataTypes.INTEGER,
      circleId: DataTypes.INTEGER,
      circleRole: { type: DataTypes.STRING, defaultValue: "member" },
      status: { type: DataTypes.STRING, defaultValue: "pending" },
      requestedAt: DataTypes.DATE,
      respondedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "CircleMember",
    }
  )

  return CircleMember
}
