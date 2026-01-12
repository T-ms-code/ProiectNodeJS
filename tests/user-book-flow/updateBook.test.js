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

const UPDATE_BOOK_MUTATION = `
  mutation UpdateBook(
    $bookId: Int!,
    $status: String,
    $currentPage: Int,
    $rating: Int,
    $visibility: String
  ) {
    updateBook(
      input: {
        bookId: $bookId
        status: $status
        currentPage: $currentPage
        rating: $rating
        visibility: $visibility
      }
    )
  }
`

describe("Update Book tests (happy + sad path)", () => {
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
            title: "Ion",
            author: "Liviu Rebreanu",
        },
        token
    )

    bookId = bookRes.body.data.createBook.id
  })

  test("HAPPY: user updates status and currentPage", async () => {
    const res = await graphqlRequest(
        UPDATE_BOOK_MUTATION,
        {
            bookId,
            status: "in-progress",
            currentPage: 50,
        },
        token
    )

    expect(res.status).toBe(200)
    expect(res.body.data.updateBook).toBe(
        `Book with ID: ${bookId} updated successfully in your library`
    )

    const entry = await db.PersonalLibrary.findOne({
        where: { userId: user.id, bookId },
    })

    expect(entry.status).toBe("in-progress")
    expect(entry.currentPage).toBe(50)
  })


  test("SAD: invalid status value", async () => {
    const res = await graphqlRequest(
      UPDATE_BOOK_MUTATION,
      {
        bookId,
        status: "finished",
      },
      token
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "Status must be in [read, to-read, in-progress]"
    )
  })

  test("SAD: rating out of range", async () => {
    const res = await graphqlRequest(
      UPDATE_BOOK_MUTATION,
      {
        bookId,
        rating: 20,
      },
      token
    )

    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe(
      "Rating must be in [null, 1..10]"
    )
  })
})
