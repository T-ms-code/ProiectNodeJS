const {
    GraphQLObjectType,
} = require ('graphql');
const PersonalLibrary = require('../queries/PersonalLibraryQuery');
const bookQuery = require('../queries/BookQuery');
const pendingRequests = require('../queries/PendingRequests');


const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        personalLibrary: PersonalLibrary,
        book: bookQuery,
        pendingRequests: pendingRequests,
    },
});



module.exports = QueryType;