const { gql } = require("../helpers/gql")
const db = require("../../models")
const bcrypt = require("bcrypt")

describe("circleMessages query tests (happy + sad path)", () => {
  let tokenMember
  let tokenOutsider
  let circleId
  let chatId
  let memberUser
  let outsiderUser
  let memberCircleMember

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    // seed member user
    const hash1 = await bcrypt.hash("password", 10)
    memberUser = await db.User.create({
      name: "Mike Tyson",
      email: "mike@test.com",
      password: hash1,
      age: 30,
      country: "RO",
      bio: "test",
      role: "user",
    })

    // login member
    const loginRes1 = await gql({
      query: `
        mutation {
          login(input:{ name:"Mike Tyson", password:"password" }) {
            ... on LoggedInUserType { token }
          }
        }
      `,
    })
    tokenMember = loginRes1.body.data.login.token

    // create circle
    const circleRes = await gql({
      token: tokenMember,
      query: `
        mutation {
          createReadingCircle(input:{ name:"Test", description:"desc" }) { id }
        }
      `,
    })
    circleId = circleRes.body.data.createReadingCircle.id

    const chat = await db.Chat.findOne({ where: { circleId } })
    expect(chat).toBeTruthy()
    chatId = chat.id

    memberCircleMember = await db.CircleMember.findOne({
      where: { userId: memberUser.id, circleId, status: "accepted" },
    })
    expect(memberCircleMember).toBeTruthy()

    // seed outsider user
    const hash2 = await bcrypt.hash("password2", 10)
    outsiderUser = await db.User.create({
      name: "Outsider",
      email: "out@test.com",
      password: hash2,
      age: 20,
      country: "RO",
      bio: "outsider",
      role: "user",
    })

    const loginRes2 = await gql({
      query: `
        mutation {
          login(input:{ name:"Outsider", password:"password2" }) {
            ... on LoggedInUserType { token }
          }
        }
      `,
    })
    tokenOutsider = loginRes2.body.data.login.token

    // create 10 messages
    const base = Date.now() - 10 * 1000
    const bulk = Array.from({ length: 10 }).map((_, i) => ({
      chatId,
      memberId: memberCircleMember.id,
      content: `m${i + 1}`, // m1..m10
      createdAt: new Date(base + i * 1000),
      updatedAt: new Date(base + i * 1000),
    }))

    await db.Message.bulkCreate(bulk)
  })

  test("SAD: UNAUTHENTICATED without token", async () => {
    const res = await gql({
      query: `
        query {
          circleMessages(circleId:${circleId}, page:1, pageSize:5) {
            id
          }
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/UNAUTHENTICATED/)
  })

  test("SAD: FORBIDDEN if not a member", async () => {
    const res = await gql({
      token: tokenOutsider,
      query: `
        query {
          circleMessages(circleId:${circleId}, page:1, pageSize:5) {
            id
          }
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/FORBIDDEN/i)
  })

  test("HAPPY: member can read messages (ordered DESC)", async () => {
    const res = await gql({
      token: tokenMember,
      query: `
        query {
          circleMessages(circleId:${circleId}, page:1, pageSize:5) {
            id
            content
            member {
              id
              role
              user {
                id
                name
              }
            }
          }
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    const msgs = res.body.data.circleMessages
    expect(msgs).toHaveLength(5)

    expect(msgs[0].content).toBe("m10")
    expect(msgs[1].content).toBe("m9")
    expect(msgs[4].content).toBe("m6")

    expect(msgs[0].member).toBeTruthy()
    expect(msgs[0].member.user).toBeTruthy()
    expect(msgs[0].member.user.name).toBe("Mike Tyson")
  })

  test("HAPPY: pagination works (page 2, pageSize 5)", async () => {
    const res = await gql({
      token: tokenMember,
      query: `
        query {
          circleMessages(circleId:${circleId}, page:2, pageSize:5) {
            content
          }
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    const msgs = res.body.data.circleMessages
    expect(msgs).toHaveLength(5)

    // page 1 would be m10..m6, page 2 should be m5..m1
    expect(msgs[0].content).toBe("m5")
    expect(msgs[4].content).toBe("m1")
  })

  test("EDGE: pageSize < 1 becomes 1", async () => {
    const res = await gql({
      token: tokenMember,
      query: `
        query {
          circleMessages(circleId:${circleId}, page:1, pageSize:0) {
            content
          }
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.circleMessages).toHaveLength(1)
    expect(res.body.data.circleMessages[0].content).toBe("m10")
  })

  test("EDGE: page < 1 becomes 1", async () => {
    const res = await gql({
      token: tokenMember,
      query: `
        query {
          circleMessages(circleId:${circleId}, page:0, pageSize:3) {
            content
          }
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.circleMessages).toHaveLength(3)
    expect(res.body.data.circleMessages[0].content).toBe("m10")
  })
})
