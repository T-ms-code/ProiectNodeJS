const { GraphQLError, GraphQLInt } = require("graphql")
const ReadingCircleType = require("../types/ReadingCircleType")
const db = require("../../models")

const circleDetails = {
  type: ReadingCircleType,
  args: { id: { type: GraphQLInt } },
  resolve: async (_, { id }, { user }) => {
    // optional: allow public view or require auth -> adjust as needed
    const circle = await db.ReadingCircle.findByPk(id)
    if (!circle) throw new GraphQLError("CIRCLE_NOT_FOUND")
    return circle
  },
}

module.exports = circleDetails
