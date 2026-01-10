const { GraphQLString, GraphQLInt, GraphQLError } = require("graphql");
const db = require('../../models');
const { isCircleAdmin } = require('../../services/ReadingCircleService');

const dissolveReadingCircleMutation = {
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

        const isAdmin = await isCircleAdmin(user.id, circleId);
        if (!isAdmin) throw new GraphQLError("FORBIDDEN");

        await db.sequelize.query('PRAGMA foreign_keys = OFF');

        try {
            await db.CircleMember.destroy({ where: { circleId } });
            
            await db.ReadingCircle.destroy({ where: { id: circleId } });

        } catch (error) {
            throw error;
        } finally {
            await db.sequelize.query('PRAGMA foreign_keys = ON');
        }

        return `Reading circle with id ${circleId} has been dissolved.`;
        }
}

module.exports = dissolveReadingCircleMutation;