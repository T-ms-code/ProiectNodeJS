const { createTestUser, graphqlRequest } = require("../helpers/gql")
const db = require("../../models")

const LOGIN_MUTATION = `
  mutation Login($name: String!, $password: String!) {
    login(input: { name: $name, password: $password }) {
      ... on LoggedInUserType {
        id
        token
      }
    }
  }
`

const READING_CIRCLE_MEMBERS_QUERY = `
  query ReadingCircleMembers($circleId: Int!) {
    readingCircleMembers(circleId: $circleId) {
      id
      user {
        id
        name
      }
      status
    }
  }
`

async function createCircle({ name, description, ownerId }) {
  const circle = await db.ReadingCircle.create({
    name,
    description,
    ownerId,
  })
  return circle
}

async function addMemberToCircle(userId, circleId, status = "accepted") {
  return await db.CircleMember.create({ userId, circleId, status })
}

describe("Reading Circle Members Query tests", () => {
  let memberUser
  let nonMemberUser
  let memberToken
  let nonMemberToken
  let circleId

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    memberUser = await createTestUser({
      name: "Member User",
      email: "member@test.com",
      password: "password",
      role: "reader",
    })

    nonMemberUser = await createTestUser({
      name: "NonMember User",
      email: "nonmember@test.com",
      password: "password",
      role: "reader",
    })

    const loginMember = await graphqlRequest(LOGIN_MUTATION, {
      name: "Member User",
      password: "password",
    })
    memberToken = loginMember.body.data.login.token

    const loginNonMember = await graphqlRequest(LOGIN_MUTATION, {
      name: "NonMember User",
      password: "password",
    })
    nonMemberToken = loginNonMember.body.data.login.token

    const circle = await createCircle({
      name: "Test Circle",
      description: "Circle for testing",
      ownerId: memberUser.id,
    })
    circleId = circle.id

    await addMemberToCircle(memberUser.id, circleId, "accepted")
  })

  test("HAPPY: member fetches circle members", async () => {
    const res = await graphqlRequest(
      READING_CIRCLE_MEMBERS_QUERY,
      { circleId },
      memberToken
    )

    expect(res.status).toBe(200)
    expect(res.body.errors).toBeUndefined()

    const members = res.body.data.readingCircleMembers
    expect(members.length).toBe(1)
    expect(members[0].user.id).toBe(memberUser.id)
    expect(members[0].status).toBe("accepted")
  })

  test("SAD: non-member cannot fetch members", async () => {
    const res = await graphqlRequest(
      READING_CIRCLE_MEMBERS_QUERY,
      { circleId },
      nonMemberToken
    )

    expect(res.body.data).toBeDefined()
    expect(res.body.data.readingCircleMembers).toBeNull()

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("FORBIDDEN")
  })

})
