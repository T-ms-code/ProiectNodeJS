// ...existing code...
const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require("graphql")

const RespondJoinInputType = new GraphQLInputObjectType({
  name: "RespondJoinInput",
  fields: {
    requestId: { type: GraphQLInt },
    action: { type: GraphQLString }, // "accept" | "reject"
  },
})

module.exports = RespondJoinInputType
// ...existing code...
