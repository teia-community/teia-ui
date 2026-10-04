import { useHolderTextPosts } from '@data/text'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { TextPostCard } from '../../components/text/TextPostCard'
import { RoleLegend } from '@components/user-badges'
import styles from '@style'

export default function MemberPosts() {
  const { data, error, isLoading } = useHolderTextPosts(100)

  if (error) {
    return (
      <Container>
        <p>Error loading TEIA member posts: {error.message}</p>
      </Container>
    )
  }

  if (isLoading || !data) {
    return <Loading message="Loading TEIA member posts" />
  }

  const posts = data.tokens || []

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No text posts from TEIA members yet.</p>
      </div>
    )
  }

  return (
    <>
      <p className={styles.description}>
        Posts from members who currently hold TEIA tokens.
        <RoleLegend className={styles.legend} />
      </p>
      <div className={styles.posts_list}>
        {posts.map((nft) => (
          <TextPostCard key={nft.token_id} nft={nft} />
        ))}
      </div>
    </>
  )
}
