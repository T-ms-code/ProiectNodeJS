const db = require('../../models');
const { BookType } = require('../types/BookType');
const {BookCharacteristicsInputType} = require('../InputTypes/BookCharacteristicsInputType');


const createBook = {
    type: BookType,
    args: {
        input: {
            type: BookCharacteristicsInputType
        }
    },
    resolve: async (_, args, context) => {
        const { title, author } = args.input;
        const { user } = context;

        try {
            let book = await db.Book.findOne({ where: { title, author } });
            if (!book) {
                book = await db.Book.create({ title, author });
            }

            if (user && user.role==='reader') {
                const existingInLibrary = await db.PersonalLibrary.findOne({
                    where: { userId: user.id, bookId: book.id }
                });
                if (existingInLibrary) {
                    throw new Error("Book is already in personal library");
                }
                await db.PersonalLibrary.create({
                    userId: user.id,
                    bookId: book.id,
                    status: 'to-read',
                    currentPage: 0,
                    rating: null,
                    visibility: 'private'
                });
            }

            return book;
        } catch (exception) {
            throw exception;
        }
    }
};


module.exports = createBook;