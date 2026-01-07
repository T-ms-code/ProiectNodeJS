const { GraphQLError } = require("graphql")
const UpdateMessageInputType = require("../InputTypes/UpdateMessageInputType")
const db = require("../../models")

const updateMessage = {
  type: require("../types/MessageType"),
  args: { input: { type: UpdateMessageInputType } },
  resolve: async (_, { input }, { user }) => {
    if (!user) throw new GraphQLError("UNAUTHENTICATED")

    const msg = await db.Message.findByPk(input.messageId)
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

    if (!isAuthor && !isAdmin) throw new GraphQLError("FORBIDDEN")

    const patch = {}
    if (typeof input.content === "string") {
      const content = input.content.trim()
      if (content.length === 0) throw new GraphQLError("Message is empty")
      if (content.length > 2000) throw new GraphQLError("Message too long")
      patch.content = content
    }

    if (Object.keys(patch).length === 0) return msg

    await msg.update(patch)
    return msg
  },
}

module.exports = updateMessage
