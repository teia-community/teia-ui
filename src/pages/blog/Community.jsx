import { gql } from 'graphql-request'
import useSWR from 'swr'
import { request } from 'graphql-request'
import { HEN_CONTRACT_FA2 } from '@constants'
import { BaseTokenFieldsFragment } from '@data/api'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { BlogPostCard } from './components/BlogPostCard'
import styles from '@style'
import laggy from '@utils/swr-laggy-middleware'

const BLOG_POSTS_QUERY = gql`
  ${BaseTokenFieldsFragment}
  query BlogPosts($limit: Int!) {
    tokens(
      where: {
        _or: [
          { mime_type: { _eq: "text/plain" } }
          { mime_type: { _eq: "text/markdown" } }
        ]
        editions: { _gt: 0 }
        metadata_status: { _eq: "processed" }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
      }
      order_by: { minted_at: desc }
      limit: $limit
    ) {
      ...baseTokenFields
    }
  }
`

export default function Community() {
  const { data, error, isLoading } = useSWR(
    ['blog-community'],
    () =>
      request(import.meta.env.VITE_TEIA_GRAPHQL_API, BLOG_POSTS_QUERY, {
        limit: 100,
      }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  )

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
