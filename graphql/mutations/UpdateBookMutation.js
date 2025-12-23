const UpdateBookInputType = require('../InputTypes/UpdateBookInputType');
const {
    GraphQLString,
    GraphQLError
} = require('graphql');
const db = require('../../models');

const updateBook = {
    type: GraphQLString,
    args: {
        input: {
            type: UpdateBookInputType
        }
    },
    resolve: async (_, args, context) => {
        const { bookId, status, currentPage, rating, visibility } = args.input;

        if (!context.user) {
            throw new GraphQLError("You must be logged in to update one of your books");
        }

        if (context.user.role === "admin") {
            throw new GraphQLError(
                "Admins are not allowed to have a personal library. Use a different account"
            );
        }

        if (!bookId) {
            throw new GraphQLError("You have to give a bookId");
        }

        const userId = context.user.id;

        try {
            const updateData = {};

            if (status !== undefined) {
                if (!["read", "to-read", "in-progress"].includes(status)) {
                    throw new GraphQLError(
                        "Status must be in [read, to-read, in-progress]"
                    );}

                updateData.status = status;
            }

            if (currentPage !== undefined) {
                if (currentPage<0){
                    throw new GraphQLError(
                        "Page number must be >= 0"
                    );}
                updateData.currentPage = currentPage;
            }
///Checks Inconsistency between status and currentPage 
            if (status !== undefined && currentPage===undefined){
                const existingInLibrary = await db.PersonalLibrary.findOne({
                        where: { userId: userId, bookId: bookId }
                });
                if (
                    status === "to-read" &&
                    existingInLibrary.currentPage !== 0
                    ) {
                        throw new GraphQLError(
                            "Inconsistency between status and currentPage"
                    );
                }
            }
             if (status === undefined && currentPage!==undefined){
                const existingInLibrary = await db.PersonalLibrary.findOne({
                        where: { userId: userId, bookId: bookId}
                });
                if (
                    existingInLibrary.status === "to-read" &&
                    currentPage !== 0
                    ) {
                        throw new GraphQLError(
                            "Inconsistency between status and currentPage"
                    );
                }
             }
             if(status !== undefined && currentPage!==undefined){
                if (
                    status === "to-read" &&
                    currentPage !== 0
                ) {
                    throw new GraphQLError(
                        "Inconsistency between status and currentPage"
                    );
                }
             }
//
            if (rating !== undefined) {
                if (![null, 1,2,3,4,5,6,7,8,9,10].includes(rating)) {
                    throw new GraphQLError(
                        "Rating must be in [null, 1..10]"
                    );
                }
                updateData.rating = rating;
            }

            if (visibility !== undefined) {
                if (!["private", "public"].includes(visibility)) {
                    throw new GraphQLError(
                        "Visibility must be in [private, public]"
                    );
                }
                updateData.visibility = visibility;
            }

            if (Object.keys(updateData).length === 0) {
                return "No fields provided for update";
            }

            const [affectedRows] = await db.PersonalLibrary.update(
                updateData,
                {
                    where: {
                        userId: userId,
                        bookId: bookId
                    }
                }
            );

            if (affectedRows === 0) {
                throw new GraphQLError(
                    "Book not found in your library or no changes made"
                );
            }

            return `Book with ID: ${bookId} updated successfully in your library`;
        } catch (exception) {
            throw new GraphQLError(exception.message);
        }
    }
};

module.exports = updateBook;
