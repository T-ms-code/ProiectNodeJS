const { GraphQLInputObjectType, GraphQLString  } = require("graphql");


const LoginCredentialsInputType = new GraphQLInputObjectType({
    name: 'LoginCredentialsInputType',
    fields: {
        name: {
            type: GraphQLString,
        },
        password: {
            type: GraphQLString
        },
    }
})


module.exports = LoginCredentialsInputType;