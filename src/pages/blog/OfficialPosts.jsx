import { useOfficialBlogPosts } from '@data/swr'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { BlogPostCard } from './components/BlogPostCard'
import styles from '@style'

export default function OfficialPosts() {
  const { data, error, isLoading } = useOfficialBlogPosts(100)

  if (error) {
    return (
      <Container>
        <p>Error loading official posts: {error.message}</p>
      </Container>
    )
  }

  if (isLoading || !data) {
    return <Loading message="Loading official posts" />
  }

  const posts = data.tokens || []

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No official blog posts yet.</p>
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
