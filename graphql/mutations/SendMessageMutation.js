const { GraphQLError } = require("graphql")
const SendMessageInput = require("../InputTypes/SendMessageInputType")
const MessageType = require("../types/MessageType")
const db = require("../../models")

const sendMessage = {
    type: MessageType,
    args: { 
        input: { 
            type: SendMessageInput 
        } 
    },
    resolve: async (_, { input }, { user }) => {
        if (!user) throw new GraphQLError("UNAUTHENTICATED")

        const content = input.content.trim()
        if (content.length === 0) throw new GraphQLError("Message is empty")
        if (content.length > 2000) throw new GraphQLError("Message too long")

        // user must be accepted member of this circle
        const member = await db.CircleMember.findOne({
        where: {
            userId: user.id,
            circleId: input.circleId,
            status: "accepted",
        },
        })
        if (!member) throw new GraphQLError("FORBIDDEN: not a member")

        const chat = await db.Chat.findOne({ where: { circleId: input.circleId } })
        if (!chat) throw new GraphQLError("Chat not found for this circle")

        const msg = await db.Message.create({
            chatId: chat.id,
            memberId: member.id,
            content,
        })

        return msg
    },
}

module.exports = sendMessage
