const {GraphQLInt, GraphQLError, GraphQLBoolean} = require('graphql');
const db = require('../../models');
const { isCircleAdmin } = require('../../services/ReadingCircleService');

const deleteReadingCircleMember = {
    type: GraphQLBoolean,
    args: {
        memberId: {type: GraphQLInt}
    },
    resolve: async (_, {memberId}, {user}) => {
        if (!user) throw new GraphQLError("UNAUTHENTICATED");
    
        const member = await db.CircleMember.findByPk(memberId);
        if (!member) throw new GraphQLError("MEMBER_NOT_FOUND");

        const isAdmin = await isCircleAdmin(user.id, member.circleId);
        if (!isAdmin) throw new GraphQLError("FORBIDDEN");

        if(member.userId === user.id) throw new GraphQLError("Cannot delete yourself from the circle. You are the ADMIN!");

        const deleted = await db.CircleMember.destroy({where: {id: memberId}});
        return deleted > 0;
    }
}

module.exports = deleteReadingCircleMember;