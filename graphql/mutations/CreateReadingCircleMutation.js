const CreateReadingCircleInput = require("../InputTypes/CreateReadingCircleInputType")
const ReadingCircleType = require("../types/ReadingCircleType")
const { GraphQLError } = require("graphql")
const db = require("../../models")

const createReadingCircle = {
  type: ReadingCircleType,
  args: { input: { type: CreateReadingCircleInput } },
  resolve: async (_, { input }, { user }) => {
    if (!user) throw new GraphQLError("UNAUTHENTICATED")
    return db.sequelize.transaction(async (t) => {
      const circle = await db.ReadingCircle.create(
        {
          name: input.name,
          description: input.description,
          ownerId: user.id,
        },
        { transaction: t }
      )

      await db.CircleMember.create(
        {
          userId: user.id,
          circleId: circle.id,
          circleRole: "admin",
          status: "accepted",
          requestedAt: new Date(),
          respondedAt: new Date(),
        },
        { transaction: t }
      )

      return circle
    })
  },
}

module.exports = createReadingCircle
