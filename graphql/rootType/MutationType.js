const {
    GraphQLObjectType,
} = require ('graphql');
const login = require('../mutations/LoginMutation');
const register = require('../mutations/RegisterMutation');
const createBook = require('../mutations/CreateBookMutation');
const updateBook = require('../mutations/UpdateBookMutation');
const deleteBook = require('../mutations/DeleteBookFromPersonalLibraryMutation');

const MutationType = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        login,
        register,
        createBook,
        updateBook,
        deleteBook
    }
});


module.exports = MutationType;