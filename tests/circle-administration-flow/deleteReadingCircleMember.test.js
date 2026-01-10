const { createTestUser, graphqlRequest } = require("../helpers/gql")
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

const DELETE_READING_CIRCLE_MEMBER_MUTATION = `
        mutation DeleteReadingCircleMember($memberId: Int!) {
            deleteReadingCircleMember(memberId: $memberId)
        }
    `;


describe("deleteReadingCircleMember mutation tests (happy + sad path)", () => {
    
    let tokenReadingCircleMember
    let tokenReadingCircleAdmin
    let circleId

    let readingCircleMemberUser
    let readingCircleMember

    let readingCircleAdminUser
    let readingCircleAdmin

    
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


        readingCircleMemberUser = await createTestUser({
            name: "Laur",
            email: "laur@gmail.com",
            password: "password",
            age: 20,
            country: "Romania",
            bio: "I read sometimes on the train. I like classical books.",
            role: "user",
        })

    });

    beforeEach(async () => {

        await db.CircleMember.destroy({
            where: {
            userId: readingCircleMemberUser.id,
            circleId,
            },
        });

        readingCircleMember = await db.CircleMember.create({
            userId: readingCircleMemberUser.id,
            circleId,
            status: "accepted",
            circleRole: "member",
            requestedAt: new Date(),
            respondedAt: new Date(),
        })
    })



    test("SAD: fails if user is not authenticated", async () => {
        const res = await graphqlRequest(
            DELETE_READING_CIRCLE_MEMBER_MUTATION,
            { memberId: readingCircleMember.id }
        )

        expect(res.body.errors[0].message).toBe("UNAUTHENTICATED")
    });

    test("SAD: fails if member does not exist", async () => {
        const res = await graphqlRequest(
            DELETE_READING_CIRCLE_MEMBER_MUTATION,
            { memberId: 99999 },
            tokenReadingCircleAdmin
        )

        expect(res.body.errors[0].message).toBe("MEMBER_NOT_FOUND")
    })

    test("SAD: fails if user is not admin", async () => {
        const tokenMember = (
            await graphqlRequest(LOGIN_MUTATION, {
            name: "Laur",
            password: "password",
            })
        ).body.data.login.token

        const res = await graphqlRequest(
            DELETE_READING_CIRCLE_MEMBER_MUTATION,
            { memberId: readingCircleAdmin.id },
            tokenMember
        )

        expect(res.body.errors[0].message).toBe("FORBIDDEN")
    })

    test("SAD: admin cannot delete himself", async () => {
        const res = await graphqlRequest(
            DELETE_READING_CIRCLE_MEMBER_MUTATION,
            { memberId: readingCircleAdmin.id },
            tokenReadingCircleAdmin
        )

        expect(res.body.errors[0].message)
            .toBe("Cannot delete yourself from the circle. You are the ADMIN!")
    })


    test("HAPPY: admin deletes a reading circle member", async () => {
        const res = await graphqlRequest(
            DELETE_READING_CIRCLE_MEMBER_MUTATION,
            { memberId: readingCircleMember.id },
            tokenReadingCircleAdmin
        )

        expect(res.status).toBe(200)
        expect(res.body.data.deleteReadingCircleMember).toBe(true)

        const memberInDb = await db.CircleMember.findByPk(readingCircleMember.id)
        expect(memberInDb).toBeNull()
    });

}
)