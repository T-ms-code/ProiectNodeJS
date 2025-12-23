const {GraphQLInputObjectType, GraphQLString} = require('graphql');


const BookCharacteristicsInputType = new GraphQLInputObjectType({
    name: 'BookCharacteristicsInputType',
    fields: {
        title: {type: GraphQLString},
        author: {type: GraphQLString},
    },
});


module.exports = {
    BookCharacteristicsInputType
};
