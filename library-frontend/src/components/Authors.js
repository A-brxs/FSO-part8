import { useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'
import { ALL_AUTHORS, EDIT_AUTHOR} from '../defs/queries'

const Authors = (props) => {

  const authors = useQuery(ALL_AUTHORS)
  const [name,setName] = useState('')
  const [born,setBirth] = useState('')

  const [ addBirth ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [ { query: ALL_AUTHORS} ],
    onError: (error) => {
      console.log(error.graphQLErrors[0].message)
    }
  })

  if (authors.loading) {
    return <div>loading...</div>
  }
  if (!props.show) {
    return null
  }


  const submit = async (event) => {
    event.preventDefault()

    addBirth({ variables: {name,born} })
    setBirth('')
    setName('')
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.data.allAuthors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      { !props.token ? null : 
      <>
      <h3>add birth date</h3>
      <form onSubmit={submit}>
        <label>
          Name: 
          <select onChange={({target}) => setName(target.value)}>
          {authors.data.allAuthors.map((a) => (
            <option value={a.name}>{a.name}</option>
          ))}
          </select>
        </label>
        <div>
          Bith year: 
            <input type="number"
              value={born}
              onChange={({target}) => setBirth(Number(target.value))}
            />
        </div>
        <button type="submit">update Author</button>
      </form>
      </>}
    </div>
  )
}

export default Authors
