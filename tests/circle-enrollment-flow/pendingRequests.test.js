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
    createReadingCircle(input: { name: $name, description: $description }) { id }
  }
`

const REQUEST_JOIN_CIRCLE_MUTATION = `
  mutation RequestJoinCircle($circleId: Int!) {
    requestJoinCircle(input: { circleId: $circleId }) { id }
  }
`

const PENDING_REQUESTS_QUERY = `
  query PendingRequests($circleId: Int!) {
    pendingRequests(circleId: $circleId) {
      id
      status
      circleId
      role
      user { id name email }
      requestedAt
    }
  }
`

describe("Pending Requests (happy + sad)", () => {
  let tokenOwner, tokenApplicant, circleId

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    await createTestUser({
      name: "Owner2",
      email: "owner2@test.com",
      password: "password",
      role: "reader",
    })
    const loginOwner = await graphqlRequest(LOGIN_MUTATION, {
      name: "Owner2",
      password: "password",
    })
    tokenOwner = loginOwner.body.data.login.token

    const create = await graphqlRequest(
      CREATE_READING_CIRCLE_MUTATION,
      { name: "Club2", description: "desc" },
      tokenOwner
    )
    circleId = create.body.data.createReadingCircle.id

    await createTestUser({
      name: "Applicant2",
      email: "app2@test.com",
      password: "password",
      role: "reader",
    })
    const loginApplicant = await graphqlRequest(LOGIN_MUTATION, {
      name: "Applicant2",
      password: "password",
    })
    tokenApplicant = loginApplicant.body.data.login.token

    await graphqlRequest(
      REQUEST_JOIN_CIRCLE_MUTATION,
      { circleId: parseInt(circleId, 10) },
      tokenApplicant
    )
  })

  test("HAPPY: owner can fetch pending requests (HTTP 200)", async () => {
    const res = await graphqlRequest(
      PENDING_REQUESTS_QUERY,
      { circleId: parseInt(circleId, 10) },
      tokenOwner
    )
    expect(res.status).toBe(200)
    expect(res.body.data.pendingRequests).toBeDefined()
    expect(Array.isArray(res.body.data.pendingRequests)).toBe(true)
    expect(res.body.data.pendingRequests.length).toBeGreaterThanOrEqual(1)
  })

  test("SAD: unauthenticated pendingRequests -> error", async () => {
    const res = await graphqlRequest(PENDING_REQUESTS_QUERY, {
      circleId: parseInt(circleId, 10),
    })
    if (res.status === 200) {
      expect(res.body.errors).toBeDefined()
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400)
    }
  })

  test("SAD: non-owner cannot fetch pending requests (forbidden/error)", async () => {
    const res = await graphqlRequest(
      PENDING_REQUESTS_QUERY,
      { circleId: parseInt(circleId, 10) },
      tokenApplicant
    )
    if (res.status === 200) {
      // either GraphQL error or empty list / different behavior
      if (res.body.errors) {
        expect(res.body.errors).toBeDefined()
      } else {
        // assert that applicant does not see owner-only details
        expect(
          res.body.data.pendingRequests == null ||
            res.body.data.pendingRequests.length === 0
        ).toBeTruthy()
      }
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400)
    }
  })
})
