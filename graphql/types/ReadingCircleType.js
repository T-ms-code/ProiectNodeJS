const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} = require("graphql")
const UserType = require("./UserType")
const CircleMemberType = require("./CircleMemberType")

const ReadingCircleType = new GraphQLObjectType({
  name: "ReadingCircle",
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    owner: {
      type: UserType,
      resolve: async (circle, _, { db }) => {
        return db.User.findByPk(circle.ownerId)
      },
    },
    members: {
      type: new GraphQLList(CircleMemberType),
      resolve: async (circle, _, { db }) => {
        return db.CircleMember.findAll({
          where: { circleId: circle.id },
          include: [{ model: db.User, as: "user" }],
        })
      },
    },
  }),
})

module.exports = ReadingCircleType
