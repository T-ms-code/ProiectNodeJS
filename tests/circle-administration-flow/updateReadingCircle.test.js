const { createTestUser, graphqlRequest } = require("../helpers/gql");
const db = require("../../models");


const LOGIN_MUTATION = `
        mutation Login($name: String!, $password: String!) {
            login(input: { name: $name, password: $password }) {
                ... on LoggedInUserType {
                    id
                    token
                }
                ... on FailedAuthenticationType {
                    reason
                }
            }
        }
    `;

const CREATE_READING_CIRCLE_MUTATION = `
    mutation CreateReadingCircle($name: String!, $description: String) {
        createReadingCircle(input: { name: $name, description: $description }) { id }
    }
`;

const UPDATE_READING_CIRCLE_MUTATION = `
  mutation UpdateReadingCircle($input: UpdateReadingCircleInput!) {
    updateReadingCircle(input: $input) {
      id
      name
      description
    }
  }
`;


describe("updateReadingCircle mutation tests (happy + sad path)", ()=>{

    let tokenReadingCircleMember
    let tokenReadingCircleAdmin
    let circleId

    let readingCircleMemberUser
    let readingCircleMember

    let readingCircleAdminUser
    let readingCircleAdmin

    let readingCircleModeratorUser
    let readingCircleModerator
    
    beforeAll(async () => {
        await db.sequelize.sync({ force: true })

        // seed admin reading circle user
        readingCircleAdminUser = await createTestUser({
            name: "Mike Tyson",
            email: "mike@test.com",
            password: "password",
            age: 30,
            country: "RO",
            bio: "test",
            role: "user",
        })

        const loginRes = await graphqlRequest(
            LOGIN_MUTATION,
            {
                name: "Mike Tyson",
                password: "password",
            });

        tokenReadingCircleAdmin = loginRes.body.data.login.token


        const circleRes = await graphqlRequest(
            CREATE_READING_CIRCLE_MUTATION,
            {
                name: "Test",
                description: "desc",
            },
            tokenReadingCircleAdmin
        );

        circleId = circleRes.body.data.createReadingCircle.id

        readingCircleAdmin = await db.CircleMember.findOne({
              where: { userId: readingCircleAdminUser.id, circleId, status: "accepted", circleRole: "admin" },
        });
        expect(readingCircleAdmin).toBeTruthy()

        // seed member reading circle user
        readingCircleMemberUser = await createTestUser({
            name: "Laur",
            email: "laur@gmail.com",
            password: "password",
            age: 20,
            country: "Romania",
            bio: "I read sometimes on the train. I like classical books.",
            role: "user",
        })


        readingCircleMember = await db.CircleMember.create({
            userId: readingCircleMemberUser.id,
            circleId,
            status: "accepted",
            circleRole: "member",
            requestedAt: new Date(),
            respondedAt: new Date(),
        })

        //seed moderator reading circle user
        readingCircleModeratorUser = await createTestUser({
            name: "Gigel",
            email: "gigel@gmail.com",
            age: 20,
            country: "Romania",
            bio: "I read sometimes on the train. I like classical books.",
            role: "user",
        })

        readingCircleModerator = await db.CircleMember.create({
            userId: readingCircleModeratorUser.id,
            circleId,
            status: "accepted",
            circleRole: "moderator",
            requestedAt: new Date(),
            respondedAt: new Date(),
        })


    });


    test("SAD: fails if user is not authenticated", async ()=>{
        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: {
                id: circleId,
                name: "New Name",
            },
            }
        );

        expect(res.body.errors[0].message).toBe("UNAUTHENTICATED");
    })

    test("SAD: fails if circle does not exist", async () => {
        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: {
                id: 99999,
                name: "New Name",
            },
            },
            tokenReadingCircleAdmin
        );

        expect(res.body.errors[0].message).toBe("CIRCLE_NOT_FOUND");
    });

    test("SAD: fails if circle does not exist", async () => {
        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: {
                id: 99999,
                name: "New Name",
            },
            },
            tokenReadingCircleAdmin
        );

        expect(res.body.errors[0].message).toBe("CIRCLE_NOT_FOUND");
    });

    test("SAD: fails if no fields are provided", async () => {
        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: { id: circleId },
            },
            tokenReadingCircleAdmin
        );

        expect(res.body.errors[0].message).toBe("NO_DATA_TO_UPDATE");
    });

    test("SAD: fails if name or description is null", async () => {
        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: {
                id: circleId,
                name: null,
            },
            },
            tokenReadingCircleAdmin
        );

        expect(res.body.errors[0].message).toBe("NULL_NOT_ALLOWED");
    });

    test("SAD: fails if name or description is empty string", async () => {
        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: {
                id: circleId,
                name: "   ",
            },
            },
            tokenReadingCircleAdmin
        );

        expect(res.body.errors[0].message).toBe("FIELDS_CANNOT_BE_EMPTY");
    });

    test("SAD: member cannot update circle name", async () => {
        const tokenMember = (
            await graphqlRequest(LOGIN_MUTATION, {
            name: "Laur",
            password: "password",
            })
        ).body.data.login.token;

        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: {
                id: circleId,
                name: "Hacked Name",
                description: "New desc"
            },
            },
            tokenMember
        );

        expect(res.body.errors[0].message).toBe("Only ADMIN can update circle name");
    });


    test("HAPPY: moderator can update circle description", async () => {
        const tokenModerator = (
            await graphqlRequest(LOGIN_MUTATION, {
            name: "Gigel",
            password: "password",
            })
        ).body.data.login.token;

        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: {
                id: circleId,
                description: "Updated by moderator",
            },
            },
            tokenModerator
        );

        expect(res.body.data.updateReadingCircle.description).toBe("Updated by moderator");
    });


    test("HAPPY: admin can update name and description", async () => {
        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MUTATION,
            {
            input: {
                id: circleId,
                name: "New Circle Name",
                description: "New description",
            },
            },
            tokenReadingCircleAdmin
        );

        expect(res.body.data.updateReadingCircle.name).toBe("New Circle Name");
        expect(res.body.data.updateReadingCircle.description).toBe("New description");
    });


})