const { gql } = require("../helpers/gql")
const db = require("../../models")
const bcrypt = require("bcrypt")

describe("Messages tests (happy + sad path)", () => {
  let token
  let circleId
  let messageId
  let outsiderToken

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    // seed user
    const hash = await bcrypt.hash("password", 10)
    await db.User.create({
      name: "Mike Tyson",
      email: "mike@test.com",
      password: hash,
      age: 30,
      country: "RO",
      bio: "test",
      role: "user",
    })

    // login
    const loginRes = await gql({
      query: `
        mutation {
          login(input:{ name:"Mike Tyson", password:"password" }) {
            ... on LoggedInUserType { token }
          }
        }
      `,
    })
    token = loginRes.body.data.login.token

    // create circle
    const circleRes = await gql({
      token,
      query: `
        mutation {
          createReadingCircle(input:{ name:"Test", description:"desc" }) { id }
        }
      `,
    })
    circleId = circleRes.body.data.createReadingCircle.id

    // seed outsider user 
    const hash2 = await bcrypt.hash("password2", 10)
    await db.User.create({
      name: "Outsider",
      email: "out@test.com",
      password: hash2,
      age: 20,
      country: "RO",
      bio: "outsider",
      role: "user",
    })

    const loginOut = await gql({
      query: `
        mutation {
          login(input:{ name:"Outsider", password:"password2" }) {
            ... on LoggedInUserType { token }
          }
        }
      `,
    })
    outsiderToken = loginOut.body.data.login.token
  })

  test("HAPPY: member can send message", async () => {
    const res = await gql({
      token,
      query: `
        mutation {
          sendMessage(input:{ circleId:${circleId}, content:"Salut!" }) {
            id
            content
          }
        }
      `,
    })

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.sendMessage.content).toBe("Salut!")
    messageId = res.body.data.sendMessage.id
  })

  test("SAD: cannot send message without token", async () => {
    const res = await gql({
      query: `
        mutation {
          sendMessage(input:{ circleId:${circleId}, content:"Hack" }) { id }
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/UNAUTHENTICATED/)
  })

  test("SAD: user who is not a circle member cannot send message", async () => {
    const res = await gql({
      token: outsiderToken,
      query: `
        mutation {
          sendMessage(input:{ circleId:${circleId}, content:"H4x" }) {
            id
          }
        }
      `,
    })

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/FORBIDDEN/i)
  })
})
