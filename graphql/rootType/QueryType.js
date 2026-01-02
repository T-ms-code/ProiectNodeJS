const { GraphQLObjectType } = require("graphql")
const PersonalLibrary = require("../queries/PersonalLibraryQuery")
const bookQuery = require("../queries/BookQuery")
const pendingRequests = require("../queries/PendingRequests")
const readingCircleMembers = require("../queries/ReadingCircleMembersQuery")
const circleDetails = require("../queries/CircleDetailsQuery")
const myCircles = require("../queries/CirclesQuery")

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    personalLibrary: PersonalLibrary,
    book: bookQuery,
    myCircles,
    circleDetails,
    pendingRequests: pendingRequests,
    readingCircleMembers,
  },
})

module.exports = QueryType
