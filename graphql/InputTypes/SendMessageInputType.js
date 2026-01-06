const {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLString,
} = require("graphql")

const SendMessageInputType = new GraphQLInputObjectType({
  name: "SendMessageInput",
  fields: {
    circleId: { type: new GraphQLNonNull(GraphQLInt) },
    content: { type: new GraphQLNonNull(GraphQLString) },
  },
})

module.exports = SendMessageInputType
