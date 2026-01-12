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

const ADD_BOOK = `
  mutation AddBook($title: String!, $author: String!) {
    createBook(input: { title: $title, author: $author }) {
      id
      title
      author
    }
  }
`

const BOOK_QUERY = `
  query Book($bookId: Int!) {
    book(bookId: $bookId) {
      book {
        id
        title
        author
      }
      status
      currentPage
      rating
      visibility
    }
  }
`

describe("Book Query tests (happy + sad path)", () => {
  let token
  let user
  let bookId

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    user = await createTestUser({
      name: "John Reader",
      email: "john@test.com",
      password: "password",
      role: "reader",
    })

    const loginRes = await graphqlRequest(LOGIN_MUTATION, {
      name: "John Reader",
      password: "password",
    })
    token = loginRes.body.data.login.token

    const bookRes = await graphqlRequest(
      ADD_BOOK,
      {
        title: "Morometii",
        author: "Marin Preda",
      },
      token
    )

    bookId = bookRes.body.data.createBook.id
  })

  test("HAPPY: authenticated user fetches book with personal data", async () => {
    const res = await graphqlRequest(
      BOOK_QUERY,
      { bookId },
      token
    )

    expect(res.status).toBe(200)

    const data = res.body.data.book
    expect(data.book.id).toBe(bookId)
    expect(data.book.title).toBe("Morometii")
    expect(data.status).toBe("to-read")
    expect(data.currentPage).toBe(0)
    expect(data.rating).toBeNull()
    expect(data.visibility).toBe("private")
  })

  test("SAD: book does not exist", async () => {
    const res = await graphqlRequest(
      BOOK_QUERY,
      { bookId: 9999 },
      token
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "Error retrieving book data: Book not found"
    )
  })

  test("SAD: book exists but not in user's personal library", async () => {
    // create another user
    const otherUser = await createTestUser({
      name: "Other User",
      email: "other@test.com",
      password: "password",
      role: "reader",
    })

    const loginRes = await graphqlRequest(LOGIN_MUTATION, {
      name: "Other User",
      password: "password",
    })
    const otherToken = loginRes.body.data.login.token

    const res = await graphqlRequest(
      BOOK_QUERY,
      { bookId },
      otherToken
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "Error retrieving book data: This book is not in your personal library"
    )
  })
})
