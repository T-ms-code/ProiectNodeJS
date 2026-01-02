const { GraphQLBoolean, GraphQLError } = require("graphql");
const db = require("../../models");
const UpdateReadingCircleInputType = require("../InputTypes/UpdateReadingCircleInputType");
const { isCircleAdmin, isCircleModerator } = require("../../services/ReadingCircleService");


const updateReadingCircle = {
    type: GraphQLBoolean,
    args: {
        input: {
            type: UpdateReadingCircleInputType
        }
    },
    resolve: async (_, { input }, {user}) => {
        if (!user) throw new GraphQLError("UNAUTHENTICATED");
    
        const {id, name, description} = input;

        const circle = await db.ReadingCircle.findByPk(id);
        if (!circle) throw new GraphQLError("CIRCLE_NOT_FOUND");


        if (name === null || description === null) {
            throw new GraphQLError("NULL_NOT_ALLOWED");
        }

        if(name === undefined && description === undefined){
            throw new GraphQLError("NO_DATA_TO_UPDATE");
        }


        if( (!(name === undefined) && name.trim() === "") || (!(description === undefined) && description.trim() === "")) {
            throw new GraphQLError("FIELDS_CANNOT_BE_EMPTY");
        }


        const isAdmin = await isCircleAdmin(user.id, circle.id);
        if (!isAdmin && name) throw new GraphQLError("Only ADMIN can update circle name");

        const isModerator = await isCircleModerator(user.id, circle.id);
        if (!(isModerator || isAdmin) && description) throw new GraphQLError("Only ADMIN or MODERATOR can update circle description");

        await circle.update({
            name: name || circle.name,
            description: description || circle.description
        });

        return true;
    }
}

module.exports = updateReadingCircle;