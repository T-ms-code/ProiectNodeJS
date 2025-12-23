const {
    GraphQLString,
    GraphQLError,
    GraphQLInt,
} = require('graphql');
const db = require('../../models');


const deleteBook = {
    type: GraphQLString,
    args: {
        bookId: {
            type: GraphQLInt
        }
    },
    resolve: async (_, args, context) => {
        const { bookId } = args;

        if (!context.user) {
            throw new GraphQLError(
                "You must be logged in to delete one of your books from library"
            );
        }

        if (context.user.role === "admin") {
            throw new GraphQLError(
                "Admins are not allowed to have a personal library. Use a different account"
            );
        }

        const userId = context.user.id;

        try {
            const deletedRows = await db.PersonalLibrary.destroy({
                where: {
                    userId: userId,
                    bookId: bookId
                }
            });

            if (deletedRows === 0) {
                throw new GraphQLError(
                    "Book not found in your library"
                );
            }

            return `Book with ID: ${bookId} deleted successfully from your library`;
        } catch (exception) {
            throw new GraphQLError(exception.message);
        }
    }
};


module.exports = deleteBook;
