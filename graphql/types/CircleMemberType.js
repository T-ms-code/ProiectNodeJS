const { GraphQLObjectType, GraphQLInt, GraphQLString } = require("graphql")
const UserType = require("./UserType")

const CircleMemberType = new GraphQLObjectType({
  name: "CircleMember",
  fields: () => ({
    id: { type: GraphQLInt },
    user: {
      type: UserType,
      resolve: async (member, _, { db }) => {
        return db.User.findByPk(member.userId)
      },
    },
    circleId: { type: GraphQLInt },
    role: { type: GraphQLString, resolve: (m) => m.circleRole },
    status: { type: GraphQLString },
    requestedAt: { type: GraphQLString },
    respondedAt: { type: GraphQLString },
  }),
})

module.exports = CircleMemberType
