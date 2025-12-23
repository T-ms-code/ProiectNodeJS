const {GraphQLInt} = require('graphql');
const db = require('../../models');
const BookWithPersonalDataType = require('../types/BookWithPersonalDataType');


const bookQuery = {
    type: BookWithPersonalDataType,
    args: {
        bookId: {
            type: GraphQLInt
        }
    },
    resolve: async (_, args, context) => {
        if (!context.user) {
            throw new Error("You must be logged in to view book details");
        }

        const { bookId } = args;
        const userId = context.user.id;

        try {
            const book = await db.Book.findByPk(bookId);
            if (!book) {
                throw new Error("Book not found");
            }

            const personalLibraryEntry = await db.PersonalLibrary.findOne({
                where: { userId: userId, bookId: bookId }
            });

            if (!personalLibraryEntry) {
                throw new Error("This book is not in your personal library");
            }

            return {
                book: book,
                status: personalLibraryEntry.status,
                currentPage: personalLibraryEntry.currentPage,
                rating: personalLibraryEntry.rating,
                visibility: personalLibraryEntry.visibility
            };
        } catch (exception) {
            throw new Error("Error retrieving book data: " + exception.message);
        }
    }
};

module.exports = bookQuery;
