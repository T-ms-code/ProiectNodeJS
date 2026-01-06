const { GraphQLObjectType } = require("graphql")
const login = require("../mutations/LoginMutation")
const register = require("../mutations/RegisterMutation")
const createBook = require("../mutations/CreateBookMutation")
const updateBook = require("../mutations/UpdateBookMutation")
const deleteBook = require("../mutations/DeleteBookFromPersonalLibraryMutation")

const createReadingCircle = require("../mutations/CreateReadingCircleMutation")
const requestJoinCircle = require("../mutations/RequestJoinCircleMutation")
const respondJoinRequest = require("../mutations/RespondJoinRequestMutation")

const deleteReadingCircleMember = require("../mutations/DeleteReadingCircleMemberMutation")
const updateReadingCircleMemberRole = require("../mutations/UpdateReadingCircleMemberRoleMutation")

const updateReadingCircle = require("../mutations/UpdateReadingCircleMutation");
const sendMessage = require("../mutations/SendMessageMutation")
const updateMessage = require("../mutations/UpdateMessageMutation")
const deleteMessage = require("../mutations/DeleteMessageMutation")

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
    updateReadingCircleMemberRole,
    updateReadingCircle,
    sendMessage,
    updateMessage,
    deleteMessage
  },
})

module.exports = MutationType
