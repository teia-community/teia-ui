import { gql } from 'graphql-request'
import { Link, Navigate } from 'react-router-dom'
import useSWR from 'swr'
import { request } from 'graphql-request'
import { HEN_CONTRACT_FA2 } from '@constants'
import { BaseTokenFieldsFragment } from '@data/api'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { BlogPostCard } from './components/BlogPostCard'
import styles from '@style'
import laggy from '@utils/swr-laggy-middleware'

const YOUR_BLOG_POSTS_QUERY = gql`
  ${BaseTokenFieldsFragment}
  query YourBlogPosts($address: String!) {
    tokens(
      where: {
        artist_address: { _eq: $address }
        _or: [
          { mime_type: { _eq: "text/plain" } }
          { mime_type: { _eq: "text/markdown" } }
        ]
        editions: { _gt: 0 }
        metadata_status: { _eq: "processed" }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
      }
      order_by: { minted_at: desc }
    ) {
      ...baseTokenFields
    }
  }
`

export default function YourPosts() {
  const address = useUserStore((st) => st.address)

  const { data, error, isLoading } = useSWR(
    address ? ['your-blog-posts', address] : null,
    () =>
      request(import.meta.env.VITE_TEIA_GRAPHQL_API, YOUR_BLOG_POSTS_QUERY, {
        address,
      }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  )

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
