const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
} = require("graphql")

const CircleMemberType = require("./CircleMemberType")

const MessageType = new GraphQLObjectType({
  name: "Message",
  fields: () => ({
    id: { type: GraphQLInt },
    content: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },

    member: {
      type: CircleMemberType,
      resolve: (message, _, { db }) => {
        return db.CircleMember.findByPk(message.memberId)
      },
    },
  }),
})

module.exports = MessageType
