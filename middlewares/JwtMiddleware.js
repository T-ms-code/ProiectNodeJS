const jwt = require("jsonwebtoken");
const {JWT_SECRET_KEY} = require("../constants");
const db = require("../models");


const jwtMiddleware =async (request, response, next) => {
    const authorizationHeader = request.headers.authorization;
    if(!authorizationHeader){
        console.log("No token found");
        next();//If no token, just continue without user data. Some resolvers might not need authentication.
        return;
    }

    token = authorizationHeader.replace("Bearer ", "");
    try{
    const payload = jwt.verify(token, JWT_SECRET_KEY);
    const subjectId = payload.sub;
    const user = await db.User.findByPk(subjectId);
    request.userData = user;
    }
    catch(e){
        console.log("Invalid token!");
    }
    next();
}


module.exports = jwtMiddleware;