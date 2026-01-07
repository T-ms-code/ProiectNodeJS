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

    const myMember = await db.CircleMember.findOne({
      where: {
        userId: user.id,
        circleId: chat.circleId,
        status: "accepted",
      },
    })
    
    const isAuthor = member.userId === user.id

    const requesterRole = myMember?.circleRole
    const authorRole = member.circleRole

    const isAdmin = requesterRole === "admin"
    const isModerator = requesterRole === "moderator"

    // - the author can delete
    // - the admin can delete any message
    // - the moderator can delete only non-admin messages

    const canDelete =
      isAuthor ||
      isAdmin ||
      (isModerator && authorRole !== "admin")

    if (!canDelete) throw new GraphQLError("FORBIDDEN")

    await msg.destroy()
    return true
  },
}

module.exports = deleteMessage
