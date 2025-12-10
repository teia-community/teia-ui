/* eslint-disable react-hooks/exhaustive-deps */
import { useParams } from 'react-router'
import { Page } from '@atoms/layout'
import TagFeed from '@pages/home/feeds/tag-feed'

export const Tags = () => {
  const { tag } = useParams()

  return (
    <Page feed title={`Tag ${tag}`}>
      <TagFeed tag={tag} namespace={`tag_${tag}`} />
    </Page>
  )
}
