const LoggedInUserType = require("../types/LoggedInUserType");
const FailedAuthenticationType = require("../types/FailedAuthenticationType");
const RegisterCredentialsInputType = require("../InputTypes/RegisterCredentialsInputType");
const {GraphQLUnionType} = require("graphql");
const jwt = require("jsonwebtoken");
const {JWT_SECRET_KEY} = require("../../constants");
const db = require("../../models");
const bcrypt = require('bcrypt');


const registerMutation = {
    type: new GraphQLUnionType({
        name: "RegisterMutationUnion",
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
            type: RegisterCredentialsInputType
        }
    },
    resolve: async (_, args) => {
        const {name, password, email, age, country, bio} = args.input;
        try{
            let user = await db.User.findOne({where: {name: name}});
            if (user){
                return {
                    reason: "Username already exists"
                };
            }
            if (password.length < 6){
                return {
                    reason: "Password must be at least 6 characters long"
                };
            }
            user = await db.User.findOne({where: {email: email}});
            if (user){
                return {
                    reason: "Email already registered"
                };
            }
            if (name.trim() === "" || password.trim() === ""){
                return {
                    reason: "Username and password cannot be empty"
                };
            }
            console.log('A');
            const hashedPassword = await bcrypt.hash(password, 3);
            const newUser = await db.User.create({
                name: name,
                password: hashedPassword,   
                email: email,
                age: age,
                country: country,
                bio: bio,
                role: 'reader'//You can only register as a reader, admins are created manually
            });
            console.log('B');
            const token = jwt.sign({sub: newUser.id}, JWT_SECRET_KEY);
            return {id: newUser.id,token: token};     
        }
        catch(exception)
            {
            return {
                reason: "Registration failed due to an internal error"
            }
        }
    }
}


module.exports = registerMutation;
