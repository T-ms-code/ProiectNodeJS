const {BookType} = require('./BookType');
const { GraphQLObjectType, GraphQLInt, GraphQLString} = require('graphql');


const BookWithPersonalDataType = new GraphQLObjectType({
    name: 'BookWithPersonalDataType',
    fields: {
        book: {type: BookType},
        status: { type: GraphQLString },
        currentPage: { type: GraphQLInt },
        rating: { type: GraphQLInt },
        visibility: { type: GraphQLString }
    }
});


module.exports = BookWithPersonalDataType;