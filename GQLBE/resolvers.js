const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

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
            filteredBooks = await Book.find( { author: findAuthor._id, genres: args.genre }).populate('author')
            return filteredBooks
          }
          return filteredBooks = await Book.find( { author: findAuthor._id })
        }
        if (!args.author) {
          if (args.genre) {
            filteredBooks = await Book.find( { genres: args.genre }).populate('author')
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
          author: findAuthor
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
      pubsub.publish('BOOK_ADDED', { bookAdded: newBook })
      return newBook
    },
    editAuthor: async (root,args, { currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('wrong credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        }) 
      }
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
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    },
  }
}

module.exports = resolvers