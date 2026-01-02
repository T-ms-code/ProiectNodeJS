const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require("graphql");

const UpdateReadingCircleInputType = new GraphQLInputObjectType({
    name: "UpdateReadingCircleInput",
    fields: {
        id: { type: GraphQLInt },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
    },
});

module.exports = UpdateReadingCircleInputType;