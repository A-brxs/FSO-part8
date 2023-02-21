import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { ALL_BOOKS, ME } from '../defs/queries'

const Recommended = (props) => {
  const books = useQuery(ALL_BOOKS)
  const user = useQuery(ME)
  const [filteredBooks,setFilteredBooks] = useState([''])
  const [checkBook,setCheckBook] = useState('')

  const handleGenre = () => {
    let tempBooks = books.data.allBooks.filter( fb => fb.genres.includes(user.data.me.favouriteGenre))
    setFilteredBooks(tempBooks)
    
  }

  useEffect(() => {
    if (books.data) {
      setFilteredBooks(books.data.allBooks)
      setCheckBook('ok')
    }
  }, [books])

  useEffect(() => {
      if (user.data) {
        console.log('ME: ',user)
          handleGenre()
      }
    
  }, [checkBook,user]) // eslint-disable-line


  if (books.loading) {
    return <div>loading...</div>
  }
  if (!user.data) {
    return <div>loading...</div>
  }
  if (!props.show) {
    return null
  }
  
  return (
    <div>
      <h2>Recommendations</h2>
      <p>Recommended based on your genre {user.data.me.favouriteGenre}</p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {filteredBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommended
