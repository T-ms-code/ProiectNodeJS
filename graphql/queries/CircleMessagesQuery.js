const { GraphQLError, GraphQLInt, GraphQLNonNull, GraphQLList } = require("graphql")
const MessageType = require("../types/MessageType")
const db = require("../../models")

const circleMessages = {
  type: new GraphQLList(MessageType),
  args: {
    circleId: { type: new GraphQLNonNull(GraphQLInt) },
    page: { type: GraphQLInt },
    pageSize: { type: GraphQLInt },
  },
  resolve: async (_, { circleId, page = 1, pageSize = 20 }, { user }) => {
    if (!user) throw new GraphQLError("UNAUTHENTICATED")

    // only members can read
    const member = await db.CircleMember.findOne({
      where: { userId: user.id, circleId, status: "accepted" },
    })
    if (!member) throw new GraphQLError("FORBIDDEN: not a member")

    const chat = await db.Chat.findOne({ where: { circleId } })
    if (!chat) return []

    const limit = Math.min(Math.max(pageSize, 1), 50)
    const offset = (Math.max(page, 1) - 1) * limit

    return db.Message.findAll({
      where: { chatId: chat.id },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: db.CircleMember,
          as: "member",
          include: [{ model: db.User, as: "user" }],
        },
      ],
    })
  },
}

module.exports = circleMessages
