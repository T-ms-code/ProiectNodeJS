const {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLString,
} = require("graphql")

const UpdateMessageInputType = new GraphQLInputObjectType({
  name: "UpdateMessageInput",
  fields: {
    messageId: { type: new GraphQLNonNull(GraphQLInt) },
    content: { type: GraphQLString },
  },
})

module.exports = UpdateMessageInputType
