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

const CREATE_BOOK_MUTATION = `
  mutation CreateBook($title: String!, $author: String!) {
    createBook(input: { title: $title, author: $author }) {
      id
      title
    }
  }
`

const DELETE_BOOK_MUTATION = `
  mutation DeleteBook($bookId: Int!) {
    deleteBook(bookId: $bookId)
  }
`

describe("Delete Book tests (happy + sad path)", () => {
  let readerUser
  let readerToken
  let adminUser
  let adminToken
  let bookId

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    // Reader user
    readerUser = await createTestUser({
      name: "Reader User",
      email: "reader@test.com",
      password: "password",
      role: "reader",
    })

    const readerLogin = await graphqlRequest(LOGIN_MUTATION, {
      name: "Reader User",
      password: "password",
    })
    readerToken = readerLogin.body.data.login.token

    // Admin user
    adminUser = await createTestUser({
      name: "Admin User",
      email: "admin@test.com",
      password: "password",
      role: "admin",
    })

    const adminLogin = await graphqlRequest(LOGIN_MUTATION, {
      name: "Admin User",
      password: "password",
    })
    adminToken = adminLogin.body.data.login.token

    const createBookRes = await graphqlRequest(
      CREATE_BOOK_MUTATION,
      {
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt",
      },
      readerToken
    )

    bookId = createBookRes.body.data.createBook.id
  })

  test("HAPPY: reader deletes book from personal library", async () => {
    const res = await graphqlRequest(
      DELETE_BOOK_MUTATION,
      { bookId },
      readerToken
    )

    expect(res.status).toBe(200)
    expect(res.body.data.deleteBook).toBe(
      `Book with ID: ${bookId} deleted successfully from your library`
    )

    const entry = await db.PersonalLibrary.findOne({
      where: { userId: readerUser.id, bookId },
    })
    expect(entry).toBeNull()
  })

  test("SAD: admin cannot delete books from personal library", async () => {
    const res = await graphqlRequest(
      DELETE_BOOK_MUTATION,
      { bookId },
      adminToken
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "Admins are not allowed to have a personal library. Use a different account"
    )
  })

  test("SAD: cannot delete book not found in personal library", async () => {
    const res = await graphqlRequest(
      DELETE_BOOK_MUTATION,
      { bookId: 9999 },
      readerToken
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "Book not found in your library"
    )
  })
})
