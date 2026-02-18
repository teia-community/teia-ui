import { Link, useOutletContext } from 'react-router-dom'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { useBlogPostsByArtist } from '@data/swr'
import { BlogPostCard } from '@pages/blog/components/BlogPostCard'
import styles from './blog-posts.module.scss'

export default function BlogPosts() {
  const { address } = useOutletContext()
  const connectedAddress = useUserStore((st) => st.address)

  const { data, error, isLoading } = useBlogPostsByArtist(address)

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
  const isOwnProfile = address === connectedAddress

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          No blog posts yet.
          {isOwnProfile && (
            <>
              {' '}
              <Link to="/blog/newpost">Write your first post!</Link>
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.posts_list}>
      {posts.map((nft) => (
        <BlogPostCard key={nft.token_id} nft={nft} showBurn={isOwnProfile} />
      ))}
    </div>
  )
}
