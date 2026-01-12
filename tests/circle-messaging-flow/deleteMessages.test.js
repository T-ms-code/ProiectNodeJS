const { gql } = require("../helpers/gql")
const db = require("../../models")
const bcrypt = require("bcrypt")

describe("DeleteMessage tests (happy + sad path)", () => {
  let tokenAdmin
  let tokenMod
  let tokenUser

  let circleId
  let chatId

  let adminUser
  let modUser
  let normalUser

  let adminMember
  let modMember
  let normalMember

  let msgByAdminId
  let msgByUserId

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    // users
    const hashAdmin = await bcrypt.hash("password", 10)
    adminUser = await db.User.create({
      name: "Admin",
      email: "admin@test.com",
      password: hashAdmin,
      age: 30,
      country: "RO",
      bio: "admin",
      role: "user",
    })

    const hashMod = await bcrypt.hash("password2", 10)
    modUser = await db.User.create({
      name: "Mod",
      email: "mod@test.com",
      password: hashMod,
      age: 28,
      country: "RO",
      bio: "mod",
      role: "user",
    })

    const hashUser = await bcrypt.hash("password3", 10)
    normalUser = await db.User.create({
      name: "User",
      email: "user@test.com",
      password: hashUser,
      age: 22,
      country: "RO",
      bio: "user",
      role: "user",
    })

    // login tokens
    const loginAdmin = await gql({
      query: `
        mutation {
          login(input:{ name:"Admin", password:"password" }) {
            ... on LoggedInUserType { token }
          }
        }
      `,
    })
    tokenAdmin = loginAdmin.body.data.login.token

    const loginMod = await gql({
      query: `
        mutation {
          login(input:{ name:"Mod", password:"password2" }) {
            ... on LoggedInUserType { token }
          }
        }
      `,
    })
    tokenMod = loginMod.body.data.login.token

    const loginUser = await gql({
      query: `
        mutation {
          login(input:{ name:"User", password:"password3" }) {
            ... on LoggedInUserType { token }
          }
        }
      `,
    })
    tokenUser = loginUser.body.data.login.token

    // create circle
    const circleRes = await gql({
      token: tokenAdmin,
      query: `
        mutation {
          createReadingCircle(input:{ name:"TestCircle", description:"desc" }) { id }
        }
      `,
    })
    circleId = circleRes.body.data.createReadingCircle.id

    adminMember = await db.CircleMember.findOne({
      where: { userId: adminUser.id, circleId, status: "accepted" },
    })
    expect(adminMember).toBeTruthy()

    const chat = await db.Chat.findOne({ where: { circleId } })
    expect(chat).toBeTruthy()
    chatId = chat.id

    // create other members
    modMember = await db.CircleMember.create({
      userId: modUser.id,
      circleId,
      status: "accepted",
      circleRole: "moderator",
      requestedAt: new Date(),
      respondedAt: new Date(),
    })

    normalMember = await db.CircleMember.create({
      userId: normalUser.id,
      circleId,
      status: "accepted",
      circleRole: "member",
      requestedAt: new Date(),
      respondedAt: new Date(),
    })

    // create messages
    const msgAdmin = await db.Message.create({
      chatId,
      memberId: adminMember.id,
      content: "Message from admin",
    })
    msgByAdminId = msgAdmin.id

    const msgUser = await db.Message.create({
      chatId,
      memberId: normalMember.id,
      content: "Message from user",
    })
    msgByUserId = msgUser.id
  })

  test("HAPPY: author can delete own message", async () => {
    const res = await gql({
      token: tokenUser,
      query: `
        mutation {
          deleteMessage(messageId:${msgByUserId})
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.deleteMessage).toBe(true)

    const stillThere = await db.Message.findByPk(msgByUserId)
    expect(stillThere).toBeNull()
  })

  test("HAPPY: admin can delete any message", async () => {
    // create a new message by moderator, admin deletes it
    const msgMod = await db.Message.create({
      chatId,
      memberId: modMember.id,
      content: "Message from mod",
    })

    const res = await gql({
      token: tokenAdmin,
      query: `
        mutation {
          deleteMessage(messageId:${msgMod.id})
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.deleteMessage).toBe(true)

    const stillThere = await db.Message.findByPk(msgMod.id)
    expect(stillThere).toBeNull()
  })

  test("HAPPY: moderator can delete non-admin messages", async () => {
    // create a normal message, mod deletes it
    const msgNormal2 = await db.Message.create({
      chatId,
      memberId: normalMember.id,
      content: "Another message from user",
    })

    const res = await gql({
      token: tokenMod,
      query: `
        mutation {
          deleteMessage(messageId:${msgNormal2.id})
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.deleteMessage).toBe(true)

    const stillThere = await db.Message.findByPk(msgNormal2.id)
    expect(stillThere).toBeNull()
  })

  test("SAD: moderator cannot delete admin messages", async () => {
    const res = await gql({
      token: tokenMod,
      query: `
        mutation {
          deleteMessage(messageId:${msgByAdminId})
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/FORBIDDEN/)
  })

  test("SAD: cannot delete without token", async () => {
    const res = await gql({
      query: `
        mutation {
          deleteMessage(messageId:${msgByAdminId})
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/UNAUTHENTICATED/)
  })

  test("SAD: cannot delete non-existent message", async () => {
    const res = await gql({
      token: tokenAdmin,
      query: `
        mutation {
          deleteMessage(messageId:999999)
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/Message not found/)
  })

  test("SAD: non-member (not accepted) cannot delete => FORBIDDEN", async () => {
    // create outsider
    const hash = await bcrypt.hash("password4", 10)
    await db.User.create({
      name: "Outsider",
      email: "out@test.com",
      password: hash,
      age: 20,
      country: "RO",
      bio: "out",
      role: "user",
    })

    const loginOut = await gql({
      query: `
        mutation {
          login(input:{ name:"Outsider", password:"password4" }) {
            ... on LoggedInUserType { token }
          }
        }
      `,
    })
    const tokenOut = loginOut.body.data.login.token

    const res = await gql({
      token: tokenOut,
      query: `
        mutation {
          deleteMessage(messageId:${msgByAdminId})
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/FORBIDDEN/)
  })
})
