const { GraphQLError, GraphQLList, GraphQLInt } = require("graphql")
const CircleMemberType = require("../types/CircleMemberType")
const db = require("../../models")
const { isCircleAdmin } = require("../../services/ReadingCircleService")

const pendingRequests = {
  type: new GraphQLList(CircleMemberType),
  args: { circleId: { type: GraphQLInt } },
  resolve: async (_, { circleId }, { user }) => {
    if (!user) throw new GraphQLError("UNAUTHENTICATED")
    const allowed = await isCircleAdmin(user.id, circleId)
    if (!allowed) throw new GraphQLError("FORBIDDEN")
    return db.CircleMember.findAll({
      where: { circleId, status: "pending" },
      include: [{ model: db.User, as: "user" }],
    })
  },
}

module.exports = pendingRequests
