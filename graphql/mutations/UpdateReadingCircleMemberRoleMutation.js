const {GraphQLInt, GraphQLError} = require("graphql");
const ReadingCircleRole = require("../types/AssignableReadingCircleRole");
const { isCircleAdmin } = require('../../services/ReadingCircleService');
const db = require("../../models");
const CircleMemberType = require("../types/CircleMemberType");

const updateReadingCircleMemberRole = {
    type: CircleMemberType,
    args: {
        memberId:{
            type: GraphQLInt
        },
        role:{
            type: ReadingCircleRole
        }
    },
    resolve: async(_, {memberId, role}, {user}) => {

        if (!user) throw new GraphQLError("UNAUTHENTICATED");
    
        const member = await db.CircleMember.findByPk(memberId);
        if (!member) throw new GraphQLError("MEMBER_NOT_FOUND");

        const isAdmin = await isCircleAdmin(user.id, member.circleId);
        if (!isAdmin) throw new GraphQLError("FORBIDDEN");

        if(member.userId === user.id) throw new GraphQLError("Cannot change your role. You are the ADMIN!");

        member.circleRole = role;
        await member.save();

        return member;
    }
}

module.exports = updateReadingCircleMemberRole;