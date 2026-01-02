const { GraphQLObjectType } = require("graphql")
const login = require("../mutations/LoginMutation")
const register = require("../mutations/RegisterMutation")
const createBook = require("../mutations/CreateBookMutation")
const updateBook = require("../mutations/UpdateBookMutation")
const deleteBook = require("../mutations/DeleteBookFromPersonalLibraryMutation")

const createReadingCircle = require("../mutations/CreateReadingCircleMutation")
const requestJoinCircle = require("../mutations/RequestJoinCircleMutation")
const respondJoinRequest = require("../mutations/RespondJoinRequestMutation")

const deleteReadingCircleMember = require("../mutations/DeleteReadingCircleMember")

const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    login,
    register,
    createBook,
    updateBook,
    deleteBook,
    createReadingCircle,
    requestJoinCircle,
    respondJoinRequest,
    deleteReadingCircleMember,
  },
})

module.exports = MutationType
