const {GraphQLEnumType} = require('graphql');

const AssignableReadingCircleRole = new GraphQLEnumType({
    name: "AssignableReadingCircleRole",
    values: {
        COORDINATOR: { value: "coordinator" },
        MEMBER: { value: "member"},
    }
});

module.exports = AssignableReadingCircleRole;