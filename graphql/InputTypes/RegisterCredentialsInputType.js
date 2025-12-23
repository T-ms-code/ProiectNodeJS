const e = require("express");
const { GraphQLInputObjectType, GraphQLString, GraphQLInt  } = require("graphql");


const RegisterCredentialsInputType = new GraphQLInputObjectType({
    name: 'RegisterCredentialsInputType',
    fields: {
        name: {
            type: GraphQLString,
        },
        password: {
            type: GraphQLString
        },
        email: {
            type: GraphQLString
        },
        age: {
            type: GraphQLInt
        },
        country: {
            type: GraphQLString
        },
        bio: {
            type: GraphQLString
        }
    }
})


module.exports = RegisterCredentialsInputType;