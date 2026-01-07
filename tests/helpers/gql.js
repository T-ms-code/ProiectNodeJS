const request = require("supertest")
const { app } = require("../../app") 

async function gql({ query, token }) {
  const r = request(app)
    .post("/graphql")
    .send({ query })
    .set("Content-Type", "application/json")

  if (token) {
    r.set("Authorization", `Bearer ${token}`)
  }

  return r
}

module.exports = { gql }
