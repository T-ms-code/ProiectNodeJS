const RequestJoinInput = require("../InputTypes/RequestJoinInputType")
const CircleMemberType = require("../types/CircleMemberType")
const { GraphQLError } = require("graphql")
const db = require("../../models")
const {
  notAlreadyMemberOrPending,
} = require("../../services/ReadingCircleService")

const requestJoinCircle = {
  type: CircleMemberType,
  args: { input: { type: RequestJoinInput } },
  resolve: async (_, { input }, { user }) => {
    if (!user) throw new GraphQLError("UNAUTHENTICATED")

    const circle = await db.ReadingCircle.findByPk(input.circleId)
    if (!circle) throw new GraphQLError("CIRCLE_NOT_FOUND")

    const exists = await notAlreadyMemberOrPending(user.id, input.circleId)
    if (exists) throw new GraphQLError("ALREADY_MEMBER_OR_PENDING")

    const membership = await db.CircleMember.create({
      userId: user.id,
      circleId: input.circleId,
      circleRole: "member",
      status: "pending",
      requestedAt: new Date(),
    })

    return membership
  },
}

module.exports = requestJoinCircle
