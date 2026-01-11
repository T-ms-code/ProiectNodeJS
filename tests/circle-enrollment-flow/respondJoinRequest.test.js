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

const RESPOND_JOIN_REQUEST_MUTATION = `
    mutation RespondJoinRequest($requestId: Int!, $action: String!) {
        respondJoinRequest(input: { requestId: $requestId, action: $action }) {
            id
            status
            role
            user {
                id
                name
                email
            }
            requestedAt
            respondedAt
        }
    }
`

describe("Respond Join Request tests (happy + sad path)", () => {
  let tokenOwner
  let tokenNewUser
  let circleId
  let requestId
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

    const requestRes = await graphqlRequest(
      REQUEST_JOIN_CIRCLE_MUTATION,
      {
        circleId: circleId,
      },
      tokenNewUser
    )
    requestId = requestRes.body.data.requestJoinCircle.id
  })

  test("HAPPY: owner accepts join request", async () => {
    const res = await graphqlRequest(
      RESPOND_JOIN_REQUEST_MUTATION,
      {
        requestId: requestId,
        action: "accept",
      },
      tokenOwner
    )

    expect(res.status).toBe(200)
    expect(res.body.data.respondJoinRequest.status).toBe("accepted")
    expect(res.body.data.respondJoinRequest.role).toBe("member")
    expect(res.body.data.respondJoinRequest.respondedAt).toBeDefined()

    const member = await db.CircleMember.findByPk(requestId)
    expect(member.status).toBe("accepted")
    expect(member.circleRole).toBe("member")
  })

  test("HAPPY: owner rejects join request", async () => {
    const res = await graphqlRequest(
      RESPOND_JOIN_REQUEST_MUTATION,
      {
        requestId: requestId,
        action: "reject",
      },
      tokenOwner
    )

    expect(res.status).toBe(200)
    expect(res.body.data.respondJoinRequest.status).toBe("rejected")
    expect(res.body.data.respondJoinRequest.respondedAt).toBeDefined()

    const member = await db.CircleMember.findByPk(requestId)
    expect(member.status).toBe("rejected")
  })

  test("SAD: cannot respond without authentication", async () => {
    const res = await graphqlRequest(RESPOND_JOIN_REQUEST_MUTATION, {
      requestId: requestId,
      action: "accept",
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("UNAUTHENTICATED")
  })

  test("SAD: cannot respond to non-existent request", async () => {
    const res = await graphqlRequest(
      RESPOND_JOIN_REQUEST_MUTATION,
      {
        requestId: 99999,
        action: "accept",
      },
      tokenOwner
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("REQUEST_NOT_FOUND")
  })

  test("SAD: non-admin cannot respond to request", async () => {
    const res = await graphqlRequest(
      RESPOND_JOIN_REQUEST_MUTATION,
      {
        requestId: requestId,
        action: "accept",
      },
      tokenNewUser
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("FORBIDDEN")
  })

  test("SAD: cannot respond to already processed request", async () => {
    await graphqlRequest(
      RESPOND_JOIN_REQUEST_MUTATION,
      {
        requestId: requestId,
        action: "accept",
      },
      tokenOwner
    )

    const res = await graphqlRequest(
      RESPOND_JOIN_REQUEST_MUTATION,
      {
        requestId: requestId,
        action: "reject",
      },
      tokenOwner
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("ALREADY_RESPONDED")
  })

  test("SAD: invalid action", async () => {
    const res = await graphqlRequest(
      RESPOND_JOIN_REQUEST_MUTATION,
      {
        requestId: requestId,
        action: "invalid_action",
      },
      tokenOwner
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("INVALID_ACTION")
  })
})
