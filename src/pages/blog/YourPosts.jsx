import { Link, Navigate } from 'react-router-dom'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { useBlogPostsByArtist } from '@data/swr'
import { BlogPostCard } from './components/BlogPostCard'
import styles from '@style'

export default function YourPosts() {
  const address = useUserStore((st) => st.address)

  const { data, error, isLoading } = useBlogPostsByArtist(address)

  // Redirect to blog if not connected
  if (!address) {
    return <Navigate to="/blog" replace />
  }

  if (error) {
    return (
      <Container>
        <p>Error loading your posts: {error.message}</p>
      </Container>
    )
  }

  if (isLoading || !data) {
    return <Loading message="Loading your posts" />
  }

  const posts = data.tokens || []

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          You haven't written any blog posts yet.{' '}
          <Link to="/blog/newpost">Write your first post!</Link>
        </p>
      </div>
    )
  }

  return (
    <div className={styles.posts_list}>
      {posts.map((nft) => (
        <BlogPostCard key={nft.token_id} nft={nft} showBurn />
      ))}
    </div>
  )
}
