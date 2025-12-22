const express = require('express');
const app = express();
const port = 3009;
const {createHandler} = require('graphql-http/lib/use/http');
const {
    GraphQLSchema,
} = require ('graphql');
// const QueryType = require('./graphql/rootType/QueryType');
// const MutationType = require('./graphql/rootType/MutationType');
// const jwtMiddleware = require("./middlewares/Jwtmiddleware");


app.get('/',(req,res)=>{
    res.send('Hello, hello!');
});

const schema = new GraphQLSchema({
    // query: QueryType,
    // mutation: MutationType,
});

const graphqlHandler = createHandler({
    schema,
    context:(request)=>{
        return {
            user: request.raw.userData,
        }
    }
});

app.post('/graphql', graphqlHandler);

module.exports = {
    app,
    port,
}

