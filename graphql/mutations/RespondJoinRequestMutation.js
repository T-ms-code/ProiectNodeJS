const RespondJoinInput = require("../InputTypes/RespondJoinInputType")
const CircleMemberType = require("../types/CircleMemberType")
const { GraphQLError } = require("graphql")
const db = require("../../models")
const { isCircleAdmin } = require("../../services/circleService")

const respondJoinRequest = {
  type: CircleMemberType,
  args: { input: { type: RespondJoinInput } },
  resolve: async (_, { input }, { user }) => {
    if (!user) throw new GraphQLError("UNAUTHENTICATED")

    const request = await db.CircleMember.findByPk(input.requestId)
    if (!request) throw new GraphQLError("REQUEST_NOT_FOUND")

    const circleId = request.circleId
    const allowed = await isCircleAdmin(user.id, circleId)
    if (!allowed) throw new GraphQLError("FORBIDDEN")

    if (request.status !== "pending")
      throw new GraphQLError("ALREADY_RESPONDED")

    const action = (input.action || "").toLowerCase()
    if (!["accept", "reject"].includes(action))
      throw new GraphQLError("INVALID_ACTION")

    const updates = {
      status: action === "accept" ? "accepted" : "rejected",
      respondedAt: new Date(),
    }
    if (action === "accept") updates.circleRole = "member"

    await request.update(updates)

    return request
  },
}

module.exports = respondJoinRequest
