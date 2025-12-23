const {
    GraphQLObjectType,
} = require ('graphql');
const PersonalLibrary = require('../queries/PersonalLibraryQuery');
const bookQuery = require('../queries/BookQuery');


const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        personalLibrary: PersonalLibrary,
        book: bookQuery,
    },
});



module.exports = QueryType;