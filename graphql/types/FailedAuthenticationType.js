const { GraphQLObjectType, GraphQLString } = require("graphql");


const FailedAuthenticationType = new GraphQLObjectType(
    {
        name: "FailedAuthenticationType",
        fields: {
            reason:{
                type: GraphQLString,
            }
        },
    }
);


module.exports = FailedAuthenticationType;