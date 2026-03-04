import { Link, useOutletContext } from 'react-router-dom'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { useTextPostsByArtist } from '@data/swr'
import { TextPostCard } from '@components/text/TextPostCard'
import styles from './text-posts.module.scss'

export default function TextPosts() {
  const { address } = useOutletContext()
  const connectedAddress = useUserStore((st) => st.address)

  const { data, error, isLoading } = useTextPostsByArtist(address)

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
  const isOwnProfile = address === connectedAddress

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          No text posts yet.
          {isOwnProfile && (
            <>
              {' '}
              <Link to="/text/newpost">Write your first post!</Link>
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.posts_list}>
      {posts.map((nft) => (
        <TextPostCard key={nft.token_id} nft={nft} showBurn={isOwnProfile} />
      ))}
    </div>
  )
}
