import { Link, Navigate } from 'react-router-dom'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { useTextPostsByArtist } from '@data/swr'
import { TextPostCard } from '../../components/text/TextPostCard'
import styles from '@style'

export default function YourPosts() {
  const address = useUserStore((st) => st.address)

  const { data, error, isLoading } = useTextPostsByArtist(address)

  // Redirect to text if not connected
  if (!address) {
    return <Navigate to="/text" replace />
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
          You haven't written any text posts yet.{' '}
          <Link to="/text/newpost">Write your first post!</Link>
        </p>
      </div>
    )
  }

  return (
    <div className={styles.posts_list}>
      {posts.map((nft) => (
        <TextPostCard key={nft.token_id} nft={nft} showBurn />
      ))}
    </div>
  )
}
