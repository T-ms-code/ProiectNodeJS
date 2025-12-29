const { GraphQLList, GraphQLError } = require("graphql")
const ReadingCircleType = require("../types/ReadingCircleType")
const db = require("../../models")

const myCircles = {
  type: new GraphQLList(ReadingCircleType),
  resolve: async (_, __, { user }) => {
    if (!user) throw new GraphQLError("UNAUTHENTICATED")
    const memberships = await db.CircleMember.findAll({
      where: { userId: user.id, status: "accepted" },
    })
    const circleIds = memberships.map((m) => m.circleId)
    if (circleIds.length === 0) return []
    return db.ReadingCircle.findAll({ where: { id: circleIds } })
  },
}

module.exports = myCircles
