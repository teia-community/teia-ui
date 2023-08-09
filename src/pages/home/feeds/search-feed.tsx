import TagFeed from './tag-feed'
import { useSearchParams } from 'react-router-dom'

export function SearchFeed() {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('term') || ''

  return (
    <TagFeed
      label="Search"
      feeds_menu={false}
      namespace="search-feed"
      tag={searchTerm}
    />
  )
}

export default SearchFeed
