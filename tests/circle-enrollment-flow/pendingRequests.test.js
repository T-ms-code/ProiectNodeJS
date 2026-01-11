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
            user {
                id
                name
                email
            }
            requestedAt
        }
    }
`

describe("Pending Requests query tests (happy + sad path)", () => {
  let tokenOwner
  let tokenNewUser
  let circleId
  let ownerUser
  let newUser

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

    const loginOwnerRes = await graphqlRequest(LOGIN_MUTATION, {
      name: "Mike Tyson",
      password: "password",
    })
    tokenOwner = loginOwnerRes.body.data.login.token

    const circleRes = await graphqlRequest(
      CREATE_READING_CIRCLE_MUTATION,
      {
        name: "Club SF",
        description: "Fahrenheit 451 type shit",
      },
      tokenOwner
    )
    circleId = circleRes.body.data.createReadingCircle.id

    newUser = await createTestUser({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      age: 25,
      country: "Romania",
      bio: "I love reading",
      role: "reader",
    })

    const loginNewUserRes = await graphqlRequest(LOGIN_MUTATION, {
      name: "John Doe",
      password: "password123",
    })
    tokenNewUser = loginNewUserRes.body.data.login.token
  })

  beforeEach(async () => {
    await db.CircleMember.destroy({
      where: {
        userId: newUser.id,
        circleId: circleId,
      },
    })

    await graphqlRequest(
      REQUEST_JOIN_CIRCLE_MUTATION,
      {
        circleId: circleId,
      },
      tokenNewUser
    )
  })

  test("HAPPY: owner gets pending requests", async () => {
    const res = await graphqlRequest(
      PENDING_REQUESTS_QUERY,
      {
        circleId: circleId,
      },
      tokenOwner
    )

    expect(res.status).toBe(200)
    expect(res.body.data.pendingRequests).toBeDefined()
    expect(res.body.data.pendingRequests.length).toBe(1)
    expect(res.body.data.pendingRequests[0].status).toBe("pending")
    expect(res.body.data.pendingRequests[0].user.name).toBe("John Doe")
  })

  test("SAD: cannot get pending requests without authentication", async () => {
    const res = await graphqlRequest(PENDING_REQUESTS_QUERY, {
      circleId: circleId,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("UNAUTHENTICATED")
  })

  test("SAD: non-admin cannot get pending requests", async () => {
    const res = await graphqlRequest(
      PENDING_REQUESTS_QUERY,
      {
        circleId: circleId,
      },
      tokenNewUser
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("FORBIDDEN")
  })
})
