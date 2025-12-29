const { PersonalLibraryType } = require("../types/PersonalLibraryType")
const { GraphQLError, GraphQLInt } = require("graphql")
const db = require("../../models")

const PersonalLibraryQuery = {
  name: "PersonalLibraryQuery",
  type: PersonalLibraryType,
  args: {
    page: {
      type: GraphQLInt,
    },
    nrBooksOnPage: {
      type: GraphQLInt,
    },
  },
  resolve: async (_, args, context) => {
    const { user } = context
    if (!user) {
      throw new GraphQLError("You must be logged in to view this information")
    }
    if (user.role == "admin") {
      throw new GraphQLError(
        "Admins are not allowed to have a personal library. Use a different account"
      )
    }
    try {
      const library = await db.User.findOne({
        where: { id: user.id },
        include: [
          {
            model: db.Book,
            as: "books",
          },
        ],
      })
      library.nrOfBooks = library.books.length
      const page = args.page ?? 1 //if null or undefined, becomes 1
      const nrBooksOnPage = args.nrBooksOnPage ?? 10

      if (page < 1) {
        throw new GraphQLError("page must be >= 1")
      }

      if (nrBooksOnPage < 1) {
        throw new GraphQLError("nrBooksOnPage must be >= 1")
      }

      library.books = library.books.slice(
        (page - 1) * nrBooksOnPage,
        page * nrBooksOnPage
      )
      return library
    } catch (exception) {
      throw new GraphQLError(exception)
    }
  },
}

module.exports = PersonalLibraryQuery
