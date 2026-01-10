const { createTestUser, graphqlRequest } = require("../helpers/gql");
const db = require("../../models");
const AssignableReadingCircleRole = require("../../graphql/types/AssignableReadingCircleRole");


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

const UPDATE_READING_CIRCLE_MEMBER_ROLE_MUTATION = `
  mutation UpdateReadingCircleMemberRole(
    $memberId: Int!,
    $role: AssignableReadingCircleRole!
  ) {
    updateReadingCircleMemberRole(
      memberId: $memberId,
      role: $role
    ) {
    id,
    status,
    role,
    user {
      id,
      name,
      email
    },
    requestedAt,
    respondedAt
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
            }
        );

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


        const loginResMember = await graphqlRequest(
            LOGIN_MUTATION,
            {
                name: "Laur",
                password: "password"
            }
        )

        tokenReadingCircleMember = loginResMember.body.data.login.token

        readingCircleMember = await db.CircleMember.create({
            userId: readingCircleMemberUser.id,
            circleId,
            status: "accepted",
            circleRole: "member",
            requestedAt: new Date(),
            respondedAt: new Date(),
        })
        
    });


    test("SAD: fails if user is not authenticated", async ()=>{

        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MEMBER_ROLE_MUTATION,
            {
                memberId: readingCircleMember.id,
                role: "MODERATOR"
            }
        )

        expect(res.body.errors[0].message).toBe("UNAUTHENTICATED");

    })

    test("SAD: fails if member does not exist", async ()=>{

        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MEMBER_ROLE_MUTATION,
            {
                memberId: 9999,
                role: "MODERATOR"
            },
            tokenReadingCircleAdmin
        )

        expect(res.body.errors[0].message).toBe("MEMBER_NOT_FOUND")

    })

    test("SAD: fails if user is not the reading circle admin", async ()=>{

        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MEMBER_ROLE_MUTATION,
            {
                memberId: readingCircleMember.id,
                role: "MODERATOR"
            },
            tokenReadingCircleMember
        )

        expect(res.body.errors[0].message).toBe("FORBIDDEN");

    })

    test("SAD: fails if the targeted user is the reading circle admin", async() =>{

        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MEMBER_ROLE_MUTATION,
            {
                memberId: readingCircleAdmin.id,
                role: "MODERATOR"
            },
            tokenReadingCircleAdmin
        )

        expect(res.body.errors[0].message).toBe("Cannot change your role. You are the ADMIN!");
    })


    test("HAPPY: admin can update member's role", async ()=>{

        const res = await graphqlRequest(
            UPDATE_READING_CIRCLE_MEMBER_ROLE_MUTATION,
            {
                memberId: readingCircleMember.id,
                role: "MODERATOR"
            },
            tokenReadingCircleAdmin
        )

        expect(res.body.data.updateReadingCircleMemberRole.role === "MODERATOR")

    })

})