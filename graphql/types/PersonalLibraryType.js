const {GraphQLObjectType, GraphQLInt, GraphQLList} = require('graphql');
const {BookType} = require('./BookType');



const PersonalLibraryType= new GraphQLObjectType({
    name: 'PersonalLibraryType',
    fields: {
        nrOfBooks: {type: GraphQLInt},
        books: {
            type: new GraphQLList(BookType),
        }
    },
});



module.exports = {
    PersonalLibraryType,
};
