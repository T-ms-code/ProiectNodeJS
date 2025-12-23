const {GraphQLObjectType, GraphQLString, GraphQLInt} = require('graphql');


const BookType = new GraphQLObjectType({
    name: 'BookType',
    fields: {
        id: {type: GraphQLInt},
        title: {type: GraphQLString},
        author: {type: GraphQLString},
    },
});


module.exports = {
    BookType,
};
