const request = require("supertest");
const { app } = require("../../app");
const db = require("../../models");
const bcrypt = require("bcrypt");



const createTestUser = async (userData = {}) => {
  const defaultData = {
    name: "testuser",
    email: "testuser@test.com",
    password: "password",
    age: 30,
    country: "RO",
    bio: "test",
    role: "user",
  };

  const data = { ...defaultData, ...userData };
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await db.User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    age: data.age,
    country: data.country,
    bio: data.bio,
    role: data.role
  });

  return user;

}


const graphqlRequest = (query, variables = {}, token = null) => {
  const req = request(app)
    .post('/graphql')
    .send({
      query,
      variables,
    });

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};




async function gql({ query, token }) {
  const r = request(app)
    .post("/graphql")
    .send({ query })
    .set("Content-Type", "application/json")

  if (token) {
    r.set("Authorization", `Bearer ${token}`)
  }

  return r //the request is sent when the Promise is consumed
}



module.exports = { 
  gql,
  createTestUser,
  graphqlRequest
}
