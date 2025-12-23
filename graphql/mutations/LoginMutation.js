const LoggedInUserType = require("../types/LoggedInUserType");
const FailedAuthenticationType = require("../types/FailedAuthenticationType");
const LoginCredentialsInputType = require("../InputTypes/LoginCredentialsInputType");
const jwt = require("jsonwebtoken");
const {JWT_SECRET_KEY} = require("../../constants");
const { GraphQLUnionType } = require("graphql");
const db = require("../../models");
const bcrypt = require('bcrypt');


const loginMutation = {
    type: new GraphQLUnionType({
        name: "LoginMutationUnion",
        types: [LoggedInUserType, FailedAuthenticationType],
        resolveType: (value)=>{
            if(value.token){
                return "LoggedInUserType";
            }
            return "FailedAuthenticationType";
        },
    }),
    args: {
        input: {
            type: LoginCredentialsInputType
        }
    },
    resolve: async (_, args) => {
        const {name, password} = args.input;
        try{
            const user = await db.User.findOne({where: {name: name}});
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch){
                const token = jwt.sign({
                sub: user.id, 
                },JWT_SECRET_KEY);
                return {
                id: user.id,
                token: token
                };
            } 
            return {
                reason: "Incorrect password"
            };
        }
        catch(exception)
            {
            return {
                reason: "Username doesn't exist"
            }
        }
    }
}


module.exports = loginMutation;
