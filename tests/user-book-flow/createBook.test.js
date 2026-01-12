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

const CREATE_BOOK_MUTATION = `
  mutation CreateBook($title: String!, $author: String!) {
    createBook(input: { title: $title, author: $author }) {
      id
      title
      author
    }
  }
`

describe("Create Book tests (happy + sad path)", () => {
  let token
  let user

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    user = await createTestUser({
      name: "John Reader",
      email: "john@test.com",
      password: "password",
      age: 25,
      country: "RO",
      bio: "Book lover",
      role: "reader",
    })

    const loginRes = await graphqlRequest(LOGIN_MUTATION, {
      name: "John Reader",
      password: "password",
    })

    token = loginRes.body.data.login.token
  })

  test("HAPPY: authenticated reader creates book and adds it to personal library", async () => {
    const res = await graphqlRequest(
      CREATE_BOOK_MUTATION,
      {
        title: "Clean Code",
        author: "Robert C. Martin",
      },
      token
    )

    expect(res.status).toBe(200)
    expect(res.body.data.createBook.id).toBeDefined()
    expect(res.body.data.createBook.title).toBe("Clean Code")

    const bookInDb = await db.Book.findOne({
      where: { title: "Clean Code", author: "Robert C. Martin" },
    })
    expect(bookInDb).toBeDefined()

    const libraryEntry = await db.PersonalLibrary.findOne({
      where: {
        userId: user.id,
        bookId: bookInDb.id,
      },
    })
    expect(libraryEntry).toBeDefined()
    expect(libraryEntry.status).toBe("to-read")
  })


  test("SAD: cannot add same book twice to personal library", async () => {
    const res = await graphqlRequest(
      CREATE_BOOK_MUTATION,
      {
        title: "Clean Code",
        author: "Robert C. Martin",
      },
      token
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "Book is already in personal library"
    )
  })
})
