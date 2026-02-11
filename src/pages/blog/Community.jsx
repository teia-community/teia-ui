import { useBlogPosts } from '@data/swr'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { BlogPostCard } from './components/BlogPostCard'
import styles from '@style'

export default function Community() {
  const { data, error, isLoading } = useBlogPosts(100)

  if (error) {
    return (
      <Container>
        <p>Error loading blog posts: {error.message}</p>
      </Container>
    )
  }

  if (isLoading || !data) {
    return <Loading message="Loading blog posts" />
  }

  const posts = data.tokens || []

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No blog posts yet. Be the first to write one!</p>
      </div>
    )
  }

  return (
    <div className={styles.posts_list}>
      {posts.map((nft) => (
        <BlogPostCard key={nft.token_id} nft={nft} />
      ))}
    </div>
  )
}
