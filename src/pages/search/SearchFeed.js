import TagFeed from './TagFeed'
import { useSearchParams } from 'react-router-dom'

function SearchFeed() {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('term') || ''

  return <TagFeed namespace="search-feed" tag={searchTerm} />
}

export default SearchFeed
