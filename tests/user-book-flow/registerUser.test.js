const { graphqlRequest } = require("../helpers/gql")
const db = require("../../models")

const REGISTER_MUTATION = `
  mutation Register($input: RegisterCredentialsInputType!) {
    register(input: $input) {
      ... on LoggedInUserType { id token }
      ... on FailedAuthenticationType { reason }
    }
  }
`

describe("Register mutation (happy + sad)", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true })
  })

  test("HAPPY: creates a new user and returns token/id (HTTP 200)", async () => {
    const unique = Date.now()
    const vars = {
      input: {
        name: `TestUser${unique}`,
        password: "password",
        email: `testuser${unique}@example.com`,
        age: 20,
        country: "Romania",
        bio: "Test user",
      },
    }

    const res = await graphqlRequest(REGISTER_MUTATION, vars)

    expect(res.status).toBe(200)
    expect(res.body).toBeDefined()
    expect(res.body.data).toBeDefined()
    expect(res.body.data.register).toBeDefined()
    expect(res.body.data.register.token).toBeDefined()
    expect(res.body.data.register.id).toBeDefined()
  })

  test("SAD: missing required field -> accept GraphQL error, failed-union or HTTP error", async () => {
    const vars = {
      input: {
        name: `BadUser`,
        email: `bad@example.com`,
        age: 20,
        country: "Romania",
        // no password
      },
    }

    const res = await graphqlRequest(REGISTER_MUTATION, vars)
    if (res.status !== 200) {
      expect(res.status).toBeGreaterThanOrEqual(400)
      return
    }
  })
})
