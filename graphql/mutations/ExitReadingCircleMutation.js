const { GraphQLString, GraphQLInt, GraphQLError } = require("graphql");
const db = require('../../models');
const { isCircleAdmin } = require('../../services/ReadingCircleService');

const exitReadingCircleMutation = {
    type: GraphQLString,
    args: {
        circleId: {
            type: GraphQLInt
        }
    },
    resolve: async (_, {circleId}, {user}) => {
    
        if (!user) throw new GraphQLError("UNAUTHENTICATED");

        const circle = await db.ReadingCircle.findByPk(circleId);
        if (!circle) throw new GraphQLError("CIRCLE_NOT_FOUND");

        const member = await db.CircleMember.findOne({where: {circleId, userId: user.id}});
        if (!member) throw new GraphQLError("FORBIDDEN");

        const isAdmin = await isCircleAdmin(user.id, circleId);
        if (isAdmin) throw new GraphQLError("You cannot exit the reading circle because you are the ADMIN! But you can dissolve the reading circle.");

        await db.CircleMember.destroy({where: {id: member.id}});

        return `You have exited the reading circle with id ${circleId}.`;
    }
}

module.exports = exitReadingCircleMutation;