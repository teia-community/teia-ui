import { useTextPosts } from '@data/swr'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { TextPostCard } from '../../components/text/TextPostCard'
import styles from '@style'

export default function Community() {
  const { data, error, isLoading } = useTextPosts(100)

  if (error) {
    return (
      <Container>
        <p>Error loading text posts: {error.message}</p>
      </Container>
    )
  }

  if (isLoading || !data) {
    return <Loading message="Loading text posts" />
  }

  const posts = data.tokens || []

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No text posts yet. Be the first to write one!</p>
      </div>
    )
  }

  return (
    <div className={styles.posts_list}>
      {posts.map((nft) => (
        <TextPostCard key={nft.token_id} nft={nft} />
      ))}
    </div>
  )
}
