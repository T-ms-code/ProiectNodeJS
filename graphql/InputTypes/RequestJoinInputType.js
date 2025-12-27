const { GraphQLInputObjectType, GraphQLInt } = require("graphql")

const RequestJoinInputType = new GraphQLInputObjectType({
  name: "RequestJoinInput",
  fields: {
    circleId: { type: GraphQLInt },
  },
})

module.exports = RequestJoinInputType
