const express = require('express');
const app = express();
const port = 3009;
const {createHandler} = require('graphql-http/lib/use/http');
const {
    GraphQLSchema,
} = require ('graphql');
const QueryType = require('./graphql/rootType/QueryType');
const MutationType = require('./graphql/rootType/MutationType');
const jwtMiddleware = require("./middlewares/JwtMiddleware");


app.get('/',(req,res)=>{
    res.send('Hello, hello!');
});

const schema = new GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
});

const graphqlHandler = createHandler({
    schema,
    context:(request)=>{
        return {
            user: request.raw.userData,// From JwtMiddleware
        }
    }
});

app.post('/graphql', jwtMiddleware, graphqlHandler);

module.exports = {
    app,
    port,
}

