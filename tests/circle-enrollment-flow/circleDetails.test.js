const { createTestUser, graphqlRequest } = require("../helpers/gql")
const db = require("../../models")

const LOGIN_MUTATION = `
  mutation Login($name: String!, $password: String!) {
    login(input: { name: $name, password: $password }) {
      ... on LoggedInUserType { id token }
    }
  }
`

const CREATE_READING_CIRCLE_MUTATION = `
  mutation CreateReadingCircle($name: String!, $description: String) {
    createReadingCircle(input: { name: $name, description: $description }) {
      id name description owner { id name }
    }
  }
`

const CIRCLE_DETAILS_QUERY = `
  query CircleDetails($id: Int!) {
    circleDetails(id: $id) {
      id
      name
      description
      owner { id name }
    }
  }
`

describe("circleDetails query (happy + sad)", () => {
  let circleId, tokenOwner

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })
    await createTestUser({
      name: "OwnerCD",
      email: "ownercd@test.com",
      password: "password",
      role: "reader",
    })
    const login = await graphqlRequest(LOGIN_MUTATION, {
      name: "OwnerCD",
      password: "password",
    })
    tokenOwner = login.body.data.login.token
    const create = await graphqlRequest(
      CREATE_READING_CIRCLE_MUTATION,
      { name: "ClubCD", description: "desc" },
      tokenOwner
    )
    circleId = create.body.data.createReadingCircle.id
  })

  test("HAPPY: anyone (or authenticated) can fetch circle details (HTTP 200)", async () => {
    // call without token to verify public access (resolver does not require auth)
    const res = await graphqlRequest(CIRCLE_DETAILS_QUERY, {
      id: parseInt(circleId, 10),
    })
    expect(res.status).toBe(200)
    expect(res.body.data.circleDetails).toBeDefined()
    expect(res.body.data.circleDetails.name).toBe("ClubCD")
  })

  test("SAD: requesting nonexistent circle returns GraphQL error", async () => {
    const res = await graphqlRequest(CIRCLE_DETAILS_QUERY, { id: 999999 })
    if (res.status === 200) {
      expect(res.body.errors).toBeDefined()
      expect(res.body.errors[0].message).toBe("CIRCLE_NOT_FOUND")
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400)
    }
  })
})
