const { GraphQLError, GraphQLBoolean, GraphQLInt, GraphQLNonNull } = require("graphql")
const db = require("../../models")

const deleteMessage = {
  type: GraphQLBoolean,
  args: {
    messageId: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (_, { messageId }, { user }) => {
    if (!user) throw new GraphQLError("UNAUTHENTICATED")

    const msg = await db.Message.findByPk(messageId)
    if (!msg) throw new GraphQLError("Message not found")

    const member = await db.CircleMember.findByPk(msg.memberId)
    if (!member) throw new GraphQLError("Invalid message author")

    const chat = await db.Chat.findByPk(msg.chatId)
    if (!chat) throw new GraphQLError("Chat not found")

    const isAuthor = member.userId === user.id

    const myMember = await db.CircleMember.findOne({
      where: {
        userId: user.id,
        circleId: chat.circleId,
        status: "accepted",
      },
    })
    const isAdmin = myMember?.circleRole === "admin"
    const isModerator = myMember?.circleRole === "moderator"

    if (!isAuthor && !isAdmin && !isModerator) throw new GraphQLError("FORBIDDEN")

    await msg.destroy()
    return true
  },
}

module.exports = deleteMessage
