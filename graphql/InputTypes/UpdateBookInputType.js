const { GraphQLInputObjectType, GraphQLString, GraphQLInt  } = require("graphql");


const UpdateBookInputType = new GraphQLInputObjectType({
    name: 'UpdateBookInputType',
    fields: {
        bookId: {
            type: GraphQLInt
        },
        status: {
            type: GraphQLString
        },
        currentPage: {
            type: GraphQLInt
        },
        rating: {
            type: GraphQLInt
        },
        visibility: {
            type: GraphQLString
        }
    }
})


module.exports = UpdateBookInputType;