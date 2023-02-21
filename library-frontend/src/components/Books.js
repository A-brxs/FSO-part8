import { useLazyQuery, useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { ALL_BOOKS } from '../defs/queries'

const Books = (props) => {
  const books = useQuery(ALL_BOOKS)
  const [genre,setGenre] = useState(null)
  const [genres,setGenres] = useState([''])
  const [filteredBooks,setFilteredBooks] = useState([''])
  const [getFilteredBooks, {loading,error,data}] = useLazyQuery(ALL_BOOKS) // eslint-disable-line

  const handleGenre = async () => {
    let tempBooks = await getFilteredBooks({ variables: {genre: genre}})
    return setFilteredBooks(tempBooks.data.allBooks)
  }

  useEffect(() => {
    if ( books.data ) {
      console.log('setgenres')
      let genresMap = books.data.allBooks.map( g => g.genres ).flat(1)
      setGenres([ ...new Set(genresMap) ])
    }
  }, [books]) // eslint-disable-line

  useEffect(() => {
      if (books.data) {
        if (genre){
          console.log('handlegenre')
          handleGenre()
        } else {
          setFilteredBooks(books.data.allBooks)
        }
      }
    
  }, [books,genre]) // eslint-disable-line

  if (loading) return <p>Loading...</p>
  if (error) return `Error! ${error}`
  if (books.loading) {
    return <div>loading...</div>
  }
  if (filteredBooks.loading) {
    return <div>loading...</div>
  }
  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>books</h2>
      { genre ? `Filtered by ${genre}` : null}
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
      <h3>Filter by genre</h3>
      {genres.map(g => { 
        return (
          <button onClick={() => setGenre(g)} key={g}>{g}</button>
      )
      })}
      <button onClick={() => setGenre(null)} key='clearG'>Clear Genre</button>
    </div>
  )
}

export default Books
