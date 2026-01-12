const { createTestUser, graphqlRequest } = require("../helpers/gql")
const db = require("../../models")

const LOGIN_MUTATION = `
  mutation Login($name: String!, $password: String!) {
    login(input: { name: $name, password: $password }) {
      ... on LoggedInUserType { id token }
      ... on FailedAuthenticationType { reason }
    }
  }
`

describe("Login mutation (happy + sad)", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true })
    await createTestUser({
      name: "Mike Tyson",
      email: "mike@test.com",
      password: "password",
      age: 30,
      country: "USA",
      bio: "Boxing reader.",
      role: "reader",
    })
  })

  test("HAPPY: valid credentials return token (HTTP 200)", async () => {
    const res = await graphqlRequest(LOGIN_MUTATION, {
      name: "Mike Tyson",
      password: "password",
    })
    expect(res.status).toBe(200)
    expect(res.body.data.login).toBeDefined()
    expect(res.body.data.login.token).toBeDefined()
    expect(res.body.data.login.id).toBeDefined()
  })

  test("SAD: invalid credentials return FailedAuthenticationType (HTTP 200 with failed payload)", async () => {
    const res = await graphqlRequest(LOGIN_MUTATION, {
      name: "Mike Tyson",
      password: "wrongpassword",
    })
    expect(res.status).toBe(200)
    expect(res.body.data.login).toBeDefined()
    expect(res.body.data.login.reason).toBeDefined()
  })
})
