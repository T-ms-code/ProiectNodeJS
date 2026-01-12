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
      id name description owner { id name email }
    }
  }
`

const MY_CIRCLES_QUERY = `
  query MyCircles {
    myCircles {
      id
      name
      description
      owner { id name }
    }
  }
`

describe("myCircles query (happy + sad)", () => {
  let tokenMember, circleId, memberUser

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    // create owner and circle
    await createTestUser({
      name: "OwnerMC",
      email: "ownermc@test.com",
      password: "password",
      role: "reader",
    })
    const loginOwner = await graphqlRequest(LOGIN_MUTATION, {
      name: "OwnerMC",
      password: "password",
    })
    const tokenOwner = loginOwner.body.data.login.token
    const createRes = await graphqlRequest(
      CREATE_READING_CIRCLE_MUTATION,
      { name: "ClubMC", description: "desc" },
      tokenOwner
    )
    circleId = createRes.body.data.createReadingCircle.id

    // create member user and insert accepted membership
    memberUser = await createTestUser({
      name: "MemberMC",
      email: "membermc@test.com",
      password: "password",
      role: "reader",
    })
    await db.CircleMember.create({
      circleId: parseInt(circleId, 10),
      userId: memberUser.id,
      role: "member",
      status: "accepted",
    })

    const loginMember = await graphqlRequest(LOGIN_MUTATION, {
      name: "MemberMC",
      password: "password",
    })
    tokenMember = loginMember.body.data.login.token
  })

  test("HAPPY: authenticated member sees their circles (HTTP 200)", async () => {
    const res = await graphqlRequest(MY_CIRCLES_QUERY, {}, tokenMember)
    expect(res.status).toBe(200)
    expect(res.body.data.myCircles).toBeDefined()
    expect(Array.isArray(res.body.data.myCircles)).toBe(true)
    const found = res.body.data.myCircles.find(
      (c) => parseInt(c.id, 10) === parseInt(circleId, 10)
    )
    expect(found).toBeDefined()
    expect(found.name).toBe("ClubMC")
  })

  test("SAD: unauthenticated myCircles -> error", async () => {
    const res = await graphqlRequest(MY_CIRCLES_QUERY)
    if (res.status === 200) {
      expect(res.body.errors).toBeDefined()
      expect(res.body.errors[0].message).toBeDefined()
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400)
    }
  })
})
