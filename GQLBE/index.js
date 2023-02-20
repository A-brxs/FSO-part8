// const { ApolloServer, UserInputError, gql } = require('apollo-server')
const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')

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

const typeDefs = `
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
  type User {
  username: String!
  favouriteGenre: String!
  id: ID!
  }
  type Token {
    value: String!
  }
  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
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
  createUser(
    username: String!
    favouriteGenre: String!
  ): User
  login(
    username: String!
    password: String!
  ): Token
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
      return Book.find({}).populate('author')
    },
    authorCount: async () => Author.collection.countDocuments(),
    allAuthors: async (root,args) => {
      return Author.find({})
    },
    me: (root, args, context) => {
      return context.currentUser
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
    addBook: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('wrong credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        }) 
      }
      let findAuthor = await Author.findOne( { name: args.author })
      if (!findAuthor) {
        findAuthor = new Author({
          name: args.author
        })
        console.log(findAuthor)
        try {
          await findAuthor.save()          
        } catch (error) {
          throw new GraphQLError('Saving Author failed',{
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.author,
              error
            }
          })          
        }
      }
      
      const newBook = new Book(
        { ...args,
          author: findAuthor._id
        }
      )
      try {
        await newBook.save()
      } catch (error) {
        throw new GraphQLError('Saving Book failed',{
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.title,
            error
          }
        })
      }
      return newBook
    

    },
    editAuthor: async (root,args, { currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('wrong credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        }) 
      }
      // const author = authors.find(a => a.name === args.name)
      // if (!author) {
      //   return null
      // }
  
      // const updatedAuthor = { ...author, born: args.setBornTo }
      // authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
      // return updatedAuthor
      console.log('editAuthor',args)
      let author = await Author.findOne({ name: args.name })
      let updatedAuthor = {}
      try {
        updatedAuthor = await Author.findByIdAndUpdate(author._id, {born: args.setBornTo}, {new: true} )
      } catch (error) {
        throw new GraphQLError('Updating Author failed',{
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }
      return updatedAuthor
    },
    createUser: async (root, args) => {
      const user = new User({ username: args.username, favouriteGenre: args.favouriteGenre })
  
      return user.save()
        .catch(error => {
          throw new GraphQLError('Creating the user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'secret' ) {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })        
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
      )
      const currentUser = await User
        .findById(decodedToken.id)
      return { currentUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})