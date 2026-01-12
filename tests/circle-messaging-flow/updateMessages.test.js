const { gql } = require("../helpers/gql")
const db = require("../../models")
const bcrypt = require("bcrypt")

describe("UpdateMessage tests (circle-aware)", () => {
  let tokenAuthor
  let tokenAdmin
  let tokenOutsider
  let circleId
  let messageId

  let authorUser
  let adminUser
  let outsiderUser

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    // users
    authorUser = await db.User.create({
      name: "Author",
      email: "author@test.com",
      password: await bcrypt.hash("pass", 10),
      age: 30,
      country: "RO",
      bio: "author",
      role: "user",
    })

    adminUser = await db.User.create({
      name: "Admin",
      email: "admin@test.com",
      password: await bcrypt.hash("pass", 10),
      age: 30,
      country: "RO",
      bio: "admin",
      role: "user",
    })

    outsiderUser = await db.User.create({
      name: "Outsider",
      email: "outsider@test.com",
      password: await bcrypt.hash("pass", 10),
      age: 30,
      country: "RO",
      bio: "outsider",
      role: "user",
    })

    const login = async (name) => {
      const res = await gql({
        query: `
          mutation {
            login(input:{ name:"${name}", password:"pass" }) {
              ... on LoggedInUserType { token }
            }
          }
        `,
      })
      return res.body.data.login.token
    }

    tokenAuthor = await login("Author")
    tokenAdmin = await login("Admin")
    tokenOutsider = await login("Outsider")

    const circleRes = await gql({
      token: tokenAdmin,
      query: `
        mutation {
          createReadingCircle(input:{ name:"Circle", description:"desc" }) { id }
        }
      `,
    })
    circleId = circleRes.body.data.createReadingCircle.id

    // ensure accepted memberships + roles
    const ensureMember = async (userId, role) => {
      const existing = await db.CircleMember.findOne({ where: { userId, circleId } })
      if (existing) return existing.update({ status: "accepted", circleRole: role })
      return db.CircleMember.create({
        userId,
        circleId,
        status: "accepted",
        circleRole: role,
      })
    }

    await ensureMember(authorUser.id, "member")
    await ensureMember(adminUser.id, "admin")

    // author sends a message in this circle
    const sendRes = await gql({
      token: tokenAuthor,
      query: `
        mutation {
          sendMessage(input:{ circleId:${circleId}, content:"Salut!" }) { id content }
        }
      `,
    })
    messageId = Number(sendRes.body.data.sendMessage.id)
  })

  test("HAPPY: author can update own message (in same circle)", async () => {
    const res = await gql({
      token: tokenAuthor,
      query: `
        mutation {
          updateMessage(input:{ messageId:${messageId}, content:"Editat de autor" }) {
            id
            content
          }
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.updateMessage.content).toBe("Editat de autor")
  })

  test("HAPPY: admin can update someone else's message (same circle)", async () => {
    const res = await gql({
      token: tokenAdmin,
      query: `
        mutation {
          updateMessage(input:{ messageId:${messageId}, content:"Editat de admin" }) {
            id
            content
          }
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.updateMessage.content).toBe("Editat de admin")
  })

  test("SAD: outsider (not accepted member in circle) cannot update", async () => {
    const res = await gql({
      token: tokenOutsider,
      query: `
        mutation {
          updateMessage(input:{ messageId:${messageId}, content:"H4x" }) {
            id
            content
          }
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/FORBIDDEN/)
  })

  test("SAD: cannot update with blank content", async () => {
    const res = await gql({
      token: tokenAuthor,
      query: `
        mutation {
          updateMessage(input:{ messageId:${messageId}, content:"   " }) {
            id
            content
          }
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/Message is empty/)
  })
})
