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
        requestJoinCircle(input: { circleId: $circleId }) {
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

describe("Request Join Circle tests (happy + sad path)", () => {
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
  })

  test("HAPPY: user requests to join circle", async () => {
    const res = await graphqlRequest(
      REQUEST_JOIN_CIRCLE_MUTATION,
      {
        circleId: circleId,
      },
      tokenNewUser
    )

    expect(res.status).toBe(200)
    expect(res.body.data.requestJoinCircle.id).toBeDefined()
    expect(res.body.data.requestJoinCircle.status).toBe("pending")
    expect(res.body.data.requestJoinCircle.circleId).toBe(circleId)
    expect(res.body.data.requestJoinCircle.user.id).toBe(newUser.id)
    expect(res.body.data.requestJoinCircle.user.name).toBe("John Doe")
  })

  test("SAD: cannot request join without authentication", async () => {
    const res = await graphqlRequest(REQUEST_JOIN_CIRCLE_MUTATION, {
      circleId: circleId,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("UNAUTHENTICATED")
  })

  test("SAD: cannot request join to non-existent circle", async () => {
    const res = await graphqlRequest(
      REQUEST_JOIN_CIRCLE_MUTATION,
      {
        circleId: 99999,
      },
      tokenNewUser
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("CIRCLE_NOT_FOUND")
  })

  test("SAD: cannot request join if already member or pending", async () => {
    await graphqlRequest(
      REQUEST_JOIN_CIRCLE_MUTATION,
      {
        circleId: circleId,
      },
      tokenNewUser
    )

    const res = await graphqlRequest(
      REQUEST_JOIN_CIRCLE_MUTATION,
      {
        circleId: circleId,
      },
      tokenNewUser
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("ALREADY_MEMBER_OR_PENDING")
  })
})
