const {GraphQLList, GraphQLError, GraphQLInt} = require("graphql")
const CircleMemberType = require("../types/CircleMemberType")
const db = require("../../models")
const { isReadingCircleMember } = require("../../services/ReadingCircleService")

const readingCircleMembers = {
    type: new GraphQLList(CircleMemberType),
    args: {circleId: {type: GraphQLInt}},
    resolve: async (_, {circleId}, {user}) =>{
        if (!user) throw new GraphQLError("UNAUTHENTICATED")

        const isMember = await isReadingCircleMember(user.id, circleId)
        if (!isMember) throw new GraphQLError("FORBIDDEN")

        return db.CircleMember.findAll(
            {
                where: {
                    circleId,
                    status: "accepted",
                },
            }
        );
    }
}

module.exports = readingCircleMembers