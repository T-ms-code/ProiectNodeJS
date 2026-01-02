const {GraphQLEnumType} = require('graphql');

const AssignableReadingCircleRole = new GraphQLEnumType({
    name: "AssignableReadingCircleRole",
    values: {
        MODERATOR: { value: "moderator" },
        MEMBER: { value: "member"},
    }
});

module.exports = AssignableReadingCircleRole;