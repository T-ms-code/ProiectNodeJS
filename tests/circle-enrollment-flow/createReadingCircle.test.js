const { createTestUser, graphqlRequest } = require("../helpers/gql")
const db = require("../../models")

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
`

const CREATE_READING_CIRCLE_MUTATION = `
    mutation CreateReadingCircle($name: String!, $description: String) {
        createReadingCircle(input: { name: $name, description: $description }) {
            id
            name
            description
            owner {
                id
                name
                email
            }
        }
    }
`

describe("Create Reading Circle tests (happy + sad path)", () => {
  let tokenOwner
  let ownerUser

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    ownerUser = await createTestUser({
      name: "Mike Tyson",
      email: "mike@test.com",
      password: "password",
      age: 30,
      country: "USA",
      bio: "Boxing reader.",
      role: "reader",
    })

    const loginRes = await graphqlRequest(LOGIN_MUTATION, {
      name: "Mike Tyson",
      password: "password",
    })
    tokenOwner = loginRes.body.data.login.token
  })

  test("HAPPY: owner creates reading circle", async () => {
    const res = await graphqlRequest(
      CREATE_READING_CIRCLE_MUTATION,
      {
        name: "Test Circle",
        description: "Test description",
      },
      tokenOwner
    )

    expect(res.status).toBe(200)
    expect(res.body.data.createReadingCircle.id).toBeDefined()
    expect(res.body.data.createReadingCircle.name).toBe("Test Circle")
    expect(res.body.data.createReadingCircle.owner.id).toBe(ownerUser.id)
    expect(res.body.data.createReadingCircle.owner.name).toBe("Mike Tyson")
  })

  test("SAD: cannot create circle without authentication", async () => {
    const res = await graphqlRequest(CREATE_READING_CIRCLE_MUTATION, {
      name: "Test Circle",
      description: "Test description",
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("UNAUTHENTICATED")
  })
})
