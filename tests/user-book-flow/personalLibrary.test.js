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
      title
      author
    }
  }
`

const PERSONAL_LIBRARY_QUERY = `
  query PersonalLibrary($page: Int, $nrBooksOnPage: Int) {
    personalLibrary(page: $page, nrBooksOnPage: $nrBooksOnPage) {
      nrOfBooks
      books {
        title
        author
      }
    }
  }
`

describe("Personal Library Query tests (happy + sad path)", () => {
  let readerToken
  let adminToken
  let readerUser

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })

    // Reader
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

    // Admin
    const adminUser = await createTestUser({
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

    // Add books to reader library
    for (let i = 1; i <= 5; i++) {
      await graphqlRequest(
        ADD_BOOK,
        { title: `Book ${i}`, author: "Test Author" },
        readerToken
      )
    }
  })

  test("HAPPY: reader fetches personal library", async () => {
    const res = await graphqlRequest(
      PERSONAL_LIBRARY_QUERY,
      {},
      readerToken
    )

    expect(res.status).toBe(200)
    expect(res.body.errors).toBeUndefined()

    const data = res.body.data.personalLibrary
    expect(data.nrOfBooks).toBe(5)
    expect(data.books.length).toBe(5)
  })

  test("HAPPY: pagination works correctly", async () => {
    const res = await graphqlRequest(
      PERSONAL_LIBRARY_QUERY,
      { page: 2, nrBooksOnPage: 2 },
      readerToken
    )

    expect(res.status).toBe(200)
    expect(res.body.errors).toBeUndefined()

    const data = res.body.data.personalLibrary
    expect(data.nrOfBooks).toBe(5)
    expect(data.books.length).toBe(2)
    expect(data.books[0].title).toBe("Book 3")
  })

  test("SAD: cannot fetch personal library without authentication", async () => {
    const res = await graphqlRequest(PERSONAL_LIBRARY_QUERY)

    expect(res.body.data.personalLibrary).toBeNull()
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "You must be logged in to view this information"
    )
  })

  test("SAD: admin cannot access personal library", async () => {
    const res = await graphqlRequest(
      PERSONAL_LIBRARY_QUERY,
      {},
      adminToken
    )

    expect(res.body.data.personalLibrary).toBeNull()
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "Admins are not allowed to have a personal library. Use a different account"
    )
  })

  test("SAD: page must be >= 1", async () => {
    const res = await graphqlRequest(
      PERSONAL_LIBRARY_QUERY,
      { page: 0 },
      readerToken
    )

    expect(res.body.data.personalLibrary).toBeNull()
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe("page must be >= 1")
  })

  test("SAD: nrBooksOnPage must be >= 1", async () => {
    const res = await graphqlRequest(
      PERSONAL_LIBRARY_QUERY,
      { nrBooksOnPage: 0 },
      readerToken
    )

    expect(res.body.data.personalLibrary).toBeNull()
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "nrBooksOnPage must be >= 1"
    )
  })
})
