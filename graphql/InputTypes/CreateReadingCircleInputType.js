const { GraphQLInputObjectType, GraphQLString } = require("graphql")

const CreateReadingCircleInputType = new GraphQLInputObjectType({
  name: "CreateReadingCircleInput",
  fields: {
    name: { type: GraphQLString },
    description: { type: GraphQLString },
  },
})

module.exports = CreateReadingCircleInputType
