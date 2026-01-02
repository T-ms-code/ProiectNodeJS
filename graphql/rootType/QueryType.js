const { GraphQLObjectType } = require("graphql")
const PersonalLibrary = require("../queries/PersonalLibraryQuery")
const bookQuery = require("../queries/BookQuery")
const pendingRequests = require("../queries/PendingRequests")
const readingCircleMembers = require("../queries/ReadingCircleMembersQuery")

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    personalLibrary: PersonalLibrary,
    book: bookQuery,
    pendingRequests: pendingRequests,
    readingCircleMembers,
  },
})

module.exports = QueryType
