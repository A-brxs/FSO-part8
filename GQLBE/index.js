const { ApolloServer, UserInputError, gql } = require('apollo-server')
const { v1: uuid } = require('uuid')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const Book = require('./models/book')
const Author = require('./models/author')

require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]
  }
  type Author {
    name: String!
    born: String
    bookCount: Int!
  }
  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  },
  type Mutation {
  addBook(
    title: String!,
    author: String!,
    published: Int!,
    genres: [String!]
  ): Book
  editAuthor(
    name: String!,
    setBornTo: Int!
  ): Author
}
`

const resolvers = {
  Query: {
    bookCount: async (root,args) => {
      if (!args.author) {
        return Book.collection.countDocuments()
      }
    },
    allBooks: async (root,args) => {
      if (args.author || args.genre) {
        let filteredBooks = {}
        let findAuthor = {}
        if (args.author) {
          findAuthor = await Author.findOne({ name: args.author })
          if (args.genre) {
            filteredBooks = await Book.find( { author: findAuthor._id, genres: args.genre })
            return filteredBooks
          }
          return filteredBooks = await Book.find( { author: findAuthor._id })
        }
        if (!args.author) {
          if (args.genre) {
            filteredBooks = await Book.find( { genres: args.genre })
            return filteredBooks
          }
        }
      }
      return Book.find({})
    },
    authorCount: async () => Author.collection.countDocuments(),
    allAuthors: async (root,args) => {
      return Author.find({})
    }
  },
  Author: {
    name: (root) => root.name,
    born: (root) => root.born,
    bookCount: (root) => {
      // const authorBookCount = books.filter(b => b.author === root.name )
      return console.log('BookCount')
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      console.log(args)
      let findBook = await Book.findOne( { title: args.title })
      if (findBook) {
        throw new UserInputError('Title must be unique', {
          invalidArgs: args.title,
        })
      }
      let findAuthor = await Author.findOne( { name: args.author })
      if (!findAuthor) {
        findAuthor = new Author({
          name: args.author
        })
        console.log(findAuthor)
        await findAuthor.save()
      }

      const newBook = new Book(
        { ...args,
          author: findAuthor._id
        }
      )
      return newBook.save()
    

    },
    editAuthor: async (root,args) => {
      // const author = authors.find(a => a.name === args.name)
      // if (!author) {
      //   return null
      // }
  
      // const updatedAuthor = { ...author, born: args.setBornTo }
      // authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
      // return updatedAuthor
      console.log('editAuthor',args)
      let author = await Author.findOne({ name: args.name })
      return Author.findByIdAndUpdate(author._id, {born: args.setBornTo}, {new: true} )
    }   
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})