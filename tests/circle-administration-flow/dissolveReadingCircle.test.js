const { createTestUser, graphqlRequest } = require("../helpers/gql")
const db = require("../../models");
const { isCircleAdmin } = require('../../services/ReadingCircleService');

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

const DISSOLVE_READING_CIRCLE_MUTATION = `
        mutation DissolveReadingCircle($circleId: Int!) {
            dissolveReadingCircle(circleId: $circleId)
        }
    `;


describe("dissolveReadingCircle mutation tests (happy + sad path)", () => {
    
    let tokenReadingCircleMember
    let tokenReadingCircleAdmin
    let tokenAnotherUser

    let circleId;

    let readingCircleMemberUser
    let readingCircleMember

    let readingCircleAdminUser
    let readingCircleAdmin

    let anotherUser

    beforeAll(async () => {
            await db.sequelize.query("PRAGMA foreign_keys = OFF;");
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
    
            //seeding reading circle member user
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
                    password: "password",
                }
            )
            
            tokenReadingCircleMember = loginResMember.body.data.login.token;



            //seeding another user
            anotherUser = await createTestUser({
                name: "Gigel",
                email: "gigel@gmail.com",
                password: "password",
                age: 20,
                country: "Romania",
                bio: "I read sometimes on the train. I like classical books.",
                role: "user",
            })

            const loginResAnotherUser = await graphqlRequest(
                LOGIN_MUTATION,
                {
                    name: "Gigel",
                    password: "password",
                }
            )
            
            tokenAnotherUser = loginResAnotherUser.body.data.login.token;

            const circleRes = await graphqlRequest(
                CREATE_READING_CIRCLE_MUTATION,
                {
                    name: "Test",
                    description: "desc",
                },
                tokenReadingCircleAdmin
            );

            circleId = circleRes.body.data.createReadingCircle.id


            readingCircleMember = await db.CircleMember.create({
                userId: readingCircleMemberUser.id,
                circleId,
                status: "accepted",
                circleRole: "member",
                requestedAt: new Date(),
                respondedAt: new Date(),
            })
    
        });

        // beforeEach( async () => {

        //     const circleRes = await graphqlRequest(
        //         CREATE_READING_CIRCLE_MUTATION,
        //         {
        //             name: "Test",
        //             description: "desc",
        //         },
        //         tokenReadingCircleAdmin
        //     );

        //     circleId = circleRes.body.data.createReadingCircle.id

        //     readingCircleMember = await db.CircleMember.create({
        //         userId: readingCircleMemberUser.id,
        //         circleId,
        //         status: "accepted",
        //         circleRole: "member",
        //         requestedAt: new Date(),
        //         respondedAt: new Date(),
        //     })

        // });

        test("SAD: fails if user is not authenticated", async () => {
                const res = await graphqlRequest(
                    DISSOLVE_READING_CIRCLE_MUTATION,
                    { circleId: circleId }
                )
        
                expect(res.body.errors[0].message).toBe("UNAUTHENTICATED")
        });

        test("SAD: fails if circle does not exist", async () => {
            const res = await graphqlRequest(
                DISSOLVE_READING_CIRCLE_MUTATION,
                { circleId: 9999 },
                tokenReadingCircleAdmin
            );

            expect(res.body.errors[0].message).toBe("CIRCLE_NOT_FOUND");
        });

        test("SAD: fails if user is not the ADMIN of the reading circle", async ()=>{
            const res = await graphqlRequest(
                DISSOLVE_READING_CIRCLE_MUTATION,
                { circleId: circleId },
                tokenReadingCircleMember
            );

            expect(res.body.errors[0].message).toBe("FORBIDDEN");
        });


        test("HAPPY: admin can dissolve the reading circle", async ()=>{

            const res = await graphqlRequest(
                DISSOLVE_READING_CIRCLE_MUTATION,
                { circleId: circleId },
                tokenReadingCircleAdmin
            );
            
            expect(res.body.data.dissolveReadingCircle).toBe(`Reading circle with id ${circleId} has been dissolved.`);
        })

});